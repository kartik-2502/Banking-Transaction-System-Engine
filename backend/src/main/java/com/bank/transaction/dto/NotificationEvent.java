package com.bank.transaction.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class NotificationEvent {

    private String eventType;
    private String transactionId;
    private String accountNumber;
    private Long userId;
    private String username;
    private BigDecimal amount;
    private String title;
    private String message;
    private String severity; // INFO, SUCCESS, WARNING, CRITICAL
    private OffsetDateTime timestamp = OffsetDateTime.now();

    public NotificationEvent() {}

    public NotificationEvent(String eventType, String transactionId, String accountNumber,
                             Long userId, String username, BigDecimal amount,
                             String title, String message, String severity) {
        this.eventType = eventType;
        this.transactionId = transactionId;
        this.accountNumber = accountNumber;
        this.userId = userId;
        this.username = username;
        this.amount = amount;
        this.title = title;
        this.message = message;
        this.severity = severity != null ? severity : "INFO";
        this.timestamp = OffsetDateTime.now();
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public OffsetDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(OffsetDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
