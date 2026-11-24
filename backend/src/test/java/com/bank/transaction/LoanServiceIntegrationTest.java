package com.bank.transaction;

import com.bank.transaction.dto.*;
import com.bank.transaction.exception.InvalidTransactionException;
import com.bank.transaction.model.Account;
import com.bank.transaction.model.LoanStatus;
import com.bank.transaction.repository.AccountRepository;
import com.bank.transaction.service.LoanService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class LoanServiceIntegrationTest {

    @Autowired
    private LoanService loanService;

    @Autowired
    private AccountRepository accountRepository;

    @AfterEach
    void resetBalance() {
        accountRepository.findByAccountNumber("ACC1001").ifPresent(acc -> {
            acc.setBalance(new BigDecimal("10000.00"));
            accountRepository.saveAndFlush(acc);
        });
    }

    @Test
    @DisplayName("Loan lifecycle: Apply -> Review & Approve -> Disburse -> Repay Installment")
    void testLoanLifecycleAndRepayment() {
        Account initialAcc = accountRepository.findByAccountNumber("ACC1001").orElseThrow();
        BigDecimal initialBalance = initialAcc.getBalance();

        // 1. Customer applies for a loan
        LoanApplicationRequest appReq = new LoanApplicationRequest(
                "ACC1001",
                new BigDecimal("10000.00"),
                12,
                "Working Capital Expansion",
                new BigDecimal("60000.00"),
                new BigDecimal("5000.00"),
                760
        );
        LoanResponse appliedLoan = loanService.applyForLoan("john_doe", appReq);

        assertNotNull(appliedLoan);
        assertNotNull(appliedLoan.getLoanId());
        assertEquals(LoanStatus.PENDING, appliedLoan.getStatus());
        assertEquals(new BigDecimal("10000.00"), appliedLoan.getAmount());
        assertNotNull(appliedLoan.getEmiAmount());
        assertTrue(appliedLoan.getEmiAmount().compareTo(BigDecimal.ZERO) > 0);
        assertFalse(appliedLoan.isRequiresAdminApproval());

        // 2. Loan Officer reviews and puts UNDER_REVIEW with assessment notes
        LoanReviewRequest reviewReq1 = new LoanReviewRequest(
                LoanStatus.UNDER_REVIEW,
                "Applicant credit score 760 verified. Low DTI ratio confirmed.",
                null,
                new BigDecimal("8.00")
        );
        LoanResponse underReviewLoan = loanService.reviewLoan(appliedLoan.getLoanId(), "loan_officer1", false, reviewReq1);
        assertEquals(LoanStatus.UNDER_REVIEW, underReviewLoan.getStatus());
        assertEquals("loan_officer1", underReviewLoan.getReviewedBy());

        // 3. Loan Officer approves
        LoanReviewRequest approveReq = new LoanReviewRequest(
                LoanStatus.APPROVED,
                "Underwriting criteria satisfied. Approved for disbursement.",
                null,
                new BigDecimal("8.00")
        );
        LoanResponse approvedLoan = loanService.reviewLoan(appliedLoan.getLoanId(), "loan_officer1", false, approveReq);
        assertEquals(LoanStatus.APPROVED, approvedLoan.getStatus());

        // 4. Loan Officer disburses funds to customer's account
        LoanResponse disbursedLoan = loanService.disburseLoan(appliedLoan.getLoanId(), "loan_officer1");
        assertEquals(LoanStatus.DISBURSED, disbursedLoan.getStatus());
        assertNotNull(disbursedLoan.getDisbursedAt());

        // Invariant: Customer balance must be atomically credited
        Account updatedAcc = accountRepository.findByAccountNumber("ACC1001").orElseThrow();
        assertEquals(initialBalance.add(new BigDecimal("10000.00")), updatedAcc.getBalance());

        // Verify repayment schedules generated
        List<LoanRepaymentScheduleResponse> schedules = loanService.getRepaymentSchedule(appliedLoan.getLoanId());
        assertEquals(12, schedules.size());
        assertEquals(1, schedules.get(0).getInstallmentNumber());
        assertEquals("PENDING", schedules.get(0).getStatus());

        // 5. Repay 1 installment
        BigDecimal firstEmi = schedules.get(0).getTotalInstallment();
        LoanRepaymentRequest repayReq = new LoanRepaymentRequest(firstEmi, "ACC1001");
        LoanResponse afterRepayLoan = loanService.repayInstallment(appliedLoan.getLoanId(), "john_doe", repayReq);

        assertTrue(afterRepayLoan.getOutstandingBalance().compareTo(disbursedLoan.getOutstandingBalance()) < 0);

        List<LoanRepaymentScheduleResponse> updatedSchedules = loanService.getRepaymentSchedule(appliedLoan.getLoanId());
        assertEquals("PAID", updatedSchedules.get(0).getStatus());

        // 6. Verify audit history trail
        List<LoanStatusHistoryResponse> history = loanService.getLoanStatusHistory(appliedLoan.getLoanId());
        assertTrue(history.size() >= 4, "Should record initial, under_review, approved, and disbursed status history");
    }

    @Test
    @DisplayName("Self-approval rule: Users cannot review or approve their own loan application")
    void testSelfApprovalProhibition() {
        LoanApplicationRequest appReq = new LoanApplicationRequest(
                "ACC1001",
                new BigDecimal("5000.00"),
                6,
                "Emergency Medical",
                new BigDecimal("40000.00"),
                BigDecimal.ZERO,
                700
        );
        LoanResponse appliedLoan = loanService.applyForLoan("john_doe", appReq);

        // john_doe attempts to approve their own loan
        LoanReviewRequest approveReq = new LoanReviewRequest(
                LoanStatus.APPROVED,
                "Self-approval attempt",
                null,
                null
        );

        InvalidTransactionException ex = assertThrows(
                InvalidTransactionException.class,
                () -> loanService.reviewLoan(appliedLoan.getLoanId(), "john_doe", false, approveReq)
        );
        assertTrue(ex.getMessage().contains("Conflict of Interest"));
    }

    @Test
    @DisplayName("High-value loan approval policy: Loans > ₹500,000 require ADMIN approval authority")
    void testHighValueLoanApprovalPolicy() {
        // Apply for ₹1,000,000 loan
        LoanApplicationRequest appReq = new LoanApplicationRequest(
                "ACC1001",
                new BigDecimal("1000000.00"),
                36,
                "Commercial Property Acquisition",
                new BigDecimal("250000.00"),
                new BigDecimal("20000.00"),
                800
        );
        LoanResponse applied = loanService.applyForLoan("john_doe", appReq);
        assertTrue(applied.isRequiresAdminApproval(), "Loan > ₹500,000 must flag requiresAdminApproval = true");

        // Loan Officer attempts to give final approval -> Must be rejected
        LoanReviewRequest approveReq = new LoanReviewRequest(
                LoanStatus.APPROVED,
                "Loan officer approving high value loan",
                null,
                null
        );

        InvalidTransactionException ex = assertThrows(
                InvalidTransactionException.class,
                () -> loanService.reviewLoan(applied.getLoanId(), "loan_officer1", false, approveReq)
        );
        assertTrue(ex.getMessage().contains("Approval Authority Violation") || ex.getMessage().contains("ADMIN"));

        // Admin approves -> Must succeed
        LoanResponse adminApproved = loanService.reviewLoan(applied.getLoanId(), "admin", true, approveReq);
        assertEquals(LoanStatus.APPROVED, adminApproved.getStatus());
        assertEquals("admin", adminApproved.getFinalApprovedBy());
    }

    @Test
    @DisplayName("Eligibility assessment and Dashboard statistics calculation")
    void testEligibilityAssessmentAndDashboardStats() {
        // 1. Eligibility assessment test
        LoanEligibilityAssessmentResponse assessment = loanService.assessEligibility(
                new BigDecimal("80000.00"),
                new BigDecimal("10000.00"),
                new BigDecimal("200000.00"),
                24,
                780
        );
        assertNotNull(assessment);
        assertTrue(assessment.isEligible());
        assertEquals("PRIME", assessment.getRiskGrade());
        assertTrue(assessment.getDtiRatio().compareTo(BigDecimal.ZERO) > 0);

        // 2. Dashboard stats test
        LoanOfficerDashboardStats stats = loanService.getDashboardStats();
        assertNotNull(stats);
        assertTrue(stats.getTotalApplications() > 0);
    }
}
