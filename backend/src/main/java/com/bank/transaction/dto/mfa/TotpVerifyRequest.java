package com.bank.transaction.dto.mfa;

import jakarta.validation.constraints.NotBlank;

public class TotpVerifyRequest {

    @NotBlank(message = "TOTP verification code is required")
    private String code;

    private String challengeId;
    private boolean trustDevice = false;
    private String deviceFingerprint;
    private String deviceName;
    private String browser;
    private String operatingSystem;
    private String locationHint;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getChallengeId() { return challengeId; }
    public void setChallengeId(String challengeId) { this.challengeId = challengeId; }
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
