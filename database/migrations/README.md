# Database Migrations
This directory contains Flyway-compatible SQL migration scripts:
- `V1__init_schema.sql`: Initial core schema (users, roles, accounts, transactions, audit)
- `V2__risk_and_freeze_controls.sql`: Account freeze, risk thresholds, and limits
- `V3__outbox_and_notifications.sql`: Transactional outbox and real-time alerts
