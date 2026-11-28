package com.bank.transaction.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "cash_reconciliations")
public class CashReconciliation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reconciliation_id", nullable = false, unique = true, length = 40)
    private String reconciliationId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "drawer_id", nullable = false)
    private TellerDrawer drawer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teller_profile_id", nullable = false)
    private TellerProfile tellerProfile;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "business_date", nullable = false)
    private LocalDate businessDate;

    @Column(name = "system_expected_balance", nullable = false, precision = 15, scale = 2)
    private BigDecimal systemExpectedBalance;

    @Column(name = "declared_physical_cash", nullable = false, precision = 15, scale = 2)
    private BigDecimal declaredPhysicalCash;

    @Column(name = "variance_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal varianceAmount;

    @Column(name = "variance_type", nullable = false, length = 20)
    private String varianceType;

    @Column(length = 500)
    private String remarks;

    @Column(nullable = false, length = 25)
    private String status = "SUBMITTED";

    @Column(name = "submitted_by", nullable = false, length = 50)
    private String submittedBy;

    @Column(name = "verified_by", length = 50)
    private String verifiedBy;

    @Column(name = "verified_at")
    private OffsetDateTime verifiedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public Long getId() { return id; }
    public String getReconciliationId() { return reconciliationId; }
    public void setReconciliationId(String reconciliationId) { this.reconciliationId = reconciliationId; }
    public TellerDrawer getDrawer() { return drawer; }
    public void setDrawer(TellerDrawer drawer) { this.drawer = drawer; }
    public TellerProfile getTellerProfile() { return tellerProfile; }
    public void setTellerProfile(TellerProfile tellerProfile) { this.tellerProfile = tellerProfile; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
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
}
