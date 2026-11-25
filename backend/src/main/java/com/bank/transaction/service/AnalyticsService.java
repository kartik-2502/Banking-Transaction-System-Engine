package com.bank.transaction.service;

import com.bank.transaction.dto.analytics.*;

import java.util.List;

public interface AnalyticsService {

    SystemOverviewAnalytics getSystemOverview();

    List<TopAccountVolumeResponse> getTopAccountsByVolume(int limit);

    List<DailyTransactionTrendResponse> getDailyTransactionTrends(int days);

    List<FailedTransactionSummaryResponse> getFailedTransactionSummary();

    List<LoanPortfolioAnalyticsResponse> getLoanPortfolioAnalytics();
}
