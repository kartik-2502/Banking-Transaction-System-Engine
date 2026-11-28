package com.bank.transaction.dto.loan;

import jakarta.validation.constraints.NotBlank;
import java.time.OffsetDateTime;

public class LoanCommunicationDto {
    private String communicationId;
    private String loanId;
    private String customerNumber;
    private String customerName;
    private String channel;
    private String communicationType;
    private String subject;
    private String message;
    private String recipient;
    private String deliveryStatus;
    private String sentBy;
    private OffsetDateTime createdAt;

    public static class SendRequest {
        private String loanId;
        @NotBlank private String customerNumber;
        private String channel = "IN_APP_NOTIFICATION";
        @NotBlank private String communicationType;
        @NotBlank private String subject;
        @NotBlank private String message;

        public String getLoanId() { return loanId; }
        public void setLoanId(String loanId) { this.loanId = loanId; }
        public String getCustomerNumber() { return customerNumber; }
        public void setCustomerNumber(String customerNumber) { this.customerNumber = customerNumber; }
        public String getChannel() { return channel; }
        public void setChannel(String channel) { this.channel = channel; }
        public String getCommunicationType() { return communicationType; }
        public void setCommunicationType(String communicationType) { this.communicationType = communicationType; }
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public String getCommunicationId() { return communicationId; }
    public void setCommunicationId(String communicationId) { this.communicationId = communicationId; }
    public String getLoanId() { return loanId; }
    public void setLoanId(String loanId) { this.loanId = loanId; }
    public String getCustomerNumber() { return customerNumber; }
    public void setCustomerNumber(String customerNumber) { this.customerNumber = customerNumber; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
    public String getCommunicationType() { return communicationType; }
    public void setCommunicationType(String communicationType) { this.communicationType = communicationType; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }
    public String getDeliveryStatus() { return deliveryStatus; }
    public void setDeliveryStatus(String deliveryStatus) { this.deliveryStatus = deliveryStatus; }
    public String getSentBy() { return sentBy; }
    public void setSentBy(String sentBy) { this.sentBy = sentBy; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
