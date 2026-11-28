-- ==============================================================================
-- Apex Banking System: V9 Enterprise Bank Teller Module Schema
-- Adds Branches, Granular Permissions, Teller Profiles, Cash Drawers & Ledger,
-- Cash Reconciliations, Cheques, Service Requests, Complaints, Reversals & Approvals.
-- ==============================================================================

-- 1. Additional Banking Roles
INSERT INTO roles (name, description) VALUES
('BANK_MANAGER', 'Branch & operations manager approving high-value teller operations and cash reconciliations'),
('AUDITOR', 'Internal compliance auditor with read-only access to branch reports and audit logs')
ON CONFLICT (name) DO NOTHING;

-- 2. Granular Permissions & Role Mapping
CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

INSERT INTO permissions (name, description) VALUES
('CUSTOMER_VIEW', 'View authorized customer profiles and KYC status'),
('ACCOUNT_VIEW', 'View authorized branch accounts and status'),
('ACCOUNT_BALANCE_VIEW', 'Check customer account balances'),
('ACCOUNT_STATEMENT_VIEW', 'View and export customer account statements'),
('CASH_DEPOSIT', 'Process branch cash deposits'),
('CASH_WITHDRAWAL', 'Process branch cash withdrawals'),
('FUND_TRANSFER_INITIATE', 'Initiate assisted branch fund transfers'),
('TRANSACTION_VIEW', 'View teller and branch transactions'),
('TRANSACTION_RECEIPT_GENERATE', 'Generate and reprint transaction receipts'),
('CHEQUE_DEPOSIT', 'Register cheque deposits, stop payments, and cheque book requests'),
('CHEQUE_VIEW', 'View and track cheque clearing status'),
('SERVICE_REQUEST_CREATE', 'Create and track customer service requests'),
('COMPLAINT_CREATE', 'Register and escalate customer complaints and disputes'),
('DAILY_REPORT_VIEW', 'View and export daily teller and branch reports'),
('CASH_RECONCILIATION', 'Manage teller cash drawer and submit EOD cash reconciliation'),
('PROFILE_VIEW', 'View employee profile and session activity'),
('MFA_MANAGE', 'Configure multi-factor authentication and trusted devices'),
('KYC_VERIFY', 'Approve or reject customer KYC verification status'),
('APPROVAL_MANAGE', 'Review and decide sensitive teller & high-value approval requests'),
('REVERSAL_APPROVE', 'Approve or reject financial transaction reversal requests'),
('CASH_RECONCILIATION_VERIFY', 'Verify and sign off end-of-day teller cash reconciliations'),
('CHEQUE_CLEAR', 'Mark cheques as cleared or bounced after clearing house settlement'),
('COMPLAINT_RESOLVE', 'Resolve or close financial complaints and investigations'),
('AUDIT_VIEW', 'Inspect full audit trails across operations')
ON CONFLICT (name) DO NOTHING;

-- Grant TELLER permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'TELLER' AND p.name IN (
    'CUSTOMER_VIEW', 'ACCOUNT_VIEW', 'ACCOUNT_BALANCE_VIEW', 'ACCOUNT_STATEMENT_VIEW',
    'CASH_DEPOSIT', 'CASH_WITHDRAWAL', 'FUND_TRANSFER_INITIATE', 'TRANSACTION_VIEW',
    'TRANSACTION_RECEIPT_GENERATE', 'CHEQUE_DEPOSIT', 'CHEQUE_VIEW',
    'SERVICE_REQUEST_CREATE', 'COMPLAINT_CREATE', 'DAILY_REPORT_VIEW',
    'CASH_RECONCILIATION', 'PROFILE_VIEW', 'MFA_MANAGE'
)
ON CONFLICT DO NOTHING;

-- Grant BANK_MANAGER permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'BANK_MANAGER' AND p.name IN (
    'CUSTOMER_VIEW', 'ACCOUNT_VIEW', 'ACCOUNT_BALANCE_VIEW', 'ACCOUNT_STATEMENT_VIEW',
    'CASH_DEPOSIT', 'CASH_WITHDRAWAL', 'FUND_TRANSFER_INITIATE', 'TRANSACTION_VIEW',
    'TRANSACTION_RECEIPT_GENERATE', 'CHEQUE_DEPOSIT', 'CHEQUE_VIEW',
    'SERVICE_REQUEST_CREATE', 'COMPLAINT_CREATE', 'DAILY_REPORT_VIEW',
    'CASH_RECONCILIATION', 'PROFILE_VIEW', 'MFA_MANAGE',
    'KYC_VERIFY', 'APPROVAL_MANAGE', 'REVERSAL_APPROVE',
    'CASH_RECONCILIATION_VERIFY', 'CHEQUE_CLEAR', 'COMPLAINT_RESOLVE', 'AUDIT_VIEW'
)
ON CONFLICT DO NOTHING;

-- Grant ADMIN all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ADMIN'
ON CONFLICT DO NOTHING;

-- Grant AUDITOR read-only audit & reporting permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'AUDITOR' AND p.name IN (
    'CUSTOMER_VIEW', 'ACCOUNT_VIEW', 'ACCOUNT_BALANCE_VIEW', 'ACCOUNT_STATEMENT_VIEW',
    'TRANSACTION_VIEW', 'CHEQUE_VIEW', 'DAILY_REPORT_VIEW', 'AUDIT_VIEW', 'PROFILE_VIEW', 'MFA_MANAGE'
)
ON CONFLICT DO NOTHING;

-- Grant RISK_ANALYST, LOAN_OFFICER, CUSTOMER baseline permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'RISK_ANALYST' AND p.name IN (
    'CUSTOMER_VIEW', 'ACCOUNT_VIEW', 'TRANSACTION_VIEW', 'COMPLAINT_CREATE',
    'COMPLAINT_RESOLVE', 'DAILY_REPORT_VIEW', 'AUDIT_VIEW', 'PROFILE_VIEW', 'MFA_MANAGE'
)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'LOAN_OFFICER' AND p.name IN (
    'CUSTOMER_VIEW', 'ACCOUNT_VIEW', 'ACCOUNT_STATEMENT_VIEW', 'PROFILE_VIEW', 'MFA_MANAGE'
)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'CUSTOMER' AND p.name IN ('PROFILE_VIEW', 'MFA_MANAGE')
ON CONFLICT DO NOTHING;

-- 3. Branches
CREATE TABLE IF NOT EXISTS branches (
    id BIGSERIAL PRIMARY KEY,
    branch_code VARCHAR(20) NOT NULL UNIQUE,
    branch_name VARCHAR(120) NOT NULL,
    city VARCHAR(80) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO branches (branch_code, branch_name, city, ifsc_code, status) VALUES
('BR001', 'Apex Financial District Main Branch', 'Hyderabad', 'APEX0001001', 'ACTIVE'),
('BR002', 'Bengaluru Tech Park Branch', 'Bengaluru', 'APEX0002001', 'ACTIVE')
ON CONFLICT (branch_code) DO NOTHING;

-- Attach branches and KYC status to existing customers & accounts
ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS branch_id BIGINT REFERENCES branches(id),
    ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(25) NOT NULL DEFAULT 'VERIFIED';

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS branch_id BIGINT REFERENCES branches(id);

UPDATE customers
SET branch_id = (SELECT id FROM branches WHERE branch_code = 'BR001')
WHERE branch_id IS NULL;

UPDATE accounts
SET branch_id = (SELECT id FROM branches WHERE branch_code = 'BR001')
WHERE branch_id IS NULL;

-- Seed dedicated BR002 customer & account for multi-branch isolation verification
INSERT INTO customers (customer_number, user_id, first_name, last_name, email, phone, address, branch_id, kyc_status)
SELECT 'CUST2001', NULL, 'Siddharth', 'Menon', 'siddharth.menon.br2@apexbank.com', '+91 9845001122',
       '88 Outer Ring Road, Bengaluru', b.id, 'PENDING'
FROM branches b WHERE b.branch_code = 'BR002'
ON CONFLICT (customer_number) DO NOTHING;

INSERT INTO accounts (account_number, customer_id, balance, currency, status, branch_id)
SELECT 'ACC2101', c.id, 42000.00, 'INR', 'ACTIVE', b.id
FROM customers c, branches b
WHERE c.customer_number = 'CUST2001' AND b.branch_code = 'BR002'
ON CONFLICT (account_number) DO NOTHING;

INSERT INTO account_transaction_limits (account_id, daily_limit, per_transaction_limit)
SELECT a.id, 100000.00, 50000.00 FROM accounts a WHERE a.account_number = 'ACC2101'
ON CONFLICT (account_id) DO NOTHING;

-- Extend transaction status check constraint to support PENDING, UNDER_REVIEW, REVERSED
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_transaction_status;
ALTER TABLE transactions ADD CONSTRAINT chk_transaction_status
    CHECK (status IN ('SUCCESS', 'FAILED', 'REJECTED', 'PENDING', 'UNDER_REVIEW', 'REVERSED'));

-- 4. Seed Branch Manager (vikram_mehta), Branch 2 Teller (daniel_brooks), and Auditor (elena_rostova)
INSERT INTO users (username, email, password_hash, enabled) VALUES
('vikram_mehta', 'vikram.mehta@apexbank.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', TRUE),
('daniel_brooks', 'daniel.brooks@apexbank.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', TRUE),
('elena_rostova', 'elena.rostova@apexbank.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', TRUE)
ON CONFLICT (username) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'vikram_mehta' AND r.name = 'BANK_MANAGER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'daniel_brooks' AND r.name = 'TELLER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'elena_rostova' AND r.name = 'AUDITOR'
ON CONFLICT DO NOTHING;

-- 5. Teller Employee Profiles
CREATE TABLE IF NOT EXISTS teller_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(32) NOT NULL UNIQUE,
    teller_id VARCHAR(32) NOT NULL UNIQUE,
    branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    drawer_code VARCHAR(32) NOT NULL,
    employment_status VARCHAR(25) NOT NULL DEFAULT 'ACTIVE',
    shift_status VARCHAR(25) NOT NULL DEFAULT 'ON_SHIFT',
    max_cash_limit NUMERIC(15, 2) NOT NULL DEFAULT 200000.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO teller_profiles (user_id, employee_id, teller_id, branch_id, drawer_code, employment_status, shift_status, max_cash_limit)
SELECT u.id, 'EMP2041', 'TLR101', b.id, 'DRW-BR001-01', 'ACTIVE', 'ON_SHIFT', 200000.00
FROM users u, branches b WHERE u.username = 'rohan_kulkarni' AND b.branch_code = 'BR001'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO teller_profiles (user_id, employee_id, teller_id, branch_id, drawer_code, employment_status, shift_status, max_cash_limit)
SELECT u.id, 'EMP2042', 'TLR201', b.id, 'DRW-BR002-01', 'ACTIVE', 'ON_SHIFT', 200000.00
FROM users u, branches b WHERE u.username = 'daniel_brooks' AND b.branch_code = 'BR002'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO teller_profiles (user_id, employee_id, teller_id, branch_id, drawer_code, employment_status, shift_status, max_cash_limit)
SELECT u.id, 'EMP1010', 'MGR101', b.id, 'VAULT-BR001', 'ACTIVE', 'ON_SHIFT', 1000000.00
FROM users u, branches b WHERE u.username = 'vikram_mehta' AND b.branch_code = 'BR001'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO teller_profiles (user_id, employee_id, teller_id, branch_id, drawer_code, employment_status, shift_status, max_cash_limit)
SELECT u.id, 'EMP0001', 'ADM001', b.id, 'VAULT-HQ', 'ACTIVE', 'ON_SHIFT', 5000000.00
FROM users u, branches b WHERE u.username = 'system_administrator' AND b.branch_code = 'BR001'
ON CONFLICT (user_id) DO NOTHING;

-- 6. Teller Cash Drawers & Drawer Transactions
CREATE TABLE IF NOT EXISTS teller_drawers (
    id BIGSERIAL PRIMARY KEY,
    teller_profile_id BIGINT NOT NULL REFERENCES teller_profiles(id) ON DELETE RESTRICT,
    branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    drawer_code VARCHAR(32) NOT NULL,
    business_date DATE NOT NULL DEFAULT CURRENT_DATE,
    opening_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    cash_received NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    cash_paid_out NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(25) NOT NULL DEFAULT 'OPEN',
    version BIGINT NOT NULL DEFAULT 0,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMPTZ,
    CONSTRAINT chk_drawer_balance_non_negative CHECK (current_balance >= 0.00),
    CONSTRAINT uq_drawer_profile_date UNIQUE (teller_profile_id, business_date)
);

CREATE TABLE IF NOT EXISTS cash_drawer_transactions (
    id BIGSERIAL PRIMARY KEY,
    drawer_id BIGINT NOT NULL REFERENCES teller_drawers(id) ON DELETE CASCADE,
    transaction_id VARCHAR(64),
    operation_type VARCHAR(35) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    balance_before NUMERIC(15, 2) NOT NULL,
    balance_after NUMERIC(15, 2) NOT NULL,
    depositor_name VARCHAR(120),
    depositor_id_ref VARCHAR(80),
    remarks VARCHAR(500),
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed active open drawers for rohan_kulkarni and daniel_brooks
INSERT INTO teller_drawers (teller_profile_id, branch_id, drawer_code, business_date, opening_balance, cash_received, cash_paid_out, current_balance, status)
SELECT tp.id, tp.branch_id, tp.drawer_code, CURRENT_DATE, 500000.00, 0.00, 0.00, 500000.00, 'OPEN'
FROM teller_profiles tp WHERE tp.teller_id = 'TLR101'
ON CONFLICT (teller_profile_id, business_date) DO NOTHING;

INSERT INTO teller_drawers (teller_profile_id, branch_id, drawer_code, business_date, opening_balance, cash_received, cash_paid_out, current_balance, status)
SELECT tp.id, tp.branch_id, tp.drawer_code, CURRENT_DATE, 300000.00, 0.00, 0.00, 300000.00, 'OPEN'
FROM teller_profiles tp WHERE tp.teller_id = 'TLR201'
ON CONFLICT (teller_profile_id, business_date) DO NOTHING;

-- 7. Cash Reconciliations
CREATE TABLE IF NOT EXISTS cash_reconciliations (
    id BIGSERIAL PRIMARY KEY,
    reconciliation_id VARCHAR(40) NOT NULL UNIQUE,
    drawer_id BIGINT NOT NULL REFERENCES teller_drawers(id) ON DELETE RESTRICT,
    teller_profile_id BIGINT NOT NULL REFERENCES teller_profiles(id) ON DELETE RESTRICT,
    branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    business_date DATE NOT NULL,
    system_expected_balance NUMERIC(15, 2) NOT NULL,
    declared_physical_cash NUMERIC(15, 2) NOT NULL,
    variance_amount NUMERIC(15, 2) NOT NULL,
    variance_type VARCHAR(20) NOT NULL,
    remarks VARCHAR(500),
    status VARCHAR(25) NOT NULL DEFAULT 'SUBMITTED',
    submitted_by VARCHAR(50) NOT NULL,
    verified_by VARCHAR(50),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Cheque Services
CREATE TABLE IF NOT EXISTS cheques (
    id BIGSERIAL PRIMARY KEY,
    cheque_ref VARCHAR(40) NOT NULL UNIQUE,
    cheque_number VARCHAR(32) NOT NULL,
    account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    drawer_account_number VARCHAR(40),
    issuing_bank_name VARCHAR(120) NOT NULL,
    issuing_branch VARCHAR(120),
    cheque_date DATE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0.00),
    request_type VARCHAR(25) NOT NULL DEFAULT 'DEPOSIT',
    status VARCHAR(30) NOT NULL DEFAULT 'RECEIVED',
    attachment_ref VARCHAR(255),
    remarks VARCHAR(500),
    submitted_by VARCHAR(50) NOT NULL,
    processed_by VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Customer Service Requests
CREATE TABLE IF NOT EXISTS service_requests (
    id BIGSERIAL PRIMARY KEY,
    request_id VARCHAR(40) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    account_id BIGINT REFERENCES accounts(id) ON DELETE RESTRICT,
    branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    request_type VARCHAR(50) NOT NULL,
    description VARCHAR(500) NOT NULL,
    payload_json TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    approval_status VARCHAR(30) NOT NULL DEFAULT 'NOT_REQUIRED',
    submitted_by VARCHAR(50) NOT NULL,
    assigned_to VARCHAR(50),
    approved_by VARCHAR(50),
    resolution_remarks VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Customer Disputes & Complaints
CREATE TABLE IF NOT EXISTS customer_complaints (
    id BIGSERIAL PRIMARY KEY,
    complaint_id VARCHAR(40) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    account_id BIGINT REFERENCES accounts(id) ON DELETE RESTRICT,
    branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    transaction_id VARCHAR(64),
    category VARCHAR(40) NOT NULL,
    subject VARCHAR(180) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    submitted_by VARCHAR(50) NOT NULL,
    assigned_to VARCHAR(50),
    internal_remarks VARCHAR(1000),
    escalated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. Transaction Reversal Requests & General Teller Approval Requests
CREATE TABLE IF NOT EXISTS transaction_reversal_requests (
    id BIGSERIAL PRIMARY KEY,
    reversal_id VARCHAR(40) NOT NULL UNIQUE,
    transaction_id VARCHAR(64) NOT NULL,
    account_id BIGINT REFERENCES accounts(id) ON DELETE RESTRICT,
    branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    amount NUMERIC(15, 2) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_APPROVAL',
    requested_by VARCHAR(50) NOT NULL,
    reviewed_by VARCHAR(50),
    review_notes VARCHAR(500),
    reversal_transaction_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS teller_approval_requests (
    id BIGSERIAL PRIMARY KEY,
    approval_id VARCHAR(40) NOT NULL UNIQUE,
    branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    entity_type VARCHAR(40) NOT NULL,
    entity_ref VARCHAR(64) NOT NULL,
    action_type VARCHAR(40) NOT NULL,
    amount NUMERIC(15, 2),
    requested_by VARCHAR(50) NOT NULL,
    status VARCHAR(25) NOT NULL DEFAULT 'PENDING',
    reviewed_by VARCHAR(50),
    review_notes VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teller_profiles_branch ON teller_profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_cash_drawer_tx_drawer ON cash_drawer_transactions(drawer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_cheques_branch_status ON cheques(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_service_req_branch_status ON service_requests(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_complaints_branch_status ON customer_complaints(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_reversal_branch_status ON transaction_reversal_requests(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_teller_approval_branch ON teller_approval_requests(branch_id, status);
