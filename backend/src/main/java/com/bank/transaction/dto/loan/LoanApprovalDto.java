package com.bank.transaction.dto.loan;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class LoanApprovalDto {
    private String approvalId;
    private String loanId;
    private String customerNumber;
    private String customerName;
    private String branchCode;
    private String loanCategory;
    private String recommendedAction;
    private BigDecimal recommendedAmount;
    private BigDecimal recommendedInterestRate;
    private Integer recommendedTermMonths;
    private String officerRemarks;
    private String submittedBy;
    private String status;
    private String decisionBy;
    private String decisionRemarks;
    private OffsetDateTime decidedAt;
    private OffsetDateTime createdAt;

    public static class RecommendRequest {
        @NotBlank private String recommendedAction; // APPROVE or REJECT
        @NotNull @DecimalMin("1000.00") private BigDecimal recommendedAmount;
        @NotNull @DecimalMin("1.00") @DecimalMax("40.00") private BigDecimal recommendedInterestRate;
        @NotNull @Min(3) @Max(360) private Integer recommendedTermMonths;
        @NotBlank private String officerRemarks;

        public String getRecommendedAction() { return recommendedAction; }
        public void setRecommendedAction(String recommendedAction) { this.recommendedAction = recommendedAction; }
        public BigDecimal getRecommendedAmount() { return recommendedAmount; }
        public void setRecommendedAmount(BigDecimal recommendedAmount) { this.recommendedAmount = recommendedAmount; }
        public BigDecimal getRecommendedInterestRate() { return recommendedInterestRate; }
        public void setRecommendedInterestRate(BigDecimal recommendedInterestRate) { this.recommendedInterestRate = recommendedInterestRate; }
        public Integer getRecommendedTermMonths() { return recommendedTermMonths; }
        public void setRecommendedTermMonths(Integer recommendedTermMonths) { this.recommendedTermMonths = recommendedTermMonths; }
        public String getOfficerRemarks() { return officerRemarks; }
        public void setOfficerRemarks(String officerRemarks) { this.officerRemarks = officerRemarks; }
    }

    public static class DecisionRequest {
        @NotBlank private String decision; // APPROVED, REJECTED, RETURNED_FOR_REVIEW, ESCALATED
        @NotBlank private String decisionRemarks;

        public String getDecision() { return decision; }
        public void setDecision(String decision) { this.decision = decision; }
        public String getDecisionRemarks() { return decisionRemarks; }
        public void setDecisionRemarks(String decisionRemarks) { this.decisionRemarks = decisionRemarks; }
    }

    public String getApprovalId() { return approvalId; }
    public void setApprovalId(String approvalId) { this.approvalId = approvalId; }
    public String getLoanId() { return loanId; }
    public void setLoanId(String loanId) { this.loanId = loanId; }
    public String getCustomerNumber() { return customerNumber; }
    public void setCustomerNumber(String customerNumber) { this.customerNumber = customerNumber; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }
    public String getLoanCategory() { return loanCategory; }
    public void setLoanCategory(String loanCategory) { this.loanCategory = loanCategory; }
    public String getRecommendedAction() { return recommendedAction; }
    public void setRecommendedAction(String recommendedAction) { this.recommendedAction = recommendedAction; }
    public BigDecimal getRecommendedAmount() { return recommendedAmount; }
    public void setRecommendedAmount(BigDecimal recommendedAmount) { this.recommendedAmount = recommendedAmount; }
    public BigDecimal getRecommendedInterestRate() { return recommendedInterestRate; }
    public void setRecommendedInterestRate(BigDecimal recommendedInterestRate) { this.recommendedInterestRate = recommendedInterestRate; }
    public Integer getRecommendedTermMonths() { return recommendedTermMonths; }
    public void setRecommendedTermMonths(Integer recommendedTermMonths) { this.recommendedTermMonths = recommendedTermMonths; }
    public String getOfficerRemarks() { return officerRemarks; }
    public void setOfficerRemarks(String officerRemarks) { this.officerRemarks = officerRemarks; }
    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDecisionBy() { return decisionBy; }
    public void setDecisionBy(String decisionBy) { this.decisionBy = decisionBy; }
    public String getDecisionRemarks() { return decisionRemarks; }
    public void setDecisionRemarks(String decisionRemarks) { this.decisionRemarks = decisionRemarks; }
    public OffsetDateTime getDecidedAt() { return decidedAt; }
    public void setDecidedAt(OffsetDateTime decidedAt) { this.decidedAt = decidedAt; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
