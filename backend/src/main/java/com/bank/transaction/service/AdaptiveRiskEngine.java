package com.bank.transaction.service;

import com.bank.transaction.config.AmfaProperties;
import com.bank.transaction.model.RiskLevel;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class AdaptiveRiskEngine {

    private final AmfaProperties properties;

    public AdaptiveRiskEngine(AmfaProperties properties) {
        this.properties = properties;
    }

    public static class RiskContext {
        private boolean mfaEnabled;
        private boolean unrecognizedDevice;
        private boolean newBrowser;
        private boolean ipChanged;
        private int recentFailedAttempts;
        private BigDecimal transactionAmount;
        private long recentTransactionCount;
        private boolean sensitiveOperation;
        private String operationLabel;

        public boolean isMfaEnabled() { return mfaEnabled; }
        public void setMfaEnabled(boolean mfaEnabled) { this.mfaEnabled = mfaEnabled; }
        public boolean isUnrecognizedDevice() { return unrecognizedDevice; }
        public void setUnrecognizedDevice(boolean unrecognizedDevice) { this.unrecognizedDevice = unrecognizedDevice; }
        public boolean isNewBrowser() { return newBrowser; }
        public void setNewBrowser(boolean newBrowser) { this.newBrowser = newBrowser; }
        public boolean isIpChanged() { return ipChanged; }
        public void setIpChanged(boolean ipChanged) { this.ipChanged = ipChanged; }
        public int getRecentFailedAttempts() { return recentFailedAttempts; }
        public void setRecentFailedAttempts(int recentFailedAttempts) { this.recentFailedAttempts = recentFailedAttempts; }
        public BigDecimal getTransactionAmount() { return transactionAmount; }
        public void setTransactionAmount(BigDecimal transactionAmount) { this.transactionAmount = transactionAmount; }
        public long getRecentTransactionCount() { return recentTransactionCount; }
        public void setRecentTransactionCount(long recentTransactionCount) { this.recentTransactionCount = recentTransactionCount; }
        public boolean isSensitiveOperation() { return sensitiveOperation; }
        public void setSensitiveOperation(boolean sensitiveOperation) { this.sensitiveOperation = sensitiveOperation; }
        public String getOperationLabel() { return operationLabel; }
        public void setOperationLabel(String operationLabel) { this.operationLabel = operationLabel; }
    }

    public static class RiskAssessmentResult {
        private final int score;
        private final RiskLevel level;
        private final List<String> reasons;
        private final boolean requiresMfa;
        private final boolean blockOperation;

        public RiskAssessmentResult(int score, RiskLevel level, List<String> reasons,
                                    boolean requiresMfa, boolean blockOperation) {
            this.score = score;
            this.level = level;
            this.reasons = reasons;
            this.requiresMfa = requiresMfa;
            this.blockOperation = blockOperation;
        }

        public int getScore() { return score; }
        public RiskLevel getLevel() { return level; }
        public List<String> getReasons() { return reasons; }
        public boolean isRequiresMfa() { return requiresMfa; }
        public boolean isBlockOperation() { return blockOperation; }
    }

    public RiskAssessmentResult evaluate(RiskContext ctx) {
        int score = 0;
        List<String> reasons = new ArrayList<>();
        AmfaProperties.Weights w = properties.getWeights();

        if (ctx.isUnrecognizedDevice()) {
            score += w.getUnrecognizedDevice();
            reasons.add("Unrecognized device fingerprint");
        }

        if (ctx.isNewBrowser()) {
            score += w.getNewBrowser();
            reasons.add("New browser or client signature");
        }

        // IP change alone adds only 15 (<25 MEDIUM threshold) so an IP shift alone never proves fraud
        if (ctx.isIpChanged()) {
            score += w.getIpChange();
            reasons.add("IP address changed from prior session");
        }

        if (ctx.getRecentFailedAttempts() >= properties.getMaxFailedLoginAttempts()) {
            score += 80;
            reasons.add("Multiple failed login attempts threshold exceeded (" + ctx.getRecentFailedAttempts() + ")");
        } else if (ctx.getRecentFailedAttempts() >= 2) {
            score += w.getFailedAttempts();
            reasons.add("Recent failed authentication attempts (" + ctx.getRecentFailedAttempts() + ")");
        }

        if (ctx.getTransactionAmount() != null) {
            BigDecimal amt = ctx.getTransactionAmount();
            if (amt.compareTo(properties.getCriticalValueTransferThreshold()) >= 0) {
                score += w.getHighValueTx() + 25;
                reasons.add("Very high-value transfer (" + amt.toPlainString() + ")");
            } else if (amt.compareTo(properties.getHighValueTransferThreshold()) >= 0) {
                score += w.getHighValueTx();
                reasons.add("High-value transfer above ₹" + properties.getHighValueTransferThreshold().toPlainString());
            }
        }

        if (ctx.getRecentTransactionCount() >= 4) {
            score += w.getHighFrequencyTx();
            reasons.add("High transaction velocity (" + ctx.getRecentTransactionCount() + " recent attempts)");
        }

        if (ctx.isSensitiveOperation()) {
            score += w.getSensitiveOperation();
            reasons.add("Sensitive account operation" + (ctx.getOperationLabel() != null ? ": " + ctx.getOperationLabel() : ""));
        }

        int finalScore = Math.min(100, Math.max(0, score));
        RiskLevel level = toRiskLevel(finalScore);

        boolean blockOperation = level == RiskLevel.CRITICAL;
        boolean requiresMfa = properties.isEnabled() && (
                level == RiskLevel.MEDIUM
                        || level == RiskLevel.HIGH
                        || (ctx.isMfaEnabled() && (ctx.isUnrecognizedDevice() || ctx.isSensitiveOperation()
                                || (ctx.getTransactionAmount() != null && ctx.getTransactionAmount().compareTo(properties.getHighValueTransferThreshold()) >= 0)))
        );

        if (requiresMfa && level == RiskLevel.LOW) {
            level = RiskLevel.MEDIUM;
            finalScore = Math.max(finalScore, 25);
            reasons.add("User MFA enforcement policy");
        }

        return new RiskAssessmentResult(finalScore, level, reasons, requiresMfa, blockOperation);
    }

    public RiskLevel toRiskLevel(int score) {
        if (score >= 80) return RiskLevel.CRITICAL;
        if (score >= 50) return RiskLevel.HIGH;
        if (score >= 25) return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }
}
