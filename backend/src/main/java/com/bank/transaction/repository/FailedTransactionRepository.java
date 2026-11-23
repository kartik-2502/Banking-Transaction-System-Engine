package com.bank.transaction.repository;

import com.bank.transaction.model.FailedTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FailedTransactionRepository extends JpaRepository<FailedTransaction, Long> {
    Optional<FailedTransaction> findByTransactionId(String transactionId);
    List<FailedTransaction> findByAccountIdOrderByCreatedAtDesc(Long accountId);
    List<FailedTransaction> findByErrorCategory(String errorCategory);
}
