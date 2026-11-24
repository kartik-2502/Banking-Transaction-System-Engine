package com.bank.transaction.fraud;

public class FraudRuleResult {

    private final boolean triggered;
    private final String ruleName;
    private final int riskScore;
    private final String reason;

    private FraudRuleResult(boolean triggered, String ruleName, int riskScore, String reason) {
        this.triggered = triggered;
        this.ruleName = ruleName;
        this.riskScore = riskScore;
        this.reason = reason;
    }

    public static FraudRuleResult pass() {
        return new FraudRuleResult(false, null, 0, null);
    }

    public static FraudRuleResult trigger(String ruleName, int riskScore, String reason) {
        return new FraudRuleResult(true, ruleName, riskScore, reason);
    }

    public boolean isTriggered() {
        return triggered;
    }

    public String getRuleName() {
        return ruleName;
    }

    public int getRiskScore() {
        return riskScore;
    }

    public String getReason() {
        return reason;
    }
}
