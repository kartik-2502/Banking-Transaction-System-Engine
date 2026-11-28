package com.bank.transaction.repository;

import com.bank.transaction.model.Account;
import com.bank.transaction.model.Transaction;
import com.bank.transaction.model.TransactionStatus;
import com.bank.transaction.model.TransactionType;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
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

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {

    Optional<Transaction> findByTransactionId(String transactionId);

    boolean existsByTransactionId(String transactionId);

    Page<Transaction> findBySourceAccountIdOrDestinationAccountIdOrderByCreatedAtDesc(Long sourceAccountId, Long destinationAccountId, Pageable pageable);

    List<Transaction> findByStatus(TransactionStatus status);

    @Query("SELECT t FROM Transaction t WHERE (t.sourceAccount.id = :accountId OR t.destinationAccount.id = :accountId) AND t.createdAt >= :since ORDER BY t.createdAt DESC")
    List<Transaction> findRecentTransactionsForAccount(@Param("accountId") Long accountId, @Param("since") OffsetDateTime since);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.sourceAccount.id = :accountId AND t.type = :type AND t.status = :status AND t.createdAt >= :since")
    long countRecentByAccountAndTypeAndStatus(@Param("accountId") Long accountId, @Param("type") TransactionType type, @Param("status") TransactionStatus status, @Param("since") OffsetDateTime since);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.sourceAccount.id = :sourceId AND t.destinationAccount.id = :destId AND t.createdAt >= :since")
    long countRecentTransfersBetweenAccounts(@Param("sourceId") Long sourceId, @Param("destId") Long destId, @Param("since") OffsetDateTime since);

    default Page<Transaction> searchBranchTransactions(Long branchId,
                                                       TransactionType type,
                                                       TransactionStatus status,
                                                       OffsetDateTime since,
                                                       OffsetDateTime until,
                                                       String q,
                                                       Pageable pageable) {
        Specification<Transaction> spec = (root, query, cb) -> {
            Join<Transaction, Account> sa = root.join("sourceAccount", JoinType.LEFT);
            Join<Transaction, Account> da = root.join("destinationAccount", JoinType.LEFT);
            List<Predicate> predicates = new ArrayList<>();

            if (branchId != null) {
                predicates.add(cb.or(
                        cb.equal(sa.get("branch").get("id"), branchId),
                        cb.equal(da.get("branch").get("id"), branchId)
                ));
            }
            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (since != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), since));
            }
            if (until != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), until));
            }
            if (q != null && !q.isBlank()) {
                String pattern = "%" + q.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("transactionId")), pattern),
                        cb.like(cb.lower(cb.coalesce(sa.get("accountNumber"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(da.get("accountNumber"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("initiatedBy"), "")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable sorted = pageable.getSort().isSorted()
                ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt"));
        return findAll(spec, sorted);
    }

    @Query("SELECT t FROM Transaction t WHERE t.createdAt >= :since ORDER BY t.createdAt DESC")
    List<Transaction> findAllSince(@Param("since") OffsetDateTime since);
}
