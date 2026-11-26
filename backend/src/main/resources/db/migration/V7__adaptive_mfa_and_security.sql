-- ==============================================================================
-- Apex Banking System: V7 Adaptive Multi-Factor Authentication (AMFA) Schema
-- Tables: user_mfa_settings, trusted_devices, authentication_challenges,
--         otp_verifications, security_events
-- ==============================================================================

-- 1. User MFA Settings
CREATE TABLE IF NOT EXISTS user_mfa_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    preferred_method VARCHAR(30) NOT NULL DEFAULT 'EMAIL_OTP',
    email_otp_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    totp_secret_encrypted VARCHAR(512),
    totp_pending_secret_encrypted VARCHAR(512),
    totp_verified_at TIMESTAMPTZ,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    last_login_ip VARCHAR(64),
    last_login_device_hash VARCHAR(128),
    last_login_user_agent VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_mfa_preferred_method CHECK (preferred_method IN ('EMAIL_OTP', 'TOTP'))
);

CREATE INDEX IF NOT EXISTS idx_user_mfa_user_id ON user_mfa_settings(user_id);

-- 2. Trusted Devices
CREATE TABLE IF NOT EXISTS trusted_devices (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_fingerprint_hash VARCHAR(128) NOT NULL,
    device_name VARCHAR(120) NOT NULL,
    browser VARCHAR(80),
    operating_system VARCHAR(80),
    ip_address VARCHAR(64),
    location_hint VARCHAR(120),
    trusted BOOLEAN NOT NULL DEFAULT TRUE,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON trusted_devices(user_id, device_fingerprint_hash);

-- 3. Authentication Challenges
CREATE TABLE IF NOT EXISTS authentication_challenges (
    id BIGSERIAL PRIMARY KEY,
    challenge_id VARCHAR(64) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_type VARCHAR(40) NOT NULL,
    required_method VARCHAR(40) NOT NULL,
    risk_score INT NOT NULL DEFAULT 0,
    risk_level VARCHAR(20) NOT NULL,
    risk_reasons VARCHAR(1000),
    transaction_binding_hash VARCHAR(128),
    target_reference VARCHAR(160),
    device_fingerprint_hash VARCHAR(128),
    ip_address VARCHAR(64),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    attempt_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_challenge_risk_level CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_challenge_status CHECK (status IN ('PENDING', 'VERIFIED', 'EXPIRED', 'FAILED', 'BLOCKED', 'CONSUMED'))
);

CREATE INDEX IF NOT EXISTS idx_auth_challenges_user_id ON authentication_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_challenges_status_expires ON authentication_challenges(status, expires_at);

-- 4. OTP Verifications (Hashed OTP storage only - never plaintext)
CREATE TABLE IF NOT EXISTS otp_verifications (
    id BIGSERIAL PRIMARY KEY,
    otp_id VARCHAR(64) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id VARCHAR(64) REFERENCES authentication_challenges(challenge_id) ON DELETE CASCADE,
    purpose VARCHAR(40) NOT NULL,
    otp_hash VARCHAR(128) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    delivery_target_masked VARCHAR(120) NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    consumed BOOLEAN NOT NULL DEFAULT FALSE,
    resend_available_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_user_id ON otp_verifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_challenge_id ON otp_verifications(challenge_id);

-- 5. Security Events (Tamper-evident audit stream without secrets)
CREATE TABLE IF NOT EXISTS security_events (
    id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL UNIQUE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(50),
    event_type VARCHAR(60) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'INFO',
    risk_score INT,
    risk_level VARCHAR(20),
    ip_address VARCHAR(64),
    user_agent VARCHAR(255),
    device_id VARCHAR(64),
    outcome VARCHAR(30) NOT NULL,
    details VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_security_events_user_created ON security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type_created ON security_events(event_type, created_at DESC);
