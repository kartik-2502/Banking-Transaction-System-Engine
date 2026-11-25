package com.bank.transaction;

import com.bank.transaction.dto.analytics.*;
import com.bank.transaction.service.AnalyticsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class AnalyticsIntegrationTest {

    @Autowired
    private AnalyticsService analyticsService;

    @Test
    @DisplayName("Analytics: System overview metrics aggregate correctly from database")
    void testSystemOverviewAnalytics() {
        SystemOverviewAnalytics overview = analyticsService.getSystemOverview();

        assertNotNull(overview);
        assertTrue(overview.getTotalAccounts() >= 3, "Total accounts should be >= 3");
        assertTrue(overview.getActiveAccounts() >= 2, "Active accounts should be >= 2");
        assertNotNull(overview.getTotalDepositBalance());
        assertTrue(overview.getTotalDepositBalance().compareTo(BigDecimal.ZERO) > 0);
        assertNotNull(overview.getTotalTransactions());
        assertNotNull(overview.getSystemHealthStatus());
        assertEquals("HEALTHY", overview.getSystemHealthStatus());
        assertNotNull(overview.getGeneratedAt());
    }

    @Test
    @DisplayName("Analytics: Top accounts by volume dense rank and turnover calculation")
    void testTopAccountsByVolume() {
        List<TopAccountVolumeResponse> topAccounts = analyticsService.getTopAccountsByVolume(5);

        assertNotNull(topAccounts);
        assertFalse(topAccounts.isEmpty(), "Top accounts list should not be empty");

        TopAccountVolumeResponse top1 = topAccounts.get(0);
        assertEquals(1, top1.getRank(), "First item must be rank 1");
        assertNotNull(top1.getAccountNumber());
        assertNotNull(top1.getCustomerName());
        assertNotNull(top1.getTotalTurnoverVolume());
        assertTrue(top1.getTotalTransactions() >= 0);
    }

    @Test
    @DisplayName("Analytics: Daily transaction trends aggregate counts and volume")
    void testDailyTransactionTrends() {
        List<DailyTransactionTrendResponse> trends = analyticsService.getDailyTransactionTrends(30);

        assertNotNull(trends);
        // If transactions exist, verify fields
        for (DailyTransactionTrendResponse t : trends) {
            assertNotNull(t.getOperationType());
            assertTrue(t.getTotalAttempts() > 0);
            assertNotNull(t.getTotalSettledVolume());
        }
    }

    @Test
    @DisplayName("Analytics: Failed transactions grouped by category and percentages")
    void testFailedTransactionSummary() {
        List<FailedTransactionSummaryResponse> failures = analyticsService.getFailedTransactionSummary();

        assertNotNull(failures);
        for (FailedTransactionSummaryResponse f : failures) {
            assertNotNull(f.getErrorCategory());
            assertTrue(f.getFailureCount() > 0);
        }
    }

    @Test
    @DisplayName("Analytics: Loan portfolio underwriting summary aggregates status groups")
    void testLoanPortfolioAnalytics() {
        List<LoanPortfolioAnalyticsResponse> portfolio = analyticsService.getLoanPortfolioAnalytics();

        assertNotNull(portfolio);
        for (LoanPortfolioAnalyticsResponse group : portfolio) {
            assertNotNull(group.getStatus());
            assertTrue(group.getLoanCount() >= 0);
            assertNotNull(group.getTotalPrincipal());
        }
    }
}
