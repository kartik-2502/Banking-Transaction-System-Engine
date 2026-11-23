package com.bank.transaction.exception;

public class AccountFrozenException extends BankingException {
    public AccountFrozenException(String message) {
        super(message, "ACCOUNT_FROZEN");
    }
}
