package com.bank.transaction.controller;

import com.bank.transaction.dto.ApiResponse;
import com.bank.transaction.dto.analytics.*;
import com.bank.transaction.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMPLIANCE_OFFICER', 'LOAN_OFFICER', 'RISK_ANALYST', 'TELLER')")
    public ResponseEntity<ApiResponse<SystemOverviewAnalytics>> getSystemOverview() {
        SystemOverviewAnalytics overview = analyticsService.getSystemOverview();
        return ResponseEntity.ok(ApiResponse.ok("System overview analytics retrieved successfully", overview));
    }

    @GetMapping("/top-accounts")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMPLIANCE_OFFICER', 'LOAN_OFFICER', 'RISK_ANALYST', 'TELLER')")
    public ResponseEntity<ApiResponse<List<TopAccountVolumeResponse>>> getTopAccounts(
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        List<TopAccountVolumeResponse> topAccounts = analyticsService.getTopAccountsByVolume(limit);
        return ResponseEntity.ok(ApiResponse.ok("Top accounts by volume retrieved successfully", topAccounts));
    }

    @GetMapping("/trends")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMPLIANCE_OFFICER', 'LOAN_OFFICER', 'RISK_ANALYST', 'TELLER')")
    public ResponseEntity<ApiResponse<List<DailyTransactionTrendResponse>>> getTransactionTrends(
            @RequestParam(name = "days", defaultValue = "30") int days) {
        List<DailyTransactionTrendResponse> trends = analyticsService.getDailyTransactionTrends(days);
        return ResponseEntity.ok(ApiResponse.ok("Daily transaction trends retrieved successfully", trends));
    }

    @GetMapping("/failures")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMPLIANCE_OFFICER', 'LOAN_OFFICER', 'RISK_ANALYST', 'TELLER')")
    public ResponseEntity<ApiResponse<List<FailedTransactionSummaryResponse>>> getFailureSummary() {
        List<FailedTransactionSummaryResponse> failures = analyticsService.getFailedTransactionSummary();
        return ResponseEntity.ok(ApiResponse.ok("Failed transaction summary retrieved successfully", failures));
    }

    @GetMapping("/loan-portfolio")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMPLIANCE_OFFICER', 'LOAN_OFFICER', 'RISK_ANALYST', 'TELLER')")
    public ResponseEntity<ApiResponse<List<LoanPortfolioAnalyticsResponse>>> getLoanPortfolio() {
        List<LoanPortfolioAnalyticsResponse> portfolio = analyticsService.getLoanPortfolioAnalytics();
        return ResponseEntity.ok(ApiResponse.ok("Loan portfolio analytics retrieved successfully", portfolio));
    }
}
