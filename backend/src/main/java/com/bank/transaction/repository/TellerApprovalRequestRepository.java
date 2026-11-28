package com.bank.transaction.repository;

import com.bank.transaction.model.TellerApprovalRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TellerApprovalRequestRepository extends JpaRepository<TellerApprovalRequest, Long> {
    Optional<TellerApprovalRequest> findByApprovalId(String approvalId);
    Page<TellerApprovalRequest> findByBranchIdOrderByCreatedAtDesc(Long branchId, Pageable pageable);
    Page<TellerApprovalRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);
    long countByBranchIdAndStatus(Long branchId, String status);
}
