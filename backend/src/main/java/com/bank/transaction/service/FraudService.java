package com.bank.transaction.service;

import com.bank.transaction.dto.FraudAlertResponse;
import com.bank.transaction.dto.FraudAlertReviewRequest;
import com.bank.transaction.dto.FraudSummaryResponse;
import com.bank.transaction.model.FraudAlertStatus;
import com.bank.transaction.model.RiskAssessment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FraudService {
    Page<FraudAlertResponse> getAlerts(FraudAlertStatus status, Pageable pageable);
    FraudAlertResponse getAlertById(Long alertId);
    FraudAlertResponse reviewAlert(Long alertId, String reviewerUsername, FraudAlertReviewRequest request);
    RiskAssessment getAssessmentByTransactionId(String transactionId);
    FraudSummaryResponse getFraudSummary();
}
