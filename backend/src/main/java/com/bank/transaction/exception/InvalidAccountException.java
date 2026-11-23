package com.bank.transaction.exception;

public class InvalidAccountException extends BankingException {
    public InvalidAccountException(String message) {
        super(message, "INVALID_ACCOUNT");
    }
}
