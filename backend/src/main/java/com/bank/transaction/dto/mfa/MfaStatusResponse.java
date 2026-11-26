package com.bank.transaction.dto.mfa;

import java.time.OffsetDateTime;

public class MfaStatusResponse {
    private boolean mfaEnabled;
    private String preferredMethod;
    private boolean emailOtpEnabled;
    private boolean totpEnabled;
    private long trustedDevicesCount;
    private OffsetDateTime lastLoginAt;
    private String lastLoginIp;
    private int failedLoginAttempts;
    private OffsetDateTime lockedUntil;

    public boolean isMfaEnabled() { return mfaEnabled; }
    public void setMfaEnabled(boolean mfaEnabled) { this.mfaEnabled = mfaEnabled; }
    public String getPreferredMethod() { return preferredMethod; }
    public void setPreferredMethod(String preferredMethod) { this.preferredMethod = preferredMethod; }
    public boolean isEmailOtpEnabled() { return emailOtpEnabled; }
    public void setEmailOtpEnabled(boolean emailOtpEnabled) { this.emailOtpEnabled = emailOtpEnabled; }
    public boolean isTotpEnabled() { return totpEnabled; }
    public void setTotpEnabled(boolean totpEnabled) { this.totpEnabled = totpEnabled; }
    public long getTrustedDevicesCount() { return trustedDevicesCount; }
    public void setTrustedDevicesCount(long trustedDevicesCount) { this.trustedDevicesCount = trustedDevicesCount; }
    public OffsetDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(OffsetDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }
    public String getLastLoginIp() { return lastLoginIp; }
    public void setLastLoginIp(String lastLoginIp) { this.lastLoginIp = lastLoginIp; }
    public int getFailedLoginAttempts() { return failedLoginAttempts; }
    public void setFailedLoginAttempts(int failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; }
    public OffsetDateTime getLockedUntil() { return lockedUntil; }
    public void setLockedUntil(OffsetDateTime lockedUntil) { this.lockedUntil = lockedUntil; }
}
