package com.bank.transaction.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class AccountTransactionLimitUpdateRequest {

    @NotNull(message = "Daily limit is required")
    @DecimalMin(value = "0.01", message = "Daily limit must be strictly positive")
    private BigDecimal dailyLimit;

    @NotNull(message = "Per-transaction limit is required")
    @DecimalMin(value = "0.01", message = "Per-transaction limit must be strictly positive")
    private BigDecimal perTransactionLimit;

    public AccountTransactionLimitUpdateRequest() {}

    public AccountTransactionLimitUpdateRequest(BigDecimal dailyLimit, BigDecimal perTransactionLimit) {
        this.dailyLimit = dailyLimit;
        this.perTransactionLimit = perTransactionLimit;
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
}
