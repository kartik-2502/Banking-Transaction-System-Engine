-- ==============================================================================
-- Apex Banking System: Report 1 - Top Accounts by Transaction Volume
-- Description: Aggregates total inbound/outbound volume and transaction counts
--              per account, joined with customer details and current balances.
-- Performance: Utilizes idx_transactions_source_acc and idx_transactions_dest_acc
-- ==============================================================================

WITH account_activity AS (
    -- Outbound volume (Source account)
    SELECT
        source_account_id AS account_id,
        COUNT(*) AS outbound_txn_count,
        COALESCE(SUM(amount), 0.00) AS outbound_volume,
        0 AS inbound_txn_count,
        0.00 AS inbound_volume
    FROM transactions
    WHERE status = 'SUCCESS' AND source_account_id IS NOT NULL
    GROUP BY source_account_id

    UNION ALL

    -- Inbound volume (Destination account)
    SELECT
        destination_account_id AS account_id,
        0 AS outbound_txn_count,
        0.00 AS outbound_volume,
        COUNT(*) AS inbound_txn_count,
        COALESCE(SUM(amount), 0.00) AS inbound_volume
    FROM transactions
    WHERE status = 'SUCCESS' AND destination_account_id IS NOT NULL
    GROUP BY destination_account_id
),
aggregated_volume AS (
    SELECT
        account_id,
        SUM(outbound_txn_count) AS total_outbound_txns,
        SUM(outbound_volume) AS total_outbound_volume,
        SUM(inbound_txn_count) AS total_inbound_txns,
        SUM(inbound_volume) AS total_inbound_volume,
        SUM(outbound_txn_count + inbound_txn_count) AS total_txn_count,
        SUM(outbound_volume + inbound_volume) AS total_turnover_volume
    FROM account_activity
    GROUP BY account_id
)
SELECT
    DENSE_RANK() OVER (ORDER BY av.total_turnover_volume DESC) AS rank,
    a.account_number,
    c.customer_number,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.email AS customer_email,
    a.currency,
    a.status AS account_status,
    a.balance AS current_balance,
    av.total_txn_count,
    av.total_outbound_volume,
    av.total_inbound_volume,
    av.total_turnover_volume
FROM aggregated_volume av
JOIN accounts a ON a.id = av.account_id
JOIN customers c ON c.id = a.customer_id
ORDER BY total_turnover_volume DESC
LIMIT 10;
