package com.bank.transaction.dto.analytics;

import java.math.BigDecimal;
import java.time.LocalDate;

public class DailyTransactionTrendResponse {

    private LocalDate transactionDate;
    private String operationType;
    private long totalAttempts;
    private long successfulCount;
    private long failedCount;
    private BigDecimal successRatePercentage;
    private BigDecimal totalSettledVolume;
    private BigDecimal avgSettledAmount;

    public DailyTransactionTrendResponse() {}

    public LocalDate getTransactionDate() {
        return transactionDate;
    }

    public void setTransactionDate(LocalDate transactionDate) {
        this.transactionDate = transactionDate;
    }

    public String getOperationType() {
        return operationType;
    }

    public void setOperationType(String operationType) {
        this.operationType = operationType;
    }

    public long getTotalAttempts() {
        return totalAttempts;
    }

    public void setTotalAttempts(long totalAttempts) {
        this.totalAttempts = totalAttempts;
    }

    public long getSuccessfulCount() {
        return successfulCount;
    }

    public void setSuccessfulCount(long successfulCount) {
        this.successfulCount = successfulCount;
    }

    public long getFailedCount() {
        return failedCount;
    }

    public void setFailedCount(long failedCount) {
        this.failedCount = failedCount;
    }

    public BigDecimal getSuccessRatePercentage() {
        return successRatePercentage;
    }

    public void setSuccessRatePercentage(BigDecimal successRatePercentage) {
        this.successRatePercentage = successRatePercentage;
    }

    public BigDecimal getTotalSettledVolume() {
        return totalSettledVolume;
    }

    public void setTotalSettledVolume(BigDecimal totalSettledVolume) {
        this.totalSettledVolume = totalSettledVolume;
    }

    public BigDecimal getAvgSettledAmount() {
        return avgSettledAmount;
    }

    public void setAvgSettledAmount(BigDecimal avgSettledAmount) {
        this.avgSettledAmount = avgSettledAmount;
    }
}
