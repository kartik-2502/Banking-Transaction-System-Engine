-- ==============================================================================
-- Apex Banking System: Report 4 - High-Frequency Accounts (Velocity Spike Detection)
-- Description: Detects accounts exhibiting unusually high transaction velocity
--              (more than N transactions in a rolling window). Used by Fraud & Risk.
-- Performance: Utilizes idx_transactions_created_at with covering index filters
-- ==============================================================================

WITH recent_activity AS (
    SELECT
        COALESCE(source_account_id, destination_account_id) AS account_id,
        id AS transaction_id,
        amount,
        type,
        status,
        created_at
    FROM transactions
    WHERE created_at >= NOW() - INTERVAL '24 HOURS'
),
velocity_per_account AS (
    SELECT
        account_id,
        COUNT(*) AS tx_count_24h,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 HOUR' THEN 1 END) AS tx_count_1h,
        SUM(amount) AS total_volume_24h,
        COUNT(CASE WHEN status != 'SUCCESS' THEN 1 END) AS failed_or_rejected_count,
        MIN(created_at) AS first_txn_time,
        MAX(created_at) AS latest_txn_time
    FROM recent_activity
    GROUP BY account_id
    HAVING COUNT(*) >= 3 -- Threshold N (default: 3 transactions in 24 hours)
)
SELECT
    a.account_number,
    c.customer_number,
    c.first_name || ' ' || c.last_name AS customer_name,
    a.status AS account_status,
    a.balance AS current_balance,
    v.tx_count_24h,
    v.tx_count_1h,
    v.total_volume_24h,
    v.failed_or_rejected_count,
    ROUND((v.total_volume_24h / NULLIF(v.tx_count_24h, 0)), 2) AS avg_txn_size,
    v.first_txn_time,
    v.latest_txn_time,
    CASE
        WHEN v.tx_count_1h >= 5 OR v.failed_or_rejected_count >= 3 THEN 'CRITICAL - INVESTIGATION REQUIRED'
        WHEN v.tx_count_24h >= 10 THEN 'HIGH - VELOCITY THRESHOLD BREACHED'
        ELSE 'ELEVATED - MONITORING'
    END AS risk_flag
FROM velocity_per_account v
JOIN accounts a ON a.id = v.account_id
JOIN customers c ON c.id = a.customer_id
ORDER BY v.tx_count_1h DESC, v.tx_count_24h DESC;
