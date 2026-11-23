package com.bank.transaction.dto;

import com.bank.transaction.model.AccountStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class AccountStatusUpdateRequest {

    @NotNull(message = "New status is mandatory")
    private AccountStatus status;

    @NotBlank(message = "Reason for status change is mandatory")
    @Size(max = 500, message = "Reason cannot exceed 500 characters")
    private String reason;

    private String changedBy = "SYSTEM";

    public AccountStatusUpdateRequest() {}

    public AccountStatusUpdateRequest(AccountStatus status, String reason, String changedBy) {
        this.status = status;
        this.reason = reason;
        this.changedBy = changedBy;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public void setStatus(AccountStatus status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(String changedBy) {
        this.changedBy = changedBy;
    }
}
