package com.bank.transaction.fraud;

import com.bank.transaction.model.Account;
import com.bank.transaction.model.TransactionType;

import java.math.BigDecimal;

public class FraudEvaluationContext {

    private final String transactionId;
    private final Account sourceAccount;
    private final Account destinationAccount;
    private final TransactionType transactionType;
    private final BigDecimal amount;
    private final String initiatedBy;

    public FraudEvaluationContext(String transactionId,
                                  Account sourceAccount,
                                  Account destinationAccount,
                                  TransactionType transactionType,
                                  BigDecimal amount,
                                  String initiatedBy) {
        this.transactionId = transactionId;
        this.sourceAccount = sourceAccount;
        this.destinationAccount = destinationAccount;
        this.transactionType = transactionType;
        this.amount = amount;
        this.initiatedBy = initiatedBy;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public Account getSourceAccount() {
        return sourceAccount;
    }

    public Account getDestinationAccount() {
        return destinationAccount;
    }

    public TransactionType getTransactionType() {
        return transactionType;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getInitiatedBy() {
        return initiatedBy;
    }
}
