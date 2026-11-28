package com.bank.transaction.dto.teller;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class TellerCashOperationRequest {
    private String transactionId;

    @NotBlank(message = "Account number is mandatory")
    private String accountNumber;

    @NotNull(message = "Amount is mandatory")
    @DecimalMin(value = "0.01", message = "Amount must be positive")
    private BigDecimal amount;

    private String depositType = "CASH";
    private String depositorName;
    private String depositorIdRef;
    private boolean customerVerified;
    private String remarks;

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getDepositType() { return depositType; }
    public void setDepositType(String depositType) { this.depositType = depositType; }
    public String getDepositorName() { return depositorName; }
    public void setDepositorName(String depositorName) { this.depositorName = depositorName; }
    public String getDepositorIdRef() { return depositorIdRef; }
    public void setDepositorIdRef(String depositorIdRef) { this.depositorIdRef = depositorIdRef; }
    public boolean isCustomerVerified() { return customerVerified; }
    public void setCustomerVerified(boolean customerVerified) { this.customerVerified = customerVerified; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
