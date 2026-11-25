package com.bank.transaction.dto.analytics;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class SystemOverviewAnalytics {

    private long totalAccounts;
    private long activeAccounts;
    private long frozenAccounts;
    private BigDecimal totalDepositBalance = BigDecimal.ZERO;

    private long totalTransactions;
    private BigDecimal totalTransactionVolume = BigDecimal.ZERO;
    private long todayTransactions;
    private BigDecimal todayTransactionVolume = BigDecimal.ZERO;

    private long totalLoans;
    private long activeLoans;
    private BigDecimal totalLoanDisbursed = BigDecimal.ZERO;
    private BigDecimal totalLoanOutstanding = BigDecimal.ZERO;

    private long totalFraudAlerts;
    private long pendingFraudAlerts;

    private String systemHealthStatus = "HEALTHY";
    private OffsetDateTime generatedAt = OffsetDateTime.now();

    public SystemOverviewAnalytics() {}

    public long getTotalAccounts() {
        return totalAccounts;
    }

    public void setTotalAccounts(long totalAccounts) {
        this.totalAccounts = totalAccounts;
    }

    public long getActiveAccounts() {
        return activeAccounts;
    }

    public void setActiveAccounts(long activeAccounts) {
        this.activeAccounts = activeAccounts;
    }

    public long getFrozenAccounts() {
        return frozenAccounts;
    }

    public void setFrozenAccounts(long frozenAccounts) {
        this.frozenAccounts = frozenAccounts;
    }

    public BigDecimal getTotalDepositBalance() {
        return totalDepositBalance;
    }

    public void setTotalDepositBalance(BigDecimal totalDepositBalance) {
        this.totalDepositBalance = totalDepositBalance;
    }

    public long getTotalTransactions() {
        return totalTransactions;
    }

    public void setTotalTransactions(long totalTransactions) {
        this.totalTransactions = totalTransactions;
    }

    public BigDecimal getTotalTransactionVolume() {
        return totalTransactionVolume;
    }

    public void setTotalTransactionVolume(BigDecimal totalTransactionVolume) {
        this.totalTransactionVolume = totalTransactionVolume;
    }

    public long getTodayTransactions() {
        return todayTransactions;
    }

    public void setTodayTransactions(long todayTransactions) {
        this.todayTransactions = todayTransactions;
    }

    public BigDecimal getTodayTransactionVolume() {
        return todayTransactionVolume;
    }

    public void setTodayTransactionVolume(BigDecimal todayTransactionVolume) {
        this.todayTransactionVolume = todayTransactionVolume;
    }

    public long getTotalLoans() {
        return totalLoans;
    }

    public void setTotalLoans(long totalLoans) {
        this.totalLoans = totalLoans;
    }

    public long getActiveLoans() {
        return activeLoans;
    }

    public void setActiveLoans(long activeLoans) {
        this.activeLoans = activeLoans;
    }

    public BigDecimal getTotalLoanDisbursed() {
        return totalLoanDisbursed;
    }

    public void setTotalLoanDisbursed(BigDecimal totalLoanDisbursed) {
        this.totalLoanDisbursed = totalLoanDisbursed;
    }

    public BigDecimal getTotalLoanOutstanding() {
        return totalLoanOutstanding;
    }

    public void setTotalLoanOutstanding(BigDecimal totalLoanOutstanding) {
        this.totalLoanOutstanding = totalLoanOutstanding;
    }

    public long getTotalFraudAlerts() {
        return totalFraudAlerts;
    }

    public void setTotalFraudAlerts(long totalFraudAlerts) {
        this.totalFraudAlerts = totalFraudAlerts;
    }

    public long getPendingFraudAlerts() {
        return pendingFraudAlerts;
    }

    public void setPendingFraudAlerts(long pendingFraudAlerts) {
        this.pendingFraudAlerts = pendingFraudAlerts;
    }

    public String getSystemHealthStatus() {
        return systemHealthStatus;
    }

    public void setSystemHealthStatus(String systemHealthStatus) {
        this.systemHealthStatus = systemHealthStatus;
    }

    public OffsetDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(OffsetDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }
}
