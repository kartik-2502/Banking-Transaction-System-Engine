package com.bank.transaction.dto.mfa;

public class TotpSetupResponse {
    private String otpAuthUri;
    private String manualEntryKey;
    private String issuer;
    private String accountLabel;

    public TotpSetupResponse(String otpAuthUri, String manualEntryKey, String issuer, String accountLabel) {
        this.otpAuthUri = otpAuthUri;
        this.manualEntryKey = manualEntryKey;
        this.issuer = issuer;
        this.accountLabel = accountLabel;
    }

    public String getOtpAuthUri() { return otpAuthUri; }
    public String getManualEntryKey() { return manualEntryKey; }
    public String getIssuer() { return issuer; }
    public String getAccountLabel() { return accountLabel; }
}
