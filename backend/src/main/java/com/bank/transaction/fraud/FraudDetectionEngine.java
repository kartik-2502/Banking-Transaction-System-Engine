package com.bank.transaction.fraud;

import com.bank.transaction.model.RiskAssessment;

public interface FraudDetectionEngine {
    RiskAssessment evaluateTransaction(FraudEvaluationContext context);
}
