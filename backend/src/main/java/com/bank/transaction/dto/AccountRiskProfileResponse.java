package com.bank.transaction.dto;

import com.bank.transaction.model.AccountStatus;
import java.math.BigDecimal;

public class AccountRiskProfileResponse {

    private String accountNumber;
    private Long customerId;
    private String customerName;
    private BigDecimal currentBalance;
    private AccountStatus status;
    private BigDecimal perTransactionLimit;
    private BigDecimal dailyLimit;
    private BigDecimal todaySpentAmount;
    private long recentFailedTransactionsCount;
    private long recentFraudAlertsCount;
    private boolean riskFlagged;
    private String riskSummary;

    public AccountRiskProfileResponse() {}

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public BigDecimal getCurrentBalance() {
        return currentBalance;
    }

    public void setCurrentBalance(BigDecimal currentBalance) {
        this.currentBalance = currentBalance;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public void setStatus(AccountStatus status) {
        this.status = status;
    }

    public BigDecimal getPerTransactionLimit() {
        return perTransactionLimit;
    }

    public void setPerTransactionLimit(BigDecimal perTransactionLimit) {
        this.perTransactionLimit = perTransactionLimit;
    }

    public BigDecimal getDailyLimit() {
        return dailyLimit;
    }

    public void setDailyLimit(BigDecimal dailyLimit) {
        this.dailyLimit = dailyLimit;
    }

    public BigDecimal getTodaySpentAmount() {
        return todaySpentAmount;
    }

    public void setTodaySpentAmount(BigDecimal todaySpentAmount) {
        this.todaySpentAmount = todaySpentAmount;
    }

    public long getRecentFailedTransactionsCount() {
        return recentFailedTransactionsCount;
    }

    public void setRecentFailedTransactionsCount(long recentFailedTransactionsCount) {
        this.recentFailedTransactionsCount = recentFailedTransactionsCount;
    }

    public long getRecentFraudAlertsCount() {
        return recentFraudAlertsCount;
    }

    public void setRecentFraudAlertsCount(long recentFraudAlertsCount) {
        this.recentFraudAlertsCount = recentFraudAlertsCount;
    }

    public boolean isRiskFlagged() {
        return riskFlagged;
    }

    public void setRiskFlagged(boolean riskFlagged) {
        this.riskFlagged = riskFlagged;
    }

    public String getRiskSummary() {
        return riskSummary;
    }

    public void setRiskSummary(String riskSummary) {
        this.riskSummary = riskSummary;
    }
}
