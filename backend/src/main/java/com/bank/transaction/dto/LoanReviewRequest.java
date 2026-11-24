package com.bank.transaction.dto;

import java.math.BigDecimal;

public class LoanReviewRequest {

    private boolean approved;
    private String rejectionReason;
    private BigDecimal interestRate;

    public LoanReviewRequest() {}

    public LoanReviewRequest(boolean approved, String rejectionReason, BigDecimal interestRate) {
        this.approved = approved;
        this.rejectionReason = rejectionReason;
        this.interestRate = interestRate;
    }

    public boolean isApproved() {
        return approved;
    }

    public void setApproved(boolean approved) {
        this.approved = approved;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public BigDecimal getInterestRate() {
        return interestRate;
    }

    public void setInterestRate(BigDecimal interestRate) {
        this.interestRate = interestRate;
    }
}
