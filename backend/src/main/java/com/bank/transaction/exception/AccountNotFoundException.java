package com.bank.transaction.exception;

public class AccountNotFoundException extends BankingException {
    public AccountNotFoundException(String message) {
        super(message, "ACCOUNT_NOT_FOUND");
    }
}
