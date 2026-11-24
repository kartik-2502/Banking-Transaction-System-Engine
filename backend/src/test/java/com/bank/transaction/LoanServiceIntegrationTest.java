package com.bank.transaction;

import com.bank.transaction.dto.LoanApplicationRequest;
import com.bank.transaction.dto.LoanResponse;
import com.bank.transaction.dto.LoanReviewRequest;
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
    @DisplayName("Loan lifecycle: Apply -> Review & Approve -> Disburse to customer account")
    void testLoanLifecycle() {
        Account initialAcc = accountRepository.findByAccountNumber("ACC1001").orElseThrow();
        BigDecimal initialBalance = initialAcc.getBalance();

        // 1. Customer applies for a loan
        LoanApplicationRequest appReq = new LoanApplicationRequest(
                "ACC1001",
                new BigDecimal("5000.00"),
                12,
                "Small Business Working Capital"
        );
        LoanResponse appliedLoan = loanService.applyForLoan("john_doe", appReq);

        assertNotNull(appliedLoan);
        assertNotNull(appliedLoan.getLoanId());
        assertEquals(LoanStatus.PENDING, appliedLoan.getStatus());
        assertEquals(new BigDecimal("5000.00"), appliedLoan.getAmount());

        // 2. Loan Officer reviews and approves
        LoanReviewRequest reviewReq = new LoanReviewRequest(true, null, new BigDecimal("7.95"));
        LoanResponse reviewedLoan = loanService.reviewLoan(appliedLoan.getLoanId(), "loan_officer1", reviewReq);

        assertEquals(LoanStatus.APPROVED, reviewedLoan.getStatus());
        assertEquals("loan_officer1", reviewedLoan.getReviewedBy());
        assertEquals(new BigDecimal("7.95"), reviewedLoan.getInterestRate());

        // 3. Loan Officer disburses funds to customer's account
        LoanResponse disbursedLoan = loanService.disburseLoan(appliedLoan.getLoanId(), "loan_officer1");

        assertEquals(LoanStatus.DISBURSED, disbursedLoan.getStatus());
        assertNotNull(disbursedLoan.getDisbursedAt());

        // Invariant: Customer balance must be atomically credited
        Account updatedAcc = accountRepository.findByAccountNumber("ACC1001").orElseThrow();
        assertEquals(initialBalance.add(new BigDecimal("5000.00")), updatedAcc.getBalance(),
                "Customer account balance must reflect the disbursed loan amount");
    }
}
