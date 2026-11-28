package com.bank.transaction.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "teller_drawers",
       uniqueConstraints = @UniqueConstraint(name = "uq_drawer_profile_date", columnNames = {"teller_profile_id", "business_date"}))
public class TellerDrawer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teller_profile_id", nullable = false)
    private TellerProfile tellerProfile;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "drawer_code", nullable = false, length = 32)
    private String drawerCode;

    @Column(name = "business_date", nullable = false)
    private LocalDate businessDate = LocalDate.now();

    @Column(name = "opening_balance", nullable = false, precision = 15, scale = 2)
    private BigDecimal openingBalance = BigDecimal.ZERO.setScale(2);

    @Column(name = "cash_received", nullable = false, precision = 15, scale = 2)
    private BigDecimal cashReceived = BigDecimal.ZERO.setScale(2);

    @Column(name = "cash_paid_out", nullable = false, precision = 15, scale = 2)
    private BigDecimal cashPaidOut = BigDecimal.ZERO.setScale(2);

    @Column(name = "current_balance", nullable = false, precision = 15, scale = 2)
    private BigDecimal currentBalance = BigDecimal.ZERO.setScale(2);

    @Column(nullable = false, length = 25)
    private String status = "OPEN";

    @Version
    @Column(nullable = false)
    private Long version = 0L;

    @Column(name = "opened_at", nullable = false, updatable = false)
    private OffsetDateTime openedAt = OffsetDateTime.now();

    @Column(name = "closed_at")
    private OffsetDateTime closedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public TellerProfile getTellerProfile() { return tellerProfile; }
    public void setTellerProfile(TellerProfile tellerProfile) { this.tellerProfile = tellerProfile; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
    public String getDrawerCode() { return drawerCode; }
    public void setDrawerCode(String drawerCode) { this.drawerCode = drawerCode; }
    public LocalDate getBusinessDate() { return businessDate; }
    public void setBusinessDate(LocalDate businessDate) { this.businessDate = businessDate; }
    public BigDecimal getOpeningBalance() { return openingBalance; }
    public void setOpeningBalance(BigDecimal openingBalance) { this.openingBalance = openingBalance; }
    public BigDecimal getCashReceived() { return cashReceived; }
    public void setCashReceived(BigDecimal cashReceived) { this.cashReceived = cashReceived; }
    public BigDecimal getCashPaidOut() { return cashPaidOut; }
    public void setCashPaidOut(BigDecimal cashPaidOut) { this.cashPaidOut = cashPaidOut; }
    public BigDecimal getCurrentBalance() { return currentBalance; }
    public void setCurrentBalance(BigDecimal currentBalance) { this.currentBalance = currentBalance; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getVersion() { return version; }
    public OffsetDateTime getOpenedAt() { return openedAt; }
    public void setOpenedAt(OffsetDateTime openedAt) { this.openedAt = openedAt; }
    public OffsetDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(OffsetDateTime closedAt) { this.closedAt = closedAt; }
}
