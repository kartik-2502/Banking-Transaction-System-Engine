package com.bank.transaction.repository;

import com.bank.transaction.model.TransactionReversalRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TransactionReversalRequestRepository extends JpaRepository<TransactionReversalRequest, Long> {
    Optional<TransactionReversalRequest> findByReversalId(String reversalId);
    Page<TransactionReversalRequest> findByBranchIdOrderByCreatedAtDesc(Long branchId, Pageable pageable);
    Page<TransactionReversalRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);
    long countByBranchIdAndStatus(Long branchId, String status);
    boolean existsByTransactionIdAndStatusIn(String transactionId, java.util.Collection<String> statuses);
}
