package com.bank.transaction.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class AccountTransactionLimitResponse {

    private Long id;
    private Long accountId;
    private String accountNumber;
    private BigDecimal dailyLimit;
    private BigDecimal perTransactionLimit;
    private OffsetDateTime updatedAt;

    public AccountTransactionLimitResponse() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAccountId() {
        return accountId;
    }

    public void setAccountId(Long accountId) {
        this.accountId = accountId;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public BigDecimal getDailyLimit() {
        return dailyLimit;
    }

    public void setDailyLimit(BigDecimal dailyLimit) {
        this.dailyLimit = dailyLimit;
    }

    public BigDecimal getPerTransactionLimit() {
        return perTransactionLimit;
    }

    public void setPerTransactionLimit(BigDecimal perTransactionLimit) {
        this.perTransactionLimit = perTransactionLimit;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
