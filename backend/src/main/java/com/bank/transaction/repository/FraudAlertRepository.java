package com.bank.transaction.repository;

import com.bank.transaction.model.FraudAlert;
import com.bank.transaction.model.FraudAlertStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FraudAlertRepository extends JpaRepository<FraudAlert, Long> {
    List<FraudAlert> findByStatusOrderByCreatedAtDesc(FraudAlertStatus status);
    Page<FraudAlert> findByStatus(FraudAlertStatus status, Pageable pageable);
    List<FraudAlert> findByAccountIdOrderByCreatedAtDesc(Long accountId);
    Optional<FraudAlert> findByTransactionId(String transactionId);
    long countByStatus(FraudAlertStatus status);
}
