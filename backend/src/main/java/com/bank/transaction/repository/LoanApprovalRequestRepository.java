package com.bank.transaction.repository;

import com.bank.transaction.model.LoanApprovalRequest;
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
public interface LoanApprovalRequestRepository extends JpaRepository<LoanApprovalRequest, Long>, JpaSpecificationExecutor<LoanApprovalRequest> {
    Optional<LoanApprovalRequest> findByApprovalId(String approvalId);
    List<LoanApprovalRequest> findByLoanIdOrderByCreatedAtDesc(Long loanId);

    default Page<LoanApprovalRequest> searchApprovals(Long branchId, String status, Pageable pageable) {
        Specification<LoanApprovalRequest> spec = (root, cq, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (branchId != null) {
                p.add(cb.equal(root.get("branch").get("id"), branchId));
            }
            if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
                p.add(cb.equal(root.get("status"), status.trim().toUpperCase()));
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
        Pageable sorted = pageable.getSort().isSorted()
                ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt"));
        return findAll(spec, sorted);
    }
}
