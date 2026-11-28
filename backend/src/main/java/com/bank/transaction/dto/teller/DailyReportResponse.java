package com.bank.transaction.dto.teller;

import com.bank.transaction.dto.TransactionResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class DailyReportResponse {
    private LocalDate reportDate;
    private String branchCode;
    private String branchName;
    private long depositCount;
    private BigDecimal totalDepositsAmount;
    private long withdrawalCount;
    private BigDecimal totalWithdrawalsAmount;
    private long transferCount;
    private BigDecimal totalTransfersAmount;
    private long failedCount;
    private long pendingCount;
    private long chequeCount;
    private long serviceRequestCount;
    private TellerDrawerResponse drawerSummary;
    private List<CashReconciliationResponse> reconciliations;
    private List<CashDrawerTransactionResponse> shortagesAndExcesses;
    private List<TransactionResponse> transactions;

    public LocalDate getReportDate() { return reportDate; }
    public void setReportDate(LocalDate reportDate) { this.reportDate = reportDate; }
    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    public long getDepositCount() { return depositCount; }
    public void setDepositCount(long depositCount) { this.depositCount = depositCount; }
    public BigDecimal getTotalDepositsAmount() { return totalDepositsAmount; }
    public void setTotalDepositsAmount(BigDecimal totalDepositsAmount) { this.totalDepositsAmount = totalDepositsAmount; }
    public long getWithdrawalCount() { return withdrawalCount; }
    public void setWithdrawalCount(long withdrawalCount) { this.withdrawalCount = withdrawalCount; }
    public BigDecimal getTotalWithdrawalsAmount() { return totalWithdrawalsAmount; }
    public void setTotalWithdrawalsAmount(BigDecimal totalWithdrawalsAmount) { this.totalWithdrawalsAmount = totalWithdrawalsAmount; }
    public long getTransferCount() { return transferCount; }
    public void setTransferCount(long transferCount) { this.transferCount = transferCount; }
    public BigDecimal getTotalTransfersAmount() { return totalTransfersAmount; }
    public void setTotalTransfersAmount(BigDecimal totalTransfersAmount) { this.totalTransfersAmount = totalTransfersAmount; }
    public long getFailedCount() { return failedCount; }
    public void setFailedCount(long failedCount) { this.failedCount = failedCount; }
    public long getPendingCount() { return pendingCount; }
    public void setPendingCount(long pendingCount) { this.pendingCount = pendingCount; }
    public long getChequeCount() { return chequeCount; }
    public void setChequeCount(long chequeCount) { this.chequeCount = chequeCount; }
    public long getServiceRequestCount() { return serviceRequestCount; }
    public void setServiceRequestCount(long serviceRequestCount) { this.serviceRequestCount = serviceRequestCount; }
    public TellerDrawerResponse getDrawerSummary() { return drawerSummary; }
    public void setDrawerSummary(TellerDrawerResponse drawerSummary) { this.drawerSummary = drawerSummary; }
    public List<CashReconciliationResponse> getReconciliations() { return reconciliations; }
    public void setReconciliations(List<CashReconciliationResponse> reconciliations) { this.reconciliations = reconciliations; }
    public List<CashDrawerTransactionResponse> getShortagesAndExcesses() { return shortagesAndExcesses; }
    public void setShortagesAndExcesses(List<CashDrawerTransactionResponse> shortagesAndExcesses) { this.shortagesAndExcesses = shortagesAndExcesses; }
    public List<TransactionResponse> getTransactions() { return transactions; }
    public void setTransactions(List<TransactionResponse> transactions) { this.transactions = transactions; }
}
