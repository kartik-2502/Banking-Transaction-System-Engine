package com.bank.transaction.dto.analytics;

import java.math.BigDecimal;

public class LoanPortfolioAnalyticsResponse {

    private String status;
    private long loanCount;
    private BigDecimal totalPrincipal = BigDecimal.ZERO;
    private BigDecimal totalOutstanding = BigDecimal.ZERO;
    private BigDecimal avgInterestRate = BigDecimal.ZERO;
    private double avgTenureMonths = 0.0;
    private double avgDtiRatio = 0.0;

    public LoanPortfolioAnalyticsResponse() {}

    public LoanPortfolioAnalyticsResponse(String status, long loanCount, BigDecimal totalPrincipal,
                                          BigDecimal totalOutstanding, BigDecimal avgInterestRate,
                                          double avgTenureMonths, double avgDtiRatio) {
        this.status = status;
        this.loanCount = loanCount;
        this.totalPrincipal = totalPrincipal != null ? totalPrincipal : BigDecimal.ZERO;
        this.totalOutstanding = totalOutstanding != null ? totalOutstanding : BigDecimal.ZERO;
        this.avgInterestRate = avgInterestRate != null ? avgInterestRate : BigDecimal.ZERO;
        this.avgTenureMonths = avgTenureMonths;
        this.avgDtiRatio = avgDtiRatio;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public long getLoanCount() {
        return loanCount;
    }

    public void setLoanCount(long loanCount) {
        this.loanCount = loanCount;
    }

    public BigDecimal getTotalPrincipal() {
        return totalPrincipal;
    }

    public void setTotalPrincipal(BigDecimal totalPrincipal) {
        this.totalPrincipal = totalPrincipal;
    }

    public BigDecimal getTotalOutstanding() {
        return totalOutstanding;
    }

    public void setTotalOutstanding(BigDecimal totalOutstanding) {
        this.totalOutstanding = totalOutstanding;
    }

    public BigDecimal getAvgInterestRate() {
        return avgInterestRate;
    }

    public void setAvgInterestRate(BigDecimal avgInterestRate) {
        this.avgInterestRate = avgInterestRate;
    }

    public double getAvgTenureMonths() {
        return avgTenureMonths;
    }

    public void setAvgTenureMonths(double avgTenureMonths) {
        this.avgTenureMonths = avgTenureMonths;
    }

    public double getAvgDtiRatio() {
        return avgDtiRatio;
    }

    public void setAvgDtiRatio(double avgDtiRatio) {
        this.avgDtiRatio = avgDtiRatio;
    }
}
