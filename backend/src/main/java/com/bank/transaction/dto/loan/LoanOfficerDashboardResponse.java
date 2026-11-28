package com.bank.transaction.dto.loan;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public class LoanOfficerDashboardResponse {
    private long totalApplications;
    private long newApplications;
    private long underReviewCount;
    private long pendingDocumentVerification;
    private long pendingCreditAssessment;
    private long approvedLoans;
    private long rejectedApplications;
    private long awaitingDisbursement;
    private long overdueLoans;

    // A. Application Statistics
    private long receivedThisMonth;
    private long processedCount;
    private long pendingCount;
    private double avgProcessingDays;

    // C. Pending Tasks breakdown
    private long pendingDocVerificationsCount;
    private long pendingAssessmentsCount;
    private long pendingReviewsCount;
    private long additionalDocsRequestedCount;
    private long pendingApprovalRecommendationsCount;

    // E. Portfolio overview
    private BigDecimal totalDisbursedAmount = BigDecimal.ZERO;
    private BigDecimal totalOutstandingAmount = BigDecimal.ZERO;
    private long performingLoansCount;
    private Map<String, Long> categoryDistribution;

    // B. Recent Applications
    private List<LoanApplicationSummaryDto> recentApplications;
    // D. Upcoming EMI Payments
    private List<UpcomingEmiDto> upcomingEmis;
    private LoanOfficerProfileDto officerProfile;

    public static class UpcomingEmiDto {
        private Long installmentId;
        private String loanId;
        private String customerName;
        private Integer installmentNumber;
        private BigDecimal emiAmount;
        private LocalDate dueDate;
        private String repaymentStatus;

        public Long getInstallmentId() { return installmentId; }
        public void setInstallmentId(Long installmentId) { this.installmentId = installmentId; }
        public String getLoanId() { return loanId; }
        public void setLoanId(String loanId) { this.loanId = loanId; }
        public String getCustomerName() { return customerName; }
        public void setCustomerName(String customerName) { this.customerName = customerName; }
        public Integer getInstallmentNumber() { return installmentNumber; }
        public void setInstallmentNumber(Integer installmentNumber) { this.installmentNumber = installmentNumber; }
        public BigDecimal getEmiAmount() { return emiAmount; }
        public void setEmiAmount(BigDecimal emiAmount) { this.emiAmount = emiAmount; }
        public LocalDate getDueDate() { return dueDate; }
        public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
        public String getRepaymentStatus() { return repaymentStatus; }
        public void setRepaymentStatus(String repaymentStatus) { this.repaymentStatus = repaymentStatus; }
    }

    public long getTotalApplications() { return totalApplications; }
    public void setTotalApplications(long totalApplications) { this.totalApplications = totalApplications; }
    public long getNewApplications() { return newApplications; }
    public void setNewApplications(long newApplications) { this.newApplications = newApplications; }
    public long getUnderReviewCount() { return underReviewCount; }
    public void setUnderReviewCount(long underReviewCount) { this.underReviewCount = underReviewCount; }
    public long getPendingDocumentVerification() { return pendingDocumentVerification; }
    public void setPendingDocumentVerification(long pendingDocumentVerification) { this.pendingDocumentVerification = pendingDocumentVerification; }
    public long getPendingCreditAssessment() { return pendingCreditAssessment; }
    public void setPendingCreditAssessment(long pendingCreditAssessment) { this.pendingCreditAssessment = pendingCreditAssessment; }
    public long getApprovedLoans() { return approvedLoans; }
    public void setApprovedLoans(long approvedLoans) { this.approvedLoans = approvedLoans; }
    public long getRejectedApplications() { return rejectedApplications; }
    public void setRejectedApplications(long rejectedApplications) { this.rejectedApplications = rejectedApplications; }
    public long getAwaitingDisbursement() { return awaitingDisbursement; }
    public void setAwaitingDisbursement(long awaitingDisbursement) { this.awaitingDisbursement = awaitingDisbursement; }
    public long getOverdueLoans() { return overdueLoans; }
    public void setOverdueLoans(long overdueLoans) { this.overdueLoans = overdueLoans; }
    public long getReceivedThisMonth() { return receivedThisMonth; }
    public void setReceivedThisMonth(long receivedThisMonth) { this.receivedThisMonth = receivedThisMonth; }
    public long getProcessedCount() { return processedCount; }
    public void setProcessedCount(long processedCount) { this.processedCount = processedCount; }
    public long getPendingCount() { return pendingCount; }
    public void setPendingCount(long pendingCount) { this.pendingCount = pendingCount; }
    public double getAvgProcessingDays() { return avgProcessingDays; }
    public void setAvgProcessingDays(double avgProcessingDays) { this.avgProcessingDays = avgProcessingDays; }
    public long getPendingDocVerificationsCount() { return pendingDocVerificationsCount; }
    public void setPendingDocVerificationsCount(long pendingDocVerificationsCount) { this.pendingDocVerificationsCount = pendingDocVerificationsCount; }
    public long getPendingAssessmentsCount() { return pendingAssessmentsCount; }
    public void setPendingAssessmentsCount(long pendingAssessmentsCount) { this.pendingAssessmentsCount = pendingAssessmentsCount; }
    public long getPendingReviewsCount() { return pendingReviewsCount; }
    public void setPendingReviewsCount(long pendingReviewsCount) { this.pendingReviewsCount = pendingReviewsCount; }
    public long getAdditionalDocsRequestedCount() { return additionalDocsRequestedCount; }
    public void setAdditionalDocsRequestedCount(long additionalDocsRequestedCount) { this.additionalDocsRequestedCount = additionalDocsRequestedCount; }
    public long getPendingApprovalRecommendationsCount() { return pendingApprovalRecommendationsCount; }
    public void setPendingApprovalRecommendationsCount(long pendingApprovalRecommendationsCount) { this.pendingApprovalRecommendationsCount = pendingApprovalRecommendationsCount; }
    public BigDecimal getTotalDisbursedAmount() { return totalDisbursedAmount; }
    public void setTotalDisbursedAmount(BigDecimal totalDisbursedAmount) { this.totalDisbursedAmount = totalDisbursedAmount; }
    public BigDecimal getTotalOutstandingAmount() { return totalOutstandingAmount; }
    public void setTotalOutstandingAmount(BigDecimal totalOutstandingAmount) { this.totalOutstandingAmount = totalOutstandingAmount; }
    public long getPerformingLoansCount() { return performingLoansCount; }
    public void setPerformingLoansCount(long performingLoansCount) { this.performingLoansCount = performingLoansCount; }
    public Map<String, Long> getCategoryDistribution() { return categoryDistribution; }
    public void setCategoryDistribution(Map<String, Long> categoryDistribution) { this.categoryDistribution = categoryDistribution; }
    public List<LoanApplicationSummaryDto> getRecentApplications() { return recentApplications; }
    public void setRecentApplications(List<LoanApplicationSummaryDto> recentApplications) { this.recentApplications = recentApplications; }
    public List<UpcomingEmiDto> getUpcomingEmis() { return upcomingEmis; }
    public void setUpcomingEmis(List<UpcomingEmiDto> upcomingEmis) { this.upcomingEmis = upcomingEmis; }
    public LoanOfficerProfileDto getOfficerProfile() { return officerProfile; }
    public void setOfficerProfile(LoanOfficerProfileDto officerProfile) { this.officerProfile = officerProfile; }
}
