package com.bank.transaction.dto.analytics;

import java.math.BigDecimal;

public class TopAccountVolumeResponse {

    private int rank;
    private String accountNumber;
    private String customerNumber;
    private String customerName;
    private String customerEmail;
    private BigDecimal currentBalance;
    private String currency;
    private String accountStatus;
    private long totalTransactions;
    private BigDecimal totalTurnoverVolume;

    public TopAccountVolumeResponse() {}

    public int getRank() {
        return rank;
    }

    public void setRank(int rank) {
        this.rank = rank;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getCustomerNumber() {
        return customerNumber;
    }

    public void setCustomerNumber(String customerNumber) {
        this.customerNumber = customerNumber;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public BigDecimal getCurrentBalance() {
        return currentBalance;
    }

    public void setCurrentBalance(BigDecimal currentBalance) {
        this.currentBalance = currentBalance;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(String accountStatus) {
        this.accountStatus = accountStatus;
    }

    public long getTotalTransactions() {
        return totalTransactions;
    }

    public void setTotalTransactions(long totalTransactions) {
        this.totalTransactions = totalTransactions;
    }

    public BigDecimal getTotalTurnoverVolume() {
        return totalTurnoverVolume;
    }

    public void setTotalTurnoverVolume(BigDecimal totalTurnoverVolume) {
        this.totalTurnoverVolume = totalTurnoverVolume;
    }
}
