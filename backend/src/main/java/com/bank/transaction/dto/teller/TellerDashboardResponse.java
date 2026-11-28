package com.bank.transaction.dto.teller;

import com.bank.transaction.dto.TransactionResponse;
import java.math.BigDecimal;
import java.util.List;

public class TellerDashboardResponse {
    private BigDecimal todayCashDeposits;
    private BigDecimal todayCashWithdrawals;
    private BigDecimal todayTransfers;
    private long totalTransactionsProcessed;
    private long successfulTransactions;
    private long failedTransactions;
    private long pendingTransactions;
    private long pendingServiceRequests;
    private long pendingCheques;
    private long openComplaints;
    private long pendingApprovals;
    private BigDecimal drawerBalance;
    private BigDecimal openingBalance;
    private BigDecimal cashReceived;
    private BigDecimal cashPaidOut;
    private String drawerStatus;
    private TellerProfileResponse tellerProfile;
    private List<TransactionResponse> recentTransactions;

    public BigDecimal getTodayCashDeposits() { return todayCashDeposits; }
    public void setTodayCashDeposits(BigDecimal todayCashDeposits) { this.todayCashDeposits = todayCashDeposits; }
    public BigDecimal getTodayCashWithdrawals() { return todayCashWithdrawals; }
    public void setTodayCashWithdrawals(BigDecimal todayCashWithdrawals) { this.todayCashWithdrawals = todayCashWithdrawals; }
    public BigDecimal getTodayTransfers() { return todayTransfers; }
    public void setTodayTransfers(BigDecimal todayTransfers) { this.todayTransfers = todayTransfers; }
    public long getTotalTransactionsProcessed() { return totalTransactionsProcessed; }
    public void setTotalTransactionsProcessed(long totalTransactionsProcessed) { this.totalTransactionsProcessed = totalTransactionsProcessed; }
    public long getSuccessfulTransactions() { return successfulTransactions; }
    public void setSuccessfulTransactions(long successfulTransactions) { this.successfulTransactions = successfulTransactions; }
    public long getFailedTransactions() { return failedTransactions; }
    public void setFailedTransactions(long failedTransactions) { this.failedTransactions = failedTransactions; }
    public long getPendingTransactions() { return pendingTransactions; }
    public void setPendingTransactions(long pendingTransactions) { this.pendingTransactions = pendingTransactions; }
    public long getPendingServiceRequests() { return pendingServiceRequests; }
    public void setPendingServiceRequests(long pendingServiceRequests) { this.pendingServiceRequests = pendingServiceRequests; }
    public long getPendingCheques() { return pendingCheques; }
    public void setPendingCheques(long pendingCheques) { this.pendingCheques = pendingCheques; }
    public long getOpenComplaints() { return openComplaints; }
    public void setOpenComplaints(long openComplaints) { this.openComplaints = openComplaints; }
    public long getPendingApprovals() { return pendingApprovals; }
    public void setPendingApprovals(long pendingApprovals) { this.pendingApprovals = pendingApprovals; }
    public BigDecimal getDrawerBalance() { return drawerBalance; }
    public void setDrawerBalance(BigDecimal drawerBalance) { this.drawerBalance = drawerBalance; }
    public BigDecimal getOpeningBalance() { return openingBalance; }
    public void setOpeningBalance(BigDecimal openingBalance) { this.openingBalance = openingBalance; }
    public BigDecimal getCashReceived() { return cashReceived; }
    public void setCashReceived(BigDecimal cashReceived) { this.cashReceived = cashReceived; }
    public BigDecimal getCashPaidOut() { return cashPaidOut; }
    public void setCashPaidOut(BigDecimal cashPaidOut) { this.cashPaidOut = cashPaidOut; }
    public String getDrawerStatus() { return drawerStatus; }
    public void setDrawerStatus(String drawerStatus) { this.drawerStatus = drawerStatus; }
    public TellerProfileResponse getTellerProfile() { return tellerProfile; }
    public void setTellerProfile(TellerProfileResponse tellerProfile) { this.tellerProfile = tellerProfile; }
    public List<TransactionResponse> getRecentTransactions() { return recentTransactions; }
    public void setRecentTransactions(List<TransactionResponse> recentTransactions) { this.recentTransactions = recentTransactions; }
}
