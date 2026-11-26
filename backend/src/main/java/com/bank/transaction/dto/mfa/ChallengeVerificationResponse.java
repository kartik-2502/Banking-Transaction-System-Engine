package com.bank.transaction.dto.mfa;

import com.bank.transaction.dto.AuthResponse;

public class ChallengeVerificationResponse {
    private boolean verified;
    private String challengeId;
    private String challengeType;
    private String status;
    private String message;
    private AuthResponse auth;

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }
    public String getChallengeId() { return challengeId; }
    public void setChallengeId(String challengeId) { this.challengeId = challengeId; }
    public String getChallengeType() { return challengeType; }
    public void setChallengeType(String challengeType) { this.challengeType = challengeType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public AuthResponse getAuth() { return auth; }
    public void setAuth(AuthResponse auth) { this.auth = auth; }
}
