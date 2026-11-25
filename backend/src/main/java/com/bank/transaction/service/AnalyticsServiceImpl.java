package com.bank.transaction.service;

import com.bank.transaction.dto.analytics.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsServiceImpl.class);

    private final JdbcTemplate jdbcTemplate;

    public AnalyticsServiceImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public SystemOverviewAnalytics getSystemOverview() {
        SystemOverviewAnalytics overview = new SystemOverviewAnalytics();

        // 1. Account Metrics
        String accountSql = "SELECT COUNT(*) AS total_accounts, " +
                "COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) AS active_accounts, " +
                "COUNT(CASE WHEN status = 'FROZEN' THEN 1 END) AS frozen_accounts, " +
                "COALESCE(SUM(balance), 0.00) AS total_balance " +
                "FROM accounts";
        jdbcTemplate.query(accountSql, rs -> {
            overview.setTotalAccounts(rs.getLong("total_accounts"));
            overview.setActiveAccounts(rs.getLong("active_accounts"));
            overview.setFrozenAccounts(rs.getLong("frozen_accounts"));
            overview.setTotalDepositBalance(rs.getBigDecimal("total_balance"));
        });

        // 2. All-Time Transaction Metrics
        String txnSql = "SELECT COUNT(*) AS total_txns, " +
                "COALESCE(SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END), 0.00) AS total_vol " +
                "FROM transactions";
        jdbcTemplate.query(txnSql, rs -> {
            overview.setTotalTransactions(rs.getLong("total_txns"));
            overview.setTotalTransactionVolume(rs.getBigDecimal("total_vol"));
        });

        // 3. Today's Transaction Metrics
        String todayTxnSql = "SELECT COUNT(*) AS today_txns, " +
                "COALESCE(SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END), 0.00) AS today_vol " +
                "FROM transactions WHERE created_at >= CURRENT_DATE";
        jdbcTemplate.query(todayTxnSql, rs -> {
            overview.setTodayTransactions(rs.getLong("today_txns"));
            overview.setTodayTransactionVolume(rs.getBigDecimal("today_vol"));
        });

        // 4. Loan Portfolio Overview
        String loanSql = "SELECT COUNT(*) AS total_loans, " +
                "COUNT(CASE WHEN status = 'DISBURSED' THEN 1 END) AS active_loans, " +
                "COALESCE(SUM(CASE WHEN status = 'DISBURSED' THEN amount ELSE 0 END), 0.00) AS total_disbursed, " +
                "COALESCE(SUM(CASE WHEN status = 'DISBURSED' THEN outstanding_balance ELSE 0 END), 0.00) AS total_outstanding " +
                "FROM loans";
        jdbcTemplate.query(loanSql, rs -> {
            overview.setTotalLoans(rs.getLong("total_loans"));
            overview.setActiveLoans(rs.getLong("active_loans"));
            overview.setTotalLoanDisbursed(rs.getBigDecimal("total_disbursed"));
            overview.setTotalLoanOutstanding(rs.getBigDecimal("total_outstanding"));
        });

        // 5. Fraud Alert Counts
        String fraudSql = "SELECT COUNT(*) AS total_alerts, " +
                "COUNT(CASE WHEN status = 'NEW' OR status = 'INVESTIGATING' THEN 1 END) AS pending_alerts " +
                "FROM fraud_alerts";
        jdbcTemplate.query(fraudSql, rs -> {
            overview.setTotalFraudAlerts(rs.getLong("total_alerts"));
            overview.setPendingFraudAlerts(rs.getLong("pending_alerts"));
        });

        overview.setGeneratedAt(OffsetDateTime.now());
        overview.setSystemHealthStatus("HEALTHY");
        return overview;
    }

    @Override
    public List<TopAccountVolumeResponse> getTopAccountsByVolume(int limit) {
        int boundedLimit = Math.min(100, Math.max(1, limit));
        String sql = "WITH account_activity AS (" +
                "    SELECT source_account_id AS account_id, COUNT(*) AS outbound_txn_count, " +
                "           COALESCE(SUM(amount), 0.00) AS outbound_volume, 0 AS inbound_txn_count, 0.00 AS inbound_volume " +
                "    FROM transactions WHERE status = 'SUCCESS' AND source_account_id IS NOT NULL " +
                "    GROUP BY source_account_id " +
                "    UNION ALL " +
                "    SELECT destination_account_id AS account_id, 0 AS outbound_txn_count, 0.00 AS outbound_volume, " +
                "           COUNT(*) AS inbound_txn_count, COALESCE(SUM(amount), 0.00) AS inbound_volume " +
                "    FROM transactions WHERE status = 'SUCCESS' AND destination_account_id IS NOT NULL " +
                "    GROUP BY destination_account_id" +
                "), " +
                "aggregated_volume AS (" +
                "    SELECT account_id, " +
                "           SUM(outbound_txn_count + inbound_txn_count) AS total_txn_count, " +
                "           SUM(outbound_volume + inbound_volume) AS total_turnover_volume " +
                "    FROM account_activity GROUP BY account_id" +
                ") " +
                "SELECT DENSE_RANK() OVER (ORDER BY av.total_turnover_volume DESC) AS rank, " +
                "       a.account_number, c.customer_number, c.first_name || ' ' || c.last_name AS customer_name, " +
                "       c.email AS customer_email, a.balance AS current_balance, a.currency, " +
                "       a.status AS account_status, av.total_txn_count, av.total_turnover_volume " +
                "FROM aggregated_volume av " +
                "JOIN accounts a ON av.account_id = a.id " +
                "JOIN customers c ON a.customer_id = c.id " +
                "ORDER BY rank ASC " +
                "LIMIT ?";

        return jdbcTemplate.query(sql, (rs, rowNum) -> mapTopAccount(rs), boundedLimit);
    }

    @Override
    public List<DailyTransactionTrendResponse> getDailyTransactionTrends(int days) {
        int boundedDays = Math.min(90, Math.max(1, days));
        String sql = "SELECT DATE_TRUNC('day', created_at)::DATE AS transaction_date, " +
                "       type AS operation_type, COUNT(*) AS total_attempts, " +
                "       COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) AS successful_count, " +
                "       COUNT(CASE WHEN status = 'FAILED' THEN 1 END) AS failed_count, " +
                "       ROUND((COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2) AS success_rate_percentage, " +
                "       COALESCE(SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END), 0.00) AS total_settled_volume, " +
                "       ROUND(COALESCE(AVG(CASE WHEN status = 'SUCCESS' THEN amount END), 0.00), 2) AS avg_settled_amount " +
                "FROM transactions " +
                "WHERE created_at >= CURRENT_DATE - (? || ' days')::INTERVAL " +
                "GROUP BY DATE_TRUNC('day', created_at)::DATE, type " +
                "ORDER BY transaction_date DESC, total_settled_volume DESC";

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            DailyTransactionTrendResponse res = new DailyTransactionTrendResponse();
            java.sql.Date d = rs.getDate("transaction_date");
            if (d != null) {
                res.setTransactionDate(d.toLocalDate());
            }
            res.setOperationType(rs.getString("operation_type"));
            res.setTotalAttempts(rs.getLong("total_attempts"));
            res.setSuccessfulCount(rs.getLong("successful_count"));
            res.setFailedCount(rs.getLong("failed_count"));
            res.setSuccessRatePercentage(rs.getBigDecimal("success_rate_percentage"));
            res.setTotalSettledVolume(rs.getBigDecimal("total_settled_volume"));
            res.setAvgSettledAmount(rs.getBigDecimal("avg_settled_amount"));
            return res;
        }, boundedDays);
    }

    @Override
    public List<FailedTransactionSummaryResponse> getFailedTransactionSummary() {
        String sql = "WITH failure_stats AS (" +
                "    SELECT error_category, failure_reason, COUNT(*) AS failure_count, " +
                "           COUNT(DISTINCT account_id) AS distinct_accounts_impacted, " +
                "           MIN(created_at) AS first_seen_at, MAX(created_at) AS last_seen_at " +
                "    FROM failed_transactions " +
                "    GROUP BY error_category, failure_reason" +
                "), " +
                "total_failures AS (" +
                "    SELECT COUNT(*) AS total_count FROM failed_transactions" +
                ") " +
                "SELECT fs.error_category, fs.failure_reason, fs.failure_count, " +
                "       ROUND((fs.failure_count::numeric / NULLIF(tf.total_count, 0) * 100), 2) AS percentage_of_total, " +
                "       fs.distinct_accounts_impacted, fs.first_seen_at, fs.last_seen_at " +
                "FROM failure_stats fs " +
                "CROSS JOIN total_failures tf " +
                "ORDER BY fs.failure_count DESC, fs.last_seen_at DESC " +
                "LIMIT 50";

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            FailedTransactionSummaryResponse res = new FailedTransactionSummaryResponse();
            res.setErrorCategory(rs.getString("error_category"));
            res.setFailureReason(rs.getString("failure_reason"));
            res.setFailureCount(rs.getLong("failure_count"));
            res.setPercentageOfTotal(rs.getBigDecimal("percentage_of_total"));
            res.setDistinctAccountsImpacted(rs.getLong("distinct_accounts_impacted"));
            res.setFirstSeenAt(rs.getObject("first_seen_at", OffsetDateTime.class));
            res.setLastSeenAt(rs.getObject("last_seen_at", OffsetDateTime.class));
            return res;
        });
    }

    @Override
    public List<LoanPortfolioAnalyticsResponse> getLoanPortfolioAnalytics() {
        String sql = "SELECT status, COUNT(*) AS loan_count, " +
                "       COALESCE(SUM(amount), 0.00) AS total_principal, " +
                "       COALESCE(SUM(outstanding_balance), 0.00) AS total_outstanding, " +
                "       ROUND(COALESCE(AVG(interest_rate), 0.00), 2) AS avg_interest_rate, " +
                "       ROUND(COALESCE(AVG(term_months), 0), 1) AS avg_tenure_months, " +
                "       ROUND(COALESCE(AVG(dti_ratio), 0.0), 2) AS avg_dti_ratio " +
                "FROM loans " +
                "GROUP BY status " +
                "ORDER BY loan_count DESC";

        return jdbcTemplate.query(sql, (rs, rowNum) -> new LoanPortfolioAnalyticsResponse(
                rs.getString("status"),
                rs.getLong("loan_count"),
                rs.getBigDecimal("total_principal"),
                rs.getBigDecimal("total_outstanding"),
                rs.getBigDecimal("avg_interest_rate"),
                rs.getDouble("avg_tenure_months"),
                rs.getDouble("avg_dti_ratio")
        ));
    }

    private TopAccountVolumeResponse mapTopAccount(ResultSet rs) throws SQLException {
        TopAccountVolumeResponse res = new TopAccountVolumeResponse();
        res.setRank(rs.getInt("rank"));
        res.setAccountNumber(rs.getString("account_number"));
        res.setCustomerNumber(rs.getString("customer_number"));
        res.setCustomerName(rs.getString("customer_name"));
        res.setCustomerEmail(rs.getString("customer_email"));
        res.setCurrentBalance(rs.getBigDecimal("current_balance"));
        res.setCurrency(rs.getString("currency"));
        res.setAccountStatus(rs.getString("account_status"));
        res.setTotalTransactions(rs.getLong("total_txn_count"));
        res.setTotalTurnoverVolume(rs.getBigDecimal("total_turnover_volume"));
        return res;
    }
}
