package com.bank.transaction.fraud;

public interface FraudRule {
    String getRuleName();
    FraudRuleResult evaluate(FraudEvaluationContext context);
}
