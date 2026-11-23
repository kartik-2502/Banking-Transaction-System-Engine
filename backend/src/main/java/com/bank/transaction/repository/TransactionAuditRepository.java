package com.bank.transaction.repository;

import com.bank.transaction.model.TransactionAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionAuditRepository extends JpaRepository<TransactionAudit, Long> {
    List<TransactionAudit> findByTransactionIdOrderByCreatedAtDesc(String transactionId);
    List<TransactionAudit> findByAccountIdOrderByCreatedAtDesc(Long accountId);
}
