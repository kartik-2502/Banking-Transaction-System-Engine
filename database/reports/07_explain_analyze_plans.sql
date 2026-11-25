-- ==============================================================================
-- Apex Banking System: Report 7 - Query Execution Plans & Index Verification
-- Description: Runs EXPLAIN (ANALYZE, BUFFERS) on critical transaction engine,
--              concurrency, and loan queries to prove index scans over table scans.
-- ==============================================================================

-- 1. Index Scan on Account Lookup by Account Number
-- Verifies: idx_accounts_account_number (Unique Index)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM accounts WHERE account_number = 'ACC1001';

-- 2. Index Scan on Concurrency Pessimistic Row Lock (SELECT ... FOR UPDATE)
-- Verifies: Fast row-level lock acquisition without table lock
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, balance, status, version FROM accounts
WHERE id = 1 FOR UPDATE;

-- 3. Index Scan on Idempotency Key Lookup
-- Verifies: idx_transactions_txn_id (Unique Index)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM transactions
WHERE transaction_id = 'TXN_CONCURRENCY_TEST_01';

-- 4. Index Scan on Account Transaction History with Time Range Filter
-- Verifies: idx_transactions_source_acc and idx_transactions_created_at
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM transactions
WHERE source_account_id = 1
ORDER BY created_at DESC
LIMIT 20;

-- 5. Index Scan on Loan Lookup by Loan ID
-- Verifies: idx_loans_loan_id (Unique Index)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM loans
WHERE loan_id = 'LN1732456012';

-- 6. Index Scan on Loan Search by Customer & Status
-- Verifies: idx_loans_customer_id and idx_loans_status
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM loans
WHERE customer_id = 1 AND status = 'DISBURSED';
