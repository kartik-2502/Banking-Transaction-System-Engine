package com.bank.transaction.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Objects;

@Entity
@Table(name = "loans")
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "loan_id", nullable = false, unique = true, length = 64)
    private String loanId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "interest_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal interestRate = BigDecimal.ZERO;

    @Column(name = "term_months", nullable = false)
    private Integer termMonths;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 35)
    private LoanStatus status = LoanStatus.PENDING;

    @Column(nullable = false, length = 255)
    private String purpose;

    @Column(name = "monthly_income", nullable = false, precision = 15, scale = 2)
    private BigDecimal monthlyIncome = BigDecimal.ZERO;

    @Column(name = "existing_monthly_debt", nullable = false, precision = 15, scale = 2)
    private BigDecimal existingMonthlyDebt = BigDecimal.ZERO;

    @Column(name = "credit_score", nullable = false)
    private Integer creditScore = 700;

    @Column(name = "dti_ratio", nullable = false, precision = 5, scale = 2)
    private BigDecimal dtiRatio = BigDecimal.ZERO;

    @Column(name = "emi_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal emiAmount = BigDecimal.ZERO;

    @Column(name = "total_payable", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalPayable = BigDecimal.ZERO;

    @Column(name = "outstanding_balance", nullable = false, precision = 15, scale = 2)
    private BigDecimal outstandingBalance = BigDecimal.ZERO;

    @Column(name = "assessment_notes", columnDefinition = "TEXT")
    private String assessmentNotes;

    @Column(name = "document_urls", columnDefinition = "TEXT")
    private String documentUrls;

    @Column(name = "requires_admin_approval", nullable = false)
    private boolean requiresAdminApproval = false;

    @Column(name = "reviewed_by", length = 50)
    private String reviewedBy;

    @Column(name = "final_approved_by", length = 50)
    private String finalApprovedBy;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "disbursed_at")
    private OffsetDateTime disbursedAt;

    @Column(name = "loan_category", nullable = false, length = 30)
    private String loanCategory = "PERSONAL";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @Column(name = "assigned_officer", length = 50)
    private String assignedOfficer;

    @Column(name = "employment_type", nullable = false, length = 40)
    private String employmentType = "SALARIED";

    @Column(name = "recommended_amount", precision = 15, scale = 2)
    private BigDecimal recommendedAmount;

    @Column(name = "recommended_interest_rate", precision = 5, scale = 2)
    private BigDecimal recommendedInterestRate;

    @Column(name = "recommended_term_months")
    private Integer recommendedTermMonths;

    @Column(name = "collateral_type", length = 60)
    private String collateralType;

    @Column(name = "collateral_value", precision = 15, scale = 2)
    private BigDecimal collateralValue;

    @Column(name = "ltv_ratio", precision = 5, scale = 2)
    private BigDecimal ltvRatio;

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public Loan() {}

    public Loan(String loanId, Customer customer, Account account, BigDecimal amount,
                BigDecimal interestRate, Integer termMonths, String purpose,
                BigDecimal monthlyIncome, BigDecimal existingMonthlyDebt, Integer creditScore) {
        this.loanId = loanId;
        this.customer = customer;
        this.account = account;
        this.amount = amount != null ? amount.setScale(2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO;
        this.interestRate = interestRate != null ? interestRate.setScale(2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO;
        this.termMonths = termMonths;
        this.purpose = purpose;
        this.monthlyIncome = monthlyIncome != null ? monthlyIncome.setScale(2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO;
        this.existingMonthlyDebt = existingMonthlyDebt != null ? existingMonthlyDebt.setScale(2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO;
        this.creditScore = creditScore != null ? creditScore : 700;
        this.status = LoanStatus.PENDING;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLoanId() {
        return loanId;
    }

    public void setLoanId(String loanId) {
        this.loanId = loanId;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public Account getAccount() {
        return account;
    }

    public void setAccount(Account account) {
        this.account = account;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getInterestRate() {
        return interestRate;
    }

    public void setInterestRate(BigDecimal interestRate) {
        this.interestRate = interestRate;
    }

    public Integer getTermMonths() {
        return termMonths;
    }

    public void setTermMonths(Integer termMonths) {
        this.termMonths = termMonths;
    }

    public LoanStatus getStatus() {
        return status;
    }

    public void setStatus(LoanStatus status) {
        this.status = status;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public BigDecimal getMonthlyIncome() {
        return monthlyIncome;
    }

    public void setMonthlyIncome(BigDecimal monthlyIncome) {
        this.monthlyIncome = monthlyIncome;
    }

    public BigDecimal getExistingMonthlyDebt() {
        return existingMonthlyDebt;
    }

    public void setExistingMonthlyDebt(BigDecimal existingMonthlyDebt) {
        this.existingMonthlyDebt = existingMonthlyDebt;
    }

    public Integer getCreditScore() {
        return creditScore;
    }

    public void setCreditScore(Integer creditScore) {
        this.creditScore = creditScore;
    }

    public BigDecimal getDtiRatio() {
        return dtiRatio;
    }

    public void setDtiRatio(BigDecimal dtiRatio) {
        this.dtiRatio = dtiRatio;
    }

    public BigDecimal getEmiAmount() {
        return emiAmount;
    }

    public void setEmiAmount(BigDecimal emiAmount) {
        this.emiAmount = emiAmount;
    }

    public BigDecimal getTotalPayable() {
        return totalPayable;
    }

    public void setTotalPayable(BigDecimal totalPayable) {
        this.totalPayable = totalPayable;
    }

    public BigDecimal getOutstandingBalance() {
        return outstandingBalance;
    }

    public void setOutstandingBalance(BigDecimal outstandingBalance) {
        this.outstandingBalance = outstandingBalance;
    }

    public String getAssessmentNotes() {
        return assessmentNotes;
    }

    public void setAssessmentNotes(String assessmentNotes) {
        this.assessmentNotes = assessmentNotes;
    }

    public String getDocumentUrls() {
        return documentUrls;
    }

    public void setDocumentUrls(String documentUrls) {
        this.documentUrls = documentUrls;
    }

    public boolean isRequiresAdminApproval() {
        return requiresAdminApproval;
    }

    public void setRequiresAdminApproval(boolean requiresAdminApproval) {
        this.requiresAdminApproval = requiresAdminApproval;
    }

    public String getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(String reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public String getFinalApprovedBy() {
        return finalApprovedBy;
    }

    public void setFinalApprovedBy(String finalApprovedBy) {
        this.finalApprovedBy = finalApprovedBy;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public OffsetDateTime getDisbursedAt() {
        return disbursedAt;
    }

    public void setDisbursedAt(OffsetDateTime disbursedAt) {
        this.disbursedAt = disbursedAt;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public String getLoanCategory() { return loanCategory; }
    public void setLoanCategory(String loanCategory) { this.loanCategory = loanCategory; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
    public String getAssignedOfficer() { return assignedOfficer; }
    public void setAssignedOfficer(String assignedOfficer) { this.assignedOfficer = assignedOfficer; }
    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }
    public BigDecimal getRecommendedAmount() { return recommendedAmount; }
    public void setRecommendedAmount(BigDecimal recommendedAmount) { this.recommendedAmount = recommendedAmount; }
    public BigDecimal getRecommendedInterestRate() { return recommendedInterestRate; }
    public void setRecommendedInterestRate(BigDecimal recommendedInterestRate) { this.recommendedInterestRate = recommendedInterestRate; }
    public Integer getRecommendedTermMonths() { return recommendedTermMonths; }
    public void setRecommendedTermMonths(Integer recommendedTermMonths) { this.recommendedTermMonths = recommendedTermMonths; }
    public String getCollateralType() { return collateralType; }
    public void setCollateralType(String collateralType) { this.collateralType = collateralType; }
    public BigDecimal getCollateralValue() { return collateralValue; }
    public void setCollateralValue(BigDecimal collateralValue) { this.collateralValue = collateralValue; }
    public BigDecimal getLtvRatio() { return ltvRatio; }
    public void setLtvRatio(BigDecimal ltvRatio) { this.ltvRatio = ltvRatio; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Loan loan = (Loan) o;
        return Objects.equals(id, loan.id) && Objects.equals(loanId, loan.loanId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, loanId);
    }
}
