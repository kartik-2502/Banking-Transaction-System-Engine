# Database Migrations (Flyway Engine)

This directory contains versioned Flyway database migrations applied to PostgreSQL:

| Version | Migration Script | Description |
|---|---|---|
| **V1** | [`V1__init_schema.sql`](V1__init_schema.sql) | 14 core banking tables including users, roles, accounts, transactions, row audit, failure logs, risk assessments, fraud alerts, and transactional outbox. |
| **V2** | [`V2__seed_initial_data.sql`](V2__seed_initial_data.sql) | Initial roles (`ADMIN`, `CUSTOMER`, `TELLER`, `RISK_ANALYST`), demo users with BCrypt credentials, retail customers, seeded accounts (`ACC1001` with ₹10,000 for concurrency tests), and account limits. |
| **V3** | [`V3__loan_management_and_loan_officer.sql`](V3__loan_management_and_loan_officer.sql) | Adds `LOAN_OFFICER` role, default officer user, `loans`, `loan_repayment_schedules` amortization table, and `loan_status_history` status audit log. |

### Running Migrations Manually via psql
```bash
psql -U postgres -d banking_db -f database/migrations/V1__init_schema.sql
psql -U postgres -d banking_db -f database/migrations/V2__seed_initial_data.sql
psql -U postgres -d banking_db -f database/migrations/V3__loan_management_and_loan_officer.sql
```
