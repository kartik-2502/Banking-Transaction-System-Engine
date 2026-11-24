package com.bank.transaction.repository;

import com.bank.transaction.model.Loan;
import com.bank.transaction.model.LoanStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    Optional<Loan> findByLoanId(String loanId);
    List<Loan> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    Page<Loan> findByStatus(LoanStatus status, Pageable pageable);
    boolean existsByLoanId(String loanId);
}
