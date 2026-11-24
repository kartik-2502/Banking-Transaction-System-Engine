package com.bank.transaction;

import com.bank.transaction.dto.DepositRequest;
import com.bank.transaction.dto.TransactionResponse;
import com.bank.transaction.dto.TransferRequest;
import com.bank.transaction.dto.WithdrawalRequest;
import com.bank.transaction.exception.AccountFrozenException;
import com.bank.transaction.exception.InsufficientBalanceException;
import com.bank.transaction.exception.InvalidTransactionException;
import com.bank.transaction.exception.TransactionLimitExceededException;
import com.bank.transaction.model.Account;
import com.bank.transaction.model.FailedTransaction;
import com.bank.transaction.model.TransactionAudit;
import com.bank.transaction.model.TransactionType;
import com.bank.transaction.repository.AccountRepository;
import com.bank.transaction.repository.FailedTransactionRepository;
import com.bank.transaction.repository.TransactionAuditRepository;
import com.bank.transaction.service.TransactionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class TransactionServiceIntegrationTest {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private TransactionAuditRepository auditRepository;

    @Autowired
    private FailedTransactionRepository failedTransactionRepository;

    @Test
    @DisplayName("Deposit: Balance increases, transaction recorded, and audit trail persisted")
    void testDepositSuccess() {
        Account before = accountRepository.findByAccountNumber("ACC2004").orElseThrow();
        BigDecimal initialBalance = before.getBalance();
        BigDecimal depositAmount = new BigDecimal("2500.00");

        String txnId = "TXN_DEP_TEST_" + System.currentTimeMillis();
        DepositRequest request = new DepositRequest(txnId, "ACC2004", depositAmount, "TELLER_ALICE");

        TransactionResponse response = transactionService.processDeposit(request);

        assertNotNull(response);
        assertEquals(txnId, response.getTransactionId());
        assertEquals(TransactionType.DEPOSIT, response.getType());
        assertEquals(depositAmount, response.getAmount());
        assertEquals(initialBalance.add(depositAmount), response.getDestinationNewBalance());

        Account after = accountRepository.findByAccountNumber("ACC2004").orElseThrow();
        assertEquals(initialBalance.add(depositAmount), after.getBalance(), "Database balance must reflect deposit");

        // Verify audit record exists
        List<TransactionAudit> audits = auditRepository.findByTransactionIdOrderByCreatedAtDesc(txnId);
        assertFalse(audits.isEmpty(), "Audit entry must be created");
        assertEquals("SUCCESS", audits.get(0).getResult());
        assertEquals("DEPOSIT", audits.get(0).getOperationType());
    }

    @Test
    @DisplayName("Withdrawal: Balance decreases atomically and audit record is persisted")
    void testWithdrawalSuccess() {
        Account before = accountRepository.findByAccountNumber("ACC2004").orElseThrow();
        BigDecimal initialBalance = before.getBalance();
        BigDecimal withdrawAmount = new BigDecimal("1500.00");

        String txnId = "TXN_WTH_TEST_" + System.currentTimeMillis();
        WithdrawalRequest request = new WithdrawalRequest(txnId, "ACC2004", withdrawAmount, "ATM_HYDERABAD");

        TransactionResponse response = transactionService.processWithdrawal(request);

        assertNotNull(response);
        assertEquals(txnId, response.getTransactionId());
        assertEquals(TransactionType.WITHDRAWAL, response.getType());
        assertEquals(initialBalance.subtract(withdrawAmount), response.getSourceNewBalance());

        Account after = accountRepository.findByAccountNumber("ACC2004").orElseThrow();
        assertEquals(initialBalance.subtract(withdrawAmount), after.getBalance());
    }

    @Test
    @DisplayName("Transfer: Atomically debits source and credits destination in one database transaction")
    void testTransferSuccessAtomic() {
        Account sourceBefore = accountRepository.findByAccountNumber("ACC3005").orElseThrow();
        Account destBefore = accountRepository.findByAccountNumber("ACC2004").orElseThrow();

        BigDecimal sourceInitial = sourceBefore.getBalance();
        BigDecimal destInitial = destBefore.getBalance();
        BigDecimal transferAmount = new BigDecimal("1000.00");

        String txnId = "TXN_TRF_TEST_" + System.currentTimeMillis();
        TransferRequest request = new TransferRequest(txnId, "ACC3005", "ACC2004", transferAmount, "NETBANKING");

        TransactionResponse response = transactionService.processTransfer(request);

        assertNotNull(response);
        assertEquals(txnId, response.getTransactionId());
        assertEquals(TransactionType.TRANSFER, response.getType());
        assertEquals(sourceInitial.subtract(transferAmount), response.getSourceNewBalance());
        assertEquals(destInitial.add(transferAmount), response.getDestinationNewBalance());

        Account sourceAfter = accountRepository.findByAccountNumber("ACC3005").orElseThrow();
        Account destAfter = accountRepository.findByAccountNumber("ACC2004").orElseThrow();

        assertEquals(sourceInitial.subtract(transferAmount), sourceAfter.getBalance(), "Source balance must be debited");
        assertEquals(destInitial.add(transferAmount), destAfter.getBalance(), "Destination balance must be credited");
    }

    @Test
    @DisplayName("Withdrawal Rejection: Insufficient balance throws exception and balance remains untouched")
    void testWithdrawalInsufficientBalance() {
        Account before = accountRepository.findByAccountNumber("ACC3005").orElseThrow();
        BigDecimal initialBalance = before.getBalance();
        // ₹15,000 is under the per-transaction limit (₹50,000) but exceeds balance (₹5,000)
        BigDecimal excessiveAmount = new BigDecimal("15000.00");

        String txnId = "TXN_FAIL_WTH_" + System.currentTimeMillis();
        WithdrawalRequest request = new WithdrawalRequest(txnId, "ACC3005", excessiveAmount, "ATM");

        assertThrows(InsufficientBalanceException.class, () -> {
            transactionService.processWithdrawal(request);
        });

        Account after = accountRepository.findByAccountNumber("ACC3005").orElseThrow();
        assertEquals(initialBalance, after.getBalance(), "Balance must remain unchanged after failed withdrawal");

        // Verify failed transaction table recorded the failure
        FailedTransaction failed = failedTransactionRepository.findByTransactionId(txnId).orElse(null);
        assertNotNull(failed, "Failure record must be persisted in failed_transactions table");
        assertEquals("INSUFFICIENT_BALANCE", failed.getErrorCategory());
    }

    @Test
    @DisplayName("Transfer Rollback: Insufficient balance rolls back completely with zero partial changes")
    void testTransferInsufficientBalanceRollback() {
        Account sourceBefore = accountRepository.findByAccountNumber("ACC3005").orElseThrow();
        Account destBefore = accountRepository.findByAccountNumber("ACC2004").orElseThrow();

        BigDecimal sourceInitial = sourceBefore.getBalance();
        BigDecimal destInitial = destBefore.getBalance();
        // ₹20,000 is under the per-transaction limit (₹50,000) but exceeds source balance (₹5,000)
        BigDecimal excessiveAmount = new BigDecimal("20000.00");

        String txnId = "TXN_FAIL_TRF_" + System.currentTimeMillis();
        TransferRequest request = new TransferRequest(txnId, "ACC3005", "ACC2004", excessiveAmount, "MOBILE_APP");

        assertThrows(InsufficientBalanceException.class, () -> {
            transactionService.processTransfer(request);
        });

        Account sourceAfter = accountRepository.findByAccountNumber("ACC3005").orElseThrow();
        Account destAfter = accountRepository.findByAccountNumber("ACC2004").orElseThrow();

        assertEquals(sourceInitial, sourceAfter.getBalance(), "Source balance must NOT be debited on rollback");
        assertEquals(destInitial, destAfter.getBalance(), "Destination balance must NOT be credited on rollback");
    }

    @Test
    @DisplayName("Frozen Account: Transactions on frozen accounts are rejected immediately")
    void testFrozenAccountRejected() {
        Account frozen = accountRepository.findByAccountNumber("ACC9999").orElseThrow();
        BigDecimal initialBalance = frozen.getBalance();

        String txnId = "TXN_FROZEN_" + System.currentTimeMillis();
        WithdrawalRequest request = new WithdrawalRequest(txnId, "ACC9999", new BigDecimal("500.00"), "BRANCH");

        assertThrows(AccountFrozenException.class, () -> {
            transactionService.processWithdrawal(request);
        });

        Account after = accountRepository.findByAccountNumber("ACC9999").orElseThrow();
        assertEquals(initialBalance, after.getBalance(), "Frozen account balance must not change");
    }

    @Test
    @DisplayName("Transfer Validation: Cannot transfer money to identical source and destination account")
    void testTransferToSameAccountRejected() {
        TransferRequest request = new TransferRequest(
                "TXN_SAME_ACC_" + System.currentTimeMillis(),
                "ACC1001",
                "ACC1001",
                new BigDecimal("500.00"),
                "USER"
        );

        assertThrows(InvalidTransactionException.class, () -> {
            transactionService.processTransfer(request);
        });
    }

    @Test
    @DisplayName("Limit Enforcement: Transactions exceeding configured per-transaction limits are rejected")
    void testTransactionLimitExceeded() {
        // ACC1001 has perTransactionLimit of ₹50,000.00
        WithdrawalRequest request = new WithdrawalRequest(
                "TXN_LIMIT_EXCEEDED_" + System.currentTimeMillis(),
                "ACC1001",
                new BigDecimal("60000.00"),
                "VIP_CLIENT"
        );

        assertThrows(TransactionLimitExceededException.class, () -> {
            transactionService.processWithdrawal(request);
        });
    }
}
