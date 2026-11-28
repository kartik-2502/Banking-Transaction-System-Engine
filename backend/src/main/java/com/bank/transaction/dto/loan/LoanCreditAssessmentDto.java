package com.bank.transaction.dto.loan;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class LoanCreditAssessmentDto {
    private String assessmentId;
    private String loanId;
    private String customerNumber;
    private String customerName;
    private BigDecimal monthlyIncome;
    private BigDecimal existingDebt;
    private BigDecimal requestedAmount;
    private BigDecimal eligibleAmount;
    private BigDecimal proposedInterestRate;
    private Integer proposedTenureMonths;
    private BigDecimal estimatedEmi;
    private BigDecimal totalRepayment;
    private BigDecimal totalInterest;
    private BigDecimal remainingMonthlyIncome;
    private BigDecimal dtiRatio;
    private BigDecimal ltvRatio;
    private Integer creditScore;
    private String creditSource;
    private String employmentStability;
    private BigDecimal collateralValue;
    private String riskCategory;
    private String recommendation;
    private String officerRemarks;
    private String assessedBy;
    private OffsetDateTime assessedAt;
    private String disclaimer = "Indicative simulated/rule-based assessment subject to authorized Bank Manager / Credit Committee approval.";

    public static class AssessRequest {
        @NotNull @DecimalMin("1000.00") private BigDecimal monthlyIncome;
        @DecimalMin("0.00") private BigDecimal existingDebt = BigDecimal.ZERO;
        @NotNull @DecimalMin("1000.00") private BigDecimal requestedAmount;
        @NotNull @DecimalMin("1.00") @DecimalMax("40.00") private BigDecimal interestRate;
        @NotNull @Min(3) @Max(360) private Integer tenureMonths;
        @NotNull @Min(300) @Max(900) private Integer creditScore;
        private String creditSource = "SIMULATED_CIBIL";
        private String employmentStability = "STABLE";
        private BigDecimal collateralValue;
        private String officerRemarks;
        private boolean saveToApplication = true;

        public BigDecimal getMonthlyIncome() { return monthlyIncome; }
        public void setMonthlyIncome(BigDecimal monthlyIncome) { this.monthlyIncome = monthlyIncome; }
        public BigDecimal getExistingDebt() { return existingDebt; }
        public void setExistingDebt(BigDecimal existingDebt) { this.existingDebt = existingDebt; }
        public BigDecimal getRequestedAmount() { return requestedAmount; }
        public void setRequestedAmount(BigDecimal requestedAmount) { this.requestedAmount = requestedAmount; }
        public BigDecimal getInterestRate() { return interestRate; }
        public void setInterestRate(BigDecimal interestRate) { this.interestRate = interestRate; }
        public Integer getTenureMonths() { return tenureMonths; }
        public void setTenureMonths(Integer tenureMonths) { this.tenureMonths = tenureMonths; }
        public Integer getCreditScore() { return creditScore; }
        public void setCreditScore(Integer creditScore) { this.creditScore = creditScore; }
        public String getCreditSource() { return creditSource; }
        public void setCreditSource(String creditSource) { this.creditSource = creditSource; }
        public String getEmploymentStability() { return employmentStability; }
        public void setEmploymentStability(String employmentStability) { this.employmentStability = employmentStability; }
        public BigDecimal getCollateralValue() { return collateralValue; }
        public void setCollateralValue(BigDecimal collateralValue) { this.collateralValue = collateralValue; }
        public String getOfficerRemarks() { return officerRemarks; }
        public void setOfficerRemarks(String officerRemarks) { this.officerRemarks = officerRemarks; }
        public boolean isSaveToApplication() { return saveToApplication; }
        public void setSaveToApplication(boolean saveToApplication) { this.saveToApplication = saveToApplication; }
    }

    public String getAssessmentId() { return assessmentId; }
    public void setAssessmentId(String assessmentId) { this.assessmentId = assessmentId; }
    public String getLoanId() { return loanId; }
    public void setLoanId(String loanId) { this.loanId = loanId; }
    public String getCustomerNumber() { return customerNumber; }
    public void setCustomerNumber(String customerNumber) { this.customerNumber = customerNumber; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
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
    public void setAssessedAt(OffsetDateTime assessedAt) { this.assessedAt = assessedAt; }
    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; }
}
