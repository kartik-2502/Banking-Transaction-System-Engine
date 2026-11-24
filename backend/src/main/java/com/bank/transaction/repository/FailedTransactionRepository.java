package com.bank.transaction.repository;

import com.bank.transaction.model.FailedTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FailedTransactionRepository extends JpaRepository<FailedTransaction, Long> {
    Optional<FailedTransaction> findByTransactionId(String transactionId);
    List<FailedTransaction> findByAccountIdOrderByCreatedAtDesc(Long accountId);
    List<FailedTransaction> findByErrorCategory(String errorCategory);

    @Query("SELECT COUNT(f) FROM FailedTransaction f WHERE f.accountId = :accountId AND f.createdAt >= :since")
    long countRecentFailuresForAccount(@Param("accountId") Long accountId, @Param("since") OffsetDateTime since);
}
