package com.bank.transaction.dto.teller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class CashReconciliationResponse {
    private String reconciliationId;
    private String drawerCode;
    private String branchCode;
    private LocalDate businessDate;
    private BigDecimal systemExpectedBalance;
    private BigDecimal declaredPhysicalCash;
    private BigDecimal varianceAmount;
    private String varianceType;
    private String remarks;
    private String status;
    private String submittedBy;
    private String verifiedBy;
    private OffsetDateTime verifiedAt;
    private OffsetDateTime createdAt;

    public String getReconciliationId() { return reconciliationId; }
    public void setReconciliationId(String reconciliationId) { this.reconciliationId = reconciliationId; }
    public String getDrawerCode() { return drawerCode; }
    public void setDrawerCode(String drawerCode) { this.drawerCode = drawerCode; }
    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }
    public LocalDate getBusinessDate() { return businessDate; }
    public void setBusinessDate(LocalDate businessDate) { this.businessDate = businessDate; }
    public BigDecimal getSystemExpectedBalance() { return systemExpectedBalance; }
    public void setSystemExpectedBalance(BigDecimal systemExpectedBalance) { this.systemExpectedBalance = systemExpectedBalance; }
    public BigDecimal getDeclaredPhysicalCash() { return declaredPhysicalCash; }
    public void setDeclaredPhysicalCash(BigDecimal declaredPhysicalCash) { this.declaredPhysicalCash = declaredPhysicalCash; }
    public BigDecimal getVarianceAmount() { return varianceAmount; }
    public void setVarianceAmount(BigDecimal varianceAmount) { this.varianceAmount = varianceAmount; }
    public String getVarianceType() { return varianceType; }
    public void setVarianceType(String varianceType) { this.varianceType = varianceType; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }
    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }
    public OffsetDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(OffsetDateTime verifiedAt) { this.verifiedAt = verifiedAt; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
