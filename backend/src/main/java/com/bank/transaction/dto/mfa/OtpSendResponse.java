package com.bank.transaction.dto.mfa;

import java.time.OffsetDateTime;

public class OtpSendResponse {
    private String otpId;
    private String challengeId;
    private String purpose;
    private String maskedDestination;
    private long expiresInSeconds;
    private long resendCooldownSeconds;
    private OffsetDateTime expiresAt;

    public String getOtpId() { return otpId; }
    public void setOtpId(String otpId) { this.otpId = otpId; }
    public String getChallengeId() { return challengeId; }
    public void setChallengeId(String challengeId) { this.challengeId = challengeId; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public String getMaskedDestination() { return maskedDestination; }
    public void setMaskedDestination(String maskedDestination) { this.maskedDestination = maskedDestination; }
    public long getExpiresInSeconds() { return expiresInSeconds; }
    public void setExpiresInSeconds(long expiresInSeconds) { this.expiresInSeconds = expiresInSeconds; }
    public long getResendCooldownSeconds() { return resendCooldownSeconds; }
    public void setResendCooldownSeconds(long resendCooldownSeconds) { this.resendCooldownSeconds = resendCooldownSeconds; }
    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }
}
