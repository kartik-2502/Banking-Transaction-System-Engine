package com.bank.transaction.exception;

import java.util.Map;

public class MfaRequiredException extends BankingException {

    private final Map<String, Object> challengeDetails;

    public MfaRequiredException(String message, Map<String, Object> challengeDetails) {
        super(message, "MFA_REQUIRED");
        this.challengeDetails = challengeDetails;
    }

    public Map<String, Object> getChallengeDetails() {
        return challengeDetails;
    }
}
