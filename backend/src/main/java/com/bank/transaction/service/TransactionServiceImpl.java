package com.bank.transaction.service;

import com.bank.transaction.dto.DepositRequest;
import com.bank.transaction.dto.TransactionResponse;
import com.bank.transaction.dto.TransferRequest;
import com.bank.transaction.dto.WithdrawalRequest;
import com.bank.transaction.exception.*;
import com.bank.transaction.idempotency.IdempotencyManager;
import com.bank.transaction.model.*;
import com.bank.transaction.repository.AccountRepository;
import com.bank.transaction.repository.AccountTransactionLimitRepository;
import com.bank.transaction.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;

@Service
public class TransactionServiceImpl implements TransactionService {

    private static final Logger log = LoggerFactory.getLogger(TransactionServiceImpl.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final AccountTransactionLimitRepository limitRepository;
    private final TransactionAuditService auditService;
    private final IdempotencyManager idempotencyManager;

    public TransactionServiceImpl(AccountRepository accountRepository,
                                  TransactionRepository transactionRepository,
                                  AccountTransactionLimitRepository limitRepository,
                                  TransactionAuditService auditService,
                                  IdempotencyManager idempotencyManager) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.limitRepository = limitRepository;
        this.auditService = auditService;
        this.idempotencyManager = idempotencyManager;
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TransactionResponse processDeposit(DepositRequest request) {
        String txnId = resolveTransactionId(request.getTransactionId());
        return idempotencyManager.executeIdempotent(txnId, () -> executeDepositInternal(txnId, request));
    }

    private TransactionResponse executeDepositInternal(String txnId, DepositRequest request) {
        long startTime = System.currentTimeMillis();
        log.info("Processing DEPOSIT [txnId={}, account={}, amount={}]", txnId, request.getAccountNumber(), request.getAmount());

        // Acquire exclusive pessimistic write lock (SELECT ... FOR UPDATE) on the account row
        Account account = accountRepository.findByAccountNumberWithPessimisticLock(request.getAccountNumber())
                .orElseThrow(() -> {
                    auditService.recordFailure(txnId, null, "ACCOUNT_NOT_FOUND", "Account not found: " + request.getAccountNumber(), null);
                    return new AccountNotFoundException("Account not found with number: " + request.getAccountNumber());
                });

        validateAccountActive(account, txnId);
        validateAmountPositive(request.getAmount(), txnId, account.getId());

        // Atomically credit balance
        BigDecimal newBalance = account.getBalance().add(request.getAmount());
        account.setBalance(newBalance);
        accountRepository.save(account);

        // Record successful transaction
        Transaction transaction = new Transaction(
                txnId,
                TransactionType.DEPOSIT,
                null,
                account,
                request.getAmount(),
                request.getInitiatedBy()
        );
        try {
            transaction = transactionRepository.save(transaction);
        } catch (DataIntegrityViolationException ex) {
            log.warn("Database unique constraint triggered for duplicate transactionId: {}", txnId);
            return idempotencyManager.findExisting(txnId)
                    .orElseThrow(() -> new DuplicateTransactionException("Duplicate transaction request for ID: " + txnId));
        }

        long duration = System.currentTimeMillis() - startTime;
        auditService.recordAudit(txnId, account.getId(), "DEPOSIT", "SUCCESS", duration);
        log.info("Deposit successful [txnId={}, account={}, newBalance={}]", txnId, account.getAccountNumber(), newBalance);

        return mapToResponse(transaction, null, newBalance);
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TransactionResponse processWithdrawal(WithdrawalRequest request) {
        String txnId = resolveTransactionId(request.getTransactionId());
        return idempotencyManager.executeIdempotent(txnId, () -> executeWithdrawalInternal(txnId, request));
    }

    private TransactionResponse executeWithdrawalInternal(String txnId, WithdrawalRequest request) {
        long startTime = System.currentTimeMillis();
        log.info("Processing WITHDRAWAL [txnId={}, account={}, amount={}]", txnId, request.getAccountNumber(), request.getAmount());

        // Acquire exclusive pessimistic write lock (SELECT ... FOR UPDATE) on the account row
        Account account = accountRepository.findByAccountNumberWithPessimisticLock(request.getAccountNumber())
                .orElseThrow(() -> {
                    auditService.recordFailure(txnId, null, "ACCOUNT_NOT_FOUND", "Account not found: " + request.getAccountNumber(), null);
                    return new AccountNotFoundException("Account not found with number: " + request.getAccountNumber());
                });

        validateAccountActive(account, txnId);
        validateAmountPositive(request.getAmount(), txnId, account.getId());
        validateTransactionLimits(account, request.getAmount(), txnId);

        // Verify sufficient balance under row-level lock
        if (account.getBalance().compareTo(request.getAmount()) < 0) {
            String failureReason = String.format("Insufficient funds. Available: ₹%s, Requested: ₹%s",
                    account.getBalance().toPlainString(), request.getAmount().toPlainString());
            auditService.recordFailure(txnId, account.getId(), "INSUFFICIENT_BALANCE", failureReason, null);
            auditService.recordAudit(txnId, account.getId(), "WITHDRAWAL", "FAILED", System.currentTimeMillis() - startTime);
            throw new InsufficientBalanceException(failureReason);
        }

        // Atomically debit balance
        BigDecimal newBalance = account.getBalance().subtract(request.getAmount());
        account.setBalance(newBalance);
        accountRepository.save(account);

        // Record successful transaction
        Transaction transaction = new Transaction(
                txnId,
                TransactionType.WITHDRAWAL,
                account,
                null,
                request.getAmount(),
                request.getInitiatedBy()
        );
        try {
            transaction = transactionRepository.save(transaction);
        } catch (DataIntegrityViolationException ex) {
            log.warn("Database unique constraint triggered for duplicate transactionId: {}", txnId);
            return idempotencyManager.findExisting(txnId)
                    .orElseThrow(() -> new DuplicateTransactionException("Duplicate transaction request for ID: " + txnId));
        }

        long duration = System.currentTimeMillis() - startTime;
        auditService.recordAudit(txnId, account.getId(), "WITHDRAWAL", "SUCCESS", duration);
        log.info("Withdrawal successful [txnId={}, account={}, newBalance={}]", txnId, account.getAccountNumber(), newBalance);

        return mapToResponse(transaction, newBalance, null);
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TransactionResponse processTransfer(TransferRequest request) {
        String txnId = resolveTransactionId(request.getTransactionId());
        return idempotencyManager.executeIdempotent(txnId, () -> executeTransferInternal(txnId, request));
    }

    private TransactionResponse executeTransferInternal(String txnId, TransferRequest request) {
        long startTime = System.currentTimeMillis();
        log.info("Processing TRANSFER [txnId={}, from={}, to={}, amount={}]",
                txnId, request.getSourceAccountNumber(), request.getDestinationAccountNumber(), request.getAmount());

        if (request.getSourceAccountNumber().equals(request.getDestinationAccountNumber())) {
            auditService.recordFailure(txnId, null, "INVALID_TRANSACTION", "Source and destination accounts must be different", null);
            throw new InvalidTransactionException("Cannot transfer money to the same account");
        }

        // Preliminary existence check to fetch IDs without loading entities into JPA persistence context
        Long sourceId = accountRepository.findIdByAccountNumber(request.getSourceAccountNumber())
                .orElseThrow(() -> {
                    auditService.recordFailure(txnId, null, "ACCOUNT_NOT_FOUND", "Source account not found: " + request.getSourceAccountNumber(), null);
                    return new AccountNotFoundException("Source account not found: " + request.getSourceAccountNumber());
                });

        Long destId = accountRepository.findIdByAccountNumber(request.getDestinationAccountNumber())
                .orElseThrow(() -> {
                    auditService.recordFailure(txnId, null, "ACCOUNT_NOT_FOUND", "Destination account not found: " + request.getDestinationAccountNumber(), null);
                    return new AccountNotFoundException("Destination account not found: " + request.getDestinationAccountNumber());
                });

        // ==============================================================================
        // DETERMINISTIC LOCKING STRATEGY TO PREVENT DEADLOCKS
        // Always acquire locks in ascending order of Account ID: lower ID first, higher ID second.
        // Guarantees no circular wait condition can ever occur between concurrent transfers.
        // ==============================================================================
        Long lowerId = Math.min(sourceId, destId);
        Long higherId = Math.max(sourceId, destId);

        Account firstLocked = accountRepository.findByIdWithPessimisticLock(lowerId)
                .orElseThrow(() -> new AccountNotFoundException("Account locked not found: ID " + lowerId));
        Account secondLocked = accountRepository.findByIdWithPessimisticLock(higherId)
                .orElseThrow(() -> new AccountNotFoundException("Account locked not found: ID " + higherId));

        Account sourceAccount = sourceId.equals(lowerId) ? firstLocked : secondLocked;
        Account destinationAccount = destId.equals(lowerId) ? firstLocked : secondLocked;

        validateAccountActive(sourceAccount, txnId);
        validateAccountActive(destinationAccount, txnId);
        validateAmountPositive(request.getAmount(), txnId, sourceAccount.getId());
        validateTransactionLimits(sourceAccount, request.getAmount(), txnId);

        // Verify sufficient balance under row-level lock
        if (sourceAccount.getBalance().compareTo(request.getAmount()) < 0) {
            String failureReason = String.format("Insufficient funds for transfer. Available: ₹%s, Requested: ₹%s",
                    sourceAccount.getBalance().toPlainString(), request.getAmount().toPlainString());
            auditService.recordFailure(txnId, sourceAccount.getId(), "INSUFFICIENT_BALANCE", failureReason, null);
            auditService.recordAudit(txnId, sourceAccount.getId(), "TRANSFER", "FAILED", System.currentTimeMillis() - startTime);
            throw new InsufficientBalanceException(failureReason);
        }

        // Atomically update balances
        BigDecimal sourceNewBalance = sourceAccount.getBalance().subtract(request.getAmount());
        BigDecimal destNewBalance = destinationAccount.getBalance().add(request.getAmount());

        sourceAccount.setBalance(sourceNewBalance);
        destinationAccount.setBalance(destNewBalance);

        accountRepository.save(sourceAccount);
        accountRepository.save(destinationAccount);

        // Record successful transfer transaction
        Transaction transaction = new Transaction(
                txnId,
                TransactionType.TRANSFER,
                sourceAccount,
                destinationAccount,
                request.getAmount(),
                request.getInitiatedBy()
        );
        try {
            transaction = transactionRepository.save(transaction);
        } catch (DataIntegrityViolationException ex) {
            log.warn("Database unique constraint triggered for duplicate transactionId: {}", txnId);
            return idempotencyManager.findExisting(txnId)
                    .orElseThrow(() -> new DuplicateTransactionException("Duplicate transaction request for ID: " + txnId));
        }

        long duration = System.currentTimeMillis() - startTime;
        auditService.recordAudit(txnId, sourceAccount.getId(), "TRANSFER", "SUCCESS", duration);
        log.info("Transfer successful [txnId={}, from={}, to={}, amount={}, sourceBalance={}, destBalance={}]",
                txnId, sourceAccount.getAccountNumber(), destinationAccount.getAccountNumber(),
                request.getAmount(), sourceNewBalance, destNewBalance);

        return mapToResponse(transaction, sourceNewBalance, destNewBalance);
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionResponse getTransactionById(String transactionId) {
        Transaction transaction = transactionRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new InvalidTransactionException("Transaction not found: " + transactionId));
        return mapToResponse(transaction, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionResponse> getAccountTransactions(String accountNumber, Pageable pageable) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new AccountNotFoundException("Account not found: " + accountNumber));

        return transactionRepository.findBySourceAccountIdOrDestinationAccountIdOrderByCreatedAtDesc(
                account.getId(), account.getId(), pageable
        ).map(tx -> mapToResponse(tx, null, null));
    }

    private void validateAccountActive(Account account, String txnId) {
        if (account.getStatus() == AccountStatus.FROZEN) {
            String reason = "Account " + account.getAccountNumber() + " is FROZEN. Prohibited from executing transactions.";
            auditService.recordFailure(txnId, account.getId(), "ACCOUNT_FROZEN", reason, null);
            throw new AccountFrozenException(reason);
        }
        if (account.getStatus() != AccountStatus.ACTIVE) {
            String reason = "Account " + account.getAccountNumber() + " is " + account.getStatus() + ". Must be ACTIVE.";
            auditService.recordFailure(txnId, account.getId(), "INVALID_ACCOUNT_STATUS", reason, null);
            throw new InvalidAccountException(reason);
        }
    }

    private void validateAmountPositive(BigDecimal amount, String txnId, Long accountId) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            String reason = "Transaction amount must be strictly greater than zero";
            auditService.recordFailure(txnId, accountId, "INVALID_AMOUNT", reason, null);
            throw new InvalidTransactionException(reason);
        }
    }

    private void validateTransactionLimits(Account account, BigDecimal amount, String txnId) {
        limitRepository.findByAccountId(account.getId()).ifPresent(limits -> {
            if (limits.getPerTransactionLimit() != null && amount.compareTo(limits.getPerTransactionLimit()) > 0) {
                String reason = String.format("Transaction amount ₹%s exceeds per-transaction limit of ₹%s",
                        amount.toPlainString(), limits.getPerTransactionLimit().toPlainString());
                auditService.recordFailure(txnId, account.getId(), "LIMIT_EXCEEDED", reason, null);
                throw new TransactionLimitExceededException(reason);
            }
        });
    }

    private String resolveTransactionId(String providedTxnId) {
        if (providedTxnId != null && !providedTxnId.trim().isEmpty()) {
            return providedTxnId.trim();
        }
        return "TXN" + System.currentTimeMillis() + (1000 + RANDOM.nextInt(9000));
    }

    private TransactionResponse mapToResponse(Transaction transaction, BigDecimal sourceNewBalance, BigDecimal destinationNewBalance) {
        TransactionResponse response = new TransactionResponse();
        response.setId(transaction.getId());
        response.setTransactionId(transaction.getTransactionId());
        response.setType(transaction.getType());
        if (transaction.getSourceAccount() != null) {
            response.setSourceAccountNumber(transaction.getSourceAccount().getAccountNumber());
        }
        if (transaction.getDestinationAccount() != null) {
            response.setDestinationAccountNumber(transaction.getDestinationAccount().getAccountNumber());
        }
        response.setAmount(transaction.getAmount());
        response.setStatus(transaction.getStatus());
        response.setFailureReason(transaction.getFailureReason());
        response.setSourceNewBalance(sourceNewBalance);
        response.setDestinationNewBalance(destinationNewBalance);
        response.setInitiatedBy(transaction.getInitiatedBy());
        response.setCreatedAt(transaction.getCreatedAt());
        return response;
    }
}
