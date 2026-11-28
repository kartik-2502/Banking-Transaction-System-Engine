package com.bank.transaction.dto.loan;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class LoanDisbursementDto {
    private String disbursementId;
    private String loanId;
    private String customerNumber;
    private String customerName;
    private String accountNumber;
    private String branchCode;
    private BigDecimal amount;
    private String disbursementMode;
    private String transactionRef;
    private boolean conditionsVerified;
    private boolean beneficiaryVerified;
    private String status;
    private String initiatedBy;
    private String approvedBy;
    private String remarks;
    private OffsetDateTime disbursedAt;
    private OffsetDateTime createdAt;

    public static class InitiateRequest {
        private boolean conditionsVerified;
        private boolean beneficiaryVerified;
        private String disbursementMode = "CORE_LEDGER_SIMULATED";
        private String remarks;

        public boolean isConditionsVerified() { return conditionsVerified; }
        public void setConditionsVerified(boolean conditionsVerified) { this.conditionsVerified = conditionsVerified; }
        public boolean isBeneficiaryVerified() { return beneficiaryVerified; }
        public void setBeneficiaryVerified(boolean beneficiaryVerified) { this.beneficiaryVerified = beneficiaryVerified; }
        public String getDisbursementMode() { return disbursementMode; }
        public void setDisbursementMode(String disbursementMode) { this.disbursementMode = disbursementMode; }
        public String getRemarks() { return remarks; }
        public void setRemarks(String remarks) { this.remarks = remarks; }
    }

    public String getDisbursementId() { return disbursementId; }
    public void setDisbursementId(String disbursementId) { this.disbursementId = disbursementId; }
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
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getDisbursementMode() { return disbursementMode; }
    public void setDisbursementMode(String disbursementMode) { this.disbursementMode = disbursementMode; }
    public String getTransactionRef() { return transactionRef; }
    public void setTransactionRef(String transactionRef) { this.transactionRef = transactionRef; }
    public boolean isConditionsVerified() { return conditionsVerified; }
    public void setConditionsVerified(boolean conditionsVerified) { this.conditionsVerified = conditionsVerified; }
    public boolean isBeneficiaryVerified() { return beneficiaryVerified; }
    public void setBeneficiaryVerified(boolean beneficiaryVerified) { this.beneficiaryVerified = beneficiaryVerified; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getInitiatedBy() { return initiatedBy; }
    public void setInitiatedBy(String initiatedBy) { this.initiatedBy = initiatedBy; }
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public OffsetDateTime getDisbursedAt() { return disbursedAt; }
    public void setDisbursedAt(OffsetDateTime disbursedAt) { this.disbursedAt = disbursedAt; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
