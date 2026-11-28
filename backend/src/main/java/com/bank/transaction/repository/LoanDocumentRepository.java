package com.bank.transaction.repository;

import com.bank.transaction.model.LoanDocument;
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
public interface LoanDocumentRepository extends JpaRepository<LoanDocument, Long>, JpaSpecificationExecutor<LoanDocument> {
    Optional<LoanDocument> findByDocumentId(String documentId);
    List<LoanDocument> findByLoanIdOrderByCreatedAtDesc(Long loanId);
    long countByLoanIdAndVerificationStatus(Long loanId, String verificationStatus);

    default Page<LoanDocument> findByBranchAndOptionalStatus(Long branchId, String status, String assignedOfficer, Pageable pageable) {
        Specification<LoanDocument> spec = (root, cq, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (branchId != null) {
                p.add(cb.equal(root.get("loan").get("branch").get("id"), branchId));
            }
            if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
                p.add(cb.equal(root.get("verificationStatus"), status.trim().toUpperCase()));
            }
            if (assignedOfficer != null && !assignedOfficer.isBlank()) {
                p.add(cb.equal(root.get("loan").get("assignedOfficer"), assignedOfficer));
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
        Pageable sorted = pageable.getSort().isSorted()
                ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt"));
        return findAll(spec, sorted);
    }
}
