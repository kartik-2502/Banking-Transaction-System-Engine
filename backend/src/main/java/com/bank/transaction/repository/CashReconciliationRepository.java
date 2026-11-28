package com.bank.transaction.repository;

import com.bank.transaction.model.CashReconciliation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CashReconciliationRepository extends JpaRepository<CashReconciliation, Long> {
    Optional<CashReconciliation> findByReconciliationId(String reconciliationId);
    List<CashReconciliation> findByBranchIdOrderByCreatedAtDesc(Long branchId);
    List<CashReconciliation> findAllByOrderByCreatedAtDesc();
}
