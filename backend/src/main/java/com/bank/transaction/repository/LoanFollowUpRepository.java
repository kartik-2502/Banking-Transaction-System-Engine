package com.bank.transaction.repository;

import com.bank.transaction.model.LoanFollowUp;
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
import java.util.Optional;

@Repository
public interface LoanFollowUpRepository extends JpaRepository<LoanFollowUp, Long>, JpaSpecificationExecutor<LoanFollowUp> {
    Optional<LoanFollowUp> findByFollowupId(String followupId);
    List<LoanFollowUp> findByLoanIdOrderByCreatedAtDesc(Long loanId);

    default Page<LoanFollowUp> findByBranchScope(Long branchId, Pageable pageable) {
        Specification<LoanFollowUp> spec = (root, cq, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (branchId != null) {
                p.add(cb.equal(root.get("branch").get("id"), branchId));
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
        Pageable sorted = pageable.getSort().isSorted()
                ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt"));
        return findAll(spec, sorted);
    }
}
