package com.bank.transaction.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "loan_approval_requests")
public class LoanApprovalRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "approval_id", nullable = false, unique = true, length = 64)
    private String approvalId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "loan_id", nullable = false)
    private Loan loan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @Column(name = "recommended_action", nullable = false, length = 20)
    private String recommendedAction;

    @Column(name = "recommended_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal recommendedAmount;

    @Column(name = "recommended_interest_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal recommendedInterestRate;

    @Column(name = "recommended_term_months", nullable = false)
    private Integer recommendedTermMonths;

    @Column(name = "officer_remarks", columnDefinition = "TEXT")
    private String officerRemarks;

    @Column(name = "submitted_by", nullable = false, length = 50)
    private String submittedBy;

    @Column(nullable = false, length = 30)
    private String status = "PENDING";

    @Column(name = "decision_by", length = 50)
    private String decisionBy;

    @Column(name = "decision_remarks", columnDefinition = "TEXT")
    private String decisionRemarks;

    @Column(name = "decided_at")
    private OffsetDateTime decidedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public Long getId() { return id; }
    public String getApprovalId() { return approvalId; }
    public void setApprovalId(String approvalId) { this.approvalId = approvalId; }
    public Loan getLoan() { return loan; }
    public void setLoan(Loan loan) { this.loan = loan; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
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
}
