package com.bank.transaction.dto.loan;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class LoanApplicationSummaryDto {
    private Long id;
    private String loanId;
    private String customerNumber;
    private String customerName;
    private String accountNumber;
    private String branchCode;
    private String loanCategory;
    private BigDecimal amount;
    private BigDecimal interestRate;
    private Integer termMonths;
    private String status;
    private String purpose;
    private String employmentType;
    private BigDecimal monthlyIncome;
    private BigDecimal existingMonthlyDebt;
    private Integer creditScore;
    private BigDecimal dtiRatio;
    private BigDecimal emiAmount;
    private BigDecimal totalPayable;
    private BigDecimal outstandingBalance;
    private String collateralType;
    private BigDecimal collateralValue;
    private BigDecimal ltvRatio;
    private String assignedOfficer;
    private boolean requiresAdminApproval;
    private String reviewedBy;
    private String finalApprovedBy;
    private String assessmentNotes;
    private String rejectionReason;
    private OffsetDateTime disbursedAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static class CreateRequest {
        @NotBlank private String customerNumber;
        @NotBlank private String accountNumber;
        @NotBlank private String loanCategory;
        @NotNull @DecimalMin("1000.00") private BigDecimal requestedAmount;
        @NotNull @Min(3) @Max(360) private Integer tenureMonths;
        @DecimalMin("1.00") @DecimalMax("40.00") private BigDecimal interestRate;
        @NotBlank private String employmentType;
        @NotNull @DecimalMin("1000.00") private BigDecimal monthlyIncome;
        @DecimalMin("0.00") private BigDecimal existingLiabilities = BigDecimal.ZERO;
        @Min(300) @Max(900) private Integer creditScore = 700;
        @NotBlank private String loanPurpose;
        private String collateralType;
        private BigDecimal collateralValue;
        private String documentUrls;
        private String remarks;

        public String getCustomerNumber() { return customerNumber; }
        public void setCustomerNumber(String customerNumber) { this.customerNumber = customerNumber; }
        public String getAccountNumber() { return accountNumber; }
        public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }
        public String getLoanCategory() { return loanCategory; }
        public void setLoanCategory(String loanCategory) { this.loanCategory = loanCategory; }
        public BigDecimal getRequestedAmount() { return requestedAmount; }
        public void setRequestedAmount(BigDecimal requestedAmount) { this.requestedAmount = requestedAmount; }
        public Integer getTenureMonths() { return tenureMonths; }
        public void setTenureMonths(Integer tenureMonths) { this.tenureMonths = tenureMonths; }
        public BigDecimal getInterestRate() { return interestRate; }
        public void setInterestRate(BigDecimal interestRate) { this.interestRate = interestRate; }
        public String getEmploymentType() { return employmentType; }
        public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }
        public BigDecimal getMonthlyIncome() { return monthlyIncome; }
        public void setMonthlyIncome(BigDecimal monthlyIncome) { this.monthlyIncome = monthlyIncome; }
        public BigDecimal getExistingLiabilities() { return existingLiabilities; }
        public void setExistingLiabilities(BigDecimal existingLiabilities) { this.existingLiabilities = existingLiabilities; }
        public Integer getCreditScore() { return creditScore; }
        public void setCreditScore(Integer creditScore) { this.creditScore = creditScore; }
        public String getLoanPurpose() { return loanPurpose; }
        public void setLoanPurpose(String loanPurpose) { this.loanPurpose = loanPurpose; }
        public String getCollateralType() { return collateralType; }
        public void setCollateralType(String collateralType) { this.collateralType = collateralType; }
        public BigDecimal getCollateralValue() { return collateralValue; }
        public void setCollateralValue(BigDecimal collateralValue) { this.collateralValue = collateralValue; }
        public String getDocumentUrls() { return documentUrls; }
        public void setDocumentUrls(String documentUrls) { this.documentUrls = documentUrls; }
        public String getRemarks() { return remarks; }
        public void setRemarks(String remarks) { this.remarks = remarks; }
    }

    public static class UpdateRequest {
        private String loanPurpose;
        private BigDecimal monthlyIncome;
        private BigDecimal existingLiabilities;
        private Integer termMonths;
        private BigDecimal requestedAmount;
        private String employmentType;
        private String collateralType;
        private BigDecimal collateralValue;
        private String remarks;

        public String getLoanPurpose() { return loanPurpose; }
        public void setLoanPurpose(String loanPurpose) { this.loanPurpose = loanPurpose; }
        public BigDecimal getMonthlyIncome() { return monthlyIncome; }
        public void setMonthlyIncome(BigDecimal monthlyIncome) { this.monthlyIncome = monthlyIncome; }
        public BigDecimal getExistingLiabilities() { return existingLiabilities; }
        public void setExistingLiabilities(BigDecimal existingLiabilities) { this.existingLiabilities = existingLiabilities; }
        public Integer getTermMonths() { return termMonths; }
        public void setTermMonths(Integer termMonths) { this.termMonths = termMonths; }
        public BigDecimal getRequestedAmount() { return requestedAmount; }
        public void setRequestedAmount(BigDecimal requestedAmount) { this.requestedAmount = requestedAmount; }
        public String getEmploymentType() { return employmentType; }
        public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }
        public String getCollateralType() { return collateralType; }
        public void setCollateralType(String collateralType) { this.collateralType = collateralType; }
        public BigDecimal getCollateralValue() { return collateralValue; }
        public void setCollateralValue(BigDecimal collateralValue) { this.collateralValue = collateralValue; }
        public String getRemarks() { return remarks; }
        public void setRemarks(String remarks) { this.remarks = remarks; }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getLoanId() { return loanId; }
    public void setLoanId(String loanId) { this.loanId = loanId; }
    public String getCustomerNumber() { return customerNumber; }
    public void setCustomerNumber(String customerNumber) { this.customerNumber = customerNumber; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }
    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }
    public String getLoanCategory() { return loanCategory; }
    public void setLoanCategory(String loanCategory) { this.loanCategory = loanCategory; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public BigDecimal getInterestRate() { return interestRate; }
    public void setInterestRate(BigDecimal interestRate) { this.interestRate = interestRate; }
    public Integer getTermMonths() { return termMonths; }
    public void setTermMonths(Integer termMonths) { this.termMonths = termMonths; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }
    public BigDecimal getMonthlyIncome() { return monthlyIncome; }
    public void setMonthlyIncome(BigDecimal monthlyIncome) { this.monthlyIncome = monthlyIncome; }
    public BigDecimal getExistingMonthlyDebt() { return existingMonthlyDebt; }
    public void setExistingMonthlyDebt(BigDecimal existingMonthlyDebt) { this.existingMonthlyDebt = existingMonthlyDebt; }
    public Integer getCreditScore() { return creditScore; }
    public void setCreditScore(Integer creditScore) { this.creditScore = creditScore; }
    public BigDecimal getDtiRatio() { return dtiRatio; }
    public void setDtiRatio(BigDecimal dtiRatio) { this.dtiRatio = dtiRatio; }
    public BigDecimal getEmiAmount() { return emiAmount; }
    public void setEmiAmount(BigDecimal emiAmount) { this.emiAmount = emiAmount; }
    public BigDecimal getTotalPayable() { return totalPayable; }
    public void setTotalPayable(BigDecimal totalPayable) { this.totalPayable = totalPayable; }
    public BigDecimal getOutstandingBalance() { return outstandingBalance; }
    public void setOutstandingBalance(BigDecimal outstandingBalance) { this.outstandingBalance = outstandingBalance; }
    public String getCollateralType() { return collateralType; }
    public void setCollateralType(String collateralType) { this.collateralType = collateralType; }
    public BigDecimal getCollateralValue() { return collateralValue; }
    public void setCollateralValue(BigDecimal collateralValue) { this.collateralValue = collateralValue; }
    public BigDecimal getLtvRatio() { return ltvRatio; }
    public void setLtvRatio(BigDecimal ltvRatio) { this.ltvRatio = ltvRatio; }
    public String getAssignedOfficer() { return assignedOfficer; }
    public void setAssignedOfficer(String assignedOfficer) { this.assignedOfficer = assignedOfficer; }
    public boolean isRequiresAdminApproval() { return requiresAdminApproval; }
    public void setRequiresAdminApproval(boolean requiresAdminApproval) { this.requiresAdminApproval = requiresAdminApproval; }
    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }
    public String getFinalApprovedBy() { return finalApprovedBy; }
    public void setFinalApprovedBy(String finalApprovedBy) { this.finalApprovedBy = finalApprovedBy; }
    public String getAssessmentNotes() { return assessmentNotes; }
    public void setAssessmentNotes(String assessmentNotes) { this.assessmentNotes = assessmentNotes; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public OffsetDateTime getDisbursedAt() { return disbursedAt; }
    public void setDisbursedAt(OffsetDateTime disbursedAt) { this.disbursedAt = disbursedAt; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
