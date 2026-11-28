-- ==============================================================================
-- Apex Banking System: V10 Enterprise Bank Loan Officer Module Schema
-- Adds 25 granular LOAN_* permissions, loan_officer_profiles, multi-branch isolation,
-- extended loan lifecycle statuses, document verification, credit assessments,
-- maker-checker loan approvals, disbursements, installment & overdue follow-ups,
-- communications & immutable audit logging.
-- ==============================================================================

-- 1. Granular Loan Officer & Credit Approval Permissions
INSERT INTO permissions (name, description) VALUES
('LOAN_DASHBOARD_VIEW', 'View Loan Officer operational dashboard and summary telemetry'),
('LOAN_CUSTOMER_VIEW', 'Search and view branch-scoped customer profiles, KYC, income and liabilities'),
('LOAN_APPLICATION_VIEW', 'View authorized branch and assigned loan applications'),
('LOAN_APPLICATION_CREATE', 'Register assisted loan applications on behalf of branch customers'),
('LOAN_APPLICATION_REVIEW', 'Review completeness, change review stages, and manage processing'),
('LOAN_APPLICATION_UPDATE', 'Update editable underwriting details and assign loan applications'),
('LOAN_DOCUMENT_VIEW', 'View and securely download uploaded loan supporting documents'),
('LOAN_DOCUMENT_VERIFY', 'Mark loan documents as verified after authenticity inspection'),
('LOAN_DOCUMENT_REJECT', 'Reject invalid/expired documents and request resubmission'),
('LOAN_CREDIT_ASSESS', 'Perform credit assessment, DTI/EMI/LTV analysis, and risk scoring'),
('LOAN_PROCESSING_MANAGE', 'Manage stage transitions, additional doc requests, and internal notes'),
('LOAN_APPROVAL_RECOMMEND', 'Submit maker recommendation for loan approval or rejection'),
('LOAN_APPROVAL_VIEW', 'View maker-checker approval queue and decision audit trail'),
('LOAN_DISBURSEMENT_INITIATE', 'Verify conditions and initiate authorized loan disbursement requests'),
('LOAN_DISBURSEMENT_VIEW', 'View disbursement pipeline and confirmation references'),
('LOAN_REPAYMENT_VIEW', 'Monitor EMI installment schedules, prepayments, and repayment history'),
('LOAN_OVERDUE_MANAGE', 'Track DPD delinquencies, log recovery follow-ups, and escalate defaults'),
('LOAN_PORTFOLIO_VIEW', 'View branch loan portfolio distribution and performance charts'),
('LOAN_CUSTOMER_COMMUNICATE', 'Send in-app notices, document reminders, and EMI alerts'),
('LOAN_REPORT_VIEW', 'Generate and export loan lifecycle CSV and printable reports'),
('LOAN_PROFILE_VIEW', 'View loan officer profile, branch assignment, and session history'),
('LOAN_MFA_MANAGE', 'Configure multi-factor authentication and trusted devices'),
('LOAN_FINAL_APPROVE', 'Grant final maker-checker approval or rejection of loan recommendations'),
('LOAN_DISBURSEMENT_APPROVE', 'Authorize execution of loan disbursement into customer account'),
('LOAN_WAIVE_DUES', 'Authorized waiver/restructuring of overdue EMI dues (Supervisor/Admin only)')
ON CONFLICT (name) DO NOTHING;

-- Grant LOAN_OFFICER permissions (excludes final approval & fee/due waivers to preserve maker-checker)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'LOAN_OFFICER' AND p.name IN (
    'LOAN_DASHBOARD_VIEW', 'LOAN_CUSTOMER_VIEW', 'LOAN_APPLICATION_VIEW',
    'LOAN_APPLICATION_CREATE', 'LOAN_APPLICATION_REVIEW', 'LOAN_APPLICATION_UPDATE',
    'LOAN_DOCUMENT_VIEW', 'LOAN_DOCUMENT_VERIFY', 'LOAN_DOCUMENT_REJECT',
    'LOAN_CREDIT_ASSESS', 'LOAN_PROCESSING_MANAGE', 'LOAN_APPROVAL_RECOMMEND',
    'LOAN_APPROVAL_VIEW', 'LOAN_DISBURSEMENT_INITIATE', 'LOAN_DISBURSEMENT_VIEW',
    'LOAN_REPAYMENT_VIEW', 'LOAN_OVERDUE_MANAGE', 'LOAN_PORTFOLIO_VIEW',
    'LOAN_CUSTOMER_COMMUNICATE', 'LOAN_REPORT_VIEW', 'LOAN_PROFILE_VIEW',
    'LOAN_MFA_MANAGE', 'AUDIT_VIEW'
)
ON CONFLICT DO NOTHING;

-- Grant BANK_MANAGER credit approval & disbursement oversight permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'BANK_MANAGER' AND p.name IN (
    'LOAN_DASHBOARD_VIEW', 'LOAN_CUSTOMER_VIEW', 'LOAN_APPLICATION_VIEW',
    'LOAN_APPLICATION_REVIEW', 'LOAN_DOCUMENT_VIEW', 'LOAN_APPROVAL_VIEW',
    'LOAN_DISBURSEMENT_VIEW', 'LOAN_REPAYMENT_VIEW', 'LOAN_OVERDUE_MANAGE',
    'LOAN_PORTFOLIO_VIEW', 'LOAN_REPORT_VIEW', 'LOAN_PROFILE_VIEW',
    'LOAN_FINAL_APPROVE', 'LOAN_DISBURSEMENT_APPROVE', 'LOAN_WAIVE_DUES'
)
ON CONFLICT DO NOTHING;

-- Grant AUDITOR read-only loan inspection permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'AUDITOR' AND p.name IN (
    'LOAN_DASHBOARD_VIEW', 'LOAN_CUSTOMER_VIEW', 'LOAN_APPLICATION_VIEW',
    'LOAN_DOCUMENT_VIEW', 'LOAN_APPROVAL_VIEW', 'LOAN_DISBURSEMENT_VIEW',
    'LOAN_REPAYMENT_VIEW', 'LOAN_PORTFOLIO_VIEW', 'LOAN_REPORT_VIEW'
)
ON CONFLICT DO NOTHING;

-- Grant ADMIN all newly added LOAN_* permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ADMIN'
ON CONFLICT DO NOTHING;

-- 2. Seed Regional Branch-2 Loan Officer for Multi-Branch Isolation Testing (Password: "password")
INSERT INTO users (username, email, password_hash, enabled) VALUES
('meera_iyer', 'meera.iyer@apexbank.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', TRUE)
ON CONFLICT (username) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'meera_iyer' AND r.name = 'LOAN_OFFICER'
ON CONFLICT DO NOTHING;

-- 3. Loan Officer Employee Profiles Table
CREATE TABLE IF NOT EXISTS loan_officer_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(32) NOT NULL UNIQUE,
    officer_id VARCHAR(32) NOT NULL UNIQUE,
    branch_id BIGINT NOT NULL REFERENCES branches(id),
    department VARCHAR(80) NOT NULL DEFAULT 'Retail & Commercial Credit',
    employment_status VARCHAR(25) NOT NULL DEFAULT 'ACTIVE',
    shift_status VARCHAR(25) NOT NULL DEFAULT 'ON_SHIFT',
    delegated_approval_limit NUMERIC(15, 2) NOT NULL DEFAULT 500000.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO loan_officer_profiles (user_id, employee_id, officer_id, branch_id, department, employment_status, shift_status, delegated_approval_limit)
SELECT u.id, 'EMP3041', 'LO301', b.id, 'Retail & MSME Underwriting', 'ACTIVE', 'ON_SHIFT', 500000.00
FROM users u, branches b WHERE u.username = 'ananya_verma' AND b.branch_code = 'BR001'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO loan_officer_profiles (user_id, employee_id, officer_id, branch_id, department, employment_status, shift_status, delegated_approval_limit)
SELECT u.id, 'EMP3042', 'LO302', b.id, 'Regional Credit Operations', 'ACTIVE', 'ON_SHIFT', 500000.00
FROM users u, branches b WHERE u.username = 'meera_iyer' AND b.branch_code = 'BR002'
ON CONFLICT (user_id) DO NOTHING;

-- 4. Extend Core Loans & Schedules Tables (Backward-Compatible)
ALTER TABLE loans ADD COLUMN IF NOT EXISTS loan_category VARCHAR(30) NOT NULL DEFAULT 'PERSONAL';
ALTER TABLE loans ADD COLUMN IF NOT EXISTS branch_id BIGINT REFERENCES branches(id);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS assigned_officer VARCHAR(50);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS employment_type VARCHAR(40) NOT NULL DEFAULT 'SALARIED';
ALTER TABLE loans ADD COLUMN IF NOT EXISTS recommended_amount NUMERIC(15, 2);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS recommended_interest_rate NUMERIC(5, 2);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS recommended_term_months INTEGER;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS collateral_type VARCHAR(60);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS collateral_value NUMERIC(15, 2);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS ltv_ratio NUMERIC(5, 2);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS created_by VARCHAR(50);

UPDATE loans l
SET branch_id = COALESCE(l.branch_id, c.branch_id),
    assigned_officer = COALESCE(l.assigned_officer, 'ananya_verma')
FROM customers c
WHERE l.customer_id = c.id;

ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_status_check;
ALTER TABLE loans ADD CONSTRAINT loans_status_check CHECK (
    status IN (
        'PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'DOCUMENT_VERIFICATION',
        'CREDIT_ASSESSMENT', 'ADDITIONAL_INFORMATION_REQUIRED', 'APPROVAL_PENDING',
        'APPROVED', 'REJECTED', 'DISBURSEMENT_PENDING', 'DISBURSED', 'PAID', 'CANCELLED'
    )
);

CREATE INDEX IF NOT EXISTS idx_loans_branch_id ON loans(branch_id);
CREATE INDEX IF NOT EXISTS idx_loans_assigned_officer ON loans(assigned_officer);
CREATE INDEX IF NOT EXISTS idx_loans_category ON loans(loan_category);

ALTER TABLE loan_repayment_schedules ADD COLUMN IF NOT EXISTS waived_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE loan_repayment_schedules ADD COLUMN IF NOT EXISTS last_payment_ref VARCHAR(64);
ALTER TABLE loan_repayment_schedules DROP CONSTRAINT IF EXISTS loan_repayment_schedules_status_check;
ALTER TABLE loan_repayment_schedules ADD CONSTRAINT loan_repayment_schedules_status_check CHECK (
    status IN ('PENDING', 'UPCOMING', 'DUE', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'WAIVED')
);

-- 5. Loan Documents & Document Verification Trail
CREATE TABLE IF NOT EXISTS loan_documents (
    id BIGSERIAL PRIMARY KEY,
    document_id VARCHAR(64) NOT NULL UNIQUE,
    loan_id BIGINT NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    document_type VARCHAR(60) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    file_size BIGINT NOT NULL DEFAULT 0,
    storage_path VARCHAR(512) NOT NULL,
    verification_status VARCHAR(35) NOT NULL DEFAULT 'PENDING'
        CHECK (verification_status IN ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED', 'RESUBMISSION_REQUIRED')),
    expiry_date DATE,
    remarks TEXT,
    rejection_reason TEXT,
    uploaded_by VARCHAR(50) NOT NULL,
    verified_by VARCHAR(50),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loan_docs_loan_id ON loan_documents(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_docs_status ON loan_documents(verification_status);

CREATE TABLE IF NOT EXISTS loan_document_verifications (
    id BIGSERIAL PRIMARY KEY,
    verification_id VARCHAR(64) NOT NULL UNIQUE,
    document_id BIGINT NOT NULL REFERENCES loan_documents(id) ON DELETE CASCADE,
    loan_id BIGINT NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    previous_status VARCHAR(35),
    new_status VARCHAR(35) NOT NULL,
    verified_by VARCHAR(50) NOT NULL,
    remarks TEXT,
    rejection_reason TEXT,
    verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doc_verif_doc_id ON loan_document_verifications(document_id);

-- 6. Credit Assessments Table
CREATE TABLE IF NOT EXISTS loan_credit_assessments (
    id BIGSERIAL PRIMARY KEY,
    assessment_id VARCHAR(64) NOT NULL UNIQUE,
    loan_id BIGINT NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    monthly_income NUMERIC(15, 2) NOT NULL,
    existing_debt NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    requested_amount NUMERIC(15, 2) NOT NULL,
    eligible_amount NUMERIC(15, 2) NOT NULL,
    proposed_interest_rate NUMERIC(5, 2) NOT NULL,
    proposed_tenure_months INTEGER NOT NULL,
    estimated_emi NUMERIC(15, 2) NOT NULL,
    total_repayment NUMERIC(15, 2) NOT NULL,
    total_interest NUMERIC(15, 2) NOT NULL,
    remaining_monthly_income NUMERIC(15, 2) NOT NULL,
    dti_ratio NUMERIC(5, 2) NOT NULL,
    ltv_ratio NUMERIC(5, 2),
    credit_score INTEGER NOT NULL,
    credit_source VARCHAR(60) NOT NULL DEFAULT 'SIMULATED_CIBIL',
    employment_stability VARCHAR(40) NOT NULL DEFAULT 'STABLE',
    collateral_value NUMERIC(15, 2),
    risk_category VARCHAR(20) NOT NULL CHECK (risk_category IN ('LOW', 'MEDIUM', 'HIGH')),
    recommendation VARCHAR(35) NOT NULL CHECK (recommendation IN ('RECOMMENDED', 'NOT_RECOMMENDED', 'REQUIRES_ADDITIONAL_REVIEW')),
    officer_remarks TEXT,
    assessed_by VARCHAR(50) NOT NULL,
    assessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credit_assess_loan_id ON loan_credit_assessments(loan_id);

-- 7. Maker-Checker Loan Approval Requests Table
CREATE TABLE IF NOT EXISTS loan_approval_requests (
    id BIGSERIAL PRIMARY KEY,
    approval_id VARCHAR(64) NOT NULL UNIQUE,
    loan_id BIGINT NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    branch_id BIGINT REFERENCES branches(id),
    recommended_action VARCHAR(20) NOT NULL CHECK (recommended_action IN ('APPROVE', 'REJECT')),
    recommended_amount NUMERIC(15, 2) NOT NULL,
    recommended_interest_rate NUMERIC(5, 2) NOT NULL,
    recommended_term_months INTEGER NOT NULL,
    officer_remarks TEXT,
    submitted_by VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RETURNED_FOR_REVIEW', 'ESCALATED')),
    decision_by VARCHAR(50),
    decision_remarks TEXT,
    decided_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loan_approvals_loan_id ON loan_approval_requests(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_approvals_status ON loan_approval_requests(status);

-- 8. Loan Disbursements Table
CREATE TABLE IF NOT EXISTS loan_disbursements (
    id BIGSERIAL PRIMARY KEY,
    disbursement_id VARCHAR(64) NOT NULL UNIQUE,
    loan_id BIGINT NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    branch_id BIGINT REFERENCES branches(id),
    account_id BIGINT NOT NULL REFERENCES accounts(id),
    amount NUMERIC(15, 2) NOT NULL,
    disbursement_mode VARCHAR(40) NOT NULL DEFAULT 'CORE_LEDGER_SIMULATED',
    transaction_ref VARCHAR(64),
    conditions_verified BOOLEAN NOT NULL DEFAULT FALSE,
    beneficiary_verified BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'INITIATED'
        CHECK (status IN ('INITIATED', 'APPROVED', 'DISBURSED', 'REJECTED', 'FAILED')),
    initiated_by VARCHAR(50) NOT NULL,
    approved_by VARCHAR(50),
    remarks TEXT,
    disbursed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loan_disb_loan_id ON loan_disbursements(loan_id);

-- 9. Overdue Follow-ups & Recovery Tracking
CREATE TABLE IF NOT EXISTS loan_follow_ups (
    id BIGSERIAL PRIMARY KEY,
    followup_id VARCHAR(64) NOT NULL UNIQUE,
    loan_id BIGINT NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    branch_id BIGINT REFERENCES branches(id),
    followup_type VARCHAR(40) NOT NULL DEFAULT 'CALL_REMINDER',
    dpd_at_followup INTEGER NOT NULL DEFAULT 0,
    overdue_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    commitment_amount NUMERIC(15, 2),
    commitment_date DATE,
    outcome VARCHAR(120) NOT NULL,
    recovery_status VARCHAR(35) NOT NULL DEFAULT 'OPEN'
        CHECK (recovery_status IN ('OPEN', 'PROMISED_TO_PAY', 'ESCALATED', 'RESOLVED', 'DEFAULTED')),
    notes TEXT,
    escalated BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loan_followup_loan_id ON loan_follow_ups(loan_id);

-- 10. Customer Loan Communications Log
CREATE TABLE IF NOT EXISTS loan_communications (
    id BIGSERIAL PRIMARY KEY,
    communication_id VARCHAR(64) NOT NULL UNIQUE,
    loan_id BIGINT REFERENCES loans(id) ON DELETE CASCADE,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    channel VARCHAR(30) NOT NULL DEFAULT 'IN_APP_NOTIFICATION',
    communication_type VARCHAR(50) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    recipient VARCHAR(120),
    delivery_status VARCHAR(30) NOT NULL DEFAULT 'SENT_INTERNAL',
    sent_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loan_comm_loan_id ON loan_communications(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_comm_cust_id ON loan_communications(customer_id);

-- 11. Immutable Loan Officer Audit Trail
CREATE TABLE IF NOT EXISTS loan_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    audit_id VARCHAR(64) NOT NULL UNIQUE,
    loan_id BIGINT REFERENCES loans(id) ON DELETE SET NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(50) NOT NULL,
    employee_id VARCHAR(32),
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_ref VARCHAR(64),
    previous_state VARCHAR(120),
    new_state VARCHAR(120),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loan_audit_loan_id ON loan_audit_logs(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_audit_created_at ON loan_audit_logs(created_at);

-- 12. Seed Realistic Sample Loan Applications Across BR001 and BR002 (Preserves ACC1001 balance!)
INSERT INTO loans (
    loan_id, customer_id, account_id, amount, interest_rate, term_months, status,
    purpose, monthly_income, existing_monthly_debt, credit_score, dti_ratio,
    emi_amount, total_payable, outstanding_balance, assessment_notes,
    requires_admin_approval, reviewed_by, loan_category, branch_id, assigned_officer,
    employment_type, collateral_type, collateral_value, ltv_ratio, created_by
)
SELECT
    'LN_SEED_BR1_01', c.id, a.id, 350000.00, 8.75, 36, 'UNDER_REVIEW',
    'Home Renovation & Solar Rooftop Setup', 95000.00, 10000.00, 775, 22.19,
    11088.62, 399190.32, 399190.32, 'Strong CIBIL score and low DTI ratio.',
    FALSE, 'ananya_verma', 'HOME', b.id, 'ananya_verma',
    'SALARIED', 'RESIDENTIAL_PROPERTY', 1200000.00, 29.17, 'aarav_sharma'
FROM customers c, accounts a, branches b
WHERE c.customer_number = 'CUST1001' AND a.account_number = 'ACC1001' AND b.branch_code = 'BR001'
ON CONFLICT (loan_id) DO NOTHING;

INSERT INTO loans (
    loan_id, customer_id, account_id, amount, interest_rate, term_months, status,
    purpose, monthly_income, existing_monthly_debt, credit_score, dti_ratio,
    emi_amount, total_payable, outstanding_balance, assessment_notes,
    requires_admin_approval, reviewed_by, final_approved_by, disbursed_at,
    loan_category, branch_id, assigned_officer, employment_type, created_by
)
SELECT
    'LN_SEED_BR1_02', c.id, a.id, 180000.00, 9.25, 24, 'DISBURSED',
    'Commercial Packaging Equipment Expansion', 165000.00, 18000.00, 745, 15.90,
    8243.45, 197842.80, 164869.00, 'Verified MSME cashflows; approved & disbursed.',
    FALSE, 'ananya_verma', 'vikram_mehta', CURRENT_TIMESTAMP - INTERVAL '45 days',
    'BUSINESS', b.id, 'ananya_verma', 'SELF_EMPLOYED', 'ananya_verma'
FROM customers c, accounts a, branches b
WHERE c.customer_number = 'CUST1002' AND a.account_number = 'ACC2004' AND b.branch_code = 'BR001'
ON CONFLICT (loan_id) DO NOTHING;

INSERT INTO loans (
    loan_id, customer_id, account_id, amount, interest_rate, term_months, status,
    purpose, monthly_income, existing_monthly_debt, credit_score, dti_ratio,
    emi_amount, total_payable, outstanding_balance,
    requires_admin_approval, loan_category, branch_id, assigned_officer,
    employment_type, created_by
)
SELECT
    'LN_SEED_BR2_01', c.id, a.id, 420000.00, 8.50, 36, 'SUBMITTED',
    'Two-Wheeler & Electric Vehicle Purchase', 110000.00, 12000.00, 730, 22.96,
    13258.36, 477300.96, 477300.96,
    FALSE, 'VEHICLE', b.id, 'meera_iyer',
    'SALARIED', 'rohit_kulkarni'
FROM customers c, accounts a, branches b
WHERE c.customer_number = 'CUST2001' AND a.account_number = 'ACC2101' AND b.branch_code = 'BR002'
ON CONFLICT (loan_id) DO NOTHING;

-- Seed sample overdue & upcoming EMI rows on disbursed LN_SEED_BR1_02
INSERT INTO loan_repayment_schedules (loan_id, installment_number, due_date, principal_amount, interest_amount, total_installment, paid_amount, status)
SELECT l.id, 1, CURRENT_DATE - INTERVAL '20 days', 6855.95, 1387.50, 8243.45, 0.00, 'OVERDUE'
FROM loans l WHERE l.loan_id = 'LN_SEED_BR1_02'
  AND NOT EXISTS (SELECT 1 FROM loan_repayment_schedules s WHERE s.loan_id = l.id AND s.installment_number = 1);

INSERT INTO loan_repayment_schedules (loan_id, installment_number, due_date, principal_amount, interest_amount, total_installment, paid_amount, status)
SELECT l.id, 2, CURRENT_DATE + INTERVAL '10 days', 6908.80, 1334.65, 8243.45, 0.00, 'DUE'
FROM loans l WHERE l.loan_id = 'LN_SEED_BR1_02'
  AND NOT EXISTS (SELECT 1 FROM loan_repayment_schedules s WHERE s.loan_id = l.id AND s.installment_number = 2);

INSERT INTO loan_repayment_schedules (loan_id, installment_number, due_date, principal_amount, interest_amount, total_installment, paid_amount, status)
SELECT l.id, 3, CURRENT_DATE + INTERVAL '40 days', 6962.06, 1281.39, 8243.45, 0.00, 'UPCOMING'
FROM loans l WHERE l.loan_id = 'LN_SEED_BR1_02'
  AND NOT EXISTS (SELECT 1 FROM loan_repayment_schedules s WHERE s.loan_id = l.id AND s.installment_number = 3);
