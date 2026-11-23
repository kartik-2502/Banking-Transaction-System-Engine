package com.bank.transaction.exception;

public class CustomerNotFoundException extends BankingException {
    public CustomerNotFoundException(String message) {
        super(message, "CUSTOMER_NOT_FOUND");
    }
}
