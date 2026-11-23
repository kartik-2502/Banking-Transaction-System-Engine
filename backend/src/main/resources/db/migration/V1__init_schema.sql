-- ==============================================================================
-- Apex Banking System: V1 Initial Schema Definition
-- High-concurrency transaction processing engine
-- ==============================================================================

-- 1. Roles
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. User Roles Mapping
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 4. Customers
CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    customer_number VARCHAR(32) NOT NULL UNIQUE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    address VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Accounts
CREATE TABLE IF NOT EXISTS accounts (
    id BIGSERIAL PRIMARY KEY,
    account_number VARCHAR(32) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_account_balance_non_negative CHECK (balance >= 0.00),
    CONSTRAINT chk_account_status CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED'))
);

-- 6. Account Status Change History
CREATE TABLE IF NOT EXISTS account_status_history (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    previous_status VARCHAR(20) NOT NULL,
    new_status VARCHAR(20) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    changed_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Account Transaction Limits
CREATE TABLE IF NOT EXISTS account_transaction_limits (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
    daily_limit NUMERIC(15, 2) NOT NULL DEFAULT 100000.00,
    per_transaction_limit NUMERIC(15, 2) NOT NULL DEFAULT 50000.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_daily_limit_positive CHECK (daily_limit >= 0.00),
    CONSTRAINT chk_per_tx_limit_positive CHECK (per_transaction_limit >= 0.00)
);

-- 8. Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL,
    source_account_id BIGINT REFERENCES accounts(id) ON DELETE RESTRICT,
    destination_account_id BIGINT REFERENCES accounts(id) ON DELETE RESTRICT,
    amount NUMERIC(15, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    failure_reason VARCHAR(500),
    initiated_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_transaction_amount_positive CHECK (amount > 0.00),
    CONSTRAINT chk_transaction_type CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER')),
    CONSTRAINT chk_transaction_status CHECK (status IN ('SUCCESS', 'FAILED', 'REJECTED'))
);

-- 9. Transaction Audit Trail
CREATE TABLE IF NOT EXISTS transaction_audit (
    id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL,
    account_id BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
    thread_name VARCHAR(100) NOT NULL,
    operation_type VARCHAR(20) NOT NULL,
    result VARCHAR(20) NOT NULL,
    duration_ms BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Failed Transactions Log
CREATE TABLE IF NOT EXISTS failed_transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL,
    account_id BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
    error_category VARCHAR(50) NOT NULL,
    failure_reason VARCHAR(500) NOT NULL,
    payload_json TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. Risk Assessments
CREATE TABLE IF NOT EXISTS risk_assessments (
    id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL,
    account_id BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
    risk_score INT NOT NULL DEFAULT 0,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'LOW',
    triggered_rule VARCHAR(100),
    details VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_risk_level CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

-- 12. Fraud Alerts
CREATE TABLE IF NOT EXISTS fraud_alerts (
    id BIGSERIAL PRIMARY KEY,
    risk_assessment_id BIGINT REFERENCES risk_assessments(id) ON DELETE SET NULL,
    transaction_id VARCHAR(64) NOT NULL,
    account_id BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NEW',
    reviewer_notes VARCHAR(500),
    resolved_by VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,
    CONSTRAINT chk_fraud_alert_status CHECK (status IN ('NEW', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'))
);

-- 13. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMPTZ
);

-- 14. Transactional Outbox (Reliable event publishing)
CREATE TABLE IF NOT EXISTS notification_outbox (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    payload_json TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ,
    CONSTRAINT chk_outbox_status CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED'))
);

-- ==============================================================================
-- Performance & Workload-Justified Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_customers_customer_num ON customers(customer_number);
CREATE INDEX IF NOT EXISTS idx_accounts_account_num ON accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_accounts_customer_id ON accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_txn_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_source_acc ON transactions(source_account_id, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_dest_acc ON transactions(destination_account_id, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_status_created ON transactions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_txn_audit_txn_id ON transaction_audit(transaction_id);
CREATE INDEX IF NOT EXISTS idx_failed_tx_txn_id ON failed_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_acc ON risk_assessments(account_id, created_at);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX IF NOT EXISTS idx_outbox_status_created ON notification_outbox(status, created_at);
