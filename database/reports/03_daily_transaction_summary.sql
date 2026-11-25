-- ==============================================================================
-- Apex Banking System: Report 3 - Daily Transaction Volume & Operational Summary
-- Description: Daily rollups grouped by transaction date and operation type.
--              Computes counts, total volumes, average amounts, and success rates.
-- Performance: Utilizes idx_transactions_created_at and idx_transactions_type
-- ==============================================================================

SELECT
    DATE_TRUNC('day', created_at)::DATE AS transaction_date,
    type AS operation_type,
    COUNT(*) AS total_attempts,
    COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) AS successful_count,
    COUNT(CASE WHEN status = 'FAILED' THEN 1 END) AS failed_count,
    COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) AS rejected_count,
    ROUND(
        (COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100),
        2
    ) AS success_rate_percentage,
    COALESCE(SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END), 0.00) AS total_settled_volume,
    ROUND(COALESCE(AVG(CASE WHEN status = 'SUCCESS' THEN amount END), 0.00), 2) AS avg_settled_amount,
    COALESCE(MIN(CASE WHEN status = 'SUCCESS' THEN amount END), 0.00) AS min_amount,
    COALESCE(MAX(CASE WHEN status = 'SUCCESS' THEN amount END), 0.00) AS max_amount
FROM transactions
GROUP BY DATE_TRUNC('day', created_at)::DATE, type
ORDER BY transaction_date DESC, total_settled_volume DESC;
