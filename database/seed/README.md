# Database Seed Scripts

This directory contains standalone seed scripts for local development and integration testing:

- [`sample_seed.sql`](sample_seed.sql): Applies initial demo data from `V2__seed_initial_data.sql` and `V3__loan_management_and_loan_officer.sql` (admin, teller, risk analyst, loan officer, retail customers, and accounts).

### Usage
```bash
psql -U postgres -d banking_db -f database/seed/sample_seed.sql
```
