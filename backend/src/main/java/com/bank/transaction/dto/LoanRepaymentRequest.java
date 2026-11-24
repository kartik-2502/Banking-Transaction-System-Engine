package com.bank.transaction.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class LoanRepaymentRequest {

    @NotNull(message = "Repayment amount is required")
    @DecimalMin(value = "1.00", message = "Minimum repayment amount is ₹1.00")
    private BigDecimal amount;

    private String sourceAccountNumber;

    public LoanRepaymentRequest() {}

    public LoanRepaymentRequest(BigDecimal amount, String sourceAccountNumber) {
        this.amount = amount;
        this.sourceAccountNumber = sourceAccountNumber;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getSourceAccountNumber() {
        return sourceAccountNumber;
    }

    public void setSourceAccountNumber(String sourceAccountNumber) {
        this.sourceAccountNumber = sourceAccountNumber;
    }
}
