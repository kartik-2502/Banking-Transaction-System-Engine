package com.bank.transaction.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "loan_follow_ups")
public class LoanFollowUp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "followup_id", nullable = false, unique = true, length = 64)
    private String followupId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "loan_id", nullable = false)
    private Loan loan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @Column(name = "followup_type", nullable = false, length = 40)
    private String followupType = "CALL_REMINDER";

    @Column(name = "dpd_at_followup", nullable = false)
    private Integer dpdAtFollowup = 0;

    @Column(name = "overdue_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal overdueAmount = BigDecimal.ZERO;

    @Column(name = "commitment_amount", precision = 15, scale = 2)
    private BigDecimal commitmentAmount;

    @Column(name = "commitment_date")
    private LocalDate commitmentDate;

    @Column(nullable = false, length = 120)
    private String outcome;

    @Column(name = "recovery_status", nullable = false, length = 35)
    private String recoveryStatus = "OPEN";

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private boolean escalated = false;

    @Column(name = "created_by", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public Long getId() { return id; }
    public String getFollowupId() { return followupId; }
    public void setFollowupId(String followupId) { this.followupId = followupId; }
    public Loan getLoan() { return loan; }
    public void setLoan(Loan loan) { this.loan = loan; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
    public String getFollowupType() { return followupType; }
    public void setFollowupType(String followupType) { this.followupType = followupType; }
    public Integer getDpdAtFollowup() { return dpdAtFollowup; }
    public void setDpdAtFollowup(Integer dpdAtFollowup) { this.dpdAtFollowup = dpdAtFollowup; }
    public BigDecimal getOverdueAmount() { return overdueAmount; }
    public void setOverdueAmount(BigDecimal overdueAmount) { this.overdueAmount = overdueAmount; }
    public BigDecimal getCommitmentAmount() { return commitmentAmount; }
    public void setCommitmentAmount(BigDecimal commitmentAmount) { this.commitmentAmount = commitmentAmount; }
    public LocalDate getCommitmentDate() { return commitmentDate; }
    public void setCommitmentDate(LocalDate commitmentDate) { this.commitmentDate = commitmentDate; }
    public String getOutcome() { return outcome; }
    public void setOutcome(String outcome) { this.outcome = outcome; }
    public String getRecoveryStatus() { return recoveryStatus; }
    public void setRecoveryStatus(String recoveryStatus) { this.recoveryStatus = recoveryStatus; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public boolean isEscalated() { return escalated; }
    public void setEscalated(boolean escalated) { this.escalated = escalated; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
