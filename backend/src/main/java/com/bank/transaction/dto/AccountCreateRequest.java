package com.bank.transaction.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class AccountCreateRequest {

    @NotBlank(message = "Customer number is mandatory")
    private String customerNumber;

    @NotNull(message = "Initial balance is mandatory")
    @DecimalMin(value = "0.00", message = "Initial balance cannot be negative")
    private BigDecimal initialBalance = BigDecimal.ZERO;

    @Size(min = 3, max = 3, message = "Currency must be a 3-character ISO code (e.g. INR, USD)")
    private String currency = "INR";

    @DecimalMin(value = "0.00", message = "Daily limit cannot be negative")
    private BigDecimal dailyLimit = new BigDecimal("100000.00");

    @DecimalMin(value = "0.00", message = "Per-transaction limit cannot be negative")
    private BigDecimal perTransactionLimit = new BigDecimal("50000.00");

    public AccountCreateRequest() {}

    public AccountCreateRequest(String customerNumber, BigDecimal initialBalance, String currency) {
        this.customerNumber = customerNumber;
        this.initialBalance = initialBalance;
        this.currency = currency;
    }

    public String getCustomerNumber() {
        return customerNumber;
    }

    public void setCustomerNumber(String customerNumber) {
        this.customerNumber = customerNumber;
    }

    public BigDecimal getInitialBalance() {
        return initialBalance;
    }

    public void setInitialBalance(BigDecimal initialBalance) {
        this.initialBalance = initialBalance;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
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
