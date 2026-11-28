package com.bank.transaction.dto.teller;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class ChequeRequest {
    @NotBlank(message = "Cheque number is required")
    private String chequeNumber;

    @NotBlank(message = "Customer account number is required")
    private String accountNumber;

    private String drawerAccountNumber;

    @NotBlank(message = "Issuing bank name is required")
    private String issuingBankName;

    private String issuingBranch;

    @NotNull(message = "Cheque date is required")
    private LocalDate chequeDate = LocalDate.now();

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.00", message = "Amount cannot be negative")
    private BigDecimal amount;

    private String requestType = "DEPOSIT"; // DEPOSIT, STOP_PAYMENT, CHEQUE_BOOK
    private String attachmentRef;
    private String remarks;

    public String getChequeNumber() { return chequeNumber; }
    public void setChequeNumber(String chequeNumber) { this.chequeNumber = chequeNumber; }
    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }
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
    public String getAttachmentRef() { return attachmentRef; }
    public void setAttachmentRef(String attachmentRef) { this.attachmentRef = attachmentRef; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
