-- ==============================================================================
-- Apex Banking System: V2 Initial Seed Data
-- Standard roles, administrative users, customers, and accounts
-- ==============================================================================

-- 1. Insert Roles
INSERT INTO roles (name, description) VALUES
('ADMIN', 'System administrator with full operational access'),
('CUSTOMER', 'Retail banking customer with access to own accounts and transactions'),
('TELLER', 'Bank branch staff authorized for deposits, withdrawals, and transfers'),
('RISK_ANALYST', 'Risk & compliance analyst monitoring fraud alerts and account freezes')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Default Users (Password: "password" -> BCrypt hash)
-- Standard BCrypt hash for "password": $2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG
INSERT INTO users (username, email, password_hash, enabled) VALUES
('admin', 'admin@apexbank.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', TRUE),
('teller1', 'teller1@apexbank.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', TRUE),
('analyst1', 'analyst1@apexbank.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', TRUE),
('john_doe', 'john.doe@apexbank.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', TRUE),
('jane_smith', 'jane.smith@apexbank.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Map User Roles
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'admin' AND r.name = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'teller1' AND r.name = 'TELLER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'analyst1' AND r.name = 'RISK_ANALYST'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'john_doe' AND r.name = 'CUSTOMER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'jane_smith' AND r.name = 'CUSTOMER'
ON CONFLICT DO NOTHING;

-- 3. Insert Customers
INSERT INTO customers (customer_number, user_id, first_name, last_name, email, phone, address)
SELECT 'CUST1001', u.id, 'John', 'Doe', 'john.doe@apexbank.com', '+91 9876543210', '101 Financial District, Cyberabad'
FROM users u WHERE u.username = 'john_doe'
ON CONFLICT (customer_number) DO NOTHING;

INSERT INTO customers (customer_number, user_id, first_name, last_name, email, phone, address)
SELECT 'CUST1002', u.id, 'Jane', 'Smith', 'jane.smith@apexbank.com', '+91 9876543211', '204 High Street, Jubilee Hills'
FROM users u WHERE u.username = 'jane_smith'
ON CONFLICT (customer_number) DO NOTHING;

-- 4. Insert Accounts
-- Mandatory Concurrency Account: ACC1001 starts with exact balance ₹10,000.00
INSERT INTO accounts (account_number, customer_id, balance, currency, status)
SELECT 'ACC1001', c.id, 10000.00, 'INR', 'ACTIVE'
FROM customers c WHERE c.customer_number = 'CUST1001'
ON CONFLICT (account_number) DO NOTHING;

INSERT INTO accounts (account_number, customer_id, balance, currency, status)
SELECT 'ACC2004', c.id, 25000.00, 'INR', 'ACTIVE'
FROM customers c WHERE c.customer_number = 'CUST1002'
ON CONFLICT (account_number) DO NOTHING;

INSERT INTO accounts (account_number, customer_id, balance, currency, status)
SELECT 'ACC3005', c.id, 5000.00, 'INR', 'ACTIVE'
FROM customers c WHERE c.customer_number = 'CUST1001'
ON CONFLICT (account_number) DO NOTHING;

INSERT INTO accounts (account_number, customer_id, balance, currency, status)
SELECT 'ACC9999', c.id, 15000.00, 'INR', 'FROZEN'
FROM customers c WHERE c.customer_number = 'CUST1002'
ON CONFLICT (account_number) DO NOTHING;

-- 5. Insert Transaction Limits
INSERT INTO account_transaction_limits (account_id, daily_limit, per_transaction_limit)
SELECT a.id, 100000.00, 50000.00
FROM accounts a
ON CONFLICT (account_id) DO NOTHING;

-- 6. Insert Status History for Frozen Account
INSERT INTO account_status_history (account_id, previous_status, new_status, reason, changed_by)
SELECT a.id, 'ACTIVE', 'FROZEN', 'Suspicious login activity reported by automated fraud monitor', 'SYSTEM_RISK'
FROM accounts a WHERE a.account_number = 'ACC9999';
