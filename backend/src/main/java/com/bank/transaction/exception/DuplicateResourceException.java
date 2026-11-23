package com.bank.transaction.exception;

public class DuplicateResourceException extends BankingException {
    public DuplicateResourceException(String message) {
        super(message, "DUPLICATE_RESOURCE");
    }
}
