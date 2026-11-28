package com.bank.transaction.service;

import com.bank.transaction.dto.DepositRequest;
import com.bank.transaction.dto.LoanRepaymentScheduleResponse;
import com.bank.transaction.dto.NotificationEvent;
import com.bank.transaction.dto.TransactionResponse;
import com.bank.transaction.dto.loan.*;
import com.bank.transaction.exception.InvalidTransactionException;
import com.bank.transaction.model.*;
import com.bank.transaction.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LoanServicingService {

    private final LoanRepository loanRepository;
    private final LoanRepaymentScheduleRepository scheduleRepository;
    private final LoanStatusHistoryRepository historyRepository;
    private final LoanDocumentRepository documentRepository;
    private final LoanCreditAssessmentRepository assessmentRepository;
    private final LoanApprovalRequestRepository approvalRepository;
    private final LoanDisbursementRepository disbursementRepository;
    private final LoanFollowUpRepository followUpRepository;
    private final LoanCommunicationRepository communicationRepository;
    private final CustomerRepository customerRepository;
    private final LoanOfficerProfileRepository officerProfileRepository;
    private final TransactionService transactionService;
    private final LoanFinancialCalculator calculator;
    private final LoanAccessService accessService;
    private final LoanUnderwritingService underwritingService;
    private final OutboxService outboxService;

    public LoanServicingService(LoanRepository loanRepository,
                                LoanRepaymentScheduleRepository scheduleRepository,
                                LoanStatusHistoryRepository historyRepository,
                                LoanDocumentRepository documentRepository,
                                LoanCreditAssessmentRepository assessmentRepository,
                                LoanApprovalRequestRepository approvalRepository,
                                LoanDisbursementRepository disbursementRepository,
                                LoanFollowUpRepository followUpRepository,
                                LoanCommunicationRepository communicationRepository,
                                CustomerRepository customerRepository,
                                LoanOfficerProfileRepository officerProfileRepository,
                                TransactionService transactionService,
                                LoanFinancialCalculator calculator,
                                LoanAccessService accessService,
                                LoanUnderwritingService underwritingService,
                                OutboxService outboxService) {
        this.loanRepository = loanRepository;
        this.scheduleRepository = scheduleRepository;
        this.historyRepository = historyRepository;
        this.documentRepository = documentRepository;
        this.assessmentRepository = assessmentRepository;
        this.approvalRepository = approvalRepository;
        this.disbursementRepository = disbursementRepository;
        this.followUpRepository = followUpRepository;
        this.communicationRepository = communicationRepository;
        this.customerRepository = customerRepository;
        this.officerProfileRepository = officerProfileRepository;
        this.transactionService = transactionService;
        this.calculator = calculator;
        this.accessService = accessService;
        this.underwritingService = underwritingService;
        this.outboxService = outboxService;
    }

    @Transactional(readOnly = true)
    public LoanOfficerDashboardResponse getDashboard(String username) {
        Long branchId = accessService.resolveBranchScopeId(username);
        List<Loan> allScoped = loanRepository.searchBranchLoans(branchId, null, null, null, null, null, null, null, null, PageRequest.of(0, 500)).getContent();

        LoanOfficerDashboardResponse res = new LoanOfficerDashboardResponse();
        res.setTotalApplications(allScoped.size());
        res.setNewApplications(allScoped.stream().filter(l -> l.getStatus() == LoanStatus.PENDING || l.getStatus() == LoanStatus.SUBMITTED).count());
        res.setUnderReviewCount(allScoped.stream().filter(l -> l.getStatus() == LoanStatus.UNDER_REVIEW).count());
        res.setPendingDocumentVerification(allScoped.stream().filter(l -> l.getStatus() == LoanStatus.DOCUMENT_VERIFICATION).count());
        res.setPendingCreditAssessment(allScoped.stream().filter(l -> l.getStatus() == LoanStatus.CREDIT_ASSESSMENT).count());
        res.setApprovedLoans(allScoped.stream().filter(l -> l.getStatus() == LoanStatus.APPROVED).count());
        res.setRejectedApplications(allScoped.stream().filter(l -> l.getStatus() == LoanStatus.REJECTED).count());
        res.setAwaitingDisbursement(allScoped.stream().filter(l -> l.getStatus() == LoanStatus.APPROVED || l.getStatus() == LoanStatus.DISBURSEMENT_PENDING).count());

        OffsetDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay().atOffset(OffsetDateTime.now().getOffset());
        res.setReceivedThisMonth(allScoped.stream().filter(l -> !l.getCreatedAt().isBefore(monthStart)).count());
        res.setProcessedCount(allScoped.stream().filter(l -> l.getStatus() == LoanStatus.APPROVED || l.getStatus() == LoanStatus.REJECTED || l.getStatus() == LoanStatus.DISBURSED || l.getStatus() == LoanStatus.PAID).count());
        res.setPendingCount(allScoped.stream().filter(l -> l.getStatus() != LoanStatus.REJECTED && l.getStatus() != LoanStatus.DISBURSED && l.getStatus() != LoanStatus.PAID && l.getStatus() != LoanStatus.CANCELLED).count());

        double avgDays = allScoped.stream()
                .filter(l -> l.getDisbursedAt() != null || l.getStatus() == LoanStatus.APPROVED || l.getStatus() == LoanStatus.REJECTED)
                .mapToLong(l -> Math.max(1L, ChronoUnit.DAYS.between(l.getCreatedAt().toLocalDate(), l.getUpdatedAt().toLocalDate())))
                .average().orElse(2.4);
        res.setAvgProcessingDays(BigDecimal.valueOf(avgDays).setScale(1, RoundingMode.HALF_UP).doubleValue());

        long pendingDocs = documentRepository.findByBranchAndOptionalStatus(branchId, "PENDING", null, PageRequest.of(0, 500)).getTotalElements();
        res.setPendingDocVerificationsCount(pendingDocs);
        res.setPendingAssessmentsCount(res.getNewApplications() + res.getPendingDocumentVerification());
        res.setPendingReviewsCount(res.getUnderReviewCount());
        res.setAdditionalDocsRequestedCount(allScoped.stream().filter(l -> l.getStatus() == LoanStatus.ADDITIONAL_INFORMATION_REQUIRED).count());
        res.setPendingApprovalRecommendationsCount(approvalRepository.searchApprovals(branchId, "PENDING", PageRequest.of(0, 500)).getTotalElements());

        BigDecimal totalDisbursed = allScoped.stream()
                .filter(l -> l.getStatus() == LoanStatus.DISBURSED || l.getStatus() == LoanStatus.PAID)
                .map(Loan::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalOutstanding = allScoped.stream()
                .filter(l -> l.getStatus() == LoanStatus.DISBURSED)
                .map(Loan::getOutstandingBalance).reduce(BigDecimal.ZERO, BigDecimal::add);
        res.setTotalDisbursedAmount(totalDisbursed);
        res.setTotalOutstandingAmount(totalOutstanding);

        List<LoanOverdueDto> overdues = getOverdueLoans(username);
        res.setOverdueLoans(overdues.size());
        long totalDisbursedLoans = allScoped.stream().filter(l -> l.getStatus() == LoanStatus.DISBURSED).count();
        res.setPerformingLoansCount(Math.max(0L, totalDisbursedLoans - overdues.size()));

        Map<String, Long> categoryDist = new LinkedHashMap<>();
        for (Loan l : allScoped) {
            categoryDist.merge(l.getLoanCategory(), 1L, Long::sum);
        }
        res.setCategoryDistribution(categoryDist);

        res.setRecentApplications(allScoped.stream().limit(8).map(underwritingService::mapLoanSummary).collect(Collectors.toList()));

        List<LoanOverdueDto> finalOverdueCheck = overdues;
        List<LoanRepaymentSchedule> schedules = scheduleRepository.findByStatusesWithLoan(List.of("PENDING", "DUE", "UPCOMING", "OVERDUE"));
        List<LoanOfficerDashboardResponse.UpcomingEmiDto> upcoming = schedules.stream()
                .filter(s -> branchId == null || (s.getLoan().getBranch() != null && s.getLoan().getBranch().getId().equals(branchId)))
                .limit(8)
                .map(s -> {
                    LoanOfficerDashboardResponse.UpcomingEmiDto dto = new LoanOfficerDashboardResponse.UpcomingEmiDto();
                    dto.setInstallmentId(s.getId());
                    dto.setLoanId(s.getLoan().getLoanId());
                    dto.setCustomerName(s.getLoan().getCustomer().getFirstName() + " " + s.getLoan().getCustomer().getLastName());
                    dto.setInstallmentNumber(s.getInstallmentNumber());
                    dto.setEmiAmount(s.getTotalInstallment());
                    dto.setDueDate(s.getDueDate());
                    dto.setRepaymentStatus(s.getStatus());
                    return dto;
                }).collect(Collectors.toList());
        res.setUpcomingEmis(upcoming);

        long assignedCount = allScoped.stream().filter(l -> username.equalsIgnoreCase(l.getAssignedOfficer())).count();
        res.setOfficerProfile(accessService.buildProfileDto(username, assignedCount));
        return res;
    }

    @Transactional(readOnly = true)
    public LoanOfficerProfileDto getOfficerProfile(String username) {
        Long branchId = accessService.resolveBranchScopeId(username);
        long assignedCount = loanRepository.searchBranchLoans(branchId, username, null, null, null, null, null, null, null, PageRequest.of(0, 1)).getTotalElements();
        return accessService.buildProfileDto(username, assignedCount);
    }

    @Transactional
    public LoanOfficerProfileDto updateShiftStatus(String username, String shiftStatus) {
        LoanOfficerProfile profile = accessService.requireOfficerProfile(username);
        if (profile.getId() != null) {
            profile.setShiftStatus(shiftStatus.trim().toUpperCase());
            officerProfileRepository.save(profile);
        }
        return getOfficerProfile(username);
    }

    @Transactional
    public LoanDisbursementDto initiateDisbursement(String username, String loanId, LoanDisbursementDto.InitiateRequest req) {
        Loan loan = loanRepository.findByLoanId(loanId)
                .orElseThrow(() -> new InvalidTransactionException("Loan not found: " + loanId));
        accessService.assertLoanAccess(username, loan);

        if (loan.getStatus() != LoanStatus.APPROVED) {
            throw new InvalidTransactionException("Only APPROVED loans can enter disbursement. Current status: " + loan.getStatus());
        }
        if (!req.isConditionsVerified() || !req.isBeneficiaryVerified()) {
            throw new InvalidTransactionException("Both disbursement conditions and beneficiary account verification are required");
        }
        if (loan.getAccount().getStatus() != AccountStatus.ACTIVE) {
            throw new InvalidTransactionException("Beneficiary account is not ACTIVE (" + loan.getAccount().getStatus() + ")");
        }

        LoanStatus prev = loan.getStatus();
        loan.setStatus(LoanStatus.DISBURSEMENT_PENDING);
        loanRepository.save(loan);

        LoanDisbursement disb = new LoanDisbursement();
        disb.setDisbursementId("LDSB_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        disb.setLoan(loan);
        disb.setBranch(loan.getBranch());
        disb.setAccount(loan.getAccount());
        disb.setAmount(loan.getAmount());
        disb.setDisbursementMode(req.getDisbursementMode() != null ? req.getDisbursementMode() : "CORE_LEDGER_SIMULATED");
        disb.setConditionsVerified(true);
        disb.setBeneficiaryVerified(true);
        disb.setStatus("INITIATED");
        disb.setInitiatedBy(username);
        disb.setRemarks(req.getRemarks());
        LoanDisbursement saved = disbursementRepository.save(disb);

        historyRepository.save(new LoanStatusHistory(loan, prev, LoanStatus.DISBURSEMENT_PENDING, username,
                "Disbursement request " + saved.getDisbursementId() + " initiated pending disbursement authorization."));
        accessService.recordAudit(loan, username, "DISBURSEMENT_INITIATED", "LOAN_DISBURSEMENT", saved.getDisbursementId(),
                prev.name(), LoanStatus.DISBURSEMENT_PENDING.name(), req.getRemarks());
        return mapDisbursement(saved);
    }

    @Transactional
    public LoanDisbursementDto executeOrRejectDisbursement(String username, String disbursementId, boolean approved, String remarks) {
        LoanDisbursement disb = disbursementRepository.findByDisbursementId(disbursementId)
                .orElseThrow(() -> new InvalidTransactionException("Disbursement request not found: " + disbursementId));
        Loan loan = disb.getLoan();
        accessService.assertBranchAccess(username, disb.getBranch());
        accessService.assertNotSelfApproval(disb.getInitiatedBy(), username, "loan disbursement");

        if (!"INITIATED".equals(disb.getStatus())) {
            throw new InvalidTransactionException("Disbursement " + disbursementId + " is already in status: " + disb.getStatus());
        }

        if (!approved) {
            disb.setStatus("REJECTED");
            disb.setApprovedBy(username);
            disb.setRemarks(remarks);
            loan.setStatus(LoanStatus.APPROVED);
            loanRepository.save(loan);
            LoanDisbursement saved = disbursementRepository.save(disb);
            historyRepository.save(new LoanStatusHistory(loan, LoanStatus.DISBURSEMENT_PENDING, LoanStatus.APPROVED, username,
                    "Disbursement rejected: " + remarks));
            accessService.recordAudit(loan, username, "DISBURSEMENT_REJECTED", "LOAN_DISBURSEMENT", disbursementId,
                    "INITIATED", "REJECTED", remarks);
            return mapDisbursement(saved);
        }

        String txnId = "TXN_LDSB_" + disbursementId;
        DepositRequest depReq = new DepositRequest(txnId, loan.getAccount().getAccountNumber(), disb.getAmount(),
                "LOAN_DISB:" + username);
        TransactionResponse txRes = transactionService.processDeposit(depReq);

        List<LoanRepaymentSchedule> existing = scheduleRepository.findByLoanIdOrderByInstallmentNumberAsc(loan.getId());
        if (existing.isEmpty()) {
            List<LoanRepaymentSchedule> generated = calculator.generateRepaymentSchedule(loan, LocalDate.now());
            for (int i = 0; i < generated.size(); i++) {
                generated.get(i).setStatus(i == 0 ? "DUE" : "UPCOMING");
            }
            scheduleRepository.saveAll(generated);
        }

        disb.setStatus("DISBURSED");
        disb.setApprovedBy(username);
        disb.setTransactionRef(txRes.getTransactionId());
        disb.setDisbursedAt(OffsetDateTime.now());
        if (remarks != null && !remarks.isBlank()) disb.setRemarks(remarks);
        LoanDisbursement saved = disbursementRepository.save(disb);

        loan.setStatus(LoanStatus.DISBURSED);
        loan.setDisbursedAt(disb.getDisbursedAt());
        loanRepository.save(loan);

        historyRepository.save(new LoanStatusHistory(loan, LoanStatus.DISBURSEMENT_PENDING, LoanStatus.DISBURSED, username,
                "Disbursed ₹" + disb.getAmount() + " to " + loan.getAccount().getAccountNumber() + " (Ref: " + txRes.getTransactionId() + ")"));
        accessService.recordAudit(loan, username, "LOAN_DISBURSED", "LOAN_DISBURSEMENT", disbursementId,
                "INITIATED", "DISBURSED", "Txn=" + txRes.getTransactionId());

        if (loan.getCustomer().getUser() != null) {
            outboxService.publishNotificationEvent(new NotificationEvent(
                    "LOAN_DISBURSED", loan.getLoanId(), loan.getAccount().getAccountNumber(),
                    loan.getCustomer().getUser().getId(), loan.getCustomer().getUser().getUsername(),
                    disb.getAmount(),
                    "Loan Disbursement Completed",
                    "₹" + disb.getAmount() + " has been credited to account " + loan.getAccount().getAccountNumber()
                            + " (Ref: " + txRes.getTransactionId() + ").",
                    "SUCCESS"
            ));
        }
        return mapDisbursement(saved);
    }

    @Transactional(readOnly = true)
    public Page<LoanDisbursementDto> listDisbursements(String username, String status, Pageable pageable) {
        Long branchId = accessService.resolveBranchScopeId(username);
        return disbursementRepository.searchDisbursements(branchId, status, pageable).map(this::mapDisbursement);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getRepaymentDetails(String username, String loanId) {
        Loan loan = loanRepository.findByLoanId(loanId)
                .orElseThrow(() -> new InvalidTransactionException("Loan not found: " + loanId));
        accessService.assertLoanAccess(username, loan);

        List<LoanRepaymentSchedule> installments = scheduleRepository.findByLoanIdOrderByInstallmentNumberAsc(loan.getId());
        BigDecimal totalPaid = installments.stream().map(LoanRepaymentSchedule::getPaidAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPrincipalRemaining = installments.stream()
                .filter(i -> !"PAID".equals(i.getStatus()) && !"WAIVED".equals(i.getStatus()))
                .map(LoanRepaymentSchedule::getPrincipalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalInterestRemaining = installments.stream()
                .filter(i -> !"PAID".equals(i.getStatus()) && !"WAIVED".equals(i.getStatus()))
                .map(LoanRepaymentSchedule::getInterestAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        long remainingCount = installments.stream().filter(i -> !"PAID".equals(i.getStatus()) && !"WAIVED".equals(i.getStatus())).count();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("loan", underwritingService.mapLoanSummary(loan));
        out.put("totalPaid", totalPaid);
        out.put("outstandingPrincipal", totalPrincipalRemaining);
        out.put("outstandingInterest", totalInterestRemaining);
        out.put("remainingInstallments", remainingCount);
        out.put("installments", installments.stream().map(s -> {
            LoanRepaymentScheduleResponse r = new LoanRepaymentScheduleResponse();
            r.setId(s.getId());
            r.setLoanId(loan.getId());
            r.setInstallmentNumber(s.getInstallmentNumber());
            r.setDueDate(s.getDueDate());
            r.setPrincipalAmount(s.getPrincipalAmount());
            r.setInterestAmount(s.getInterestAmount());
            r.setTotalInstallment(s.getTotalInstallment());
            r.setPaidAmount(s.getPaidAmount());
            r.setPaidDate(s.getPaidDate());
            r.setStatus(s.getStatus());
            return r;
        }).collect(Collectors.toList()));
        return out;
    }

    @Transactional(readOnly = true)
    public List<LoanOverdueDto> getOverdueLoans(String username) {
        Long branchId = accessService.resolveBranchScopeId(username);
        LocalDate today = LocalDate.now();
        List<LoanRepaymentSchedule> candidates = scheduleRepository.findByStatusesWithLoan(List.of("OVERDUE", "DUE", "PENDING"));
        Map<String, List<LoanRepaymentSchedule>> grouped = candidates.stream()
                .filter(s -> s.getDueDate().isBefore(today) || "OVERDUE".equals(s.getStatus()))
                .filter(s -> branchId == null || (s.getLoan().getBranch() != null && s.getLoan().getBranch().getId().equals(branchId)))
                .collect(Collectors.groupingBy(s -> s.getLoan().getLoanId(), LinkedHashMap::new, Collectors.toList()));

        List<LoanOverdueDto> list = new ArrayList<>();
        for (Map.Entry<String, List<LoanRepaymentSchedule>> entry : grouped.entrySet()) {
            List<LoanRepaymentSchedule> overdueRows = entry.getValue();
            Loan loan = overdueRows.get(0).getLoan();
            LocalDate oldestDue = overdueRows.stream().map(LoanRepaymentSchedule::getDueDate).min(LocalDate::compareTo).orElse(today);
            long dpd = Math.max(0L, ChronoUnit.DAYS.between(oldestDue, today));
            BigDecimal overdueAmt = overdueRows.stream()
                    .map(s -> s.getTotalInstallment().subtract(s.getPaidAmount()).subtract(s.getWaivedAmount()).max(BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            LoanOverdueDto dto = new LoanOverdueDto();
            dto.setLoanId(loan.getLoanId());
            dto.setCustomerNumber(loan.getCustomer().getCustomerNumber());
            dto.setCustomerName(loan.getCustomer().getFirstName() + " " + loan.getCustomer().getLastName());
            dto.setMaskedPhone(accessService.maskPhone(loan.getCustomer().getPhone()));
            dto.setLoanCategory(loan.getLoanCategory());
            dto.setBranchCode(loan.getBranch() != null ? loan.getBranch().getBranchCode() : null);
            dto.setDaysPastDue(dpd);
            dto.setDelinquencyBucket(dpd >= 90 ? "NPA_90_PLUS" : (dpd >= 30 ? "SMA_2_30_89" : (dpd >= 1 ? "SMA_0_1_29" : "CURRENT")));
            dto.setOverdueAmount(overdueAmt);
            dto.setOutstandingBalance(loan.getOutstandingBalance());
            dto.setOverdueInstallmentCount(overdueRows.size());
            dto.setOldestDueDate(oldestDue);
            list.add(dto);
        }
        return list;
    }

    @Transactional
    public LoanOverdueDto.FollowUpDto logFollowUp(String username, String loanId, LoanOverdueDto.CreateFollowUpRequest req) {
        Loan loan = loanRepository.findByLoanId(loanId)
                .orElseThrow(() -> new InvalidTransactionException("Loan not found: " + loanId));
        accessService.assertLoanAccess(username, loan);

        LoanOverdueDto match = getOverdueLoans(username).stream()
                .filter(o -> o.getLoanId().equals(loanId)).findFirst().orElse(null);

        LoanFollowUp f = new LoanFollowUp();
        f.setFollowupId("LFUP_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        f.setLoan(loan);
        f.setBranch(loan.getBranch());
        f.setFollowupType(req.getFollowupType().trim().toUpperCase());
        f.setDpdAtFollowup(match != null ? (int) match.getDaysPastDue() : 0);
        f.setOverdueAmount(match != null ? match.getOverdueAmount() : BigDecimal.ZERO);
        f.setCommitmentAmount(req.getCommitmentAmount());
        f.setCommitmentDate(req.getCommitmentDate());
        f.setOutcome(req.getOutcome());
        f.setRecoveryStatus(req.isEscalated() ? "ESCALATED" : (req.getRecoveryStatus() != null ? req.getRecoveryStatus().toUpperCase() : "OPEN"));
        f.setNotes(req.getNotes());
        f.setEscalated(req.isEscalated());
        f.setCreatedBy(username);
        LoanFollowUp saved = followUpRepository.save(f);

        accessService.recordAudit(loan, username, "OVERDUE_FOLLOWUP_LOGGED", "LOAN_FOLLOWUP", saved.getFollowupId(),
                null, saved.getRecoveryStatus(), req.getOutcome());
        return mapFollowUp(saved);
    }

    @Transactional(readOnly = true)
    public Page<LoanOverdueDto.FollowUpDto> listFollowUps(String username, Pageable pageable) {
        Long branchId = accessService.resolveBranchScopeId(username);
        return followUpRepository.findByBranchScope(branchId, pageable).map(this::mapFollowUp);
    }

    @Transactional
    public LoanCommunicationDto sendCustomerCommunication(String username, LoanCommunicationDto.SendRequest req) {
        Customer customer = customerRepository.findByCustomerNumber(req.getCustomerNumber())
                .orElseThrow(() -> new InvalidTransactionException("Customer not found: " + req.getCustomerNumber()));
        accessService.assertBranchAccess(username, customer.getBranch());

        Loan loan = null;
        if (req.getLoanId() != null && !req.getLoanId().isBlank()) {
            loan = loanRepository.findByLoanId(req.getLoanId())
                    .orElseThrow(() -> new InvalidTransactionException("Loan not found: " + req.getLoanId()));
            accessService.assertLoanAccess(username, loan);
        }

        LoanCommunication comm = new LoanCommunication();
        comm.setCommunicationId("LCOM_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        comm.setLoan(loan);
        comm.setCustomer(customer);
        comm.setChannel(req.getChannel() != null ? req.getChannel().toUpperCase() : "IN_APP_NOTIFICATION");
        comm.setCommunicationType(req.getCommunicationType().toUpperCase());
        comm.setSubject(req.getSubject());
        comm.setMessage(req.getMessage());
        comm.setRecipient(accessService.maskEmail(customer.getEmail()));
        comm.setDeliveryStatus("SENT_INTERNAL");
        comm.setSentBy(username);
        LoanCommunication saved = communicationRepository.save(comm);

        if (customer.getUser() != null) {
            outboxService.publishNotificationEvent(new NotificationEvent(
                    "LOAN_OFFICER_COMMUNICATION",
                    loan != null ? loan.getLoanId() : null,
                    null,
                    customer.getUser().getId(),
                    customer.getUser().getUsername(),
                    loan != null ? loan.getAmount() : BigDecimal.ZERO,
                    req.getSubject(),
                    req.getMessage(),
                    "INFO"
            ));
        }

        accessService.recordAudit(loan, username, "CUSTOMER_COMMUNICATION_SENT", "LOAN_COMMUNICATION",
                saved.getCommunicationId(), null, saved.getDeliveryStatus(), req.getSubject());
        return mapCommunication(saved);
    }

    @Transactional(readOnly = true)
    public Page<LoanCommunicationDto> listCommunications(String username, Pageable pageable) {
        Long branchId = accessService.resolveBranchScopeId(username);
        return communicationRepository.findByBranchScope(branchId, pageable).map(this::mapCommunication);
    }

    @Transactional(readOnly = true)
    public LoanPortfolioDto getPortfolioAnalytics(String username, String categoryFilter) {
        Long branchId = accessService.resolveBranchScopeId(username);
        List<Loan> scoped = loanRepository.searchBranchLoans(branchId, null, null, categoryFilter, null, null, null, null, null, PageRequest.of(0, 1000)).getContent();

        LoanPortfolioDto dto = new LoanPortfolioDto();
        dto.setTotalApplications(scoped.size());
        long approved = scoped.stream().filter(l -> l.getStatus() == LoanStatus.APPROVED || l.getStatus() == LoanStatus.DISBURSED || l.getStatus() == LoanStatus.PAID).count();
        long rejected = scoped.stream().filter(l -> l.getStatus() == LoanStatus.REJECTED).count();
        dto.setTotalApprovedLoans(approved);
        dto.setTotalRejectedLoans(rejected);
        dto.setTotalLoansManaged(scoped.stream().filter(l -> l.getStatus() == LoanStatus.DISBURSED || l.getStatus() == LoanStatus.PAID).count());
        dto.setApprovalRatioPercent((approved + rejected) > 0
                ? BigDecimal.valueOf(approved * 100.0 / (approved + rejected)).setScale(1, RoundingMode.HALF_UP).doubleValue() : 0.0);

        dto.setTotalDisbursedAmount(scoped.stream()
                .filter(l -> l.getStatus() == LoanStatus.DISBURSED || l.getStatus() == LoanStatus.PAID)
                .map(Loan::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add));

        List<Loan> activeDisbursed = scoped.stream().filter(l -> l.getStatus() == LoanStatus.DISBURSED).collect(Collectors.toList());
        BigDecimal totalOutPrincipal = BigDecimal.ZERO;
        BigDecimal totalOutInterest = BigDecimal.ZERO;
        long totalSchedules = 0;
        long paidSchedules = 0;
        for (Loan l : activeDisbursed) {
            for (LoanRepaymentSchedule s : scheduleRepository.findByLoanIdOrderByInstallmentNumberAsc(l.getId())) {
                totalSchedules++;
                if ("PAID".equals(s.getStatus())) {
                    paidSchedules++;
                } else if (!"WAIVED".equals(s.getStatus())) {
                    totalOutPrincipal = totalOutPrincipal.add(s.getPrincipalAmount());
                    totalOutInterest = totalOutInterest.add(s.getInterestAmount());
                }
            }
        }
        dto.setTotalOutstandingPrincipal(totalOutPrincipal);
        dto.setTotalOutstandingInterest(totalOutInterest);

        long overdueCount = getOverdueLoans(username).size();
        dto.setOverdueLoanCount(overdueCount);
        dto.setPerformingLoanCount(Math.max(0L, activeDisbursed.size() - overdueCount));
        dto.setOnTimeRepaymentRatePercent(totalSchedules > 0
                ? BigDecimal.valueOf(paidSchedules * 100.0 / totalSchedules).setScale(1, RoundingMode.HALF_UP).doubleValue() : 100.0);

        Map<String, Long> catCounts = new LinkedHashMap<>();
        Map<String, BigDecimal> catAmts = new LinkedHashMap<>();
        Map<YearMonth, List<Loan>> byMonth = new TreeMap<>();
        for (Loan l : scoped) {
            catCounts.merge(l.getLoanCategory(), 1L, Long::sum);
            catAmts.merge(l.getLoanCategory(), l.getAmount(), BigDecimal::add);
            YearMonth ym = YearMonth.from(l.getCreatedAt());
            byMonth.computeIfAbsent(ym, k -> new ArrayList<>()).add(l);
        }
        dto.setCategoryCounts(catCounts);
        dto.setCategoryAmounts(catAmts);

        List<LoanPortfolioDto.MonthlyTrend> trends = byMonth.entrySet().stream().map(e -> {
            BigDecimal disbSum = e.getValue().stream()
                    .filter(l -> l.getStatus() == LoanStatus.DISBURSED || l.getStatus() == LoanStatus.PAID)
                    .map(Loan::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            return new LoanPortfolioDto.MonthlyTrend(e.getKey().toString(), e.getValue().size(), disbSum, BigDecimal.ZERO);
        }).collect(Collectors.toList());
        dto.setMonthlyTrends(trends);
        return dto;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> buildReport(String username, String reportType, String category, LoanStatus status,
                                           LocalDate fromDate, LocalDate toDate, Pageable pageable) {
        Long branchId = accessService.resolveBranchScopeId(username);
        OffsetDateTime since = fromDate != null ? fromDate.atStartOfDay().atOffset(OffsetDateTime.now().getOffset()) : null;
        OffsetDateTime until = toDate != null ? toDate.plusDays(1).atStartOfDay().atOffset(OffsetDateTime.now().getOffset()) : null;

        Page<Loan> page = loanRepository.searchBranchLoans(branchId, null, status, category, null, null, null, since, until, pageable);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("reportType", reportType != null ? reportType : "LOAN_APPLICATION_REPORT");
        out.put("generatedAt", OffsetDateTime.now());
        out.put("totalRecords", page.getTotalElements());
        out.put("portfolioSummary", getPortfolioAnalytics(username, category));
        out.put("rows", page.getContent().stream().map(underwritingService::mapLoanSummary).collect(Collectors.toList()));
        return out;
    }

    @Transactional(readOnly = true)
    public String exportReportCsv(String username, String reportType, String category, LoanStatus status) {
        Long branchId = accessService.resolveBranchScopeId(username);
        List<Loan> rows = loanRepository.searchBranchLoans(branchId, null, status, category, null, null, null, null, null, PageRequest.of(0, 1000)).getContent();
        StringBuilder sb = new StringBuilder("LoanId,Category,Branch,CustomerNumber,CustomerName,Amount,InterestRate,TermMonths,DTI,EMI,Outstanding,Status,AssignedOfficer,FinalApprovedBy,CreatedAt\n");
        for (Loan l : rows) {
            sb.append(csvCell(l.getLoanId())).append(',')
                    .append(csvCell(l.getLoanCategory())).append(',')
                    .append(csvCell(l.getBranch() != null ? l.getBranch().getBranchCode() : "")).append(',')
                    .append(csvCell(l.getCustomer().getCustomerNumber())).append(',')
                    .append(csvCell(l.getCustomer().getFirstName() + " " + l.getCustomer().getLastName())).append(',')
                    .append(l.getAmount()).append(',')
                    .append(l.getInterestRate()).append(',')
                    .append(l.getTermMonths()).append(',')
                    .append(l.getDtiRatio()).append(',')
                    .append(l.getEmiAmount()).append(',')
                    .append(l.getOutstandingBalance()).append(',')
                    .append(l.getStatus().name()).append(',')
                    .append(csvCell(l.getAssignedOfficer())).append(',')
                    .append(csvCell(l.getFinalApprovedBy())).append(',')
                    .append(csvCell(l.getCreatedAt().toString())).append('\n');
        }
        return sb.toString();
    }

    private String csvCell(String val) {
        if (val == null) return "\"\"";
        return "\"" + val.replace("\"", "\"\"") + "\"";
    }

    private LoanDisbursementDto mapDisbursement(LoanDisbursement d) {
        LoanDisbursementDto dto = new LoanDisbursementDto();
        dto.setDisbursementId(d.getDisbursementId());
        dto.setLoanId(d.getLoan().getLoanId());
        dto.setCustomerNumber(d.getLoan().getCustomer().getCustomerNumber());
        dto.setCustomerName(d.getLoan().getCustomer().getFirstName() + " " + d.getLoan().getCustomer().getLastName());
        dto.setAccountNumber(d.getAccount().getAccountNumber());
        dto.setBranchCode(d.getBranch() != null ? d.getBranch().getBranchCode() : null);
        dto.setAmount(d.getAmount());
        dto.setDisbursementMode(d.getDisbursementMode());
        dto.setTransactionRef(d.getTransactionRef());
        dto.setConditionsVerified(d.isConditionsVerified());
        dto.setBeneficiaryVerified(d.isBeneficiaryVerified());
        dto.setStatus(d.getStatus());
        dto.setInitiatedBy(d.getInitiatedBy());
        dto.setApprovedBy(d.getApprovedBy());
        dto.setRemarks(d.getRemarks());
        dto.setDisbursedAt(d.getDisbursedAt());
        dto.setCreatedAt(d.getCreatedAt());
        return dto;
    }

    private LoanOverdueDto.FollowUpDto mapFollowUp(LoanFollowUp f) {
        LoanOverdueDto.FollowUpDto dto = new LoanOverdueDto.FollowUpDto();
        dto.setFollowupId(f.getFollowupId());
        dto.setLoanId(f.getLoan().getLoanId());
        dto.setFollowupType(f.getFollowupType());
        dto.setDpdAtFollowup(f.getDpdAtFollowup());
        dto.setOverdueAmount(f.getOverdueAmount());
        dto.setCommitmentAmount(f.getCommitmentAmount());
        dto.setCommitmentDate(f.getCommitmentDate());
        dto.setOutcome(f.getOutcome());
        dto.setRecoveryStatus(f.getRecoveryStatus());
        dto.setNotes(f.getNotes());
        dto.setEscalated(f.isEscalated());
        dto.setCreatedBy(f.getCreatedBy());
        dto.setCreatedAt(f.getCreatedAt());
        return dto;
    }

    private LoanCommunicationDto mapCommunication(LoanCommunication c) {
        LoanCommunicationDto dto = new LoanCommunicationDto();
        dto.setCommunicationId(c.getCommunicationId());
        dto.setLoanId(c.getLoan() != null ? c.getLoan().getLoanId() : null);
        dto.setCustomerNumber(c.getCustomer().getCustomerNumber());
        dto.setCustomerName(c.getCustomer().getFirstName() + " " + c.getCustomer().getLastName());
        dto.setChannel(c.getChannel());
        dto.setCommunicationType(c.getCommunicationType());
        dto.setSubject(c.getSubject());
        dto.setMessage(c.getMessage());
        dto.setRecipient(c.getRecipient());
        dto.setDeliveryStatus(c.getDeliveryStatus());
        dto.setSentBy(c.getSentBy());
        dto.setCreatedAt(c.getCreatedAt());
        return dto;
    }
}
