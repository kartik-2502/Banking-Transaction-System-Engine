package com.bank.transaction.dto;

import com.bank.transaction.model.TransactionStatus;
import com.bank.transaction.model.TransactionType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class TransactionResponse {

    private Long id;
    private String transactionId;
    private TransactionType type;
    private String sourceAccountNumber;
    private String destinationAccountNumber;
    private BigDecimal amount;
    private TransactionStatus status;
    private String failureReason;
    private BigDecimal sourceNewBalance;
    private BigDecimal destinationNewBalance;
    private String initiatedBy;
    private OffsetDateTime createdAt;

    public TransactionResponse() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public TransactionType getType() {
        return type;
    }

    public void setType(TransactionType type) {
        this.type = type;
    }

    public String getSourceAccountNumber() {
        return sourceAccountNumber;
    }

    public void setSourceAccountNumber(String sourceAccountNumber) {
        this.sourceAccountNumber = sourceAccountNumber;
    }

    public String getDestinationAccountNumber() {
        return destinationAccountNumber;
    }

    public void setDestinationAccountNumber(String destinationAccountNumber) {
        this.destinationAccountNumber = destinationAccountNumber;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public TransactionStatus getStatus() {
        return status;
    }

    public void setStatus(TransactionStatus status) {
        this.status = status;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public BigDecimal getSourceNewBalance() {
        return sourceNewBalance;
    }

    public void setSourceNewBalance(BigDecimal sourceNewBalance) {
        this.sourceNewBalance = sourceNewBalance;
    }

    public BigDecimal getDestinationNewBalance() {
        return destinationNewBalance;
    }

    public void setDestinationNewBalance(BigDecimal destinationNewBalance) {
        this.destinationNewBalance = destinationNewBalance;
    }

    public String getInitiatedBy() {
        return initiatedBy;
    }

    public void setInitiatedBy(String initiatedBy) {
        this.initiatedBy = initiatedBy;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
