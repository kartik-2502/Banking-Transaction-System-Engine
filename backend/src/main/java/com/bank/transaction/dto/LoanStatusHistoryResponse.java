package com.bank.transaction.dto;

import com.bank.transaction.model.LoanStatus;
import java.time.OffsetDateTime;

public class LoanStatusHistoryResponse {

    private Long id;
    private Long loanId;
    private LoanStatus previousStatus;
    private LoanStatus newStatus;
    private String changedBy;
    private String remarks;
    private OffsetDateTime createdAt;

    public LoanStatusHistoryResponse() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getLoanId() {
        return loanId;
    }

    public void setLoanId(Long loanId) {
        this.loanId = loanId;
    }

    public LoanStatus getPreviousStatus() {
        return previousStatus;
    }

    public void setPreviousStatus(LoanStatus previousStatus) {
        this.previousStatus = previousStatus;
    }

    public LoanStatus getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(LoanStatus newStatus) {
        this.newStatus = newStatus;
    }

    public String getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(String changedBy) {
        this.changedBy = changedBy;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
