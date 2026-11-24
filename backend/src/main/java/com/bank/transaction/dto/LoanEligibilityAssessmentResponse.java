package com.bank.transaction.dto;

import java.math.BigDecimal;

public class LoanEligibilityAssessmentResponse {

    private boolean eligible;
    private Integer creditScore;
    private BigDecimal monthlyIncome;
    private BigDecimal existingMonthlyDebt;
    private BigDecimal proposedEmi;
    private BigDecimal maxAllowableEmi;
    private BigDecimal dtiRatio;
    private String riskGrade; // PRIME, NEAR_PRIME, SUBPRIME
    private String recommendation;

    public LoanEligibilityAssessmentResponse() {}

    public LoanEligibilityAssessmentResponse(boolean eligible, Integer creditScore, BigDecimal monthlyIncome,
                                            BigDecimal existingMonthlyDebt, BigDecimal proposedEmi,
                                            BigDecimal maxAllowableEmi, BigDecimal dtiRatio,
                                            String riskGrade, String recommendation) {
        this.eligible = eligible;
        this.creditScore = creditScore;
        this.monthlyIncome = monthlyIncome;
        this.existingMonthlyDebt = existingMonthlyDebt;
        this.proposedEmi = proposedEmi;
        this.maxAllowableEmi = maxAllowableEmi;
        this.dtiRatio = dtiRatio;
        this.riskGrade = riskGrade;
        this.recommendation = recommendation;
    }

    public boolean isEligible() {
        return eligible;
    }

    public void setEligible(boolean eligible) {
        this.eligible = eligible;
    }

    public Integer getCreditScore() {
        return creditScore;
    }

    public void setCreditScore(Integer creditScore) {
        this.creditScore = creditScore;
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

    public BigDecimal getProposedEmi() {
        return proposedEmi;
    }

    public void setProposedEmi(BigDecimal proposedEmi) {
        this.proposedEmi = proposedEmi;
    }

    public BigDecimal getMaxAllowableEmi() {
        return maxAllowableEmi;
    }

    public void setMaxAllowableEmi(BigDecimal maxAllowableEmi) {
        this.maxAllowableEmi = maxAllowableEmi;
    }

    public BigDecimal getDtiRatio() {
        return dtiRatio;
    }

    public void setDtiRatio(BigDecimal dtiRatio) {
        this.dtiRatio = dtiRatio;
    }

    public String getRiskGrade() {
        return riskGrade;
    }

    public void setRiskGrade(String riskGrade) {
        this.riskGrade = riskGrade;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }
}
