package com.bank.transaction.idempotency;

import com.bank.transaction.dto.TransactionResponse;
import com.bank.transaction.model.Transaction;
import com.bank.transaction.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Supplier;

/**
 * Robust Multi-Layer Idempotency Manager.
 * 1. Application-level in-flight synchronization per transaction ID.
 * 2. Database-level transaction lookup to return cached outcomes without re-processing.
 * 3. Backed by PostgreSQL UNIQUE (transaction_id) constraint for absolute ACID guarantee.
 */
@Component
public class IdempotencyManager {

    private static final Logger log = LoggerFactory.getLogger(IdempotencyManager.class);

    private final TransactionRepository transactionRepository;
    private final ConcurrentHashMap<String, ReentrantLock> inFlightLocks = new ConcurrentHashMap<>();

    public IdempotencyManager(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    /**
     * Executes the banking operation with strict idempotency guarantees.
     * If transactionId already exists, returns the original result without executing the supplier.
     */
    public TransactionResponse executeIdempotent(String transactionId, Supplier<TransactionResponse> transactionSupplier) {
        // Fast-path: Check database if already processed
        Optional<Transaction> existing = transactionRepository.findByTransactionId(transactionId);
        if (existing.isPresent()) {
            log.info("Idempotency HIT: Transaction '{}' already processed. Returning original receipt.", transactionId);
            return mapExistingToResponse(existing.get(), true);
        }

        // Synchronize in-flight concurrent requests with the identical transactionId
        ReentrantLock lock = inFlightLocks.computeIfAbsent(transactionId, k -> new ReentrantLock());
        lock.lock();
        try {
            // Re-check after acquiring lock in case a concurrent thread just committed it
            existing = transactionRepository.findByTransactionId(transactionId);
            if (existing.isPresent()) {
                log.info("Idempotency HIT (post-lock): Transaction '{}' was just committed by another thread.", transactionId);
                return mapExistingToResponse(existing.get(), true);
            }

            // Execute transaction
            return transactionSupplier.get();
        } finally {
            lock.unlock();
            inFlightLocks.remove(transactionId, lock);
        }
    }

    public Optional<TransactionResponse> findExisting(String transactionId) {
        return transactionRepository.findByTransactionId(transactionId)
                .map(tx -> mapExistingToResponse(tx, true));
    }

    private TransactionResponse mapExistingToResponse(Transaction tx, boolean duplicate) {
        TransactionResponse response = new TransactionResponse();
        response.setId(tx.getId());
        response.setTransactionId(tx.getTransactionId());
        response.setType(tx.getType());
        if (tx.getSourceAccount() != null) {
            response.setSourceAccountNumber(tx.getSourceAccount().getAccountNumber());
            response.setSourceNewBalance(tx.getSourceAccount().getBalance());
        }
        if (tx.getDestinationAccount() != null) {
            response.setDestinationAccountNumber(tx.getDestinationAccount().getAccountNumber());
            response.setDestinationNewBalance(tx.getDestinationAccount().getBalance());
        }
        response.setAmount(tx.getAmount());
        response.setStatus(tx.getStatus());
        response.setFailureReason(tx.getFailureReason());
        response.setInitiatedBy(tx.getInitiatedBy());
        response.setCreatedAt(tx.getCreatedAt());
        return response;
    }
}
