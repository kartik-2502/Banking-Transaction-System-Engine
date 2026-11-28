package com.bank.transaction.service;

import com.bank.transaction.dto.*;
import com.bank.transaction.dto.teller.*;
import com.bank.transaction.exception.InvalidTransactionException;
import com.bank.transaction.exception.MfaRequiredException;
import com.bank.transaction.model.*;
import com.bank.transaction.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TellerCashAndTransactionService {

    private static final Logger log = LoggerFactory.getLogger(TellerCashAndTransactionService.class);
    private static final BigDecimal LOW_DRAWER_ALERT_THRESHOLD = new BigDecimal("25000.00");

    private final TellerAccessService accessService;
    private final TellerDrawerRepository drawerRepository;
    private final CashDrawerTransactionRepository drawerTxRepository;
    private final CashReconciliationRepository reconciliationRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionReversalRequestRepository reversalRepository;
    private final TellerApprovalRequestRepository approvalRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final ChequeRepository chequeRepository;
    private final CustomerComplaintRepository complaintRepository;
    private final TransactionService transactionService;
    private final OutboxService outboxService;
    private final AdaptiveMfaService adaptiveMfaService;

    @PersistenceContext
    private EntityManager entityManager;

    public TellerCashAndTransactionService(TellerAccessService accessService,
                                           TellerDrawerRepository drawerRepository,
                                           CashDrawerTransactionRepository drawerTxRepository,
                                           CashReconciliationRepository reconciliationRepository,
                                           AccountRepository accountRepository,
                                           TransactionRepository transactionRepository,
                                           TransactionReversalRequestRepository reversalRepository,
                                           TellerApprovalRequestRepository approvalRepository,
                                           ServiceRequestRepository serviceRequestRepository,
                                           ChequeRepository chequeRepository,
                                           CustomerComplaintRepository complaintRepository,
                                           TransactionService transactionService,
                                           OutboxService outboxService,
                                           AdaptiveMfaService adaptiveMfaService) {
        this.accessService = accessService;
        this.drawerRepository = drawerRepository;
        this.drawerTxRepository = drawerTxRepository;
        this.reconciliationRepository = reconciliationRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.reversalRepository = reversalRepository;
        this.approvalRepository = approvalRepository;
        this.serviceRequestRepository = serviceRequestRepository;
        this.chequeRepository = chequeRepository;
        this.complaintRepository = complaintRepository;
        this.transactionService = transactionService;
        this.outboxService = outboxService;
        this.adaptiveMfaService = adaptiveMfaService;
    }

    @Transactional
    public TellerDashboardResponse getDashboard(String username) {
        TellerProfile profile = accessService.requireStaffProfile(username);
        Long branchId = accessService.resolveBranchScopeId(username);
        Long targetBranchId = branchId != null ? branchId : profile.getBranch().getId();

        TellerDrawer drawer = getOrCreateTodayDrawer(profile);
        OffsetDateTime startOfDay = LocalDate.now().atStartOfDay().atOffset(ZoneOffset.UTC);

        Page<Transaction> recentPage = transactionRepository.searchBranchTransactions(
                branchId, null, null, null, null, null, PageRequest.of(0, 10)
        );
        List<Transaction> todayTxns = transactionRepository.searchBranchTransactions(
                branchId, null, null, startOfDay, null, null, PageRequest.of(0, 500)
        ).getContent();

        BigDecimal deposits = BigDecimal.ZERO;
        BigDecimal withdrawals = BigDecimal.ZERO;
        BigDecimal transfers = BigDecimal.ZERO;
        long successCount = 0;
        long failedCount = 0;
        long pendingCount = 0;

        for (Transaction t : todayTxns) {
            if (t.getStatus() == TransactionStatus.SUCCESS) {
                successCount++;
                if (t.getType() == TransactionType.DEPOSIT) deposits = deposits.add(t.getAmount());
                else if (t.getType() == TransactionType.WITHDRAWAL) withdrawals = withdrawals.add(t.getAmount());
                else if (t.getType() == TransactionType.TRANSFER) transfers = transfers.add(t.getAmount());
            } else if (t.getStatus() == TransactionStatus.FAILED || t.getStatus() == TransactionStatus.REJECTED) {
                failedCount++;
            } else if (t.getStatus() == TransactionStatus.PENDING || t.getStatus() == TransactionStatus.UNDER_REVIEW) {
                pendingCount++;
            }
        }

        TellerDashboardResponse res = new TellerDashboardResponse();
        res.setTodayCashDeposits(deposits);
        res.setTodayCashWithdrawals(withdrawals);
        res.setTodayTransfers(transfers);
        res.setTotalTransactionsProcessed(todayTxns.size());
        res.setSuccessfulTransactions(successCount);
        res.setFailedTransactions(failedCount);
        res.setPendingTransactions(pendingCount);
        res.setPendingServiceRequests(serviceRequestRepository.countByBranchIdAndStatusIn(
                targetBranchId, List.of("OPEN", "IN_PROGRESS", "PENDING_APPROVAL")));
        res.setPendingCheques(chequeRepository.countByBranchIdAndStatusIn(
                targetBranchId, List.of("RECEIVED", "UNDER_PROCESSING", "SENT_FOR_CLEARING")));
        res.setOpenComplaints(complaintRepository.countByBranchIdAndStatusIn(
                targetBranchId, List.of("OPEN", "ASSIGNED", "UNDER_INVESTIGATION", "ESCALATED")));
        res.setPendingApprovals(approvalRepository.countByBranchIdAndStatus(targetBranchId, "PENDING")
                + reversalRepository.countByBranchIdAndStatus(targetBranchId, "PENDING_APPROVAL"));
        res.setDrawerBalance(drawer.getCurrentBalance());
        res.setOpeningBalance(drawer.getOpeningBalance());
        res.setCashReceived(drawer.getCashReceived());
        res.setCashPaidOut(drawer.getCashPaidOut());
        res.setDrawerStatus(drawer.getStatus());
        res.setTellerProfile(accessService.getProfileResponse(username));
        res.setRecentTransactions(recentPage.getContent().stream().map(this::mapTxResponse).collect(Collectors.toList()));
        return res;
    }

    @Transactional
    public TellerDrawerResponse getCurrentDrawer(String username) {
        TellerProfile profile = accessService.requireStaffProfile(username);
        TellerDrawer drawer = getOrCreateTodayDrawer(profile);
        return mapDrawerResponse(drawer);
    }

    @Transactional
    public TellerDrawerResponse openDrawer(String username, BigDecimal openingBalance) {
        TellerProfile profile = accessService.requireStaffProfile(username);
        if (profile.getId() == null) {
            throw new InvalidTransactionException("Assigned teller profile required to open a cash drawer");
        }
        LocalDate today = LocalDate.now();
        TellerDrawer drawer = drawerRepository.findWithLockByTellerProfileIdAndBusinessDate(profile.getId(), today)
                .orElseGet(() -> {
                    TellerDrawer d = new TellerDrawer();
                    d.setTellerProfile(profile);
                    d.setBranch(profile.getBranch());
                    d.setDrawerCode(profile.getDrawerCode());
                    d.setBusinessDate(today);
                    d.setOpeningBalance(openingBalance);
                    d.setCurrentBalance(openingBalance);
                    d.setStatus("OPEN");
                    return drawerRepository.save(d);
                });

        if ("CLOSED".equals(drawer.getStatus())) {
            drawer.setStatus("OPEN");
            drawer.setClosedAt(null);
            drawerRepository.save(drawer);
        }
        return mapDrawerResponse(drawer);
    }

    @Transactional
    public TellerDrawerResponse adjustDrawer(String username, CashAdjustmentRequest request) {
        TellerProfile profile = accessService.requireStaffProfile(username);
        if (profile.getId() == null) {
            throw new InvalidTransactionException("Assigned teller profile required for drawer adjustment");
        }
        TellerDrawer drawer = drawerRepository.findWithLockByTellerProfileIdAndBusinessDate(profile.getId(), LocalDate.now())
                .orElseGet(() -> getOrCreateTodayDrawer(profile));

        String opType = request.getOperationType().trim().toUpperCase();
        BigDecimal before = drawer.getCurrentBalance();
        BigDecimal amount = request.getAmount();
        BigDecimal after;

        switch (opType) {
            case "EXCESS_ADJUSTMENT":
            case "VAULT_REPLENISHMENT":
                after = before.add(amount);
                drawer.setCashReceived(drawer.getCashReceived().add(amount));
                break;
            case "SHORTAGE_ADJUSTMENT":
                if (before.compareTo(amount) < 0) {
                    throw new InvalidTransactionException("Drawer balance insufficient for shortage adjustment");
                }
                after = before.subtract(amount);
                drawer.setCashPaidOut(drawer.getCashPaidOut().add(amount));
                break;
            default:
                throw new InvalidTransactionException("Unsupported drawer adjustment type: " + opType);
        }

        drawer.setCurrentBalance(after);
        drawerRepository.save(drawer);

        CashDrawerTransaction entry = new CashDrawerTransaction();
        entry.setDrawer(drawer);
        entry.setTransactionId("ADJ_" + System.currentTimeMillis());
        entry.setOperationType(opType);
        entry.setAmount(amount);
        entry.setBalanceBefore(before);
        entry.setBalanceAfter(after);
        entry.setRemarks(request.getRemarks());
        entry.setCreatedBy(username);
        drawerTxRepository.save(entry);

        if ("SHORTAGE_ADJUSTMENT".equals(opType) || "EXCESS_ADJUSTMENT".equals(opType)) {
            createApprovalTicket(profile.getBranch(), "CASH_DRAWER_ADJUSTMENT", entry.getTransactionId(),
                    opType, amount, username);
        }
        return mapDrawerResponse(drawer);
    }

    @Transactional
    public CashReconciliationResponse submitReconciliation(String username, CashReconciliationRequest request) {
        TellerProfile profile = accessService.requireStaffProfile(username);
        if (profile.getId() == null) {
            throw new InvalidTransactionException("Assigned teller profile required for cash reconciliation");
        }
        TellerDrawer drawer = drawerRepository.findWithLockByTellerProfileIdAndBusinessDate(profile.getId(), LocalDate.now())
                .orElseGet(() -> getOrCreateTodayDrawer(profile));

        BigDecimal expected = drawer.getCurrentBalance();
        BigDecimal declared = request.getDeclaredPhysicalCash();
        BigDecimal variance = declared.subtract(expected);
        String varianceType = variance.compareTo(BigDecimal.ZERO) == 0 ? "BALANCED"
                : (variance.compareTo(BigDecimal.ZERO) > 0 ? "EXCESS" : "SHORTAGE");

        CashReconciliation rec = new CashReconciliation();
        rec.setReconciliationId("REC_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        rec.setDrawer(drawer);
        rec.setTellerProfile(profile);
        rec.setBranch(profile.getBranch());
        rec.setBusinessDate(drawer.getBusinessDate());
        rec.setSystemExpectedBalance(expected);
        rec.setDeclaredPhysicalCash(declared);
        rec.setVarianceAmount(variance);
        rec.setVarianceType(varianceType);
        rec.setRemarks(request.getRemarks());
        rec.setStatus("BALANCED".equals(varianceType) ? "SUBMITTED" : "FLAGGED");
        rec.setSubmittedBy(username);
        CashReconciliation saved = reconciliationRepository.save(rec);

        drawer.setStatus("RECONCILED");
        drawerRepository.save(drawer);

        createApprovalTicket(profile.getBranch(), "CASH_RECONCILIATION", saved.getReconciliationId(),
                "EOD_RECONCILIATION_" + varianceType, variance.abs(), username);

        return mapReconciliationResponse(saved);
    }

    @Transactional
    public CashReconciliationResponse verifyReconciliation(String username, String reconciliationId, ApprovalDecisionRequest decision) {
        CashReconciliation rec = reconciliationRepository.findByReconciliationId(reconciliationId)
                .orElseThrow(() -> new InvalidTransactionException("Reconciliation record not found: " + reconciliationId));

        accessService.assertBranchAccess(username, rec.getBranch());
        accessService.assertNotSelfApproval(rec.getSubmittedBy(), username, "cash reconciliation");

        rec.setStatus(Boolean.TRUE.equals(decision.getApproved()) ? "VERIFIED" : "FLAGGED");
        rec.setVerifiedBy(username);
        rec.setVerifiedAt(OffsetDateTime.now());
        if (decision.getRemarks() != null && !decision.getRemarks().isBlank()) {
            rec.setRemarks(decision.getRemarks());
        }
        CashReconciliation saved = reconciliationRepository.save(rec);

        if (Boolean.TRUE.equals(decision.getApproved())) {
            TellerDrawer drawer = rec.getDrawer();
            drawer.setStatus("CLOSED");
            drawer.setClosedAt(OffsetDateTime.now());
            drawerRepository.save(drawer);
        }
        markApprovalTicketDecided("CASH_RECONCILIATION", reconciliationId, decision, username);
        return mapReconciliationResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<CashReconciliationResponse> listReconciliations(String username) {
        Long branchId = accessService.resolveBranchScopeId(username);
        List<CashReconciliation> list = branchId == null
                ? reconciliationRepository.findAllByOrderByCreatedAtDesc()
                : reconciliationRepository.findByBranchIdOrderByCreatedAtDesc(branchId);
        return list.stream().map(this::mapReconciliationResponse).collect(Collectors.toList());
    }

    @Transactional
    public TransactionResponse processCashDeposit(String username, TellerCashOperationRequest request) {
        String txnId = (request.getTransactionId() != null && !request.getTransactionId().isBlank())
                ? request.getTransactionId()
                : "TLR_DEP_" + System.currentTimeMillis() + "_" + (int) (Math.random() * 900 + 100);

        Account account = accountRepository.findByAccountNumberWithPessimisticLock(request.getAccountNumber())
                .orElseThrow(() -> new InvalidTransactionException("Account not found: " + request.getAccountNumber()));
        accessService.assertBranchAccess(username, account.getBranch());

        TellerProfile profile = accessService.requireStaffProfile(username);
        if (request.getAmount().compareTo(profile.getMaxCashLimit()) > 0) {
            throw new InvalidTransactionException("Cash deposit exceeds teller counter limit of ₹" + profile.getMaxCashLimit());
        }

        boolean alreadyExists = transactionRepository.findByTransactionId(txnId).isPresent();
        DepositRequest depReq = new DepositRequest(txnId, request.getAccountNumber(), request.getAmount(), username);
        TransactionResponse txRes = transactionService.processDeposit(depReq);

        if (!alreadyExists && profile.getId() != null) {
            TellerDrawer drawer = drawerRepository.findWithLockByTellerProfileIdAndBusinessDate(profile.getId(), LocalDate.now())
                    .orElseGet(() -> getOrCreateTodayDrawer(profile));
            if ("CLOSED".equals(drawer.getStatus())) {
                throw new InvalidTransactionException("Teller cash drawer is CLOSED for today. Re-open before cash operations.");
            }
            BigDecimal before = drawer.getCurrentBalance();
            BigDecimal after = before.add(request.getAmount());
            drawer.setCashReceived(drawer.getCashReceived().add(request.getAmount()));
            drawer.setCurrentBalance(after);
            drawerRepository.save(drawer);

            CashDrawerTransaction ledger = new CashDrawerTransaction();
            ledger.setDrawer(drawer);
            ledger.setTransactionId(txRes.getTransactionId());
            ledger.setOperationType("CASH_DEPOSIT");
            ledger.setAmount(request.getAmount());
            ledger.setBalanceBefore(before);
            ledger.setBalanceAfter(after);
            ledger.setDepositorName(request.getDepositorName());
            ledger.setDepositorIdRef(request.getDepositorIdRef());
            ledger.setRemarks(request.getRemarks() != null ? request.getRemarks() : "Cash deposit [" + request.getDepositType() + "]");
            ledger.setCreatedBy(username);
            drawerTxRepository.save(ledger);
        }
        return txRes;
    }

    @Transactional
    public TransactionResponse processCashWithdrawal(String username, TellerCashOperationRequest request) {
        String txnId = (request.getTransactionId() != null && !request.getTransactionId().isBlank())
                ? request.getTransactionId()
                : "TLR_WTH_" + System.currentTimeMillis() + "_" + (int) (Math.random() * 900 + 100);

        Account account = accountRepository.findByAccountNumberWithPessimisticLock(request.getAccountNumber())
                .orElseThrow(() -> new InvalidTransactionException("Account not found: " + request.getAccountNumber()));
        accessService.assertBranchAccess(username, account.getBranch());

        if (!request.isCustomerVerified()) {
            throw new InvalidTransactionException("Customer physical/KYC verification is mandatory before cash withdrawal");
        }

        TellerProfile profile = accessService.requireStaffProfile(username);
        if (request.getAmount().compareTo(profile.getMaxCashLimit()) > 0) {
            throw new InvalidTransactionException("Cash withdrawal exceeds teller counter limit of ₹" + profile.getMaxCashLimit());
        }

        boolean alreadyExists = transactionRepository.findByTransactionId(txnId).isPresent();
        TellerDrawer drawer = null;
        if (!alreadyExists && profile.getId() != null) {
            drawer = drawerRepository.findWithLockByTellerProfileIdAndBusinessDate(profile.getId(), LocalDate.now())
                    .orElseGet(() -> getOrCreateTodayDrawer(profile));
            if ("CLOSED".equals(drawer.getStatus())) {
                throw new InvalidTransactionException("Teller cash drawer is CLOSED for today.");
            }
            if (drawer.getCurrentBalance().compareTo(request.getAmount()) < 0) {
                throw new InvalidTransactionException(
                        "Insufficient teller drawer cash. Drawer available: ₹" + drawer.getCurrentBalance()
                                + ", Requested: ₹" + request.getAmount()
                );
            }
        }

        WithdrawalRequest wReq = new WithdrawalRequest(txnId, request.getAccountNumber(), request.getAmount(), username);
        TransactionResponse txRes = transactionService.processWithdrawal(wReq);

        if (drawer != null) {
            BigDecimal before = drawer.getCurrentBalance();
            BigDecimal after = before.subtract(request.getAmount());
            drawer.setCashPaidOut(drawer.getCashPaidOut().add(request.getAmount()));
            drawer.setCurrentBalance(after);
            drawerRepository.save(drawer);

            CashDrawerTransaction ledger = new CashDrawerTransaction();
            ledger.setDrawer(drawer);
            ledger.setTransactionId(txRes.getTransactionId());
            ledger.setOperationType("CASH_WITHDRAWAL");
            ledger.setAmount(request.getAmount());
            ledger.setBalanceBefore(before);
            ledger.setBalanceAfter(after);
            ledger.setDepositorName(request.getDepositorName());
            ledger.setDepositorIdRef(request.getDepositorIdRef());
            ledger.setRemarks(request.getRemarks() != null ? request.getRemarks() : "Teller counter cash withdrawal");
            ledger.setCreatedBy(username);
            drawerTxRepository.save(ledger);

            if (after.compareTo(LOW_DRAWER_ALERT_THRESHOLD) < 0) {
                User user = accessService.getUser(username);
                outboxService.publishNotificationEvent(new NotificationEvent(
                        "LOW_DRAWER_BALANCE",
                        txRes.getTransactionId(),
                        drawer.getDrawerCode(),
                        user.getId(),
                        username,
                        after,
                        "Low Teller Drawer Cash Alert",
                        "Drawer " + drawer.getDrawerCode() + " cash balance dropped to ₹" + after.toPlainString() + ". Vault replenishment advised.",
                        "WARNING"
                ));
            }
        }
        return txRes;
    }

    @Transactional(noRollbackFor = MfaRequiredException.class)
    public TransactionResponse processTellerTransfer(String username, TellerTransferRequest request,
                                                     AdaptiveMfaService.ClientContext ctx) {
        Account source = accountRepository.findByAccountNumber(request.getSourceAccountNumber())
                .orElseThrow(() -> new InvalidTransactionException("Source account not found: " + request.getSourceAccountNumber()));
        accessService.assertBranchAccess(username, source.getBranch());
        if (entityManager != null) {
            entityManager.detach(source);
        }

        String channel = request.getTransferChannel() != null
                ? request.getTransferChannel().trim().toUpperCase()
                : "INTERNAL";
        String baseChannel = channel.endsWith("_SIMULATED")
                ? channel.substring(0, channel.length() - "_SIMULATED".length())
                : channel;
        String txnId = (request.getTransactionId() != null && !request.getTransactionId().isBlank())
                ? request.getTransactionId()
                : "TLR_" + baseChannel + "_" + System.currentTimeMillis();

        if (request.getDestinationAccountNumber() != null && !request.getDestinationAccountNumber().isBlank()
                && accountRepository.existsByAccountNumber(request.getDestinationAccountNumber())) {
            TransferRequest tr = new TransferRequest(txnId, request.getSourceAccountNumber(),
                    request.getDestinationAccountNumber(), request.getAmount(), username);
            tr.setChallengeId(request.getChallengeId());
            tr.setDeviceFingerprint(request.getDeviceFingerprint());
            adaptiveMfaService.enforceTransferVerification(username, tr, ctx);
            return transactionService.processTransfer(tr);
        }

        if ("NEFT".equals(baseChannel) || "RTGS".equals(baseChannel) || "IMPS".equals(baseChannel) || "INTER_BRANCH".equals(baseChannel)) {
            if ("RTGS".equals(baseChannel) && request.getAmount().compareTo(new BigDecimal("200000.00")) < 0) {
                throw new InvalidTransactionException("RTGS transfers require a minimum amount of ₹2,00,000.00");
            }
            TransferRequest mfaCheck = new TransferRequest(txnId, request.getSourceAccountNumber(),
                    request.getBeneficiaryIfsc() != null ? request.getBeneficiaryIfsc() : "EXTERNAL_" + channel,
                    request.getAmount(), username);
            mfaCheck.setChallengeId(request.getChallengeId());
            mfaCheck.setDeviceFingerprint(request.getDeviceFingerprint());
            adaptiveMfaService.enforceTransferVerification(username, mfaCheck, ctx);

            // Simulated external clearing settlement: debit source account cleanly through existing TransactionService
            WithdrawalRequest debit = new WithdrawalRequest(
                    txnId,
                    request.getSourceAccountNumber(),
                    request.getAmount(),
                    username + ":" + channel + "_SIMULATED:" + (request.getBeneficiaryName() != null ? request.getBeneficiaryName() : "Beneficiary")
            );
            return transactionService.processWithdrawal(debit);
        }

        throw new InvalidTransactionException("Valid destination account number is required for internal/same-branch transfer");
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> searchTransactions(String username, String query, TransactionType type,
                                                      TransactionStatus status, LocalDate fromDate, LocalDate toDate,
                                                      Pageable pageable) {
        Long branchId = accessService.resolveBranchScopeId(username);
        OffsetDateTime since = fromDate != null ? fromDate.atStartOfDay().atOffset(ZoneOffset.UTC) : null;
        OffsetDateTime until = toDate != null ? toDate.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC) : null;
        return transactionRepository.searchBranchTransactions(branchId, type, status, since, until, query, pageable)
                .map(this::mapTxResponse);
    }

    @Transactional
    public ReversalResponse requestReversal(String username, String transactionId, ReversalCreateRequest request) {
        Transaction tx = transactionRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new InvalidTransactionException("Transaction not found: " + transactionId));
        if (tx.getStatus() != TransactionStatus.SUCCESS) {
            throw new InvalidTransactionException("Only SUCCESS transactions can be submitted for reversal");
        }
        Account primaryAccount = tx.getSourceAccount() != null ? tx.getSourceAccount() : tx.getDestinationAccount();
        if (primaryAccount == null) {
            throw new InvalidTransactionException("Transaction has no associated account");
        }
        accessService.assertBranchAccess(username, primaryAccount.getBranch());

        if (reversalRepository.existsByTransactionIdAndStatusIn(transactionId, List.of("PENDING_APPROVAL", "EXECUTED"))) {
            throw new InvalidTransactionException("A reversal request already exists or has been executed for " + transactionId);
        }

        TransactionReversalRequest rev = new TransactionReversalRequest();
        rev.setReversalId("REV_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        rev.setTransactionId(transactionId);
        rev.setAccount(primaryAccount);
        rev.setBranch(primaryAccount.getBranch());
        rev.setAmount(tx.getAmount());
        rev.setReason(request.getReason());
        rev.setStatus("PENDING_APPROVAL");
        rev.setRequestedBy(username);
        TransactionReversalRequest saved = reversalRepository.save(rev);

        createApprovalTicket(primaryAccount.getBranch(), "TRANSACTION_REVERSAL", saved.getReversalId(),
                "REVERSE_" + tx.getType().name(), tx.getAmount(), username);

        return mapReversalResponse(saved);
    }

    @Transactional
    public ReversalResponse decideReversal(String username, String reversalId, ApprovalDecisionRequest decision) {
        TransactionReversalRequest rev = reversalRepository.findByReversalId(reversalId)
                .orElseThrow(() -> new InvalidTransactionException("Reversal request not found: " + reversalId));
        accessService.assertBranchAccess(username, rev.getBranch());
        accessService.assertNotSelfApproval(rev.getRequestedBy(), username, "transaction reversal");

        if (!"PENDING_APPROVAL".equals(rev.getStatus())) {
            throw new InvalidTransactionException("Reversal request has already been processed: " + rev.getStatus());
        }

        rev.setReviewedBy(username);
        rev.setReviewNotes(decision.getRemarks());
        rev.setReviewedAt(OffsetDateTime.now());

        if (Boolean.TRUE.equals(decision.getApproved())) {
            Transaction orig = transactionRepository.findByTransactionId(rev.getTransactionId())
                    .orElseThrow(() -> new InvalidTransactionException("Original transaction missing"));
            String revTxnId = "TXN_REV_" + orig.getTransactionId();
            if (orig.getType() == TransactionType.TRANSFER && orig.getSourceAccount() != null && orig.getDestinationAccount() != null) {
                transactionService.processTransfer(new TransferRequest(
                        revTxnId,
                        orig.getDestinationAccount().getAccountNumber(),
                        orig.getSourceAccount().getAccountNumber(),
                        orig.getAmount(),
                        username
                ));
            } else if (orig.getType() == TransactionType.DEPOSIT && orig.getDestinationAccount() != null) {
                transactionService.processWithdrawal(new WithdrawalRequest(
                        revTxnId, orig.getDestinationAccount().getAccountNumber(), orig.getAmount(), username
                ));
            } else if (orig.getType() == TransactionType.WITHDRAWAL && orig.getSourceAccount() != null) {
                transactionService.processDeposit(new DepositRequest(
                        revTxnId, orig.getSourceAccount().getAccountNumber(), orig.getAmount(), username
                ));
            }
            orig.setStatus(TransactionStatus.REVERSED);
            transactionRepository.save(orig);
            rev.setReversalTransactionId(revTxnId);
            rev.setStatus("EXECUTED");
        } else {
            rev.setStatus("REJECTED");
        }

        TransactionReversalRequest saved = reversalRepository.save(rev);
        markApprovalTicketDecided("TRANSACTION_REVERSAL", reversalId, decision, username);
        return mapReversalResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<ReversalResponse> listReversals(String username, Pageable pageable) {
        Long branchId = accessService.resolveBranchScopeId(username);
        Page<TransactionReversalRequest> page = branchId == null
                ? reversalRepository.findAllByOrderByCreatedAtDesc(pageable)
                : reversalRepository.findByBranchIdOrderByCreatedAtDesc(branchId, pageable);
        return page.map(this::mapReversalResponse);
    }

    @Transactional
    public DailyReportResponse getDailyReport(String username, LocalDate reportDate) {
        LocalDate date = reportDate != null ? reportDate : LocalDate.now();
        TellerProfile profile = accessService.requireStaffProfile(username);
        Long branchId = accessService.resolveBranchScopeId(username);
        Long targetBranchId = branchId != null ? branchId : profile.getBranch().getId();

        OffsetDateTime start = date.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime end = date.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);

        List<Transaction> dayTxns = transactionRepository.searchBranchTransactions(
                branchId, null, null, start, end, null, PageRequest.of(0, 500)
        ).getContent();

        BigDecimal depAmt = BigDecimal.ZERO;
        BigDecimal wthAmt = BigDecimal.ZERO;
        BigDecimal trfAmt = BigDecimal.ZERO;
        long depCnt = 0, wthCnt = 0, trfCnt = 0, failCnt = 0, pendCnt = 0;

        for (Transaction t : dayTxns) {
            if (t.getStatus() == TransactionStatus.SUCCESS) {
                if (t.getType() == TransactionType.DEPOSIT) { depCnt++; depAmt = depAmt.add(t.getAmount()); }
                else if (t.getType() == TransactionType.WITHDRAWAL) { wthCnt++; wthAmt = wthAmt.add(t.getAmount()); }
                else if (t.getType() == TransactionType.TRANSFER) { trfCnt++; trfAmt = trfAmt.add(t.getAmount()); }
            } else if (t.getStatus() == TransactionStatus.FAILED || t.getStatus() == TransactionStatus.REJECTED) {
                failCnt++;
            } else if (t.getStatus() == TransactionStatus.PENDING || t.getStatus() == TransactionStatus.UNDER_REVIEW) {
                pendCnt++;
            }
        }

        DailyReportResponse report = new DailyReportResponse();
        report.setReportDate(date);
        report.setBranchCode(profile.getBranch().getBranchCode());
        report.setBranchName(profile.getBranch().getBranchName());
        report.setDepositCount(depCnt);
        report.setTotalDepositsAmount(depAmt);
        report.setWithdrawalCount(wthCnt);
        report.setTotalWithdrawalsAmount(wthAmt);
        report.setTransferCount(trfCnt);
        report.setTotalTransfersAmount(trfAmt);
        report.setFailedCount(failCnt);
        report.setPendingCount(pendCnt);
        report.setChequeCount(chequeRepository.findByBranchIdOrderByCreatedAtDesc(targetBranchId, PageRequest.of(0, 1)).getTotalElements());
        report.setServiceRequestCount(serviceRequestRepository.findByBranchIdOrderByCreatedAtDesc(targetBranchId, PageRequest.of(0, 1)).getTotalElements());
        report.setDrawerSummary(getCurrentDrawer(username));
        report.setReconciliations(reconciliationRepository.findByBranchIdOrderByCreatedAtDesc(targetBranchId)
                .stream().map(this::mapReconciliationResponse).collect(Collectors.toList()));
        report.setShortagesAndExcesses(drawerTxRepository.findByDrawerBranchIdAndOperationTypeInOrderByCreatedAtDesc(
                targetBranchId, List.of("SHORTAGE_ADJUSTMENT", "EXCESS_ADJUSTMENT", "VAULT_REPLENISHMENT"))
                .stream().map(this::mapDrawerTx).collect(Collectors.toList()));
        report.setTransactions(dayTxns.stream().map(this::mapTxResponse).collect(Collectors.toList()));
        return report;
    }

    @Transactional
    public String exportDailyReportCsv(String username, LocalDate reportDate) {
        DailyReportResponse report = getDailyReport(username, reportDate);
        StringBuilder sb = new StringBuilder();
        sb.append("TransactionId,Type,SourceAccount,DestinationAccount,Amount,Status,InitiatedBy,CreatedAt\n");
        for (TransactionResponse tx : report.getTransactions()) {
            sb.append(csv(tx.getTransactionId())).append(',')
              .append(csv(tx.getType() != null ? tx.getType().name() : "")).append(',')
              .append(csv(tx.getSourceAccountNumber())).append(',')
              .append(csv(tx.getDestinationAccountNumber())).append(',')
              .append(tx.getAmount() != null ? tx.getAmount().toPlainString() : "0.00").append(',')
              .append(csv(tx.getStatus() != null ? tx.getStatus().name() : "")).append(',')
              .append(csv(tx.getInitiatedBy())).append(',')
              .append(csv(tx.getCreatedAt() != null ? tx.getCreatedAt().toString() : ""))
              .append('\n');
        }
        return sb.toString();
    }

    private String csv(String v) {
        if (v == null) return "";
        return "\"" + v.replace("\"", "\"\"") + "\"";
    }

    private TellerDrawer getOrCreateTodayDrawer(TellerProfile profile) {
        if (profile.getId() == null) {
            TellerDrawer virtualDrawer = new TellerDrawer();
            virtualDrawer.setDrawerCode(profile.getDrawerCode());
            virtualDrawer.setBranch(profile.getBranch());
            virtualDrawer.setBusinessDate(LocalDate.now());
            virtualDrawer.setOpeningBalance(BigDecimal.ZERO.setScale(2));
            virtualDrawer.setCurrentBalance(BigDecimal.ZERO.setScale(2));
            virtualDrawer.setStatus("OPEN");
            return virtualDrawer;
        }
        LocalDate today = LocalDate.now();
        return drawerRepository.findByTellerProfileIdAndBusinessDate(profile.getId(), today)
                .orElseGet(() -> {
                    TellerDrawer d = new TellerDrawer();
                    d.setTellerProfile(profile);
                    d.setBranch(profile.getBranch());
                    d.setDrawerCode(profile.getDrawerCode());
                    d.setBusinessDate(today);
                    d.setOpeningBalance(new BigDecimal("250000.00"));
                    d.setCurrentBalance(new BigDecimal("250000.00"));
                    d.setStatus("OPEN");
                    return drawerRepository.save(d);
                });
    }

    private void createApprovalTicket(Branch branch, String entityType, String entityRef,
                                      String actionType, BigDecimal amount, String requestedBy) {
        TellerApprovalRequest req = new TellerApprovalRequest();
        req.setApprovalId("APR_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        req.setBranch(branch);
        req.setEntityType(entityType);
        req.setEntityRef(entityRef);
        req.setActionType(actionType);
        req.setAmount(amount);
        req.setRequestedBy(requestedBy);
        req.setStatus("PENDING");
        approvalRepository.save(req);
    }

    private void markApprovalTicketDecided(String entityType, String entityRef, ApprovalDecisionRequest decision, String reviewer) {
        approvalRepository.findAll().stream()
                .filter(a -> entityType.equals(a.getEntityType()) && entityRef.equals(a.getEntityRef()) && "PENDING".equals(a.getStatus()))
                .forEach(a -> {
                    a.setStatus(Boolean.TRUE.equals(decision.getApproved()) ? "APPROVED" : "REJECTED");
                    a.setReviewedBy(reviewer);
                    a.setReviewNotes(decision.getRemarks());
                    a.setReviewedAt(OffsetDateTime.now());
                    approvalRepository.save(a);
                });
    }

    private TellerDrawerResponse mapDrawerResponse(TellerDrawer d) {
        TellerDrawerResponse res = new TellerDrawerResponse();
        res.setId(d.getId());
        res.setDrawerCode(d.getDrawerCode());
        res.setBranchCode(d.getBranch().getBranchCode());
        res.setBusinessDate(d.getBusinessDate());
        res.setOpeningBalance(d.getOpeningBalance());
        res.setCashReceived(d.getCashReceived());
        res.setCashPaidOut(d.getCashPaidOut());
        res.setCurrentBalance(d.getCurrentBalance());
        res.setStatus(d.getStatus());
        res.setOpenedAt(d.getOpenedAt());
        res.setClosedAt(d.getClosedAt());
        if (d.getId() != null) {
            res.setLedger(drawerTxRepository.findTop50ByDrawerIdOrderByCreatedAtDesc(d.getId())
                    .stream().map(this::mapDrawerTx).collect(Collectors.toList()));
        } else {
            res.setLedger(List.of());
        }
        return res;
    }

    private CashDrawerTransactionResponse mapDrawerTx(CashDrawerTransaction t) {
        CashDrawerTransactionResponse res = new CashDrawerTransactionResponse();
        res.setId(t.getId());
        res.setTransactionId(t.getTransactionId());
        res.setOperationType(t.getOperationType());
        res.setAmount(t.getAmount());
        res.setBalanceBefore(t.getBalanceBefore());
        res.setBalanceAfter(t.getBalanceAfter());
        res.setDepositorName(t.getDepositorName());
        res.setDepositorIdRef(t.getDepositorIdRef());
        res.setRemarks(t.getRemarks());
        res.setCreatedBy(t.getCreatedBy());
        res.setCreatedAt(t.getCreatedAt());
        return res;
    }

    private CashReconciliationResponse mapReconciliationResponse(CashReconciliation r) {
        CashReconciliationResponse res = new CashReconciliationResponse();
        res.setReconciliationId(r.getReconciliationId());
        res.setDrawerCode(r.getDrawer().getDrawerCode());
        res.setBranchCode(r.getBranch().getBranchCode());
        res.setBusinessDate(r.getBusinessDate());
        res.setSystemExpectedBalance(r.getSystemExpectedBalance());
        res.setDeclaredPhysicalCash(r.getDeclaredPhysicalCash());
        res.setVarianceAmount(r.getVarianceAmount());
        res.setVarianceType(r.getVarianceType());
        res.setRemarks(r.getRemarks());
        res.setStatus(r.getStatus());
        res.setSubmittedBy(r.getSubmittedBy());
        res.setVerifiedBy(r.getVerifiedBy());
        res.setVerifiedAt(r.getVerifiedAt());
        res.setCreatedAt(r.getCreatedAt());
        return res;
    }

    private ReversalResponse mapReversalResponse(TransactionReversalRequest r) {
        ReversalResponse res = new ReversalResponse();
        res.setReversalId(r.getReversalId());
        res.setTransactionId(r.getTransactionId());
        res.setAccountNumber(r.getAccount() != null ? r.getAccount().getAccountNumber() : null);
        res.setBranchCode(r.getBranch().getBranchCode());
        res.setAmount(r.getAmount());
        res.setReason(r.getReason());
        res.setStatus(r.getStatus());
        res.setRequestedBy(r.getRequestedBy());
        res.setReviewedBy(r.getReviewedBy());
        res.setReviewNotes(r.getReviewNotes());
        res.setReversalTransactionId(r.getReversalTransactionId());
        res.setCreatedAt(r.getCreatedAt());
        res.setReviewedAt(r.getReviewedAt());
        return res;
    }

    public TransactionResponse mapTxResponse(Transaction tx) {
        TransactionResponse res = new TransactionResponse();
        res.setId(tx.getId());
        res.setTransactionId(tx.getTransactionId());
        res.setType(tx.getType());
        res.setSourceAccountNumber(tx.getSourceAccount() != null ? tx.getSourceAccount().getAccountNumber() : null);
        res.setDestinationAccountNumber(tx.getDestinationAccount() != null ? tx.getDestinationAccount().getAccountNumber() : null);
        res.setAmount(tx.getAmount());
        res.setStatus(tx.getStatus());
        res.setFailureReason(tx.getFailureReason());
        res.setInitiatedBy(tx.getInitiatedBy());
        res.setCreatedAt(tx.getCreatedAt());
        return res;
    }
}
