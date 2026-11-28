package com.bank.transaction.dto.teller;

import jakarta.validation.constraints.NotNull;

public class ApprovalDecisionRequest {
    @NotNull(message = "Approval flag is required")
    private Boolean approved;
    private String remarks;

    public Boolean getApproved() { return approved; }
    public void setApproved(Boolean approved) { this.approved = approved; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
