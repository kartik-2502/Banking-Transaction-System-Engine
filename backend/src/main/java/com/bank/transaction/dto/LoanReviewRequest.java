package com.bank.transaction.dto;

import com.bank.transaction.model.LoanStatus;
import java.math.BigDecimal;

public class LoanReviewRequest {

    private LoanStatus status;
    private Boolean approved;
    private String assessmentNotes;
    private String rejectionReason;
    private BigDecimal interestRate;

    public LoanReviewRequest() {}

    public LoanReviewRequest(LoanStatus status, String assessmentNotes, String rejectionReason, BigDecimal interestRate) {
        this.status = status;
        this.assessmentNotes = assessmentNotes;
        this.rejectionReason = rejectionReason;
        this.interestRate = interestRate;
        if (status == LoanStatus.APPROVED) {
            this.approved = true;
        } else if (status == LoanStatus.REJECTED) {
            this.approved = false;
        }
    }

    public LoanStatus getStatus() {
        return status;
    }

    public void setStatus(LoanStatus status) {
        this.status = status;
    }

    public Boolean getApproved() {
        return approved;
    }

    public void setApproved(Boolean approved) {
        this.approved = approved;
    }

    public String getAssessmentNotes() {
        return assessmentNotes;
    }

    public void setAssessmentNotes(String assessmentNotes) {
        this.assessmentNotes = assessmentNotes;
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
