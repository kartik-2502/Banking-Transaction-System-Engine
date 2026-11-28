package com.bank.transaction.dto.loan;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class LoanOverdueDto {
    private String loanId;
    private String customerNumber;
    private String customerName;
    private String maskedPhone;
    private String loanCategory;
    private String branchCode;
    private long daysPastDue;
    private String delinquencyBucket;
    private BigDecimal overdueAmount;
    private BigDecimal outstandingBalance;
    private int overdueInstallmentCount;
    private LocalDate oldestDueDate;

    public static class FollowUpDto {
        private String followupId;
        private String loanId;
        private String followupType;
        private int dpdAtFollowup;
        private BigDecimal overdueAmount;
        private BigDecimal commitmentAmount;
        private LocalDate commitmentDate;
        private String outcome;
        private String recoveryStatus;
        private String notes;
        private boolean escalated;
        private String createdBy;
        private OffsetDateTime createdAt;

        public String getFollowupId() { return followupId; }
        public void setFollowupId(String followupId) { this.followupId = followupId; }
        public String getLoanId() { return loanId; }
        public void setLoanId(String loanId) { this.loanId = loanId; }
        public String getFollowupType() { return followupType; }
        public void setFollowupType(String followupType) { this.followupType = followupType; }
        public int getDpdAtFollowup() { return dpdAtFollowup; }
        public void setDpdAtFollowup(int dpdAtFollowup) { this.dpdAtFollowup = dpdAtFollowup; }
        public BigDecimal getOverdueAmount() { return overdueAmount; }
        public void setOverdueAmount(BigDecimal overdueAmount) { this.overdueAmount = overdueAmount; }
        public BigDecimal getCommitmentAmount() { return commitmentAmount; }
        public void setCommitmentAmount(BigDecimal commitmentAmount) { this.commitmentAmount = commitmentAmount; }
        public LocalDate getCommitmentDate() { return commitmentDate; }
        public void setCommitmentDate(LocalDate commitmentDate) { this.commitmentDate = commitmentDate; }
        public String getOutcome() { return outcome; }
        public void setOutcome(String outcome) { this.outcome = outcome; }
        public String getRecoveryStatus() { return recoveryStatus; }
        public void setRecoveryStatus(String recoveryStatus) { this.recoveryStatus = recoveryStatus; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        public boolean isEscalated() { return escalated; }
        public void setEscalated(boolean escalated) { this.escalated = escalated; }
        public String getCreatedBy() { return createdBy; }
        public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
        public OffsetDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    }

    public static class CreateFollowUpRequest {
        @NotBlank private String followupType;
        private BigDecimal commitmentAmount;
        private LocalDate commitmentDate;
        @NotBlank private String outcome;
        private String recoveryStatus = "OPEN";
        private String notes;
        private boolean escalated = false;

        public String getFollowupType() { return followupType; }
        public void setFollowupType(String followupType) { this.followupType = followupType; }
        public BigDecimal getCommitmentAmount() { return commitmentAmount; }
        public void setCommitmentAmount(BigDecimal commitmentAmount) { this.commitmentAmount = commitmentAmount; }
        public LocalDate getCommitmentDate() { return commitmentDate; }
        public void setCommitmentDate(LocalDate commitmentDate) { this.commitmentDate = commitmentDate; }
        public String getOutcome() { return outcome; }
        public void setOutcome(String outcome) { this.outcome = outcome; }
        public String getRecoveryStatus() { return recoveryStatus; }
        public void setRecoveryStatus(String recoveryStatus) { this.recoveryStatus = recoveryStatus; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        public boolean isEscalated() { return escalated; }
        public void setEscalated(boolean escalated) { this.escalated = escalated; }
    }

    public String getLoanId() { return loanId; }
    public void setLoanId(String loanId) { this.loanId = loanId; }
    public String getCustomerNumber() { return customerNumber; }
    public void setCustomerNumber(String customerNumber) { this.customerNumber = customerNumber; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getMaskedPhone() { return maskedPhone; }
    public void setMaskedPhone(String maskedPhone) { this.maskedPhone = maskedPhone; }
    public String getLoanCategory() { return loanCategory; }
    public void setLoanCategory(String loanCategory) { this.loanCategory = loanCategory; }
    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }
    public long getDaysPastDue() { return daysPastDue; }
    public void setDaysPastDue(long daysPastDue) { this.daysPastDue = daysPastDue; }
    public String getDelinquencyBucket() { return delinquencyBucket; }
    public void setDelinquencyBucket(String delinquencyBucket) { this.delinquencyBucket = delinquencyBucket; }
    public BigDecimal getOverdueAmount() { return overdueAmount; }
    public void setOverdueAmount(BigDecimal overdueAmount) { this.overdueAmount = overdueAmount; }
    public BigDecimal getOutstandingBalance() { return outstandingBalance; }
    public void setOutstandingBalance(BigDecimal outstandingBalance) { this.outstandingBalance = outstandingBalance; }
    public int getOverdueInstallmentCount() { return overdueInstallmentCount; }
    public void setOverdueInstallmentCount(int overdueInstallmentCount) { this.overdueInstallmentCount = overdueInstallmentCount; }
    public LocalDate getOldestDueDate() { return oldestDueDate; }
    public void setOldestDueDate(LocalDate oldestDueDate) { this.oldestDueDate = oldestDueDate; }
}
