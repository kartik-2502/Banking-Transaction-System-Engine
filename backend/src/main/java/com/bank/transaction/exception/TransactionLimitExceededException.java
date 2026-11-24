package com.bank.transaction.exception;

public class TransactionLimitExceededException extends BankingException {
    public TransactionLimitExceededException(String message) {
        super(message, "TRANSACTION_LIMIT_EXCEEDED");
    }
}
