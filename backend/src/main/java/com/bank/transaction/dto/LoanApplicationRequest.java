package com.bank.transaction.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class LoanApplicationRequest {

    @NotBlank(message = "Account number is required")
    private String accountNumber;

    @NotNull(message = "Loan amount is required")
    @DecimalMin(value = "1000.00", message = "Minimum loan amount is ₹1,000.00")
    private BigDecimal amount;

    @NotNull(message = "Term in months is required")
    @Min(value = 1, message = "Minimum loan term is 1 month")
    private Integer termMonths;

    @NotBlank(message = "Loan purpose is required")
    private String purpose;

    public LoanApplicationRequest() {}

    public LoanApplicationRequest(String accountNumber, BigDecimal amount, Integer termMonths, String purpose) {
        this.accountNumber = accountNumber;
        this.amount = amount;
        this.termMonths = termMonths;
        this.purpose = purpose;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Integer getTermMonths() {
        return termMonths;
    }

    public void setTermMonths(Integer termMonths) {
        this.termMonths = termMonths;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }
}
