package com.bank.transaction.dto;

public class FraudSummaryResponse {

    private long totalAlerts;
    private long newAlerts;
    private long underReviewAlerts;
    private long resolvedAlerts;
    private long dismissedAlerts;
    private long lowRiskAssessments;
    private long mediumRiskAssessments;
    private long highRiskAssessments;
    private long criticalRiskAssessments;

    public FraudSummaryResponse() {}

    public long getTotalAlerts() {
        return totalAlerts;
    }

    public void setTotalAlerts(long totalAlerts) {
        this.totalAlerts = totalAlerts;
    }

    public long getNewAlerts() {
        return newAlerts;
    }

    public void setNewAlerts(long newAlerts) {
        this.newAlerts = newAlerts;
    }

    public long getUnderReviewAlerts() {
        return underReviewAlerts;
    }

    public void setUnderReviewAlerts(long underReviewAlerts) {
        this.underReviewAlerts = underReviewAlerts;
    }

    public long getResolvedAlerts() {
        return resolvedAlerts;
    }

    public void setResolvedAlerts(long resolvedAlerts) {
        this.resolvedAlerts = resolvedAlerts;
    }

    public long getDismissedAlerts() {
        return dismissedAlerts;
    }

    public void setDismissedAlerts(long dismissedAlerts) {
        this.dismissedAlerts = dismissedAlerts;
    }

    public long getLowRiskAssessments() {
        return lowRiskAssessments;
    }

    public void setLowRiskAssessments(long lowRiskAssessments) {
        this.lowRiskAssessments = lowRiskAssessments;
    }

    public long getMediumRiskAssessments() {
        return mediumRiskAssessments;
    }

    public void setMediumRiskAssessments(long mediumRiskAssessments) {
        this.mediumRiskAssessments = mediumRiskAssessments;
    }

    public long getHighRiskAssessments() {
        return highRiskAssessments;
    }

    public void setHighRiskAssessments(long highRiskAssessments) {
        this.highRiskAssessments = highRiskAssessments;
    }

    public long getCriticalRiskAssessments() {
        return criticalRiskAssessments;
    }

    public void setCriticalRiskAssessments(long criticalRiskAssessments) {
        this.criticalRiskAssessments = criticalRiskAssessments;
    }
}
