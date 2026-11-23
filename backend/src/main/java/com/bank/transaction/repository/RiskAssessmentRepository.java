package com.bank.transaction.repository;

import com.bank.transaction.model.RiskAssessment;
import com.bank.transaction.model.RiskLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RiskAssessmentRepository extends JpaRepository<RiskAssessment, Long> {
    Optional<RiskAssessment> findByTransactionId(String transactionId);
    List<RiskAssessment> findByAccountIdOrderByCreatedAtDesc(Long accountId);
    List<RiskAssessment> findByRiskLevel(RiskLevel riskLevel);
}
