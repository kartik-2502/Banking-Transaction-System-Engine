package com.bank.transaction.service;

import com.bank.transaction.dto.*;
import com.bank.transaction.exception.AccountNotFoundException;
import com.bank.transaction.exception.CustomerNotFoundException;
import com.bank.transaction.exception.InvalidTransactionException;
import com.bank.transaction.model.*;
import com.bank.transaction.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LoanServiceImpl implements LoanService {

    private static final Logger log = LoggerFactory.getLogger(LoanServiceImpl.class);
    private static final BigDecimal HIGH_VALUE_THRESHOLD = new BigDecimal("500000.00");
    private static final BigDecimal STANDARD_INTEREST_RATE = new BigDecimal("8.50");

    private final LoanRepository loanRepository;
    private final LoanRepaymentScheduleRepository scheduleRepository;
    private final LoanStatusHistoryRepository historyRepository;
    private final CustomerRepository customerRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final TransactionService transactionService;
    private final LoanFinancialCalculator financialCalculator;

    public LoanServiceImpl(LoanRepository loanRepository,
                           LoanRepaymentScheduleRepository scheduleRepository,
                           LoanStatusHistoryRepository historyRepository,
                           CustomerRepository customerRepository,
                           AccountRepository accountRepository,
                           UserRepository userRepository,
                           TransactionService transactionService,
                           LoanFinancialCalculator financialCalculator) {
        this.loanRepository = loanRepository;
        this.scheduleRepository = scheduleRepository;
        this.historyRepository = historyRepository;
        this.customerRepository = customerRepository;
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.transactionService = transactionService;
        this.financialCalculator = financialCalculator;
    }

    @Override
    @Transactional
    public LoanResponse applyForLoan(String username, LoanApplicationRequest request) {
        log.info("Processing loan application for user: {}, account: {}, amount: {}",
                username, request.getAccountNumber(), request.getAmount());

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new CustomerNotFoundException("User not found: " + username));

        Customer customer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new CustomerNotFoundException("Customer profile not found for user: " + username));

        Account account = accountRepository.findByAccountNumber(request.getAccountNumber())
                .orElseThrow(() -> new AccountNotFoundException("Account not found: " + request.getAccountNumber()));

        if (!account.getCustomer().getId().equals(customer.getId())) {
            throw new InvalidTransactionException("Specified account does not belong to the applying customer");
        }

        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new InvalidTransactionException("Cannot apply for a loan on a non-active account (" + account.getStatus() + ")");
        }

        String loanId = "LN" + System.currentTimeMillis() + (int)(Math.random() * 900 + 100);
        BigDecimal interestRate = STANDARD_INTEREST_RATE;

        // Calculate financial projections
        BigDecimal emi = financialCalculator.calculateMonthlyEmi(request.getAmount(), interestRate, request.getTermMonths());
        BigDecimal dti = financialCalculator.calculateDtiRatio(request.getMonthlyIncome(), request.getExistingMonthlyDebt(), emi);
        BigDecimal totalPayable = emi.multiply(BigDecimal.valueOf(request.getTermMonths())).setScale(2, java.math.RoundingMode.HALF_UP);

        Loan loan = new Loan(
                loanId,
                customer,
                account,
                request.getAmount(),
                interestRate,
                request.getTermMonths(),
                request.getPurpose(),
                request.getMonthlyIncome(),
                request.getExistingMonthlyDebt(),
                request.getCreditScore()
        );

        loan.setEmiAmount(emi);
        loan.setDtiRatio(dti);
        loan.setTotalPayable(totalPayable);
        loan.setOutstandingBalance(totalPayable);
        loan.setDocumentUrls(request.getDocumentUrls());

        boolean isHighValue = request.getAmount().compareTo(HIGH_VALUE_THRESHOLD) > 0;
        loan.setRequiresAdminApproval(isHighValue);

        Loan saved = loanRepository.save(loan);

        // Record initial status in audit trail
        LoanStatusHistory initialHistory = new LoanStatusHistory(
                saved,
                null,
                LoanStatus.PENDING,
                username,
                "Initial loan application submitted by customer" + (isHighValue ? " [Flagged: High-Value > ₹500,000 requiring Admin Approval]" : "")
        );
        historyRepository.save(initialHistory);

        log.info("Loan application created [loanId={}, amount={}, emi={}, dti={}, highValue={}]",
                saved.getLoanId(), saved.getAmount(), emi, dti, isHighValue);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public LoanResponse reviewLoan(String loanId, String reviewedBy, boolean isAdmin, LoanReviewRequest request) {
        log.info("Reviewing loan: {} by user: {} (isAdmin: {})", loanId, reviewedBy, isAdmin);

        Loan loan = loanRepository.findByLoanId(loanId)
                .orElseThrow(() -> new InvalidTransactionException("Loan application not found: " + loanId));

        if (loan.getStatus() == LoanStatus.DISBURSED || loan.getStatus() == LoanStatus.PAID) {
            throw new InvalidTransactionException("Loan is already in " + loan.getStatus() + " status and cannot be modified");
        }

        // Rule: Never allow users to approve their own loan applications
        if (loan.getCustomer().getUser() != null &&
                loan.getCustomer().getUser().getUsername().equalsIgnoreCase(reviewedBy)) {
            throw new InvalidTransactionException("Conflict of Interest: Users cannot assess, review or approve their own loan applications");
        }

        // Determine target status
        LoanStatus targetStatus;
        if (request.getStatus() != null) {
            targetStatus = request.getStatus();
        } else if (request.getApproved() != null) {
            targetStatus = request.getApproved() ? LoanStatus.APPROVED : LoanStatus.REJECTED;
        } else {
            targetStatus = LoanStatus.UNDER_REVIEW;
        }

        // High-Value Approval Enforcement:
        // A Loan Officer can assess and put under review, but final APPROVED status on loans > 500,000 requires ADMIN
        if (targetStatus == LoanStatus.APPROVED && loan.isRequiresAdminApproval() && !isAdmin) {
            throw new InvalidTransactionException("Approval Authority Violation: Loans exceeding ₹500,000.00 require ADMIN approval authority. A Loan Officer can recommend approval via UNDER_REVIEW notes, but cannot grant final approval.");
        }

        LoanStatus previousStatus = loan.getStatus();

        // If interest rate updated, recalculate EMI and total payable
        if (request.getInterestRate() != null && request.getInterestRate().compareTo(BigDecimal.ZERO) > 0) {
            loan.setInterestRate(request.getInterestRate());
            BigDecimal emi = financialCalculator.calculateMonthlyEmi(loan.getAmount(), loan.getInterestRate(), loan.getTermMonths());
            BigDecimal dti = financialCalculator.calculateDtiRatio(loan.getMonthlyIncome(), loan.getExistingMonthlyDebt(), emi);
            BigDecimal totalPayable = emi.multiply(BigDecimal.valueOf(loan.getTermMonths())).setScale(2, java.math.RoundingMode.HALF_UP);
            loan.setEmiAmount(emi);
            loan.setDtiRatio(dti);
            loan.setTotalPayable(totalPayable);
            if (loan.getStatus() != LoanStatus.DISBURSED) {
                loan.setOutstandingBalance(totalPayable);
            }
        }

        if (request.getAssessmentNotes() != null) {
            loan.setAssessmentNotes(request.getAssessmentNotes());
        }

        loan.setStatus(targetStatus);
        loan.setReviewedBy(reviewedBy);

        if (targetStatus == LoanStatus.APPROVED) {
            if (isAdmin) {
                loan.setFinalApprovedBy(reviewedBy);
            } else {
                loan.setReviewedBy(reviewedBy);
            }
        } else if (targetStatus == LoanStatus.REJECTED) {
            loan.setRejectionReason(request.getRejectionReason() != null ? request.getRejectionReason() : "Application did not meet underwriting criteria");
        }

        Loan updated = loanRepository.save(loan);

        // Record status change in audit history
        String remarks = targetStatus == LoanStatus.REJECTED
                ? updated.getRejectionReason()
                : (request.getAssessmentNotes() != null ? request.getAssessmentNotes() : "Status changed to " + targetStatus);

        LoanStatusHistory history = new LoanStatusHistory(updated, previousStatus, targetStatus, reviewedBy, remarks);
        historyRepository.save(history);

        log.info("Loan status updated [loanId={}, previousStatus={}, newStatus={}, actor={}]",
                loanId, previousStatus, targetStatus, reviewedBy);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public LoanResponse disburseLoan(String loanId, String officerUsername) {
        log.info("Disbursing loan: {} by officer: {}", loanId, officerUsername);

        Loan loan = loanRepository.findByLoanId(loanId)
                .orElseThrow(() -> new InvalidTransactionException("Loan not found: " + loanId));

        if (loan.getStatus() != LoanStatus.APPROVED) {
            throw new InvalidTransactionException("Only APPROVED loans can be disbursed. Current status: " + loan.getStatus());
        }

        // Disburse loan funds atomically to customer account
        String txnId = "TXN_DISBURSE_" + loan.getLoanId();
        DepositRequest depositRequest = new DepositRequest(
                txnId,
                loan.getAccount().getAccountNumber(),
                loan.getAmount(),
                "LOAN_DISBURSEMENT:" + officerUsername
        );
        transactionService.processDeposit(depositRequest);

        // Generate and persist repayment schedule
        List<LoanRepaymentSchedule> schedules = financialCalculator.generateRepaymentSchedule(loan, LocalDate.now());
        scheduleRepository.saveAll(schedules);

        LoanStatus previousStatus = loan.getStatus();
        loan.setStatus(LoanStatus.DISBURSED);
        loan.setDisbursedAt(OffsetDateTime.now());
        Loan disbursed = loanRepository.save(loan);

        // Audit status history
        LoanStatusHistory history = new LoanStatusHistory(
                disbursed,
                previousStatus,
                LoanStatus.DISBURSED,
                officerUsername,
                "Funds ₹" + loan.getAmount() + " credited to account " + loan.getAccount().getAccountNumber() + ". Generated " + schedules.size() + " installment repayment schedules."
        );
        historyRepository.save(history);

        log.info("Loan disbursed successfully [loanId={}, amount={}, account={}, schedules={}]",
                loanId, loan.getAmount(), loan.getAccount().getAccountNumber(), schedules.size());
        return mapToResponse(disbursed);
    }

    @Override
    @Transactional
    public LoanResponse repayInstallment(String loanId, String actorUsername, LoanRepaymentRequest request) {
        log.info("Repaying loan installment [loanId={}, amount={}, actor={}]", loanId, request.getAmount(), actorUsername);

        Loan loan = loanRepository.findByLoanId(loanId)
                .orElseThrow(() -> new InvalidTransactionException("Loan not found: " + loanId));

        if (loan.getStatus() != LoanStatus.DISBURSED) {
            throw new InvalidTransactionException("Can only repay loans that are in DISBURSED status. Current status: " + loan.getStatus());
        }

        String debitAccount = (request.getSourceAccountNumber() != null && !request.getSourceAccountNumber().isBlank())
                ? request.getSourceAccountNumber()
                : loan.getAccount().getAccountNumber();

        // Process debit from source account atomically
        String txnId = "TXN_REPAY_" + loan.getLoanId() + "_" + System.currentTimeMillis();
        WithdrawalRequest withdrawalRequest = new WithdrawalRequest(
                txnId,
                debitAccount,
                request.getAmount(),
                "LOAN_REPAYMENT:" + actorUsername
        );
        transactionService.processWithdrawal(withdrawalRequest);

        // Update repayment schedule
        List<LoanRepaymentSchedule> schedules = scheduleRepository.findByLoanIdAndStatusOrderByInstallmentNumberAsc(loan.getId(), "PENDING");
        BigDecimal remainingRepayment = request.getAmount();

        for (LoanRepaymentSchedule schedule : schedules) {
            if (remainingRepayment.compareTo(BigDecimal.ZERO) <= 0) break;

            BigDecimal installmentDue = schedule.getTotalInstallment().subtract(schedule.getPaidAmount());
            if (remainingRepayment.compareTo(installmentDue) >= 0) {
                schedule.setPaidAmount(schedule.getTotalInstallment());
                schedule.setStatus("PAID");
                schedule.setPaidDate(OffsetDateTime.now());
                remainingRepayment = remainingRepayment.subtract(installmentDue);
            } else {
                schedule.setPaidAmount(schedule.getPaidAmount().add(remainingRepayment));
                remainingRepayment = BigDecimal.ZERO;
            }
            scheduleRepository.save(schedule);
        }

        // Update outstanding balance
        BigDecimal newOutstanding = loan.getOutstandingBalance().subtract(request.getAmount()).max(BigDecimal.ZERO);
        loan.setOutstandingBalance(newOutstanding);

        if (newOutstanding.compareTo(BigDecimal.ZERO) == 0) {
            LoanStatus prev = loan.getStatus();
            loan.setStatus(LoanStatus.PAID);
            historyRepository.save(new LoanStatusHistory(loan, prev, LoanStatus.PAID, actorUsername, "Loan fully repaid and closed."));
        }

        Loan updated = loanRepository.save(loan);
        log.info("Repayment processed [loanId={}, amountPaid={}, remainingBalance={}, status={}]",
                loanId, request.getAmount(), newOutstanding, updated.getStatus());
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public LoanResponse getLoanById(String loanId) {
        return loanRepository.findByLoanId(loanId)
                .map(this::mapToResponse)
                .orElseThrow(() -> new InvalidTransactionException("Loan not found: " + loanId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LoanResponse> getLoans(LoanStatus status, String searchTerm, Pageable pageable) {
        String query = (searchTerm != null && !searchTerm.trim().isEmpty()) ? searchTerm.trim() : null;
        if (query != null && status != null) {
            return loanRepository.searchLoansWithStatus(status, query, pageable).map(this::mapToResponse);
        } else if (query != null) {
            return loanRepository.searchLoansWithoutStatus(query, pageable).map(this::mapToResponse);
        } else if (status != null) {
            return loanRepository.findByStatus(status, pageable).map(this::mapToResponse);
        } else {
            return loanRepository.findAll(pageable).map(this::mapToResponse);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<LoanResponse> getCustomerLoans(Long customerId) {
        return loanRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public LoanOfficerDashboardStats getDashboardStats() {
        long total = loanRepository.count();
        long pending = loanRepository.countByStatus(LoanStatus.PENDING);
        long underReview = loanRepository.countByStatus(LoanStatus.UNDER_REVIEW);
        long approved = loanRepository.countByStatus(LoanStatus.APPROVED);
        long rejected = loanRepository.countByStatus(LoanStatus.REJECTED);
        long additionalInfo = loanRepository.countByStatus(LoanStatus.ADDITIONAL_INFORMATION_REQUIRED);
        long disbursed = loanRepository.countByStatus(LoanStatus.DISBURSED);
        long paid = loanRepository.countByStatus(LoanStatus.PAID);
        long highValuePending = loanRepository.countByRequiresAdminApprovalTrueAndStatus(LoanStatus.PENDING)
                + loanRepository.countByRequiresAdminApprovalTrueAndStatus(LoanStatus.UNDER_REVIEW);
        BigDecimal disbursedVolume = loanRepository.sumDisbursedLoanVolume();
        if (disbursedVolume == null) {
            disbursedVolume = BigDecimal.ZERO;
        }

        return new LoanOfficerDashboardStats(
                total,
                pending,
                underReview,
                approved,
                rejected,
                additionalInfo,
                disbursed,
                paid,
                highValuePending,
                disbursedVolume
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<LoanRepaymentScheduleResponse> getRepaymentSchedule(String loanId) {
        Loan loan = loanRepository.findByLoanId(loanId)
                .orElseThrow(() -> new InvalidTransactionException("Loan not found: " + loanId));

        return scheduleRepository.findByLoanIdOrderByInstallmentNumberAsc(loan.getId())
                .stream()
                .map(this::mapToScheduleResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LoanStatusHistoryResponse> getLoanStatusHistory(String loanId) {
        Loan loan = loanRepository.findByLoanId(loanId)
                .orElseThrow(() -> new InvalidTransactionException("Loan not found: " + loanId));

        return historyRepository.findByLoanIdOrderByCreatedAtDesc(loan.getId())
                .stream()
                .map(this::mapToHistoryResponse)
                .collect(Collectors.toList());
    }

    @Override
    public LoanEligibilityAssessmentResponse assessEligibility(BigDecimal monthlyIncome, BigDecimal existingDebt,
                                                               BigDecimal amount, Integer termMonths, Integer creditScore) {
        int term = termMonths != null ? termMonths : 12;
        int score = creditScore != null ? creditScore : 700;
        return financialCalculator.assessEligibility(monthlyIncome, existingDebt, amount, STANDARD_INTEREST_RATE, term, score);
    }

    private LoanResponse mapToResponse(Loan loan) {
        LoanResponse res = new LoanResponse();
        res.setId(loan.getId());
        res.setLoanId(loan.getLoanId());
        res.setCustomerId(loan.getCustomer().getId());
        res.setCustomerNumber(loan.getCustomer().getCustomerNumber());
        res.setCustomerName(loan.getCustomer().getFirstName() + " " + loan.getCustomer().getLastName());
        res.setCustomerEmail(loan.getCustomer().getEmail());
        res.setAccountNumber(loan.getAccount().getAccountNumber());
        res.setAmount(loan.getAmount());
        res.setInterestRate(loan.getInterestRate());
        res.setTermMonths(loan.getTermMonths());
        res.setStatus(loan.getStatus());
        res.setPurpose(loan.getPurpose());
        res.setMonthlyIncome(loan.getMonthlyIncome());
        res.setExistingMonthlyDebt(loan.getExistingMonthlyDebt());
        res.setCreditScore(loan.getCreditScore());
        res.setDtiRatio(loan.getDtiRatio());
        res.setEmiAmount(loan.getEmiAmount());
        res.setTotalPayable(loan.getTotalPayable());
        res.setOutstandingBalance(loan.getOutstandingBalance());
        res.setAssessmentNotes(loan.getAssessmentNotes());
        res.setDocumentUrls(loan.getDocumentUrls());
        res.setRequiresAdminApproval(loan.isRequiresAdminApproval());
        res.setReviewedBy(loan.getReviewedBy());
        res.setFinalApprovedBy(loan.getFinalApprovedBy());
        res.setRejectionReason(loan.getRejectionReason());
        res.setDisbursedAt(loan.getDisbursedAt());
        res.setCreatedAt(loan.getCreatedAt());
        res.setUpdatedAt(loan.getUpdatedAt());
        return res;
    }

    private LoanRepaymentScheduleResponse mapToScheduleResponse(LoanRepaymentSchedule s) {
        LoanRepaymentScheduleResponse res = new LoanRepaymentScheduleResponse();
        res.setId(s.getId());
        res.setLoanId(s.getLoan().getId());
        res.setInstallmentNumber(s.getInstallmentNumber());
        res.setDueDate(s.getDueDate());
        res.setPrincipalAmount(s.getPrincipalAmount());
        res.setInterestAmount(s.getInterestAmount());
        res.setTotalInstallment(s.getTotalInstallment());
        res.setPaidAmount(s.getPaidAmount());
        res.setPaidDate(s.getPaidDate());
        res.setStatus(s.getStatus());
        return res;
    }

    private LoanStatusHistoryResponse mapToHistoryResponse(LoanStatusHistory h) {
        LoanStatusHistoryResponse res = new LoanStatusHistoryResponse();
        res.setId(h.getId());
        res.setLoanId(h.getLoan().getId());
        res.setPreviousStatus(h.getPreviousStatus());
        res.setNewStatus(h.getNewStatus());
        res.setChangedBy(h.getChangedBy());
        res.setRemarks(h.getRemarks());
        res.setCreatedAt(h.getCreatedAt());
        return res;
    }
}
