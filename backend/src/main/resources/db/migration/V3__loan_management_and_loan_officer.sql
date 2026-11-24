-- ==============================================================================
-- Apex Banking System: V3 Loan Management and Loan Officer RBAC
-- Adds LOAN_OFFICER role, loan applications, repayment schedules & audit trail
-- ==============================================================================

-- 1. Insert LOAN_OFFICER Role
INSERT INTO roles (name, description) VALUES
('LOAN_OFFICER', 'Loan officer assessing creditworthiness, underwriting, approving and disbursing loans')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Default Loan Officer User (Password: "password")
INSERT INTO users (username, email, password_hash, enabled) VALUES
('loan_officer1', 'loan.officer1@apexbank.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Map Loan Officer Role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'loan_officer1' AND r.name = 'LOAN_OFFICER'
ON CONFLICT DO NOTHING;

-- 3. Create Loans Table
CREATE TABLE IF NOT EXISTS loans (
    id BIGSERIAL PRIMARY KEY,
    loan_id VARCHAR(64) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    interest_rate NUMERIC(5, 2) NOT NULL CHECK (interest_rate >= 0),
    term_months INTEGER NOT NULL CHECK (term_months > 0),
    status VARCHAR(35) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ADDITIONAL_INFORMATION_REQUIRED', 'DISBURSED', 'PAID')),
    purpose VARCHAR(255) NOT NULL,
    monthly_income NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    existing_monthly_debt NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    credit_score INTEGER NOT NULL DEFAULT 700 CHECK (credit_score BETWEEN 300 AND 900),
    dti_ratio NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    emi_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_payable NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    outstanding_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    assessment_notes TEXT,
    document_urls TEXT,
    requires_admin_approval BOOLEAN NOT NULL DEFAULT FALSE,
    reviewed_by VARCHAR(50),
    final_approved_by VARCHAR(50),
    rejection_reason TEXT,
    disbursed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loans_loan_id ON loans(loan_id);
CREATE INDEX IF NOT EXISTS idx_loans_customer_id ON loans(customer_id);
CREATE INDEX IF NOT EXISTS idx_loans_account_id ON loans(account_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_created_at ON loans(created_at);

-- 4. Create Loan Repayment Schedules Table
CREATE TABLE IF NOT EXISTS loan_repayment_schedules (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    principal_amount NUMERIC(15, 2) NOT NULL,
    interest_amount NUMERIC(15, 2) NOT NULL,
    total_installment NUMERIC(15, 2) NOT NULL,
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    paid_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'PAID', 'OVERDUE')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_repayment_loan_id ON loan_repayment_schedules(loan_id);
CREATE INDEX IF NOT EXISTS idx_repayment_status ON loan_repayment_schedules(status);
CREATE INDEX IF NOT EXISTS idx_repayment_due_date ON loan_repayment_schedules(due_date);

-- 5. Create Loan Status Change History Table (Complete Audit Trail)
CREATE TABLE IF NOT EXISTS loan_status_history (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    previous_status VARCHAR(35),
    new_status VARCHAR(35) NOT NULL,
    changed_by VARCHAR(50) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loan_history_loan_id ON loan_status_history(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_history_created_at ON loan_status_history(created_at);
