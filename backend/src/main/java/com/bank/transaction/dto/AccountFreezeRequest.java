package com.bank.transaction.dto;

import jakarta.validation.constraints.NotBlank;

public class AccountFreezeRequest {

    @NotBlank(message = "Reason for freeze or unfreeze is required")
    private String reason;

    public AccountFreezeRequest() {}

    public AccountFreezeRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
