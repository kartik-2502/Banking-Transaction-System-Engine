package com.bank.transaction.dto.mfa;

public class SendOtpRequest {
    private String challengeId;
    private String purpose = "LOGIN_MFA";

    public String getChallengeId() { return challengeId; }
    public void setChallengeId(String challengeId) { this.challengeId = challengeId; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
}
