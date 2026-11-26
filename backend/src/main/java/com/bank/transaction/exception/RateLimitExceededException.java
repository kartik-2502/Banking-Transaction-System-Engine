package com.bank.transaction.exception;

public class RateLimitExceededException extends BankingException {
    public RateLimitExceededException(String message) {
        super(message, "RATE_LIMIT_EXCEEDED");
    }
}
