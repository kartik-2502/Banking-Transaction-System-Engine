-- ==============================================================================
-- Apex Banking System: V8 Update Usernames to firstname_lastname & Password
-- Updates seeded user accounts to firstname_lastname format and ensures all
-- users have password "password" (BCrypt hash).
-- ==============================================================================

-- Update seeded usernames and emails to firstname_lastname format
UPDATE users
SET username = 'aarav_sharma',
    email    = 'aarav.sharma@apexbank.com'
WHERE username = 'john_doe'
  AND NOT EXISTS (SELECT 1 FROM users u2 WHERE u2.username = 'aarav_sharma');

UPDATE users
SET username = 'priya_patel',
    email    = 'priya.patel@apexbank.com'
WHERE username = 'jane_smith'
  AND NOT EXISTS (SELECT 1 FROM users u2 WHERE u2.username = 'priya_patel');

UPDATE users
SET username = 'rohan_kulkarni',
    email    = 'rohan.kulkarni@apexbank.com'
WHERE username = 'teller1'
  AND NOT EXISTS (SELECT 1 FROM users u2 WHERE u2.username = 'rohan_kulkarni');

UPDATE users
SET username = 'ananya_verma',
    email    = 'ananya.verma@apexbank.com'
WHERE username = 'loan_officer1'
  AND NOT EXISTS (SELECT 1 FROM users u2 WHERE u2.username = 'ananya_verma');

UPDATE users
SET username = 'kavya_nair',
    email    = 'kavya.nair@apexbank.com'
WHERE username = 'analyst1'
  AND NOT EXISTS (SELECT 1 FROM users u2 WHERE u2.username = 'kavya_nair');

UPDATE users
SET username = 'system_administrator',
    email    = 'system.administrator@apexbank.com'
WHERE username = 'admin'
  AND NOT EXISTS (SELECT 1 FROM users u2 WHERE u2.username = 'system_administrator');

-- Ensure every user's password is "password" and account is enabled
UPDATE users
SET password_hash = '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    enabled       = TRUE;

-- Clear stale lockout/MFA baseline state for renamed demo accounts
UPDATE user_mfa_settings
SET failed_login_attempts  = 0,
    locked_until           = NULL,
    last_login_ip          = NULL,
    last_login_user_agent  = NULL,
    last_login_device_hash = NULL,
    mfa_enabled            = FALSE,
    preferred_method       = 'EMAIL_OTP'
WHERE user_id IN (
    SELECT id FROM users
    WHERE username IN (
        'aarav_sharma',
        'priya_patel',
        'rohan_kulkarni',
        'ananya_verma',
        'kavya_nair',
        'system_administrator'
    )
);
