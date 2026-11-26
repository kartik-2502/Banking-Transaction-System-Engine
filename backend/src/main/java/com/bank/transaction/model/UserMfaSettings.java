package com.bank.transaction.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "user_mfa_settings")
public class UserMfaSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "mfa_enabled", nullable = false)
    private boolean mfaEnabled = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_method", nullable = false, length = 30)
    private MfaMethod preferredMethod = MfaMethod.EMAIL_OTP;

    @Column(name = "email_otp_enabled", nullable = false)
    private boolean emailOtpEnabled = true;

    @Column(name = "totp_enabled", nullable = false)
    private boolean totpEnabled = false;

    @Column(name = "totp_secret_encrypted", length = 512)
    private String totpSecretEncrypted;

    @Column(name = "totp_pending_secret_encrypted", length = 512)
    private String totpPendingSecretEncrypted;

    @Column(name = "totp_verified_at")
    private OffsetDateTime totpVerifiedAt;

    @Column(name = "failed_login_attempts", nullable = false)
    private int failedLoginAttempts = 0;

    @Column(name = "locked_until")
    private OffsetDateTime lockedUntil;

    @Column(name = "last_login_at")
    private OffsetDateTime lastLoginAt;

    @Column(name = "last_login_ip", length = 64)
    private String lastLoginIp;

    @Column(name = "last_login_device_hash", length = 128)
    private String lastLoginDeviceHash;

    @Column(name = "last_login_user_agent", length = 255)
    private String lastLoginUserAgent;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public UserMfaSettings() {}

    public UserMfaSettings(User user) {
        this.user = user;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public boolean isMfaEnabled() { return mfaEnabled; }
    public void setMfaEnabled(boolean mfaEnabled) { this.mfaEnabled = mfaEnabled; }

    public MfaMethod getPreferredMethod() { return preferredMethod; }
    public void setPreferredMethod(MfaMethod preferredMethod) { this.preferredMethod = preferredMethod; }

    public boolean isEmailOtpEnabled() { return emailOtpEnabled; }
    public void setEmailOtpEnabled(boolean emailOtpEnabled) { this.emailOtpEnabled = emailOtpEnabled; }

    public boolean isTotpEnabled() { return totpEnabled; }
    public void setTotpEnabled(boolean totpEnabled) { this.totpEnabled = totpEnabled; }

    public String getTotpSecretEncrypted() { return totpSecretEncrypted; }
    public void setTotpSecretEncrypted(String totpSecretEncrypted) { this.totpSecretEncrypted = totpSecretEncrypted; }

    public String getTotpPendingSecretEncrypted() { return totpPendingSecretEncrypted; }
    public void setTotpPendingSecretEncrypted(String totpPendingSecretEncrypted) { this.totpPendingSecretEncrypted = totpPendingSecretEncrypted; }

    public OffsetDateTime getTotpVerifiedAt() { return totpVerifiedAt; }
    public void setTotpVerifiedAt(OffsetDateTime totpVerifiedAt) { this.totpVerifiedAt = totpVerifiedAt; }

    public int getFailedLoginAttempts() { return failedLoginAttempts; }
    public void setFailedLoginAttempts(int failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; }

    public OffsetDateTime getLockedUntil() { return lockedUntil; }
    public void setLockedUntil(OffsetDateTime lockedUntil) { this.lockedUntil = lockedUntil; }

    public OffsetDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(OffsetDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }

    public String getLastLoginIp() { return lastLoginIp; }
    public void setLastLoginIp(String lastLoginIp) { this.lastLoginIp = lastLoginIp; }

    public String getLastLoginDeviceHash() { return lastLoginDeviceHash; }
    public void setLastLoginDeviceHash(String lastLoginDeviceHash) { this.lastLoginDeviceHash = lastLoginDeviceHash; }

    public String getLastLoginUserAgent() { return lastLoginUserAgent; }
    public void setLastLoginUserAgent(String lastLoginUserAgent) { this.lastLoginUserAgent = lastLoginUserAgent; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
