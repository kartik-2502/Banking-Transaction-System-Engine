package com.bank.transaction.dto.mfa;

public class MfaToggleRequest {
    private String preferredMethod; // EMAIL_OTP | TOTP
    private Boolean emailOtpEnabled;
    private String otpCode;
    private String totpCode;
    private String password;

    public String getPreferredMethod() { return preferredMethod; }
    public void setPreferredMethod(String preferredMethod) { this.preferredMethod = preferredMethod; }
    public Boolean getEmailOtpEnabled() { return emailOtpEnabled; }
    public void setEmailOtpEnabled(Boolean emailOtpEnabled) { this.emailOtpEnabled = emailOtpEnabled; }
    public String getOtpCode() { return otpCode; }
    public void setOtpCode(String otpCode) { this.otpCode = otpCode; }
    public String getTotpCode() { return totpCode; }
    public void setTotpCode(String totpCode) { this.totpCode = totpCode; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
