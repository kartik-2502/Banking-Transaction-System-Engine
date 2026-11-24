package com.bank.transaction.exception;

public class DuplicateTransactionException extends BankingException {
    public DuplicateTransactionException(String message) {
        super(message, "DUPLICATE_TRANSACTION");
    }
}
