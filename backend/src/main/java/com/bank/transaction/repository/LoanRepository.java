package com.bank.transaction.repository;

import com.bank.transaction.model.Loan;
import com.bank.transaction.model.LoanStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    Optional<Loan> findByLoanId(String loanId);
    List<Loan> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    Page<Loan> findByStatus(LoanStatus status, Pageable pageable);
    boolean existsByLoanId(String loanId);

    long countByStatus(LoanStatus status);
    long countByRequiresAdminApprovalTrueAndStatus(LoanStatus status);

    @Query("SELECT SUM(l.amount) FROM Loan l WHERE l.status = com.bank.transaction.model.LoanStatus.DISBURSED")
    BigDecimal sumDisbursedLoanVolume();

    @Query("SELECT l FROM Loan l WHERE " +
            "LOWER(l.loanId) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(l.customer.customerNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(l.customer.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(l.customer.lastName) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Loan> searchLoansWithoutStatus(@Param("search") String search, Pageable pageable);

    @Query("SELECT l FROM Loan l WHERE l.status = :status AND (" +
            "LOWER(l.loanId) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(l.customer.customerNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(l.customer.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(l.customer.lastName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Loan> searchLoansWithStatus(@Param("status") LoanStatus status,
                                     @Param("search") String search,
                                     Pageable pageable);
}
