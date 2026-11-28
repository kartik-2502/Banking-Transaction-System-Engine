package com.bank.transaction.dto.teller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class ChequeResponse {
    private String chequeRef;
    private String chequeNumber;
    private String accountNumber;
    private String customerNumber;
    private String customerName;
    private String branchCode;
    private String drawerAccountNumber;
    private String issuingBankName;
    private String issuingBranch;
    private LocalDate chequeDate;
    private BigDecimal amount;
    private String requestType;
    private String status;
    private String attachmentRef;
    private String remarks;
    private String submittedBy;
    private String processedBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public String getChequeRef() { return chequeRef; }
    public void setChequeRef(String chequeRef) { this.chequeRef = chequeRef; }
    public String getChequeNumber() { return chequeNumber; }
    public void setChequeNumber(String chequeNumber) { this.chequeNumber = chequeNumber; }
    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }
    public String getCustomerNumber() { return customerNumber; }
    public void setCustomerNumber(String customerNumber) { this.customerNumber = customerNumber; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }
    public String getDrawerAccountNumber() { return drawerAccountNumber; }
    public void setDrawerAccountNumber(String drawerAccountNumber) { this.drawerAccountNumber = drawerAccountNumber; }
    public String getIssuingBankName() { return issuingBankName; }
    public void setIssuingBankName(String issuingBankName) { this.issuingBankName = issuingBankName; }
    public String getIssuingBranch() { return issuingBranch; }
    public void setIssuingBranch(String issuingBranch) { this.issuingBranch = issuingBranch; }
    public LocalDate getChequeDate() { return chequeDate; }
    public void setChequeDate(LocalDate chequeDate) { this.chequeDate = chequeDate; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getRequestType() { return requestType; }
    public void setRequestType(String requestType) { this.requestType = requestType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAttachmentRef() { return attachmentRef; }
    public void setAttachmentRef(String attachmentRef) { this.attachmentRef = attachmentRef; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }
    public String getProcessedBy() { return processedBy; }
    public void setProcessedBy(String processedBy) { this.processedBy = processedBy; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
