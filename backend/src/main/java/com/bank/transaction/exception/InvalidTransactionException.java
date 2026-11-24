package com.bank.transaction.exception;

public class InvalidTransactionException extends BankingException {
    public InvalidTransactionException(String message) {
        super(message, "INVALID_TRANSACTION");
    }
}
