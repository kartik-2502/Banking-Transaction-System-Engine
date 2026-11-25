# Production SQL Reports & Performance Execution Plans

This directory contains production-grade SQL analytical reports and query execution plans for the Apex Banking Transaction System.

---

## 1. Catalog of SQL Reports

| Report Script | Primary Purpose | Key Indexes Used |
|---|---|---|
| [`01_top_accounts_by_volume.sql`](01_top_accounts_by_volume.sql) | Aggregates inbound/outbound transaction volume, ranking top 10 accounts with customer details. | `idx_transactions_source_acc`, `idx_transactions_dest_acc`, `idx_accounts_customer_id` |
| [`02_failed_transactions_by_reason.sql`](02_failed_transactions_by_reason.sql) | Categorizes failure reasons, error percentages, and impacted account counts for operational risk analysis. | `idx_failed_txn_error_cat`, `idx_failed_txn_account_id` |
| [`03_daily_transaction_summary.sql`](03_daily_transaction_summary.sql) | Daily rollups by transaction type (`DEPOSIT`, `WITHDRAWAL`, `TRANSFER`), showing counts, volumes, and success rates. | `idx_transactions_created_at`, `idx_transactions_type` |
| [`04_high_frequency_accounts.sql`](04_high_frequency_accounts.sql) | Detects rapid velocity spikes and potential automated transaction fraud within 1-hour and 24-hour windows. | `idx_transactions_created_at`, `idx_transactions_status` |
| [`05_customer_transaction_history.sql`](05_customer_transaction_history.sql) | Generates chronological bank statements with running net balance calculations for any customer. | `idx_accounts_customer_id`, `idx_transactions_created_at` |
| [`06_loan_portfolio_underwriting.sql`](06_loan_portfolio_underwriting.sql) | Comprehensive loan portfolio analytics: volume by status, DTI bracket segmentation, and Prime/Near-Prime risk tiers. | `idx_loans_status`, `idx_loans_customer_id`, `idx_loans_created_at` |
| [`07_explain_analyze_plans.sql`](07_explain_analyze_plans.sql) | `EXPLAIN (ANALYZE, BUFFERS)` execution plans demonstrating index scans and low buffer reads across key tables. | B-Tree primary keys and compound indexes |

---

## 2. Executing Reports via psql

To run any report against the live PostgreSQL database:

```bash
# Set PostgreSQL password
export PGPASSWORD="password"   # Linux/macOS
$env:PGPASSWORD = "password"    # Windows PowerShell

# Run Top Accounts Report
psql -U postgres -d banking_db -f database/reports/01_top_accounts_by_volume.sql

# Run Daily Summary Report
psql -U postgres -d banking_db -f database/reports/03_daily_transaction_summary.sql

# Run Loan Underwriting Report
psql -U postgres -d banking_db -f database/reports/06_loan_portfolio_underwriting.sql

# Run Execution Plan Verification
psql -U postgres -d banking_db -f database/reports/07_explain_analyze_plans.sql
```
