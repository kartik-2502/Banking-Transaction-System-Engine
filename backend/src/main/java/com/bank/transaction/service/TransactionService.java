package com.bank.transaction.service;

import com.bank.transaction.dto.DepositRequest;
import com.bank.transaction.dto.TransactionResponse;
import com.bank.transaction.dto.TransferRequest;
import com.bank.transaction.dto.WithdrawalRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TransactionService {
    TransactionResponse processDeposit(DepositRequest request);
    TransactionResponse processWithdrawal(WithdrawalRequest request);
    TransactionResponse processTransfer(TransferRequest request);
    TransactionResponse getTransactionById(String transactionId);
    Page<TransactionResponse> getAccountTransactions(String accountNumber, Pageable pageable);
}
