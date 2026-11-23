package com.bank.transaction.repository;

import com.bank.transaction.model.FraudAlert;
import com.bank.transaction.model.FraudAlertStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FraudAlertRepository extends JpaRepository<FraudAlert, Long> {
    List<FraudAlert> findByStatusOrderByCreatedAtDesc(FraudAlertStatus status);
    List<FraudAlert> findByAccountIdOrderByCreatedAtDesc(Long accountId);
}
