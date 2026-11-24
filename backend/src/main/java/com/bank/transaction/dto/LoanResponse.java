package com.bank.transaction.dto;

import com.bank.transaction.model.LoanStatus;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class LoanResponse {

    private Long id;
    private String loanId;
    private Long customerId;
    private String customerNumber;
    private String customerName;
    private String customerEmail;
    private String accountNumber;
    private BigDecimal amount;
    private BigDecimal interestRate;
    private Integer termMonths;
    private LoanStatus status;
    private String purpose;
    private BigDecimal monthlyIncome;
    private BigDecimal existingMonthlyDebt;
    private Integer creditScore;
    private BigDecimal dtiRatio;
    private BigDecimal emiAmount;
    private BigDecimal totalPayable;
    private BigDecimal outstandingBalance;
    private String assessmentNotes;
    private String documentUrls;
    private boolean requiresAdminApproval;
    private String reviewedBy;
    private String finalApprovedBy;
    private String rejectionReason;
    private OffsetDateTime disbursedAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public LoanResponse() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLoanId() {
        return loanId;
    }

    public void setLoanId(String loanId) {
        this.loanId = loanId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
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

    public BigDecimal getInterestRate() {
        return interestRate;
    }

    public void setInterestRate(BigDecimal interestRate) {
        this.interestRate = interestRate;
    }

    public Integer getTermMonths() {
        return termMonths;
    }

    public void setTermMonths(Integer termMonths) {
        this.termMonths = termMonths;
    }

    public LoanStatus getStatus() {
        return status;
    }

    public void setStatus(LoanStatus status) {
        this.status = status;
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

    public BigDecimal getDtiRatio() {
        return dtiRatio;
    }

    public void setDtiRatio(BigDecimal dtiRatio) {
        this.dtiRatio = dtiRatio;
    }

    public BigDecimal getEmiAmount() {
        return emiAmount;
    }

    public void setEmiAmount(BigDecimal emiAmount) {
        this.emiAmount = emiAmount;
    }

    public BigDecimal getTotalPayable() {
        return totalPayable;
    }

    public void setTotalPayable(BigDecimal totalPayable) {
        this.totalPayable = totalPayable;
    }

    public BigDecimal getOutstandingBalance() {
        return outstandingBalance;
    }

    public void setOutstandingBalance(BigDecimal outstandingBalance) {
        this.outstandingBalance = outstandingBalance;
    }

    public String getAssessmentNotes() {
        return assessmentNotes;
    }

    public void setAssessmentNotes(String assessmentNotes) {
        this.assessmentNotes = assessmentNotes;
    }

    public String getDocumentUrls() {
        return documentUrls;
    }

    public void setDocumentUrls(String documentUrls) {
        this.documentUrls = documentUrls;
    }

    public boolean isRequiresAdminApproval() {
        return requiresAdminApproval;
    }

    public void setRequiresAdminApproval(boolean requiresAdminApproval) {
        this.requiresAdminApproval = requiresAdminApproval;
    }

    public String getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(String reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public String getFinalApprovedBy() {
        return finalApprovedBy;
    }

    public void setFinalApprovedBy(String finalApprovedBy) {
        this.finalApprovedBy = finalApprovedBy;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public OffsetDateTime getDisbursedAt() {
        return disbursedAt;
    }

    public void setDisbursedAt(OffsetDateTime disbursedAt) {
        this.disbursedAt = disbursedAt;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
