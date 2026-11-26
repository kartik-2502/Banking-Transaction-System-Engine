package com.bank.transaction.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

@Configuration
@ConfigurationProperties(prefix = "banking.security.amfa")
public class AmfaProperties {

    private boolean enabled = true;
    private String secretEncryptionKey = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";
    private long otpExpirationSeconds = 300;
    private long otpResendCooldownSeconds = 60;
    private int otpMaxAttempts = 5;
    private long challengeExpirationSeconds = 300;
    private long trustedDeviceTtlDays = 30;
    private int maxFailedLoginAttempts = 5;
    private long lockoutDurationMinutes = 15;
    private long rateLimitWindowSeconds = 300;
    private int rateLimitMaxRequests = 10;
    private BigDecimal highValueTransferThreshold = new BigDecimal("25000");
    private BigDecimal criticalValueTransferThreshold = new BigDecimal("500000");
    private String mailFrom = "no-reply@bank.internal";
    private Weights weights = new Weights();

    public static class Weights {
        private int unrecognizedDevice = 30;
        private int newBrowser = 15;
        private int ipChange = 15;
        private int failedAttempts = 25;
        private int highValueTx = 30;
        private int highFrequencyTx = 25;
        private int sensitiveOperation = 30;

        public int getUnrecognizedDevice() { return unrecognizedDevice; }
        public void setUnrecognizedDevice(int unrecognizedDevice) { this.unrecognizedDevice = unrecognizedDevice; }
        public int getNewBrowser() { return newBrowser; }
        public void setNewBrowser(int newBrowser) { this.newBrowser = newBrowser; }
        public int getIpChange() { return ipChange; }
        public void setIpChange(int ipChange) { this.ipChange = ipChange; }
        public int getFailedAttempts() { return failedAttempts; }
        public void setFailedAttempts(int failedAttempts) { this.failedAttempts = failedAttempts; }
        public int getHighValueTx() { return highValueTx; }
        public void setHighValueTx(int highValueTx) { this.highValueTx = highValueTx; }
        public int getHighFrequencyTx() { return highFrequencyTx; }
        public void setHighFrequencyTx(int highFrequencyTx) { this.highFrequencyTx = highFrequencyTx; }
        public int getSensitiveOperation() { return sensitiveOperation; }
        public void setSensitiveOperation(int sensitiveOperation) { this.sensitiveOperation = sensitiveOperation; }
    }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getSecretEncryptionKey() { return secretEncryptionKey; }
    public void setSecretEncryptionKey(String secretEncryptionKey) { this.secretEncryptionKey = secretEncryptionKey; }
    public long getOtpExpirationSeconds() { return otpExpirationSeconds; }
    public void setOtpExpirationSeconds(long otpExpirationSeconds) { this.otpExpirationSeconds = otpExpirationSeconds; }
    public long getOtpResendCooldownSeconds() { return otpResendCooldownSeconds; }
    public void setOtpResendCooldownSeconds(long otpResendCooldownSeconds) { this.otpResendCooldownSeconds = otpResendCooldownSeconds; }
    public int getOtpMaxAttempts() { return otpMaxAttempts; }
    public void setOtpMaxAttempts(int otpMaxAttempts) { this.otpMaxAttempts = otpMaxAttempts; }
    public long getChallengeExpirationSeconds() { return challengeExpirationSeconds; }
    public void setChallengeExpirationSeconds(long challengeExpirationSeconds) { this.challengeExpirationSeconds = challengeExpirationSeconds; }
    public long getTrustedDeviceTtlDays() { return trustedDeviceTtlDays; }
    public void setTrustedDeviceTtlDays(long trustedDeviceTtlDays) { this.trustedDeviceTtlDays = trustedDeviceTtlDays; }
    public int getMaxFailedLoginAttempts() { return maxFailedLoginAttempts; }
    public void setMaxFailedLoginAttempts(int maxFailedLoginAttempts) { this.maxFailedLoginAttempts = maxFailedLoginAttempts; }
    public long getLockoutDurationMinutes() { return lockoutDurationMinutes; }
    public void setLockoutDurationMinutes(long lockoutDurationMinutes) { this.lockoutDurationMinutes = lockoutDurationMinutes; }
    public long getRateLimitWindowSeconds() { return rateLimitWindowSeconds; }
    public void setRateLimitWindowSeconds(long rateLimitWindowSeconds) { this.rateLimitWindowSeconds = rateLimitWindowSeconds; }
    public int getRateLimitMaxRequests() { return rateLimitMaxRequests; }
    public void setRateLimitMaxRequests(int rateLimitMaxRequests) { this.rateLimitMaxRequests = rateLimitMaxRequests; }
    public BigDecimal getHighValueTransferThreshold() { return highValueTransferThreshold; }
    public void setHighValueTransferThreshold(BigDecimal highValueTransferThreshold) { this.highValueTransferThreshold = highValueTransferThreshold; }
    public BigDecimal getCriticalValueTransferThreshold() { return criticalValueTransferThreshold; }
    public void setCriticalValueTransferThreshold(BigDecimal criticalValueTransferThreshold) { this.criticalValueTransferThreshold = criticalValueTransferThreshold; }
    public String getMailFrom() { return mailFrom; }
    public void setMailFrom(String mailFrom) { this.mailFrom = mailFrom; }
    public Weights getWeights() { return weights; }
    public void setWeights(Weights weights) { this.weights = weights; }
}
