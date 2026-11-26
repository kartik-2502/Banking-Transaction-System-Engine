package com.bank.transaction;

import com.bank.transaction.dto.DepositRequest;
import com.bank.transaction.dto.FraudAlertResponse;
import com.bank.transaction.dto.FraudAlertReviewRequest;
import com.bank.transaction.dto.TransactionResponse;
import com.bank.transaction.model.Account;
import com.bank.transaction.model.FraudAlertStatus;
import com.bank.transaction.model.RiskAssessment;
import com.bank.transaction.model.RiskLevel;
import com.bank.transaction.repository.AccountRepository;
import com.bank.transaction.service.FraudService;
import com.bank.transaction.service.TransactionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class FraudDetectionIntegrationTest {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private FraudService fraudService;

    @Autowired
    private AccountRepository accountRepository;

    @AfterEach
    void resetBalances() {
        accountRepository.findByAccountNumber("ACC2004").ifPresent(acc -> {
            acc.setBalance(new BigDecimal("25000.00"));
            accountRepository.saveAndFlush(acc);
        });
        accountRepository.findByAccountNumber("ACC3005").ifPresent(acc -> {
            acc.setBalance(new BigDecimal("5000.00"));
            accountRepository.saveAndFlush(acc);
        });
    }

    @Test
    @DisplayName("Fraud Rule: Normal transaction results in LOW risk assessment with no alert")
    void testNormalTransactionLowRisk() {
        String txnId = "TXN_LOW_RISK_" + System.currentTimeMillis();
        DepositRequest request = new DepositRequest(txnId, "ACC3005", new BigDecimal("500.00"), "ATM");

        TransactionResponse response = transactionService.processDeposit(request);
        assertNotNull(response);

        RiskAssessment assessment = fraudService.getAssessmentByTransactionId(txnId);
        assertNotNull(assessment);
        assertEquals(RiskLevel.LOW, assessment.getRiskLevel());
        assertTrue(assessment.getRiskScore() < 30);
    }

    @Test
    @DisplayName("Fraud Rule: Unusually large transaction triggers alert and analyst review workflow")
    void testLargeAmountTriggersFraudAlertAndReview() {
        String txnId = "TXN_LARGE_FRAUD_" + System.currentTimeMillis();
        // ₹250,000 exceeds high-amount threshold
        DepositRequest request = new DepositRequest(txnId, "ACC2004", new BigDecimal("250000.00"), "WIRE_TRANSFER");

        TransactionResponse response = transactionService.processDeposit(request);
        assertNotNull(response);

        RiskAssessment assessment = fraudService.getAssessmentByTransactionId(txnId);
        assertNotNull(assessment);
        assertTrue(assessment.getTriggeredRule().contains("UNUSUALLY_LARGE_AMOUNT"));

        // Verify alert was raised
        Page<FraudAlertResponse> alerts = fraudService.getAlerts(FraudAlertStatus.NEW, PageRequest.of(0, 500));
        assertFalse(alerts.isEmpty(), "Fraud alert should be raised for large amount");

        FraudAlertResponse targetAlert = alerts.getContent().stream()
                .filter(a -> txnId.equals(a.getTransactionId()))
                .findFirst()
                .orElse(null);
        assertNotNull(targetAlert, "Target alert must be present for txnId: " + txnId);

        // Risk Analyst reviews and resolves the alert
        FraudAlertReviewRequest reviewReq = new FraudAlertReviewRequest(
                FraudAlertStatus.RESOLVED,
                "Verified high-value corporate treasury deposit via phone verification"
        );
        FraudAlertResponse reviewedAlert = fraudService.reviewAlert(targetAlert.getId(), "kavya_nair", reviewReq);

        assertEquals(FraudAlertStatus.RESOLVED, reviewedAlert.getStatus());
        assertEquals("kavya_nair", reviewedAlert.getResolvedBy());
        assertNotNull(reviewedAlert.getResolvedAt());
    }
}
