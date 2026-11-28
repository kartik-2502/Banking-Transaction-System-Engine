package com.bank.transaction.repository;

import com.bank.transaction.model.CashDrawerTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CashDrawerTransactionRepository extends JpaRepository<CashDrawerTransaction, Long> {
    Page<CashDrawerTransaction> findByDrawerIdOrderByCreatedAtDesc(Long drawerId, Pageable pageable);
    List<CashDrawerTransaction> findTop50ByDrawerIdOrderByCreatedAtDesc(Long drawerId);
    List<CashDrawerTransaction> findByDrawerBranchIdAndOperationTypeInOrderByCreatedAtDesc(Long branchId, List<String> operationTypes);
}
