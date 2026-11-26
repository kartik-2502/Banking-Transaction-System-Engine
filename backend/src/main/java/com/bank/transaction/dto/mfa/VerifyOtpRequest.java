package com.bank.transaction.dto.mfa;

import jakarta.validation.constraints.NotBlank;

public class VerifyOtpRequest {

    @NotBlank(message = "OTP code is required")
    private String otp;

    private String challengeId;
    private String purpose = "LOGIN_MFA";
    private boolean trustDevice = false;
    private String deviceFingerprint;
    private String deviceName;
    private String browser;
    private String operatingSystem;
    private String locationHint;

    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }
    public String getChallengeId() { return challengeId; }
    public void setChallengeId(String challengeId) { this.challengeId = challengeId; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public boolean isTrustDevice() { return trustDevice; }
    public void setTrustDevice(boolean trustDevice) { this.trustDevice = trustDevice; }
    public String getDeviceFingerprint() { return deviceFingerprint; }
    public void setDeviceFingerprint(String deviceFingerprint) { this.deviceFingerprint = deviceFingerprint; }
    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }
    public String getBrowser() { return browser; }
    public void setBrowser(String browser) { this.browser = browser; }
    public String getOperatingSystem() { return operatingSystem; }
    public void setOperatingSystem(String operatingSystem) { this.operatingSystem = operatingSystem; }
    public String getLocationHint() { return locationHint; }
    public void setLocationHint(String locationHint) { this.locationHint = locationHint; }
}
