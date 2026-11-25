package com.bank.transaction.dto.analytics;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class FailedTransactionSummaryResponse {

    private String errorCategory;
    private String failureReason;
    private long failureCount;
    private BigDecimal percentageOfTotal;
    private long distinctAccountsImpacted;
    private OffsetDateTime firstSeenAt;
    private OffsetDateTime lastSeenAt;

    public FailedTransactionSummaryResponse() {}

    public String getErrorCategory() {
        return errorCategory;
    }

    public void setErrorCategory(String errorCategory) {
        this.errorCategory = errorCategory;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public long getFailureCount() {
        return failureCount;
    }

    public void setFailureCount(long failureCount) {
        this.failureCount = failureCount;
    }

    public BigDecimal getPercentageOfTotal() {
        return percentageOfTotal;
    }

    public void setPercentageOfTotal(BigDecimal percentageOfTotal) {
        this.percentageOfTotal = percentageOfTotal;
    }

    public long getDistinctAccountsImpacted() {
        return distinctAccountsImpacted;
    }

    public void setDistinctAccountsImpacted(long distinctAccountsImpacted) {
        this.distinctAccountsImpacted = distinctAccountsImpacted;
    }

    public OffsetDateTime getFirstSeenAt() {
        return firstSeenAt;
    }

    public void setFirstSeenAt(OffsetDateTime firstSeenAt) {
        this.firstSeenAt = firstSeenAt;
    }

    public OffsetDateTime getLastSeenAt() {
        return lastSeenAt;
    }

    public void setLastSeenAt(OffsetDateTime lastSeenAt) {
        this.lastSeenAt = lastSeenAt;
    }
}
