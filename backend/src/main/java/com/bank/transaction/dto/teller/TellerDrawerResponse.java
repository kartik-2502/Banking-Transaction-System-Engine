package com.bank.transaction.dto.teller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public class TellerDrawerResponse {
    private Long id;
    private String drawerCode;
    private String branchCode;
    private LocalDate businessDate;
    private BigDecimal openingBalance;
    private BigDecimal cashReceived;
    private BigDecimal cashPaidOut;
    private BigDecimal currentBalance;
    private String status;
    private OffsetDateTime openedAt;
    private OffsetDateTime closedAt;
    private List<CashDrawerTransactionResponse> ledger;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDrawerCode() { return drawerCode; }
    public void setDrawerCode(String drawerCode) { this.drawerCode = drawerCode; }
    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }
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
    public OffsetDateTime getOpenedAt() { return openedAt; }
    public void setOpenedAt(OffsetDateTime openedAt) { this.openedAt = openedAt; }
    public OffsetDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(OffsetDateTime closedAt) { this.closedAt = closedAt; }
    public List<CashDrawerTransactionResponse> getLedger() { return ledger; }
    public void setLedger(List<CashDrawerTransactionResponse> ledger) { this.ledger = ledger; }
}
