package com.bank.transaction.repository;

import com.bank.transaction.model.LoanAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanAuditLogRepository extends JpaRepository<LoanAuditLog, Long> {
    List<LoanAuditLog> findByLoanIdOrderByCreatedAtDesc(Long loanId);
    Page<LoanAuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
