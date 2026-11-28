package com.bank.transaction.dto.loan;

import java.math.BigDecimal;
import java.util.List;

public class LoanOfficerCustomerDto {
    private Long id;
    private String customerNumber;
    private String fullName;
    private String maskedEmail;
    private String maskedPhone;
    private String branchCode;
    private String branchName;
    private String kycStatus;
    private String employmentType;
    private BigDecimal latestMonthlyIncome;
    private BigDecimal existingLiabilities;
    private BigDecimal totalLoanExposure;
    private long activeLoanCount;
    private Integer latestCreditScore;
    private List<String> linkedAccounts;
    private List<LoanApplicationSummaryDto> loanApplications;
    private List<LoanCreditAssessmentDto> creditAssessments;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCustomerNumber() { return customerNumber; }
    public void setCustomerNumber(String customerNumber) { this.customerNumber = customerNumber; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getMaskedEmail() { return maskedEmail; }
    public void setMaskedEmail(String maskedEmail) { this.maskedEmail = maskedEmail; }
    public String getMaskedPhone() { return maskedPhone; }
    public void setMaskedPhone(String maskedPhone) { this.maskedPhone = maskedPhone; }
    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    public String getKycStatus() { return kycStatus; }
    public void setKycStatus(String kycStatus) { this.kycStatus = kycStatus; }
    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }
    public BigDecimal getLatestMonthlyIncome() { return latestMonthlyIncome; }
    public void setLatestMonthlyIncome(BigDecimal latestMonthlyIncome) { this.latestMonthlyIncome = latestMonthlyIncome; }
    public BigDecimal getExistingLiabilities() { return existingLiabilities; }
    public void setExistingLiabilities(BigDecimal existingLiabilities) { this.existingLiabilities = existingLiabilities; }
    public BigDecimal getTotalLoanExposure() { return totalLoanExposure; }
    public void setTotalLoanExposure(BigDecimal totalLoanExposure) { this.totalLoanExposure = totalLoanExposure; }
    public long getActiveLoanCount() { return activeLoanCount; }
    public void setActiveLoanCount(long activeLoanCount) { this.activeLoanCount = activeLoanCount; }
    public Integer getLatestCreditScore() { return latestCreditScore; }
    public void setLatestCreditScore(Integer latestCreditScore) { this.latestCreditScore = latestCreditScore; }
    public List<String> getLinkedAccounts() { return linkedAccounts; }
    public void setLinkedAccounts(List<String> linkedAccounts) { this.linkedAccounts = linkedAccounts; }
    public List<LoanApplicationSummaryDto> getLoanApplications() { return loanApplications; }
    public void setLoanApplications(List<LoanApplicationSummaryDto> loanApplications) { this.loanApplications = loanApplications; }
    public List<LoanCreditAssessmentDto> getCreditAssessments() { return creditAssessments; }
    public void setCreditAssessments(List<LoanCreditAssessmentDto> creditAssessments) { this.creditAssessments = creditAssessments; }
}
