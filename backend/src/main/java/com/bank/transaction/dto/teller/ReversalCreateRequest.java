package com.bank.transaction.dto.teller;

import jakarta.validation.constraints.NotBlank;

public class ReversalCreateRequest {
    @NotBlank(message = "Reversal reason is mandatory")
    private String reason;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
