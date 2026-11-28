package com.bank.transaction.dto.teller;

import jakarta.validation.constraints.NotBlank;

public class ChequeStatusUpdateRequest {
    @NotBlank(message = "Target status is required")
    private String status;
    private String remarks;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
