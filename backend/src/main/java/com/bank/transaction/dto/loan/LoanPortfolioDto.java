package com.bank.transaction.dto.loan;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class LoanPortfolioDto {
    private long totalLoansManaged;
    private long totalApplications;
    private long totalApprovedLoans;
    private long totalRejectedLoans;
    private double approvalRatioPercent;
    private BigDecimal totalDisbursedAmount = BigDecimal.ZERO;
    private BigDecimal totalOutstandingPrincipal = BigDecimal.ZERO;
    private BigDecimal totalOutstandingInterest = BigDecimal.ZERO;
    private long performingLoanCount;
    private long overdueLoanCount;
    private double onTimeRepaymentRatePercent;
    private Map<String, Long> categoryCounts;
    private Map<String, BigDecimal> categoryAmounts;
    private List<MonthlyTrend> monthlyTrends;

    public static class MonthlyTrend {
        private String month;
        private long applicationCount;
        private BigDecimal disbursedAmount;
        private BigDecimal collectedAmount;

        public MonthlyTrend(String month, long applicationCount, BigDecimal disbursedAmount, BigDecimal collectedAmount) {
            this.month = month;
            this.applicationCount = applicationCount;
            this.disbursedAmount = disbursedAmount;
            this.collectedAmount = collectedAmount;
        }

        public String getMonth() { return month; }
        public long getApplicationCount() { return applicationCount; }
        public BigDecimal getDisbursedAmount() { return disbursedAmount; }
        public BigDecimal getCollectedAmount() { return collectedAmount; }
    }

    public long getTotalLoansManaged() { return totalLoansManaged; }
    public void setTotalLoansManaged(long totalLoansManaged) { this.totalLoansManaged = totalLoansManaged; }
    public long getTotalApplications() { return totalApplications; }
    public void setTotalApplications(long totalApplications) { this.totalApplications = totalApplications; }
    public long getTotalApprovedLoans() { return totalApprovedLoans; }
    public void setTotalApprovedLoans(long totalApprovedLoans) { this.totalApprovedLoans = totalApprovedLoans; }
    public long getTotalRejectedLoans() { return totalRejectedLoans; }
    public void setTotalRejectedLoans(long totalRejectedLoans) { this.totalRejectedLoans = totalRejectedLoans; }
    public double getApprovalRatioPercent() { return approvalRatioPercent; }
    public void setApprovalRatioPercent(double approvalRatioPercent) { this.approvalRatioPercent = approvalRatioPercent; }
    public BigDecimal getTotalDisbursedAmount() { return totalDisbursedAmount; }
    public void setTotalDisbursedAmount(BigDecimal totalDisbursedAmount) { this.totalDisbursedAmount = totalDisbursedAmount; }
    public BigDecimal getTotalOutstandingPrincipal() { return totalOutstandingPrincipal; }
    public void setTotalOutstandingPrincipal(BigDecimal totalOutstandingPrincipal) { this.totalOutstandingPrincipal = totalOutstandingPrincipal; }
    public BigDecimal getTotalOutstandingInterest() { return totalOutstandingInterest; }
    public void setTotalOutstandingInterest(BigDecimal totalOutstandingInterest) { this.totalOutstandingInterest = totalOutstandingInterest; }
    public long getPerformingLoanCount() { return performingLoanCount; }
    public void setPerformingLoanCount(long performingLoanCount) { this.performingLoanCount = performingLoanCount; }
    public long getOverdueLoanCount() { return overdueLoanCount; }
    public void setOverdueLoanCount(long overdueLoanCount) { this.overdueLoanCount = overdueLoanCount; }
    public double getOnTimeRepaymentRatePercent() { return onTimeRepaymentRatePercent; }
    public void setOnTimeRepaymentRatePercent(double onTimeRepaymentRatePercent) { this.onTimeRepaymentRatePercent = onTimeRepaymentRatePercent; }
    public Map<String, Long> getCategoryCounts() { return categoryCounts; }
    public void setCategoryCounts(Map<String, Long> categoryCounts) { this.categoryCounts = categoryCounts; }
    public Map<String, BigDecimal> getCategoryAmounts() { return categoryAmounts; }
    public void setCategoryAmounts(Map<String, BigDecimal> categoryAmounts) { this.categoryAmounts = categoryAmounts; }
    public List<MonthlyTrend> getMonthlyTrends() { return monthlyTrends; }
    public void setMonthlyTrends(List<MonthlyTrend> monthlyTrends) { this.monthlyTrends = monthlyTrends; }
}
