package com.bank.transaction.dto;

import com.bank.transaction.model.FraudAlertStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class FraudAlertReviewRequest {

    @NotNull(message = "Review status is required")
    private FraudAlertStatus status;

    @NotBlank(message = "Reviewer notes are required")
    private String reviewerNotes;

    public FraudAlertReviewRequest() {}

    public FraudAlertReviewRequest(FraudAlertStatus status, String reviewerNotes) {
        this.status = status;
        this.reviewerNotes = reviewerNotes;
    }

    public FraudAlertStatus getStatus() {
        return status;
    }

    public void setStatus(FraudAlertStatus status) {
        this.status = status;
    }

    public String getReviewerNotes() {
        return reviewerNotes;
    }

    public void setReviewerNotes(String reviewerNotes) {
        this.reviewerNotes = reviewerNotes;
    }
}
