package com.bank.transaction.repository;

import com.bank.transaction.model.Transaction;
import com.bank.transaction.model.TransactionStatus;
import com.bank.transaction.model.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByTransactionId(String transactionId);

    boolean existsByTransactionId(String transactionId);

    Page<Transaction> findBySourceAccountIdOrDestinationAccountIdOrderByCreatedAtDesc(Long sourceAccountId, Long destinationAccountId, Pageable pageable);

    List<Transaction> findByStatus(TransactionStatus status);

    @Query("SELECT t FROM Transaction t WHERE (t.sourceAccount.id = :accountId OR t.destinationAccount.id = :accountId) AND t.createdAt >= :since ORDER BY t.createdAt DESC")
    List<Transaction> findRecentTransactionsForAccount(@Param("accountId") Long accountId, @Param("since") OffsetDateTime since);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.sourceAccount.id = :accountId AND t.type = :type AND t.status = :status AND t.createdAt >= :since")
    long countRecentByAccountAndTypeAndStatus(@Param("accountId") Long accountId, @Param("type") TransactionType type, @Param("status") TransactionStatus status, @Param("since") OffsetDateTime since);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.sourceAccount.id = :sourceId AND t.destinationAccount.id = :destId AND t.createdAt >= :since")
    long countRecentTransfersBetweenAccounts(@Param("sourceId") Long sourceId, @Param("destId") Long destId, @Param("since") OffsetDateTime since);
}
