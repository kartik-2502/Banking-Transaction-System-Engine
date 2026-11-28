package com.bank.transaction.dto.teller;

import jakarta.validation.constraints.NotBlank;

public class ServiceRequestCreateDto {
    @NotBlank(message = "Customer number is required")
    private String customerNumber;

    private String accountNumber;

    @NotBlank(message = "Request type is required")
    private String requestType;

    @NotBlank(message = "Description is required")
    private String description;

    private String payloadJson;

    public String getCustomerNumber() { return customerNumber; }
    public void setCustomerNumber(String customerNumber) { this.customerNumber = customerNumber; }
    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }
    public String getRequestType() { return requestType; }
    public void setRequestType(String requestType) { this.requestType = requestType; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getPayloadJson() { return payloadJson; }
    public void setPayloadJson(String payloadJson) { this.payloadJson = payloadJson; }
}
