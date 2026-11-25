-- ==============================================================================
-- Apex Banking System: Report 2 - Failed Transactions Grouped by Reason
-- Description: Analyzes failed transaction patterns, error categories,
--              impacted accounts, and error distribution percentages.
-- Performance: Utilizes idx_failed_txn_error_cat and idx_failed_txn_account_id
-- ==============================================================================

WITH failure_stats AS (
    SELECT
        error_category,
        failure_reason,
        COUNT(*) AS failure_count,
        COUNT(DISTINCT account_id) AS distinct_accounts_impacted,
        MIN(created_at) AS first_seen_at,
        MAX(created_at) AS last_seen_at
    FROM failed_transactions
    GROUP BY error_category, failure_reason
),
total_failures AS (
    SELECT COUNT(*) AS total_count FROM failed_transactions
)
SELECT
    fs.error_category,
    fs.failure_reason,
    fs.failure_count,
    ROUND((fs.failure_count::numeric / NULLIF(tf.total_count, 0) * 100), 2) AS percentage_of_total_failures,
    fs.distinct_accounts_impacted,
    fs.first_seen_at,
    fs.last_seen_at
FROM failure_stats fs
CROSS JOIN total_failures tf
ORDER BY fs.failure_count DESC, fs.last_seen_at DESC;
