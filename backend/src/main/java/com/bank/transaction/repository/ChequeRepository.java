package com.bank.transaction.repository;

import com.bank.transaction.model.Cheque;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;

@Repository
public interface ChequeRepository extends JpaRepository<Cheque, Long> {
    Optional<Cheque> findByChequeRef(String chequeRef);
    Page<Cheque> findByBranchIdOrderByCreatedAtDesc(Long branchId, Pageable pageable);
    Page<Cheque> findByBranchIdAndStatusOrderByCreatedAtDesc(Long branchId, String status, Pageable pageable);
    Page<Cheque> findAllByOrderByCreatedAtDesc(Pageable pageable);
    long countByBranchIdAndStatusIn(Long branchId, Collection<String> statuses);
}
