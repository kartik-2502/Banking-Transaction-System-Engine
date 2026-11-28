package com.bank.transaction.repository;

import com.bank.transaction.model.Loan;
import com.bank.transaction.model.LoanStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long>, JpaSpecificationExecutor<Loan> {
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

    default Page<Loan> searchBranchLoans(Long branchId,
                                         String assignedOfficer,
                                         LoanStatus status,
                                         String loanCategory,
                                         String q,
                                         BigDecimal minAmount,
                                         BigDecimal maxAmount,
                                         OffsetDateTime since,
                                         OffsetDateTime until,
                                         Pageable pageable) {
        Specification<Loan> spec = (root, cq, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (branchId != null) {
                p.add(cb.equal(root.get("branch").get("id"), branchId));
            }
            if (assignedOfficer != null && !assignedOfficer.isBlank()) {
                p.add(cb.equal(root.get("assignedOfficer"), assignedOfficer.trim()));
            }
            if (status != null) {
                p.add(cb.equal(root.get("status"), status));
            }
            if (loanCategory != null && !loanCategory.isBlank() && !"ALL".equalsIgnoreCase(loanCategory)) {
                p.add(cb.equal(root.get("loanCategory"), loanCategory.trim().toUpperCase()));
            }
            if (minAmount != null) {
                p.add(cb.greaterThanOrEqualTo(root.get("amount"), minAmount));
            }
            if (maxAmount != null) {
                p.add(cb.lessThanOrEqualTo(root.get("amount"), maxAmount));
            }
            if (since != null) {
                p.add(cb.greaterThanOrEqualTo(root.get("createdAt"), since));
            }
            if (until != null) {
                p.add(cb.lessThanOrEqualTo(root.get("createdAt"), until));
            }
            if (q != null && !q.isBlank()) {
                String pattern = "%" + q.trim().toLowerCase() + "%";
                p.add(cb.or(
                        cb.like(cb.lower(root.get("loanId")), pattern),
                        cb.like(cb.lower(root.get("customer").get("customerNumber")), pattern),
                        cb.like(cb.lower(cb.concat(cb.concat(root.get("customer").get("firstName"), " "), root.get("customer").get("lastName"))), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("purpose"), "")), pattern)
                ));
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
        Pageable sorted = pageable.getSort().isSorted()
                ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt"));
        return findAll(spec, sorted);
    }
}
