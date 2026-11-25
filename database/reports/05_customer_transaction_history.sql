-- ==============================================================================
-- Apex Banking System: Report 5 - Customer Detailed Transaction History & Ledger
-- Description: Generates a full chronological statement of debits and credits
--              across all accounts owned by a customer, with running net flows.
-- Performance: Utilizes idx_transactions_source_acc and idx_accounts_customer_id
-- ==============================================================================

-- Parameter: Filter by customer_number (e.g., 'CUST1001')
WITH customer_accounts AS (
    SELECT a.id, a.account_number, a.currency, c.customer_number, c.first_name || ' ' || c.last_name AS customer_name
    FROM accounts a
    JOIN customers c ON c.id = a.customer_id
    WHERE c.customer_number = 'CUST1001'
),
customer_ledger AS (
    SELECT
        t.id AS internal_id,
        t.transaction_id,
        t.created_at,
        ca.account_number AS my_account_number,
        t.type AS transaction_type,
        CASE
            WHEN t.source_account_id = ca.id THEN 'DEBIT'
            WHEN t.destination_account_id = ca.id THEN 'CREDIT'
            ELSE 'OTHER'
        END AS entry_type,
        t.amount,
        CASE
            WHEN t.source_account_id = ca.id THEN -t.amount
            WHEN t.destination_account_id = ca.id THEN t.amount
            ELSE 0.00
        END AS signed_flow,
        t.status,
        COALESCE(dest_a.account_number, 'EXTERNAL/CASH') AS counterparty_account,
        t.initiated_by
    FROM transactions t
    JOIN customer_accounts ca ON (t.source_account_id = ca.id OR t.destination_account_id = ca.id)
    LEFT JOIN accounts dest_a ON dest_a.id = (
        CASE
            WHEN t.source_account_id = ca.id THEN t.destination_account_id
            ELSE t.source_account_id
        END
    )
)
SELECT
    transaction_id,
    created_at,
    my_account_number,
    transaction_type,
    entry_type,
    amount,
    signed_flow,
    status,
    counterparty_account,
    initiated_by,
    SUM(CASE WHEN status = 'SUCCESS' THEN signed_flow ELSE 0 END) OVER (
        PARTITION BY my_account_number
        ORDER BY created_at ASC, internal_id ASC
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_net_change
FROM customer_ledger
ORDER BY created_at DESC;
