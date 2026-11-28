package com.bank.transaction.service;

import com.bank.transaction.dto.AccountResponse;
import com.bank.transaction.dto.DepositRequest;
import com.bank.transaction.dto.NotificationEvent;
import com.bank.transaction.dto.TransactionResponse;
import com.bank.transaction.dto.teller.*;
import com.bank.transaction.exception.AccountNotFoundException;
import com.bank.transaction.exception.CustomerNotFoundException;
import com.bank.transaction.exception.InvalidTransactionException;
import com.bank.transaction.model.*;
import com.bank.transaction.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TellerOperationsService {

    private static final Set<String> SENSITIVE_REQUEST_TYPES = Set.of(
            "ACCOUNT_OPENING", "ACCOUNT_ACTIVATION", "ACCOUNT_CLOSURE",
            "ACCOUNT_FREEZE", "ACCOUNT_UNFREEZE", "CONTACT_UPDATE",
            "MOBILE_UPDATE", "EMAIL_UPDATE", "ADDRESS_UPDATE", "NOMINEE_UPDATE"
    );

    private final TellerAccessService accessService;
    private final TellerCashAndTransactionService cashTxService;
    private final CustomerRepository customerRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final ChequeRepository chequeRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final CustomerComplaintRepository complaintRepository;
    private final TellerApprovalRequestRepository approvalRepository;
    private final TellerProfileRepository tellerProfileRepository;
    private final TransactionService transactionService;
    private final AccountService accountService;
    private final OutboxService outboxService;

    public TellerOperationsService(TellerAccessService accessService,
                                   TellerCashAndTransactionService cashTxService,
                                   CustomerRepository customerRepository,
                                   AccountRepository accountRepository,
                                   TransactionRepository transactionRepository,
                                   ChequeRepository chequeRepository,
                                   ServiceRequestRepository serviceRequestRepository,
                                   CustomerComplaintRepository complaintRepository,
                                   TellerApprovalRequestRepository approvalRepository,
                                   TellerProfileRepository tellerProfileRepository,
                                   TransactionService transactionService,
                                   AccountService accountService,
                                   OutboxService outboxService) {
        this.accessService = accessService;
        this.cashTxService = cashTxService;
        this.customerRepository = customerRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.chequeRepository = chequeRepository;
        this.serviceRequestRepository = serviceRequestRepository;
        this.complaintRepository = complaintRepository;
        this.approvalRepository = approvalRepository;
        this.tellerProfileRepository = tellerProfileRepository;
        this.transactionService = transactionService;
        this.accountService = accountService;
        this.outboxService = outboxService;
    }

    @Transactional(readOnly = true)
    public Page<TellerCustomerSummaryResponse> searchCustomers(String username, String query, String kycStatus, Pageable pageable) {
        Long branchId = accessService.resolveBranchScopeId(username);
        String kycFilter = (kycStatus != null && !kycStatus.isBlank() && !"ALL".equalsIgnoreCase(kycStatus))
                ? kycStatus.trim().toUpperCase() : null;
        return customerRepository.searchCustomers(branchId, kycFilter, query, pageable)
                .map(this::mapCustomerSummary);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCustomerHistory(String username, String customerNumber) {
        Customer customer = customerRepository.findByCustomerNumberWithAccounts(customerNumber)
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found: " + customerNumber));
        accessService.assertBranchAccess(username, customer.getBranch());

        List<TransactionResponse> txns = new ArrayList<>();
        for (Account acc : customer.getAccounts()) {
            transactionRepository.findBySourceAccountIdOrDestinationAccountIdOrderByCreatedAtDesc(
                            acc.getId(), acc.getId(), PageRequest.of(0, 15))
                    .getContent()
                    .forEach(t -> txns.add(cashTxService.mapTxResponse(t)));
        }

        List<ServiceRequestResponse> requests = serviceRequestRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId())
                .stream().map(this::mapServiceRequest).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("customer", mapCustomerSummary(customer));
        result.put("transactions", txns);
        result.put("serviceRequests", requests);
        return result;
    }

    @Transactional(readOnly = true)
    public AccountResponse getAccountDetails(String username, String accountNumber) {
        Account acc = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new AccountNotFoundException("Account not found: " + accountNumber));
        accessService.assertBranchAccess(username, acc.getBranch());
        return accountService.getAccountByAccountNumber(accountNumber);
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> getAccountStatement(String username, String accountNumber,
                                                         LocalDate fromDate, LocalDate toDate, Pageable pageable) {
        Account acc = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new AccountNotFoundException("Account not found: " + accountNumber));
        accessService.assertBranchAccess(username, acc.getBranch());
        OffsetDateTime since = fromDate != null ? fromDate.atStartOfDay().atOffset(ZoneOffset.UTC) : null;
        OffsetDateTime until = toDate != null ? toDate.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC) : null;
        return transactionRepository.searchBranchTransactions(
                        acc.getBranch() != null ? acc.getBranch().getId() : null,
                        null, null, since, until, accountNumber, pageable)
                .map(cashTxService::mapTxResponse);
    }

    @Transactional
    public TellerCustomerSummaryResponse updateKycStatus(String username, String customerNumber, String kycStatus) {
        User actor = accessService.getUser(username);
        if (!accessService.hasAnyRole(actor, RoleName.BANK_MANAGER, RoleName.ADMIN)) {
            throw new AccessDeniedException("Only Bank Manager or Admin can update KYC verification status");
        }
        Customer customer = customerRepository.findByCustomerNumber(customerNumber)
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found: " + customerNumber));
        accessService.assertBranchAccess(username, customer.getBranch());
        customer.setKycStatus(kycStatus.trim().toUpperCase());
        return mapCustomerSummary(customerRepository.save(customer));
    }

    @Transactional
    public ChequeResponse registerCheque(String username, ChequeRequest request) {
        Account account = accountRepository.findByAccountNumber(request.getAccountNumber())
                .orElseThrow(() -> new AccountNotFoundException("Account not found: " + request.getAccountNumber()));
        accessService.assertBranchAccess(username, account.getBranch());

        Cheque ch = new Cheque();
        ch.setChequeRef("CHQ_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        ch.setChequeNumber(request.getChequeNumber());
        ch.setAccount(account);
        ch.setCustomer(account.getCustomer());
        ch.setBranch(account.getBranch() != null ? account.getBranch() : accessService.requireStaffProfile(username).getBranch());
        ch.setDrawerAccountNumber(request.getDrawerAccountNumber());
        ch.setIssuingBankName(request.getIssuingBankName());
        ch.setIssuingBranch(request.getIssuingBranch());
        ch.setChequeDate(request.getChequeDate());
        ch.setAmount(request.getAmount());
        ch.setRequestType(request.getRequestType() != null ? request.getRequestType().trim().toUpperCase() : "DEPOSIT");
        ch.setStatus("RECEIVED");
        ch.setAttachmentRef(request.getAttachmentRef());
        ch.setRemarks(request.getRemarks());
        ch.setSubmittedBy(username);

        Cheque saved = chequeRepository.save(ch);
        if ("DEPOSIT".equals(saved.getRequestType())) {
            createApprovalTicket(saved.getBranch(), "CHEQUE_CLEARING", saved.getChequeRef(),
                    "CLEAR_CHEQUE_DEPOSIT", saved.getAmount(), username);
        }
        return mapCheque(saved);
    }

    @Transactional(readOnly = true)
    public Page<ChequeResponse> listCheques(String username, String status, Pageable pageable) {
        Long branchId = accessService.resolveBranchScopeId(username);
        if (branchId == null) {
            return chequeRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::mapCheque);
        }
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            return chequeRepository.findByBranchIdAndStatusOrderByCreatedAtDesc(branchId, status.toUpperCase(), pageable)
                    .map(this::mapCheque);
        }
        return chequeRepository.findByBranchIdOrderByCreatedAtDesc(branchId, pageable).map(this::mapCheque);
    }

    @Transactional
    public ChequeResponse updateChequeStatus(String username, String chequeRef, ChequeStatusUpdateRequest request) {
        Cheque ch = chequeRepository.findByChequeRef(chequeRef)
                .orElseThrow(() -> new InvalidTransactionException("Cheque not found: " + chequeRef));
        accessService.assertBranchAccess(username, ch.getBranch());

        String targetStatus = request.getStatus().trim().toUpperCase();
        User actor = accessService.getUser(username);
        boolean isClearingAuthority = accessService.hasAnyRole(actor, RoleName.BANK_MANAGER, RoleName.ADMIN);

        if (("CLEARED".equals(targetStatus) || "BOUNCED".equals(targetStatus)) && !isClearingAuthority) {
            throw new AccessDeniedException("Teller cannot independently mark cheques as CLEARED or BOUNCED. Bank Manager or Admin clearing required.");
        }
        if ("CLEARED".equals(targetStatus)) {
            accessService.assertNotSelfApproval(ch.getSubmittedBy(), username, "cheque clearing");
            if ("CLEARED".equals(ch.getStatus())) {
                throw new InvalidTransactionException("Cheque is already CLEARED");
            }
            if ("DEPOSIT".equals(ch.getRequestType()) && ch.getAmount().signum() > 0) {
                transactionService.processDeposit(new DepositRequest(
                        "TXN_CHQ_" + ch.getChequeRef(),
                        ch.getAccount().getAccountNumber(),
                        ch.getAmount(),
                        username
                ));
            }
        }

        ch.setStatus(targetStatus);
        ch.setProcessedBy(username);
        if (request.getRemarks() != null && !request.getRemarks().isBlank()) {
            ch.setRemarks(request.getRemarks());
        }
        return mapCheque(chequeRepository.save(ch));
    }

    @Transactional
    public ServiceRequestResponse createServiceRequest(String username, ServiceRequestCreateDto dto) {
        Customer customer = customerRepository.findByCustomerNumber(dto.getCustomerNumber())
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found: " + dto.getCustomerNumber()));
        accessService.assertBranchAccess(username, customer.getBranch());

        Account account = null;
        if (dto.getAccountNumber() != null && !dto.getAccountNumber().isBlank()) {
            account = accountRepository.findByAccountNumber(dto.getAccountNumber())
                    .orElseThrow(() -> new AccountNotFoundException("Account not found: " + dto.getAccountNumber()));
            accessService.assertBranchAccess(username, account.getBranch());
        }

        String reqType = dto.getRequestType().trim().toUpperCase();
        boolean requiresApproval = SENSITIVE_REQUEST_TYPES.contains(reqType);

        ServiceRequest sr = new ServiceRequest();
        sr.setRequestId("REQ_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        sr.setCustomer(customer);
        sr.setAccount(account);
        sr.setBranch(customer.getBranch() != null ? customer.getBranch() : accessService.requireStaffProfile(username).getBranch());
        sr.setRequestType(reqType);
        sr.setDescription(dto.getDescription());
        sr.setPayloadJson(dto.getPayloadJson());
        sr.setStatus(requiresApproval ? "PENDING_APPROVAL" : "OPEN");
        sr.setApprovalStatus(requiresApproval ? "PENDING" : "NOT_REQUIRED");
        sr.setSubmittedBy(username);

        ServiceRequest saved = serviceRequestRepository.save(sr);
        if (requiresApproval) {
            createApprovalTicket(saved.getBranch(), "SERVICE_REQUEST", saved.getRequestId(), reqType, null, username);
        }
        return mapServiceRequest(saved);
    }

    @Transactional(readOnly = true)
    public Page<ServiceRequestResponse> listServiceRequests(String username, String status, Pageable pageable) {
        Long branchId = accessService.resolveBranchScopeId(username);
        if (branchId == null) {
            return serviceRequestRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::mapServiceRequest);
        }
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            return serviceRequestRepository.findByBranchIdAndStatusOrderByCreatedAtDesc(branchId, status.toUpperCase(), pageable)
                    .map(this::mapServiceRequest);
        }
        return serviceRequestRepository.findByBranchIdOrderByCreatedAtDesc(branchId, pageable).map(this::mapServiceRequest);
    }

    @Transactional
    public ServiceRequestResponse decideServiceRequest(String username, String requestId, ApprovalDecisionRequest decision) {
        User actor = accessService.getUser(username);
        if (!accessService.hasAnyRole(actor, RoleName.BANK_MANAGER, RoleName.ADMIN)) {
            throw new AccessDeniedException("Only Bank Manager or Admin can approve or reject service requests");
        }
        ServiceRequest sr = serviceRequestRepository.findByRequestId(requestId)
                .orElseThrow(() -> new InvalidTransactionException("Service request not found: " + requestId));
        accessService.assertBranchAccess(username, sr.getBranch());
        accessService.assertNotSelfApproval(sr.getSubmittedBy(), username, "service request");

        sr.setApprovedBy(username);
        sr.setResolutionRemarks(decision.getRemarks());

        if (Boolean.TRUE.equals(decision.getApproved())) {
            sr.setApprovalStatus("APPROVED");
            sr.setStatus("COMPLETED");
            applyApprovedServiceEffect(sr, username);
        } else {
            sr.setApprovalStatus("REJECTED");
            sr.setStatus("REJECTED");
        }
        ServiceRequest saved = serviceRequestRepository.save(sr);

        approvalRepository.findAll().stream()
                .filter(a -> "SERVICE_REQUEST".equals(a.getEntityType()) && requestId.equals(a.getEntityRef()) && "PENDING".equals(a.getStatus()))
                .forEach(a -> {
                    a.setStatus(Boolean.TRUE.equals(decision.getApproved()) ? "APPROVED" : "REJECTED");
                    a.setReviewedBy(username);
                    a.setReviewNotes(decision.getRemarks());
                    a.setReviewedAt(OffsetDateTime.now());
                    approvalRepository.save(a);
                });

        return mapServiceRequest(saved);
    }

    private void applyApprovedServiceEffect(ServiceRequest sr, String actorUsername) {
        if (sr.getAccount() == null) return;
        String accNum = sr.getAccount().getAccountNumber();
        String reason = sr.getResolutionRemarks() != null ? sr.getResolutionRemarks() : "Approved service request " + sr.getRequestId();
        switch (sr.getRequestType()) {
            case "ACCOUNT_FREEZE":
                accountService.freezeAccount(accNum, reason, actorUsername);
                break;
            case "ACCOUNT_UNFREEZE":
            case "ACCOUNT_ACTIVATION":
                accountService.unfreezeAccount(accNum, reason, actorUsername);
                break;
            case "ACCOUNT_CLOSURE":
                com.bank.transaction.dto.AccountStatusUpdateRequest upd = new com.bank.transaction.dto.AccountStatusUpdateRequest();
                upd.setStatus(AccountStatus.CLOSED);
                upd.setReason(reason);
                upd.setChangedBy(actorUsername);
                accountService.updateAccountStatus(accNum, upd);
                break;
            default:
                break;
        }
    }

    @Transactional
    public ComplaintResponse createComplaint(String username, ComplaintCreateRequest dto) {
        Customer customer = customerRepository.findByCustomerNumber(dto.getCustomerNumber())
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found: " + dto.getCustomerNumber()));
        accessService.assertBranchAccess(username, customer.getBranch());

        Account account = null;
        if (dto.getAccountNumber() != null && !dto.getAccountNumber().isBlank()) {
            account = accountRepository.findByAccountNumber(dto.getAccountNumber())
                    .orElseThrow(() -> new AccountNotFoundException("Account not found: " + dto.getAccountNumber()));
        }

        CustomerComplaint c = new CustomerComplaint();
        c.setComplaintId("CMP_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        c.setCustomer(customer);
        c.setAccount(account);
        c.setBranch(customer.getBranch() != null ? customer.getBranch() : accessService.requireStaffProfile(username).getBranch());
        c.setTransactionId(dto.getTransactionId());
        c.setCategory(dto.getCategory().trim().toUpperCase());
        c.setSubject(dto.getSubject());
        c.setDescription(dto.getDescription());
        c.setPriority(dto.getPriority() != null ? dto.getPriority().trim().toUpperCase() : "MEDIUM");
        c.setStatus("OPEN");
        c.setSubmittedBy(username);

        CustomerComplaint saved = complaintRepository.save(c);
        User actor = accessService.getUser(username);
        outboxService.publishNotificationEvent(new NotificationEvent(
                "COMPLAINT_REGISTERED",
                saved.getComplaintId(),
                account != null ? account.getAccountNumber() : customer.getCustomerNumber(),
                actor.getId(),
                username,
                null,
                "Customer Complaint Registered",
                "Dispute " + saved.getComplaintId() + " (" + saved.getCategory() + "): " + saved.getSubject(),
                "WARNING"
        ));
        return mapComplaint(saved);
    }

    @Transactional(readOnly = true)
    public Page<ComplaintResponse> listComplaints(String username, String status, Pageable pageable) {
        Long branchId = accessService.resolveBranchScopeId(username);
        if (branchId == null) {
            return complaintRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::mapComplaint);
        }
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            return complaintRepository.findByBranchIdAndStatusOrderByCreatedAtDesc(branchId, status.toUpperCase(), pageable)
                    .map(this::mapComplaint);
        }
        return complaintRepository.findByBranchIdOrderByCreatedAtDesc(branchId, pageable).map(this::mapComplaint);
    }

    @Transactional
    public ComplaintResponse updateComplaint(String username, String complaintId, ComplaintUpdateRequest dto) {
        CustomerComplaint c = complaintRepository.findByComplaintId(complaintId)
                .orElseThrow(() -> new InvalidTransactionException("Complaint not found: " + complaintId));
        accessService.assertBranchAccess(username, c.getBranch());

        User actor = accessService.getUser(username);
        boolean canResolve = accessService.hasAnyRole(actor, RoleName.BANK_MANAGER, RoleName.ADMIN, RoleName.RISK_ANALYST);

        if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
            String target = dto.getStatus().trim().toUpperCase();
            if (("RESOLVED".equals(target) || "REJECTED".equals(target) || "CLOSED".equals(target)) && !canResolve) {
                throw new AccessDeniedException("Only Bank Manager, Risk Analyst, or Admin can resolve or close investigations");
            }
            c.setStatus(target);
        }
        if (dto.getAssignedTo() != null) {
            c.setAssignedTo(dto.getAssignedTo());
        }
        if (dto.getInternalRemarks() != null) {
            c.setInternalRemarks(dto.getInternalRemarks());
        }
        if (Boolean.TRUE.equals(dto.getEscalated())) {
            c.setEscalated(true);
            c.setStatus("ESCALATED");
        }
        return mapComplaint(complaintRepository.save(c));
    }

    @Transactional(readOnly = true)
    public Page<ApprovalRequestResponse> listApprovals(String username, Pageable pageable) {
        Long branchId = accessService.resolveBranchScopeId(username);
        Page<TellerApprovalRequest> page = branchId == null
                ? approvalRepository.findAllByOrderByCreatedAtDesc(pageable)
                : approvalRepository.findByBranchIdOrderByCreatedAtDesc(branchId, pageable);
        return page.map(a -> {
            ApprovalRequestResponse res = new ApprovalRequestResponse();
            res.setApprovalId(a.getApprovalId());
            res.setBranchCode(a.getBranch().getBranchCode());
            res.setEntityType(a.getEntityType());
            res.setEntityRef(a.getEntityRef());
            res.setActionType(a.getActionType());
            res.setAmount(a.getAmount());
            res.setRequestedBy(a.getRequestedBy());
            res.setStatus(a.getStatus());
            res.setReviewedBy(a.getReviewedBy());
            res.setReviewNotes(a.getReviewNotes());
            res.setCreatedAt(a.getCreatedAt());
            res.setReviewedAt(a.getReviewedAt());
            return res;
        });
    }

    @Transactional
    public TellerProfileResponse updateShiftStatus(String username, String shiftStatus) {
        TellerProfile profile = tellerProfileRepository.findByUsernameWithDetails(username)
                .orElseThrow(() -> new InvalidTransactionException("Assigned teller profile not found for user: " + username));
        profile.setShiftStatus(shiftStatus.trim().toUpperCase());
        tellerProfileRepository.save(profile);
        return accessService.getProfileResponse(username);
    }

    private void createApprovalTicket(Branch branch, String entityType, String entityRef,
                                      String actionType, java.math.BigDecimal amount, String requestedBy) {
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

    private TellerCustomerSummaryResponse mapCustomerSummary(Customer c) {
        TellerCustomerSummaryResponse res = new TellerCustomerSummaryResponse();
        res.setId(c.getId());
        res.setCustomerNumber(c.getCustomerNumber());
        res.setFirstName(c.getFirstName());
        res.setLastName(c.getLastName());
        res.setFullName(c.getFirstName() + " " + c.getLastName());
        res.setMaskedEmail(accessService.maskEmail(c.getEmail()));
        res.setMaskedPhone(accessService.maskPhone(c.getPhone()));
        res.setAddress(c.getAddress());
        res.setKycStatus(c.getKycStatus());
        if (c.getBranch() != null) {
            res.setBranchCode(c.getBranch().getBranchCode());
            res.setBranchName(c.getBranch().getBranchName());
        }
        res.setAccounts(accountRepository.findByCustomerId(c.getId()).stream()
                .map(accessService::mapAccountSummary)
                .collect(Collectors.toList()));
        return res;
    }

    private ChequeResponse mapCheque(Cheque c) {
        ChequeResponse res = new ChequeResponse();
        res.setChequeRef(c.getChequeRef());
        res.setChequeNumber(c.getChequeNumber());
        res.setAccountNumber(c.getAccount().getAccountNumber());
        res.setCustomerNumber(c.getCustomer().getCustomerNumber());
        res.setCustomerName(c.getCustomer().getFirstName() + " " + c.getCustomer().getLastName());
        res.setBranchCode(c.getBranch().getBranchCode());
        res.setDrawerAccountNumber(c.getDrawerAccountNumber());
        res.setIssuingBankName(c.getIssuingBankName());
        res.setIssuingBranch(c.getIssuingBranch());
        res.setChequeDate(c.getChequeDate());
        res.setAmount(c.getAmount());
        res.setRequestType(c.getRequestType());
        res.setStatus(c.getStatus());
        res.setAttachmentRef(c.getAttachmentRef());
        res.setRemarks(c.getRemarks());
        res.setSubmittedBy(c.getSubmittedBy());
        res.setProcessedBy(c.getProcessedBy());
        res.setCreatedAt(c.getCreatedAt());
        res.setUpdatedAt(c.getUpdatedAt());
        return res;
    }

    private ServiceRequestResponse mapServiceRequest(ServiceRequest s) {
        ServiceRequestResponse res = new ServiceRequestResponse();
        res.setRequestId(s.getRequestId());
        res.setCustomerNumber(s.getCustomer().getCustomerNumber());
        res.setCustomerName(s.getCustomer().getFirstName() + " " + s.getCustomer().getLastName());
        res.setAccountNumber(s.getAccount() != null ? s.getAccount().getAccountNumber() : null);
        res.setBranchCode(s.getBranch().getBranchCode());
        res.setRequestType(s.getRequestType());
        res.setDescription(s.getDescription());
        res.setPayloadJson(s.getPayloadJson());
        res.setStatus(s.getStatus());
        res.setApprovalStatus(s.getApprovalStatus());
        res.setSubmittedBy(s.getSubmittedBy());
        res.setAssignedTo(s.getAssignedTo());
        res.setApprovedBy(s.getApprovedBy());
        res.setResolutionRemarks(s.getResolutionRemarks());
        res.setCreatedAt(s.getCreatedAt());
        res.setUpdatedAt(s.getUpdatedAt());
        return res;
    }

    private ComplaintResponse mapComplaint(CustomerComplaint c) {
        ComplaintResponse res = new ComplaintResponse();
        res.setComplaintId(c.getComplaintId());
        res.setCustomerNumber(c.getCustomer().getCustomerNumber());
        res.setCustomerName(c.getCustomer().getFirstName() + " " + c.getCustomer().getLastName());
        res.setAccountNumber(c.getAccount() != null ? c.getAccount().getAccountNumber() : null);
        res.setBranchCode(c.getBranch().getBranchCode());
        res.setTransactionId(c.getTransactionId());
        res.setCategory(c.getCategory());
        res.setSubject(c.getSubject());
        res.setDescription(c.getDescription());
        res.setStatus(c.getStatus());
        res.setPriority(c.getPriority());
        res.setSubmittedBy(c.getSubmittedBy());
        res.setAssignedTo(c.getAssignedTo());
        res.setInternalRemarks(c.getInternalRemarks());
        res.setEscalated(c.isEscalated());
        res.setCreatedAt(c.getCreatedAt());
        res.setUpdatedAt(c.getUpdatedAt());
        return res;
    }
}
