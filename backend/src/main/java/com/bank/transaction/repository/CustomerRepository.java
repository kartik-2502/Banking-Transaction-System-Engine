package com.bank.transaction.repository;

import com.bank.transaction.model.Account;
import com.bank.transaction.model.Customer;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long>, JpaSpecificationExecutor<Customer> {
    Optional<Customer> findByCustomerNumber(String customerNumber);
    Optional<Customer> findByEmail(String email);
    Optional<Customer> findByUserId(Long userId);
    boolean existsByCustomerNumber(String customerNumber);
    boolean existsByEmail(String email);

    @Query("SELECT c FROM Customer c LEFT JOIN FETCH c.accounts WHERE c.id = :id")
    Optional<Customer> findByIdWithAccounts(@Param("id") Long id);

    @Query("SELECT c FROM Customer c LEFT JOIN FETCH c.accounts WHERE c.customerNumber = :customerNumber")
    Optional<Customer> findByCustomerNumberWithAccounts(@Param("customerNumber") String customerNumber);

    default Page<Customer> searchCustomers(Long branchId,
                                           String kycStatus,
                                           String query,
                                           Pageable pageable) {
        Specification<Customer> spec = (root, cq, cb) -> {
            if (cq != null) {
                cq.distinct(true);
            }
            Join<Customer, Account> acctJoin = root.join("accounts", JoinType.LEFT);
            List<Predicate> predicates = new ArrayList<>();

            if (branchId != null) {
                predicates.add(cb.equal(root.get("branch").get("id"), branchId));
            }
            if (kycStatus != null && !kycStatus.isBlank()) {
                predicates.add(cb.equal(root.get("kycStatus"), kycStatus.trim()));
            }
            if (query != null && !query.isBlank()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(cb.concat(cb.concat(root.get("firstName"), " "), root.get("lastName"))), pattern),
                        cb.like(cb.lower(root.get("customerNumber")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("phone"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(acctJoin.get("accountNumber"), "")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return findAll(spec, pageable);
    }
}
