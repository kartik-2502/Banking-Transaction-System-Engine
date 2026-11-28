package com.bank.transaction.repository;

import com.bank.transaction.model.LoanCommunication;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public interface LoanCommunicationRepository extends JpaRepository<LoanCommunication, Long>, JpaSpecificationExecutor<LoanCommunication> {
    List<LoanCommunication> findByLoanIdOrderByCreatedAtDesc(Long loanId);

    default Page<LoanCommunication> findByBranchScope(Long branchId, Pageable pageable) {
        Specification<LoanCommunication> spec = (root, cq, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (branchId != null) {
                p.add(cb.equal(root.get("customer").get("branch").get("id"), branchId));
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
        Pageable sorted = pageable.getSort().isSorted()
                ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt"));
        return findAll(spec, sorted);
    }
}
