package com.bank.transaction.service;

import com.bank.transaction.dto.NotificationEvent;
import com.bank.transaction.dto.loan.*;
import com.bank.transaction.exception.InvalidTransactionException;
import com.bank.transaction.model.*;
import com.bank.transaction.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LoanUnderwritingService {

    private static final Map<String, BigDecimal> CATEGORY_BASE_RATES = Map.of(
            "PERSONAL", new BigDecimal("11.25"),
            "HOME", new BigDecimal("8.50"),
            "EDUCATION", new BigDecimal("7.90"),
            "VEHICLE", new BigDecimal("9.25"),
            "BUSINESS", new BigDecimal("10.50"),
            "GOLD", new BigDecimal("8.25")
    );

    private static final BigDecimal MAX_ALLOWABLE_DTI_PERCENT = new BigDecimal("50.00");

    private final LoanRepository loanRepository;
    private final CustomerRepository customerRepository;
    private final AccountRepository accountRepository;
    private final LoanStatusHistoryRepository historyRepository;
    private final LoanCreditAssessmentRepository assessmentRepository;
    private final LoanApprovalRequestRepository approvalRepository;
    private final LoanDocumentRepository documentRepository;
    private final LoanAuditLogRepository auditLogRepository;
    private final LoanFinancialCalculator calculator;
    private final LoanAccessService accessService;
    private final OutboxService outboxService;

    public LoanUnderwritingService(LoanRepository loanRepository,
                                   CustomerRepository customerRepository,
                                   AccountRepository accountRepository,
                                   LoanStatusHistoryRepository historyRepository,
                                   LoanCreditAssessmentRepository assessmentRepository,
                                   LoanApprovalRequestRepository approvalRepository,
                                   LoanDocumentRepository documentRepository,
                                   LoanAuditLogRepository auditLogRepository,
                                   LoanFinancialCalculator calculator,
                                   LoanAccessService accessService,
                                   OutboxService outboxService) {
        this.loanRepository = loanRepository;
        this.customerRepository = customerRepository;
        this.accountRepository = accountRepository;
        this.historyRepository = historyRepository;
        this.assessmentRepository = assessmentRepository;
        this.approvalRepository = approvalRepository;
        this.documentRepository = documentRepository;
        this.auditLogRepository = auditLogRepository;
        this.calculator = calculator;
        this.accessService = accessService;
        this.outboxService = outboxService;
    }

    @Transactional(readOnly = true)
    public Page<LoanOfficerCustomerDto> searchCustomers(String username, String query, String kycStatus, Pageable pageable) {
        Long branchId = accessService.resolveBranchScopeId(username);
        String kycFilter = (kycStatus != null && !kycStatus.isBlank() && !"ALL".equalsIgnoreCase(kycStatus))
                ? kycStatus.trim().toUpperCase() : null;
        return customerRepository.searchCustomers(branchId, kycFilter, query, pageable)
                .map(c -> mapCustomerSummary(c, false));
    }

    @Transactional(readOnly = true)
    public LoanOfficerCustomerDto getCustomerProfile(String username, String customerNumber) {
        Customer customer = customerRepository.findByCustomerNumberWithAccounts(customerNumber)
                .orElseThrow(() -> new InvalidTransactionException("Customer not found: " + customerNumber));
        accessService.assertBranchAccess(username, customer.getBranch());
        return mapCustomerSummary(customer, true);
    }

    @Transactional
    public LoanApplicationSummaryDto createApplication(String username, LoanApplicationSummaryDto.CreateRequest req) {
        Customer customer = customerRepository.findByCustomerNumberWithAccounts(req.getCustomerNumber())
                .orElseThrow(() -> new InvalidTransactionException("Customer not found: " + req.getCustomerNumber()));
        accessService.assertBranchAccess(username, customer.getBranch());

        Account account = accountRepository.findByAccountNumber(req.getAccountNumber())
                .orElseThrow(() -> new InvalidTransactionException("Repayment account not found: " + req.getAccountNumber()));
        if (!account.getCustomer().getId().equals(customer.getId())) {
            throw new InvalidTransactionException("Repayment account " + req.getAccountNumber() + " does not belong to customer " + req.getCustomerNumber());
        }
        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new InvalidTransactionException("Repayment account must be ACTIVE (current: " + account.getStatus() + ")");
        }

        String category = req.getLoanCategory().trim().toUpperCase();
        if (!CATEGORY_BASE_RATES.containsKey(category)) {
            throw new InvalidTransactionException("Unsupported loan category: " + category);
        }

        BigDecimal rate = req.getInterestRate() != null ? req.getInterestRate() : CATEGORY_BASE_RATES.get(category);
        BigDecimal existingDebt = req.getExistingLiabilities() != null ? req.getExistingLiabilities() : BigDecimal.ZERO;
        BigDecimal emi = calculator.calculateMonthlyEmi(req.getRequestedAmount(), rate, req.getTenureMonths());
        BigDecimal dti = calculator.calculateDtiRatio(req.getMonthlyIncome(), existingDebt, emi);
        BigDecimal totalPayable = emi.multiply(BigDecimal.valueOf(req.getTenureMonths())).setScale(2, RoundingMode.HALF_UP);

        Loan loan = new Loan(
                "LN" + System.currentTimeMillis() + (int) (Math.random() * 900 + 100),
                customer,
                account,
                req.getRequestedAmount(),
                rate,
                req.getTenureMonths(),
                req.getLoanPurpose(),
                req.getMonthlyIncome(),
                existingDebt,
                req.getCreditScore() != null ? req.getCreditScore() : 700
        );
        loan.setStatus(LoanStatus.SUBMITTED);
        loan.setLoanCategory(category);
        loan.setBranch(customer.getBranch() != null ? customer.getBranch() : account.getBranch());
        loan.setAssignedOfficer(username);
        loan.setCreatedBy(username);
        loan.setEmploymentType(req.getEmploymentType().trim().toUpperCase());
        loan.setEmiAmount(emi);
        loan.setDtiRatio(dti);
        loan.setTotalPayable(totalPayable);
        loan.setOutstandingBalance(totalPayable);
        loan.setDocumentUrls(req.getDocumentUrls());
        loan.setAssessmentNotes(req.getRemarks());
        loan.setRequiresAdminApproval(req.getRequestedAmount().compareTo(new BigDecimal("500000.00")) > 0);
        if (req.getCollateralType() != null && !req.getCollateralType().isBlank()) {
            loan.setCollateralType(req.getCollateralType().trim().toUpperCase());
        }
        if (req.getCollateralValue() != null && req.getCollateralValue().compareTo(BigDecimal.ZERO) > 0) {
            loan.setCollateralValue(req.getCollateralValue());
            loan.setLtvRatio(req.getRequestedAmount().multiply(BigDecimal.valueOf(100))
                    .divide(req.getCollateralValue(), 2, RoundingMode.HALF_UP));
        }

        Loan saved = loanRepository.save(loan);

        historyRepository.save(new LoanStatusHistory(saved, null, LoanStatus.SUBMITTED, username,
                "Loan application registered by officer (" + category + "): " + (req.getRemarks() != null ? req.getRemarks() : "")));
        accessService.recordAudit(saved, username, "LOAN_APPLICATION_CREATED", "LOAN", saved.getLoanId(),
                null, LoanStatus.SUBMITTED.name(), "Category=" + category + ", Amount=" + saved.getAmount());

        if (customer.getUser() != null) {
            outboxService.publishNotificationEvent(new NotificationEvent(
                    "LOAN_APPLICATION_CREATED", saved.getLoanId(), account.getAccountNumber(),
                    customer.getUser().getId(), customer.getUser().getUsername(), saved.getAmount(),
                    "Loan Application Registered",
                    "Loan application " + saved.getLoanId() + " (" + category + ") has been submitted for underwriting.",
                    "INFO"
            ));
        }
        return mapLoanSummary(saved);
    }

    @Transactional(readOnly = true)
    public Page<LoanApplicationSummaryDto> searchApplications(String username, LoanStatus status, String category,
                                                              String q, BigDecimal minAmount, BigDecimal maxAmount,
                                                              LocalDate fromDate, LocalDate toDate, boolean assignedOnly,
                                                              Pageable pageable) {
        Long branchId = accessService.resolveBranchScopeId(username);
        String officerScope = assignedOnly ? username : null;
        OffsetDateTime since = fromDate != null ? fromDate.atStartOfDay().atOffset(ZoneOffset.UTC) : null;
        OffsetDateTime until = toDate != null ? toDate.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC) : null;
        return loanRepository.searchBranchLoans(branchId, officerScope, status, category, q, minAmount, maxAmount, since, until, pageable)
                .map(this::mapLoanSummary);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getApplicationWorkspace(String username, String loanId) {
        Loan loan = loanRepository.findByLoanId(loanId)
                .orElseThrow(() -> new InvalidTransactionException("Loan not found: " + loanId));
        accessService.assertLoanAccess(username, loan);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("application", mapLoanSummary(loan));
        payload.put("timeline", historyRepository.findByLoanIdOrderByCreatedAtAsc(loan.getId()).stream().map(h -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("previousStatus", h.getPreviousStatus() != null ? h.getPreviousStatus().name() : null);
            item.put("newStatus", h.getNewStatus().name());
            item.put("changedBy", h.getChangedBy());
            item.put("remarks", h.getRemarks());
            item.put("createdAt", h.getCreatedAt());
            return item;
        }).collect(Collectors.toList()));
        payload.put("latestAssessment", assessmentRepository.findTopByLoanIdOrderByAssessedAtDesc(loan.getId())
                .map(this::mapAssessment).orElse(null));
        payload.put("approvals", approvalRepository.findByLoanIdOrderByCreatedAtDesc(loan.getId()).stream()
                .map(this::mapApproval).collect(Collectors.toList()));
        payload.put("auditLogs", auditLogRepository.findByLoanIdOrderByCreatedAtDesc(loan.getId()));
        payload.put("documentCount", documentRepository.findByLoanIdOrderByCreatedAtDesc(loan.getId()).size());
        payload.put("verifiedDocumentCount", documentRepository.countByLoanIdAndVerificationStatus(loan.getId(), "VERIFIED"));
        return payload;
    }

    @Transactional
    public LoanApplicationSummaryDto updateApplication(String username, String loanId, LoanApplicationSummaryDto.UpdateRequest req) {
        Loan loan = loanRepository.findByLoanId(loanId)
                .orElseThrow(() -> new InvalidTransactionException("Loan not found: " + loanId));
        accessService.assertLoanAccess(username, loan);

        if (loan.getStatus() == LoanStatus.APPROVED || loan.getStatus() == LoanStatus.DISBURSED
                || loan.getStatus() == LoanStatus.DISBURSEMENT_PENDING || loan.getStatus() == LoanStatus.PAID) {
            throw new InvalidTransactionException("Cannot modify terms of a loan in " + loan.getStatus() + " status");
        }

        if (req.getLoanPurpose() != null && !req.getLoanPurpose().isBlank()) loan.setPurpose(req.getLoanPurpose().trim());
        if (req.getEmploymentType() != null && !req.getEmploymentType().isBlank()) loan.setEmploymentType(req.getEmploymentType().trim().toUpperCase());
        if (req.getMonthlyIncome() != null) loan.setMonthlyIncome(req.getMonthlyIncome());
        if (req.getExistingLiabilities() != null) loan.setExistingMonthlyDebt(req.getExistingLiabilities());
        if (req.getRequestedAmount() != null) loan.setAmount(req.getRequestedAmount());
        if (req.getTermMonths() != null) loan.setTermMonths(req.getTermMonths());
        if (req.getCollateralType() != null) loan.setCollateralType(req.getCollateralType());
        if (req.getCollateralValue() != null) loan.setCollateralValue(req.getCollateralValue());
        if (req.getRemarks() != null) loan.setAssessmentNotes(req.getRemarks());

        BigDecimal emi = calculator.calculateMonthlyEmi(loan.getAmount(), loan.getInterestRate(), loan.getTermMonths());
        BigDecimal dti = calculator.calculateDtiRatio(loan.getMonthlyIncome(), loan.getExistingMonthlyDebt(), emi);
        BigDecimal totalPayable = emi.multiply(BigDecimal.valueOf(loan.getTermMonths())).setScale(2, RoundingMode.HALF_UP);
        loan.setEmiAmount(emi);
        loan.setDtiRatio(dti);
        loan.setTotalPayable(totalPayable);
        loan.setOutstandingBalance(totalPayable);
        if (loan.getCollateralValue() != null && loan.getCollateralValue().compareTo(BigDecimal.ZERO) > 0) {
            loan.setLtvRatio(loan.getAmount().multiply(BigDecimal.valueOf(100))
                    .divide(loan.getCollateralValue(), 2, RoundingMode.HALF_UP));
        }
        loan.setRequiresAdminApproval(loan.getAmount().compareTo(new BigDecimal("500000.00")) > 0);
        Loan saved = loanRepository.save(loan);
        accessService.recordAudit(saved, username, "LOAN_APPLICATION_UPDATED", "LOAN", saved.getLoanId(),
                saved.getStatus().name(), saved.getStatus().name(), req.getRemarks());
        return mapLoanSummary(saved);
    }

    @Transactional
    public LoanApplicationSummaryDto assignApplication(String username, String loanId, String targetOfficerUsername) {
        Loan loan = loanRepository.findByLoanId(loanId)
                .orElseThrow(() -> new InvalidTransactionException("Loan not found: " + loanId));
        accessService.assertBranchAccess(username, loan.getBranch());
        LoanOfficerProfile targetProfile = accessService.requireOfficerProfile(targetOfficerUsername);
        if (loan.getBranch() != null && !loan.getBranch().getId().equals(targetProfile.getBranch().getId())) {
            throw new InvalidTransactionException("Cannot assign loan across branches");
        }
        String prev = loan.getAssignedOfficer();
        loan.setAssignedOfficer(targetOfficerUsername);
        Loan saved = loanRepository.save(loan);

        accessService.recordAudit(saved, username, "APPLICATION_ASSIGNED", "LOAN", saved.getLoanId(),
                prev, targetOfficerUsername, "Assigned to " + targetOfficerUsername);
        outboxService.publishNotificationEvent(new NotificationEvent(
                "LOAN_ASSIGNED", saved.getLoanId(), saved.getAccount().getAccountNumber(),
                targetProfile.getUser().getId(), targetProfile.getUser().getUsername(), saved.getAmount(),
                "New Loan Application Assigned",
                "Loan application " + saved.getLoanId() + " has been assigned to you for underwriting.",
                "INFO"
        ));
        return mapLoanSummary(saved);
    }

    @Transactional
    public LoanApplicationSummaryDto transitionStage(String username, String loanId, LoanStatus targetStatus, String remarks) {
        Loan loan = loanRepository.findByLoanId(loanId)
                .orElseThrow(() -> new InvalidTransactionException("Loan not found: " + loanId));
        accessService.assertLoanAccess(username, loan);

        LoanStatus current = loan.getStatus();
        if (targetStatus == LoanStatus.APPROVED || targetStatus == LoanStatus.DISBURSED) {
            throw new InvalidTransactionException("Use Approval Decision / Disbursement endpoints for " + targetStatus);
        }
        if (current == LoanStatus.DISBURSED || current == LoanStatus.PAID) {
            throw new InvalidTransactionException("Completed loan (" + current + ") cannot change stage");
        }

        loan.setStatus(targetStatus);
        loan.setReviewedBy(username);
        if (remarks != null && !remarks.isBlank()) {
            loan.setAssessmentNotes(remarks);
        }
        Loan saved = loanRepository.save(loan);
        historyRepository.save(new LoanStatusHistory(saved, current, targetStatus, username,
                remarks != null ? remarks : "Moved stage to " + targetStatus));
        accessService.recordAudit(saved, username, "LOAN_STAGE_TRANSITION", "LOAN", saved.getLoanId(),
                current.name(), targetStatus.name(), remarks);
        return mapLoanSummary(saved);
    }

    @Transactional
    public LoanCreditAssessmentDto performCreditAssessment(String username, String loanId, LoanCreditAssessmentDto.AssessRequest req) {
        Loan loan = loanRepository.findByLoanId(loanId)
                .orElseThrow(() -> new InvalidTransactionException("Loan not found: " + loanId));
        accessService.assertLoanAccess(username, loan);

        LoanCreditAssessmentDto computed = computeCreditMetrics(loan, req);
        if (!req.isSaveToApplication()) {
            return computed;
        }

        LoanCreditAssessment entity = new LoanCreditAssessment();
        entity.setAssessmentId("CAS_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        entity.setLoan(loan);
        entity.setCustomer(loan.getCustomer());
        entity.setMonthlyIncome(req.getMonthlyIncome());
        entity.setExistingDebt(req.getExistingDebt() != null ? req.getExistingDebt() : BigDecimal.ZERO);
        entity.setRequestedAmount(req.getRequestedAmount());
        entity.setEligibleAmount(computed.getEligibleAmount());
        entity.setProposedInterestRate(req.getInterestRate());
        entity.setProposedTenureMonths(req.getTenureMonths());
        entity.setEstimatedEmi(computed.getEstimatedEmi());
        entity.setTotalRepayment(computed.getTotalRepayment());
        entity.setTotalInterest(computed.getTotalInterest());
        entity.setRemainingMonthlyIncome(computed.getRemainingMonthlyIncome());
        entity.setDtiRatio(computed.getDtiRatio());
        entity.setLtvRatio(computed.getLtvRatio());
        entity.setCreditScore(req.getCreditScore());
        entity.setCreditSource(req.getCreditSource() != null ? req.getCreditSource() : "SIMULATED_CIBIL");
        entity.setEmploymentStability(req.getEmploymentStability() != null ? req.getEmploymentStability() : "STABLE");
        entity.setCollateralValue(req.getCollateralValue());
        entity.setRiskCategory(computed.getRiskCategory());
        entity.setRecommendation(computed.getRecommendation());
        entity.setOfficerRemarks(req.getOfficerRemarks());
        entity.setAssessedBy(username);

        LoanCreditAssessment saved = assessmentRepository.save(entity);
        if (loan.getStatus() == LoanStatus.PENDING || loan.getStatus() == LoanStatus.SUBMITTED
                || loan.getStatus() == LoanStatus.DOCUMENT_VERIFICATION || loan.getStatus() == LoanStatus.UNDER_REVIEW) {
            LoanStatus prev = loan.getStatus();
            loan.setStatus(LoanStatus.CREDIT_ASSESSMENT);
            loan.setDtiRatio(computed.getDtiRatio());
            loan.setCreditScore(req.getCreditScore());
            loan.setAssessmentNotes(req.getOfficerRemarks());
            loanRepository.save(loan);
            historyRepository.save(new LoanStatusHistory(loan, prev, LoanStatus.CREDIT_ASSESSMENT, username,
                    "Credit assessment recorded: " + computed.getRecommendation() + " (" + computed.getRiskCategory() + " RISK)"));
        }
        accessService.recordAudit(loan, username, "CREDIT_ASSESSMENT_SAVED", "CREDIT_ASSESSMENT", saved.getAssessmentId(),
                null, computed.getRiskCategory() + ":" + computed.getRecommendation(), req.getOfficerRemarks());
        return mapAssessment(saved);
    }

    public LoanCreditAssessmentDto computeCreditMetrics(Loan loan, LoanCreditAssessmentDto.AssessRequest req) {
        BigDecimal income = req.getMonthlyIncome();
        BigDecimal debt = req.getExistingDebt() != null ? req.getExistingDebt() : BigDecimal.ZERO;
        BigDecimal emi = calculator.calculateMonthlyEmi(req.getRequestedAmount(), req.getInterestRate(), req.getTenureMonths());
        BigDecimal dti = calculator.calculateDtiRatio(income, debt, emi);
        BigDecimal totalRepayment = emi.multiply(BigDecimal.valueOf(req.getTenureMonths())).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalInterest = totalRepayment.subtract(req.getRequestedAmount()).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        BigDecimal remainingIncome = income.subtract(debt).subtract(emi).setScale(2, RoundingMode.HALF_UP);

        // Compute eligible amount based on 50% max DTI capacity
        BigDecimal maxAllowableEmi = income.multiply(new BigDecimal("0.50")).subtract(debt).max(BigDecimal.ZERO);
        BigDecimal eligibleAmount;
        if (emi.compareTo(BigDecimal.ZERO) > 0 && maxAllowableEmi.compareTo(BigDecimal.ZERO) > 0) {
            eligibleAmount = req.getRequestedAmount().multiply(maxAllowableEmi)
                    .divide(emi, 2, RoundingMode.HALF_UP).min(req.getRequestedAmount().multiply(new BigDecimal("1.50")));
        } else {
            eligibleAmount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal ltv = null;
        if (req.getCollateralValue() != null && req.getCollateralValue().compareTo(BigDecimal.ZERO) > 0) {
            ltv = req.getRequestedAmount().multiply(BigDecimal.valueOf(100))
                    .divide(req.getCollateralValue(), 2, RoundingMode.HALF_UP);
        }

        int score = req.getCreditScore() != null ? req.getCreditScore() : 700;
        String risk;
        String recommendation;
        if (score >= 740 && dti.compareTo(new BigDecimal("40.00")) <= 0 && (ltv == null || ltv.compareTo(new BigDecimal("75.00")) <= 0)) {
            risk = "LOW";
            recommendation = "RECOMMENDED";
        } else if (score >= 650 && dti.compareTo(MAX_ALLOWABLE_DTI_PERCENT) <= 0 && (ltv == null || ltv.compareTo(new BigDecimal("85.00")) <= 0)) {
            risk = "MEDIUM";
            recommendation = dti.compareTo(new BigDecimal("45.00")) > 0 ? "REQUIRES_ADDITIONAL_REVIEW" : "RECOMMENDED";
        } else {
            risk = "HIGH";
            recommendation = "NOT_RECOMMENDED";
        }

        LoanCreditAssessmentDto dto = new LoanCreditAssessmentDto();
        dto.setLoanId(loan != null ? loan.getLoanId() : null);
        dto.setCustomerNumber(loan != null ? loan.getCustomer().getCustomerNumber() : null);
        dto.setCustomerName(loan != null ? loan.getCustomer().getFirstName() + " " + loan.getCustomer().getLastName() : null);
        dto.setMonthlyIncome(income);
        dto.setExistingDebt(debt);
        dto.setRequestedAmount(req.getRequestedAmount());
        dto.setEligibleAmount(eligibleAmount);
        dto.setProposedInterestRate(req.getInterestRate());
        dto.setProposedTenureMonths(req.getTenureMonths());
        dto.setEstimatedEmi(emi);
        dto.setTotalRepayment(totalRepayment);
        dto.setTotalInterest(totalInterest);
        dto.setRemainingMonthlyIncome(remainingIncome);
        dto.setDtiRatio(dti);
        dto.setLtvRatio(ltv);
        dto.setCreditScore(score);
        dto.setCreditSource(req.getCreditSource() != null ? req.getCreditSource() : "SIMULATED_CIBIL");
        dto.setEmploymentStability(req.getEmploymentStability() != null ? req.getEmploymentStability() : "STABLE");
        dto.setCollateralValue(req.getCollateralValue());
        dto.setRiskCategory(risk);
        dto.setRecommendation(recommendation);
        dto.setOfficerRemarks(req.getOfficerRemarks());
        dto.setAssessedAt(OffsetDateTime.now());
        return dto;
    }

    @Transactional
    public LoanApprovalDto submitRecommendation(String username, String loanId, LoanApprovalDto.RecommendRequest req) {
        Loan loan = loanRepository.findByLoanId(loanId)
                .orElseThrow(() -> new InvalidTransactionException("Loan not found: " + loanId));
        accessService.assertLoanAccess(username, loan);

        if (loan.getStatus() == LoanStatus.APPROVED || loan.getStatus() == LoanStatus.DISBURSED || loan.getStatus() == LoanStatus.PAID) {
            throw new InvalidTransactionException("Loan is already finalized (" + loan.getStatus() + ") and cannot be altered");
        }
        if (loan.getCustomer().getUser() != null && loan.getCustomer().getUser().getUsername().equalsIgnoreCase(username)) {
            throw new AccessDeniedException("Conflict of Interest: Officer cannot recommend their own loan application");
        }

        String action = req.getRecommendedAction().trim().toUpperCase();
        if (!"APPROVE".equals(action) && !"REJECT".equals(action)) {
            throw new InvalidTransactionException("Recommended action must be APPROVE or REJECT");
        }

        LoanStatus prevStatus = loan.getStatus();
        loan.setStatus(LoanStatus.APPROVAL_PENDING);
        loan.setRecommendedAmount(req.getRecommendedAmount());
        loan.setRecommendedInterestRate(req.getRecommendedInterestRate());
        loan.setRecommendedTermMonths(req.getRecommendedTermMonths());
        loan.setReviewedBy(username);
        loan.setAssessmentNotes(req.getOfficerRemarks());
        loanRepository.save(loan);

        LoanApprovalRequest appReq = new LoanApprovalRequest();
        appReq.setApprovalId("LAPR_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        appReq.setLoan(loan);
        appReq.setBranch(loan.getBranch());
        appReq.setRecommendedAction(action);
        appReq.setRecommendedAmount(req.getRecommendedAmount());
        appReq.setRecommendedInterestRate(req.getRecommendedInterestRate());
        appReq.setRecommendedTermMonths(req.getRecommendedTermMonths());
        appReq.setOfficerRemarks(req.getOfficerRemarks());
        appReq.setSubmittedBy(username);
        appReq.setStatus("PENDING");
        LoanApprovalRequest saved = approvalRepository.save(appReq);

        historyRepository.save(new LoanStatusHistory(loan, prevStatus, LoanStatus.APPROVAL_PENDING, username,
                "Maker recommendation submitted (" + action + " ₹" + req.getRecommendedAmount() + " @ "
                        + req.getRecommendedInterestRate() + "%). Awaiting Bank Manager / Admin decision."));
        accessService.recordAudit(loan, username, "APPROVAL_RECOMMENDED", "LOAN_APPROVAL", saved.getApprovalId(),
                prevStatus.name(), LoanStatus.APPROVAL_PENDING.name(), req.getOfficerRemarks());

        return mapApproval(saved);
    }

    @Transactional(readOnly = true)
    public Page<LoanApprovalDto> listApprovals(String username, String status, Pageable pageable) {
        Long branchId = accessService.resolveBranchScopeId(username);
        return approvalRepository.searchApprovals(branchId, status, pageable).map(this::mapApproval);
    }

    @Transactional
    public LoanApprovalDto decideApproval(String username, String approvalId, LoanApprovalDto.DecisionRequest decision) {
        LoanApprovalRequest appReq = approvalRepository.findByApprovalId(approvalId)
                .orElseThrow(() -> new InvalidTransactionException("Approval request not found: " + approvalId));
        Loan loan = appReq.getLoan();
        accessService.assertBranchAccess(username, appReq.getBranch());
        accessService.assertNotSelfApproval(appReq.getSubmittedBy(), username, "loan approval recommendation");

        String targetDecision = decision.getDecision().trim().toUpperCase();
        LoanStatus prevLoanStatus = loan.getStatus();

        if ("APPROVED".equals(targetDecision)) {
            User checker = accessService.getUser(username);
            if (appReq.getRecommendedAmount().compareTo(new BigDecimal("500000.00")) > 0
                    && !accessService.hasAnyRole(checker, RoleName.ADMIN, RoleName.BANK_MANAGER)) {
                throw new AccessDeniedException("High-value loans (> ₹5,00,000) require Admin or Bank Manager final authorization");
            }
            loan.setAmount(appReq.getRecommendedAmount());
            loan.setInterestRate(appReq.getRecommendedInterestRate());
            loan.setTermMonths(appReq.getRecommendedTermMonths());
            BigDecimal emi = calculator.calculateMonthlyEmi(loan.getAmount(), loan.getInterestRate(), loan.getTermMonths());
            BigDecimal totalPayable = emi.multiply(BigDecimal.valueOf(loan.getTermMonths())).setScale(2, RoundingMode.HALF_UP);
            loan.setEmiAmount(emi);
            loan.setTotalPayable(totalPayable);
            loan.setOutstandingBalance(totalPayable);
            loan.setStatus(LoanStatus.APPROVED);
            loan.setFinalApprovedBy(username);
            loan.setReviewedBy(appReq.getSubmittedBy());
        } else if ("REJECTED".equals(targetDecision)) {
            loan.setStatus(LoanStatus.REJECTED);
            loan.setRejectionReason(decision.getDecisionRemarks());
            loan.setFinalApprovedBy(username);
        } else if ("RETURNED_FOR_REVIEW".equals(targetDecision)) {
            loan.setStatus(LoanStatus.UNDER_REVIEW);
        } else if (!"ESCALATED".equals(targetDecision)) {
            throw new InvalidTransactionException("Unsupported approval decision: " + targetDecision);
        }

        appReq.setStatus(targetDecision);
        appReq.setDecisionBy(username);
        appReq.setDecisionRemarks(decision.getDecisionRemarks());
        appReq.setDecidedAt(OffsetDateTime.now());
        loanRepository.save(loan);
        LoanApprovalRequest saved = approvalRepository.save(appReq);

        historyRepository.save(new LoanStatusHistory(loan, prevLoanStatus, loan.getStatus(), username,
                "Maker-checker decision [" + targetDecision + "]: " + decision.getDecisionRemarks()));
        accessService.recordAudit(loan, username, "APPROVAL_" + targetDecision, "LOAN_APPROVAL", saved.getApprovalId(),
                prevLoanStatus.name(), loan.getStatus().name(), decision.getDecisionRemarks());

        if (loan.getCustomer().getUser() != null) {
            outboxService.publishNotificationEvent(new NotificationEvent(
                    "LOAN_APPROVAL_DECISION", loan.getLoanId(), loan.getAccount().getAccountNumber(),
                    loan.getCustomer().getUser().getId(), loan.getCustomer().getUser().getUsername(),
                    loan.getAmount(),
                    "Loan Approval Decision: " + targetDecision,
                    String.format("Your loan application %s decision is %s. Notes: %s",
                            loan.getLoanId(), targetDecision, decision.getDecisionRemarks()),
                    "APPROVED".equals(targetDecision) ? "SUCCESS" : "WARNING"
            ));
        }
        return mapApproval(saved);
    }

    public LoanApplicationSummaryDto mapLoanSummary(Loan l) {
        LoanApplicationSummaryDto dto = new LoanApplicationSummaryDto();
        dto.setId(l.getId());
        dto.setLoanId(l.getLoanId());
        dto.setCustomerNumber(l.getCustomer().getCustomerNumber());
        dto.setCustomerName(l.getCustomer().getFirstName() + " " + l.getCustomer().getLastName());
        dto.setAccountNumber(l.getAccount().getAccountNumber());
        dto.setBranchCode(l.getBranch() != null ? l.getBranch().getBranchCode() : (l.getCustomer().getBranch() != null ? l.getCustomer().getBranch().getBranchCode() : null));
        dto.setLoanCategory(l.getLoanCategory());
        dto.setAmount(l.getAmount());
        dto.setInterestRate(l.getInterestRate());
        dto.setTermMonths(l.getTermMonths());
        dto.setStatus(l.getStatus().name());
        dto.setPurpose(l.getPurpose());
        dto.setEmploymentType(l.getEmploymentType());
        dto.setMonthlyIncome(l.getMonthlyIncome());
        dto.setExistingMonthlyDebt(l.getExistingMonthlyDebt());
        dto.setCreditScore(l.getCreditScore());
        dto.setDtiRatio(l.getDtiRatio());
        dto.setEmiAmount(l.getEmiAmount());
        dto.setTotalPayable(l.getTotalPayable());
        dto.setOutstandingBalance(l.getOutstandingBalance());
        dto.setCollateralType(l.getCollateralType());
        dto.setCollateralValue(l.getCollateralValue());
        dto.setLtvRatio(l.getLtvRatio());
        dto.setAssignedOfficer(l.getAssignedOfficer());
        dto.setRequiresAdminApproval(l.isRequiresAdminApproval());
        dto.setReviewedBy(l.getReviewedBy());
        dto.setFinalApprovedBy(l.getFinalApprovedBy());
        dto.setAssessmentNotes(l.getAssessmentNotes());
        dto.setRejectionReason(l.getRejectionReason());
        dto.setDisbursedAt(l.getDisbursedAt());
        dto.setCreatedAt(l.getCreatedAt());
        dto.setUpdatedAt(l.getUpdatedAt());
        return dto;
    }

    private LoanOfficerCustomerDto mapCustomerSummary(Customer c, boolean includeDetails) {
        LoanOfficerCustomerDto dto = new LoanOfficerCustomerDto();
        dto.setId(c.getId());
        dto.setCustomerNumber(c.getCustomerNumber());
        dto.setFullName(c.getFirstName() + " " + c.getLastName());
        dto.setMaskedEmail(accessService.maskEmail(c.getEmail()));
        dto.setMaskedPhone(accessService.maskPhone(c.getPhone()));
        dto.setBranchCode(c.getBranch() != null ? c.getBranch().getBranchCode() : null);
        dto.setBranchName(c.getBranch() != null ? c.getBranch().getBranchName() : null);
        dto.setKycStatus(c.getKycStatus());

        List<Loan> customerLoans = loanRepository.findByCustomerIdOrderByCreatedAtDesc(c.getId());
        dto.setActiveLoanCount(customerLoans.stream().filter(l -> l.getStatus() == LoanStatus.DISBURSED).count());
        dto.setTotalLoanExposure(customerLoans.stream()
                .filter(l -> l.getStatus() == LoanStatus.DISBURSED)
                .map(Loan::getOutstandingBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        if (!customerLoans.isEmpty()) {
            Loan latest = customerLoans.get(0);
            dto.setEmploymentType(latest.getEmploymentType());
            dto.setLatestMonthlyIncome(latest.getMonthlyIncome());
            dto.setExistingLiabilities(latest.getExistingMonthlyDebt());
            dto.setLatestCreditScore(latest.getCreditScore());
        }
        if (includeDetails) {
            dto.setLinkedAccounts(c.getAccounts().stream().map(Account::getAccountNumber).collect(Collectors.toList()));
            dto.setLoanApplications(customerLoans.stream().map(this::mapLoanSummary).collect(Collectors.toList()));
            dto.setCreditAssessments(assessmentRepository.findByCustomerIdOrderByAssessedAtDesc(c.getId()).stream()
                    .map(this::mapAssessment).collect(Collectors.toList()));
        }
        return dto;
    }

    private LoanCreditAssessmentDto mapAssessment(LoanCreditAssessment a) {
        LoanCreditAssessmentDto dto = new LoanCreditAssessmentDto();
        dto.setAssessmentId(a.getAssessmentId());
        dto.setLoanId(a.getLoan().getLoanId());
        dto.setCustomerNumber(a.getCustomer().getCustomerNumber());
        dto.setCustomerName(a.getCustomer().getFirstName() + " " + a.getCustomer().getLastName());
        dto.setMonthlyIncome(a.getMonthlyIncome());
        dto.setExistingDebt(a.getExistingDebt());
        dto.setRequestedAmount(a.getRequestedAmount());
        dto.setEligibleAmount(a.getEligibleAmount());
        dto.setProposedInterestRate(a.getProposedInterestRate());
        dto.setProposedTenureMonths(a.getProposedTenureMonths());
        dto.setEstimatedEmi(a.getEstimatedEmi());
        dto.setTotalRepayment(a.getTotalRepayment());
        dto.setTotalInterest(a.getTotalInterest());
        dto.setRemainingMonthlyIncome(a.getRemainingMonthlyIncome());
        dto.setDtiRatio(a.getDtiRatio());
        dto.setLtvRatio(a.getLtvRatio());
        dto.setCreditScore(a.getCreditScore());
        dto.setCreditSource(a.getCreditSource());
        dto.setEmploymentStability(a.getEmploymentStability());
        dto.setCollateralValue(a.getCollateralValue());
        dto.setRiskCategory(a.getRiskCategory());
        dto.setRecommendation(a.getRecommendation());
        dto.setOfficerRemarks(a.getOfficerRemarks());
        dto.setAssessedBy(a.getAssessedBy());
        dto.setAssessedAt(a.getAssessedAt());
        return dto;
    }

    private LoanApprovalDto mapApproval(LoanApprovalRequest r) {
        LoanApprovalDto dto = new LoanApprovalDto();
        dto.setApprovalId(r.getApprovalId());
        dto.setLoanId(r.getLoan().getLoanId());
        dto.setCustomerNumber(r.getLoan().getCustomer().getCustomerNumber());
        dto.setCustomerName(r.getLoan().getCustomer().getFirstName() + " " + r.getLoan().getCustomer().getLastName());
        dto.setBranchCode(r.getBranch() != null ? r.getBranch().getBranchCode() : null);
        dto.setLoanCategory(r.getLoan().getLoanCategory());
        dto.setRecommendedAction(r.getRecommendedAction());
        dto.setRecommendedAmount(r.getRecommendedAmount());
        dto.setRecommendedInterestRate(r.getRecommendedInterestRate());
        dto.setRecommendedTermMonths(r.getRecommendedTermMonths());
        dto.setOfficerRemarks(r.getOfficerRemarks());
        dto.setSubmittedBy(r.getSubmittedBy());
        dto.setStatus(r.getStatus());
        dto.setDecisionBy(r.getDecisionBy());
        dto.setDecisionRemarks(r.getDecisionRemarks());
        dto.setDecidedAt(r.getDecidedAt());
        dto.setCreatedAt(r.getCreatedAt());
        return dto;
    }
}
