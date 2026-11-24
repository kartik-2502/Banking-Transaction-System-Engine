package com.bank.transaction.dto;

import java.math.BigDecimal;

public class LoanOfficerDashboardStats {

    private long totalApplications;
    private long pendingCount;
    private long underReviewCount;
    private long approvedCount;
    private long rejectedCount;
    private long additionalInfoRequiredCount;
    private long disbursedCount;
    private long paidCount;
    private long highValuePendingCount;
    private BigDecimal totalDisbursedVolume;

    public LoanOfficerDashboardStats() {}

    public LoanOfficerDashboardStats(long totalApplications, long pendingCount, long underReviewCount,
                                     long approvedCount, long rejectedCount, long additionalInfoRequiredCount,
                                     long disbursedCount, long paidCount, long highValuePendingCount,
                                     BigDecimal totalDisbursedVolume) {
        this.totalApplications = totalApplications;
        this.pendingCount = pendingCount;
        this.underReviewCount = underReviewCount;
        this.approvedCount = approvedCount;
        this.rejectedCount = rejectedCount;
        this.additionalInfoRequiredCount = additionalInfoRequiredCount;
        this.disbursedCount = disbursedCount;
        this.paidCount = paidCount;
        this.highValuePendingCount = highValuePendingCount;
        this.totalDisbursedVolume = totalDisbursedVolume != null ? totalDisbursedVolume : BigDecimal.ZERO;
    }

    public long getTotalApplications() {
        return totalApplications;
    }

    public void setTotalApplications(long totalApplications) {
        this.totalApplications = totalApplications;
    }

    public long getPendingCount() {
        return pendingCount;
    }

    public void setPendingCount(long pendingCount) {
        this.pendingCount = pendingCount;
    }

    public long getUnderReviewCount() {
        return underReviewCount;
    }

    public void setUnderReviewCount(long underReviewCount) {
        this.underReviewCount = underReviewCount;
    }

    public long getApprovedCount() {
        return approvedCount;
    }

    public void setApprovedCount(long approvedCount) {
        this.approvedCount = approvedCount;
    }

    public long getRejectedCount() {
        return rejectedCount;
    }

    public void setRejectedCount(long rejectedCount) {
        this.rejectedCount = rejectedCount;
    }

    public long getAdditionalInfoRequiredCount() {
        return additionalInfoRequiredCount;
    }

    public void setAdditionalInfoRequiredCount(long additionalInfoRequiredCount) {
        this.additionalInfoRequiredCount = additionalInfoRequiredCount;
    }

    public long getDisbursedCount() {
        return disbursedCount;
    }

    public void setDisbursedCount(long disbursedCount) {
        this.disbursedCount = disbursedCount;
    }

    public long getPaidCount() {
        return paidCount;
    }

    public void setPaidCount(long paidCount) {
        this.paidCount = paidCount;
    }

    public long getHighValuePendingCount() {
        return highValuePendingCount;
    }

    public void setHighValuePendingCount(long highValuePendingCount) {
        this.highValuePendingCount = highValuePendingCount;
    }

    public BigDecimal getTotalDisbursedVolume() {
        return totalDisbursedVolume;
    }

    public void setTotalDisbursedVolume(BigDecimal totalDisbursedVolume) {
        this.totalDisbursedVolume = totalDisbursedVolume;
    }
}
