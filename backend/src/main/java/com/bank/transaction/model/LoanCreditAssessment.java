package com.bank.transaction.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "loan_credit_assessments")
public class LoanCreditAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "assessment_id", nullable = false, unique = true, length = 64)
    private String assessmentId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "loan_id", nullable = false)
    private Loan loan;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "monthly_income", nullable = false, precision = 15, scale = 2)
    private BigDecimal monthlyIncome;

    @Column(name = "existing_debt", nullable = false, precision = 15, scale = 2)
    private BigDecimal existingDebt = BigDecimal.ZERO;

    @Column(name = "requested_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal requestedAmount;

    @Column(name = "eligible_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal eligibleAmount;

    @Column(name = "proposed_interest_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal proposedInterestRate;

    @Column(name = "proposed_tenure_months", nullable = false)
    private Integer proposedTenureMonths;

    @Column(name = "estimated_emi", nullable = false, precision = 15, scale = 2)
    private BigDecimal estimatedEmi;

    @Column(name = "total_repayment", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalRepayment;

    @Column(name = "total_interest", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalInterest;

    @Column(name = "remaining_monthly_income", nullable = false, precision = 15, scale = 2)
    private BigDecimal remainingMonthlyIncome;

    @Column(name = "dti_ratio", nullable = false, precision = 5, scale = 2)
    private BigDecimal dtiRatio;

    @Column(name = "ltv_ratio", precision = 5, scale = 2)
    private BigDecimal ltvRatio;

    @Column(name = "credit_score", nullable = false)
    private Integer creditScore;

    @Column(name = "credit_source", nullable = false, length = 60)
    private String creditSource = "SIMULATED_CIBIL";

    @Column(name = "employment_stability", nullable = false, length = 40)
    private String employmentStability = "STABLE";

    @Column(name = "collateral_value", precision = 15, scale = 2)
    private BigDecimal collateralValue;

    @Column(name = "risk_category", nullable = false, length = 20)
    private String riskCategory;

    @Column(nullable = false, length = 35)
    private String recommendation;

    @Column(name = "officer_remarks", columnDefinition = "TEXT")
    private String officerRemarks;

    @Column(name = "assessed_by", nullable = false, length = 50)
    private String assessedBy;

    @Column(name = "assessed_at", nullable = false, updatable = false)
    private OffsetDateTime assessedAt = OffsetDateTime.now();

    public Long getId() { return id; }
    public String getAssessmentId() { return assessmentId; }
    public void setAssessmentId(String assessmentId) { this.assessmentId = assessmentId; }
    public Loan getLoan() { return loan; }
    public void setLoan(Loan loan) { this.loan = loan; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public BigDecimal getMonthlyIncome() { return monthlyIncome; }
    public void setMonthlyIncome(BigDecimal monthlyIncome) { this.monthlyIncome = monthlyIncome; }
    public BigDecimal getExistingDebt() { return existingDebt; }
    public void setExistingDebt(BigDecimal existingDebt) { this.existingDebt = existingDebt; }
    public BigDecimal getRequestedAmount() { return requestedAmount; }
    public void setRequestedAmount(BigDecimal requestedAmount) { this.requestedAmount = requestedAmount; }
    public BigDecimal getEligibleAmount() { return eligibleAmount; }
    public void setEligibleAmount(BigDecimal eligibleAmount) { this.eligibleAmount = eligibleAmount; }
    public BigDecimal getProposedInterestRate() { return proposedInterestRate; }
    public void setProposedInterestRate(BigDecimal proposedInterestRate) { this.proposedInterestRate = proposedInterestRate; }
    public Integer getProposedTenureMonths() { return proposedTenureMonths; }
    public void setProposedTenureMonths(Integer proposedTenureMonths) { this.proposedTenureMonths = proposedTenureMonths; }
    public BigDecimal getEstimatedEmi() { return estimatedEmi; }
    public void setEstimatedEmi(BigDecimal estimatedEmi) { this.estimatedEmi = estimatedEmi; }
    public BigDecimal getTotalRepayment() { return totalRepayment; }
    public void setTotalRepayment(BigDecimal totalRepayment) { this.totalRepayment = totalRepayment; }
    public BigDecimal getTotalInterest() { return totalInterest; }
    public void setTotalInterest(BigDecimal totalInterest) { this.totalInterest = totalInterest; }
    public BigDecimal getRemainingMonthlyIncome() { return remainingMonthlyIncome; }
    public void setRemainingMonthlyIncome(BigDecimal remainingMonthlyIncome) { this.remainingMonthlyIncome = remainingMonthlyIncome; }
    public BigDecimal getDtiRatio() { return dtiRatio; }
    public void setDtiRatio(BigDecimal dtiRatio) { this.dtiRatio = dtiRatio; }
    public BigDecimal getLtvRatio() { return ltvRatio; }
    public void setLtvRatio(BigDecimal ltvRatio) { this.ltvRatio = ltvRatio; }
    public Integer getCreditScore() { return creditScore; }
    public void setCreditScore(Integer creditScore) { this.creditScore = creditScore; }
    public String getCreditSource() { return creditSource; }
    public void setCreditSource(String creditSource) { this.creditSource = creditSource; }
    public String getEmploymentStability() { return employmentStability; }
    public void setEmploymentStability(String employmentStability) { this.employmentStability = employmentStability; }
    public BigDecimal getCollateralValue() { return collateralValue; }
    public void setCollateralValue(BigDecimal collateralValue) { this.collateralValue = collateralValue; }
    public String getRiskCategory() { return riskCategory; }
    public void setRiskCategory(String riskCategory) { this.riskCategory = riskCategory; }
    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
    public String getOfficerRemarks() { return officerRemarks; }
    public void setOfficerRemarks(String officerRemarks) { this.officerRemarks = officerRemarks; }
    public String getAssessedBy() { return assessedBy; }
    public void setAssessedBy(String assessedBy) { this.assessedBy = assessedBy; }
    public OffsetDateTime getAssessedAt() { return assessedAt; }
}
