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

    @NotNull(message = "Monthly income is required for credit assessment")
    @DecimalMin(value = "5000.00", message = "Minimum declared monthly income is ₹5,000.00")
    private BigDecimal monthlyIncome;

    private BigDecimal existingMonthlyDebt = BigDecimal.ZERO;
    private Integer creditScore = 720;
    private String documentUrls;

    public LoanApplicationRequest() {}

    public LoanApplicationRequest(String accountNumber, BigDecimal amount, Integer termMonths, String purpose) {
        this(accountNumber, amount, termMonths, purpose, new BigDecimal("50000.00"), BigDecimal.ZERO, 720);
    }

    public LoanApplicationRequest(String accountNumber, BigDecimal amount, Integer termMonths, String purpose,
                                  BigDecimal monthlyIncome, BigDecimal existingMonthlyDebt, Integer creditScore) {
        this.accountNumber = accountNumber;
        this.amount = amount;
        this.termMonths = termMonths;
        this.purpose = purpose;
        this.monthlyIncome = monthlyIncome;
        this.existingMonthlyDebt = existingMonthlyDebt != null ? existingMonthlyDebt : BigDecimal.ZERO;
        this.creditScore = creditScore != null ? creditScore : 720;
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

    public BigDecimal getMonthlyIncome() {
        return monthlyIncome;
    }

    public void setMonthlyIncome(BigDecimal monthlyIncome) {
        this.monthlyIncome = monthlyIncome;
    }

    public BigDecimal getExistingMonthlyDebt() {
        return existingMonthlyDebt;
    }

    public void setExistingMonthlyDebt(BigDecimal existingMonthlyDebt) {
        this.existingMonthlyDebt = existingMonthlyDebt;
    }

    public Integer getCreditScore() {
        return creditScore;
    }

    public void setCreditScore(Integer creditScore) {
        this.creditScore = creditScore;
    }

    public String getDocumentUrls() {
        return documentUrls;
    }

    public void setDocumentUrls(String documentUrls) {
        this.documentUrls = documentUrls;
    }
}
