-- ==============================================================================
-- Apex Banking System: V3 Loan Management and Loan Officer RBAC
-- Adds LOAN_OFFICER role, loan applications table, and initial seed
-- ==============================================================================

-- 1. Insert LOAN_OFFICER Role
INSERT INTO roles (name, description) VALUES
('LOAN_OFFICER', 'Loan officer assessing creditworthiness, underwriting, approving and disbursing loans')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Default Loan Officer User
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
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED', 'PAID')),
    purpose VARCHAR(255) NOT NULL,
    reviewed_by VARCHAR(50),
    rejection_reason TEXT,
    disbursed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loans_loan_id ON loans(loan_id);
CREATE INDEX IF NOT EXISTS idx_loans_customer_id ON loans(customer_id);
CREATE INDEX IF NOT EXISTS idx_loans_account_id ON loans(account_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
