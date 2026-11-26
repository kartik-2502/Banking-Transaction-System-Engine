package com.bank.transaction.exception;

public class AccountLockedException extends BankingException {
    public AccountLockedException(String message) {
        super(message, "ACCOUNT_LOCKED");
    }
}
