package com.bank.transaction.repository;

import com.bank.transaction.model.LoanStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanStatusHistoryRepository extends JpaRepository<LoanStatusHistory, Long> {
    List<LoanStatusHistory> findByLoanIdOrderByCreatedAtDesc(Long loanId);
}
