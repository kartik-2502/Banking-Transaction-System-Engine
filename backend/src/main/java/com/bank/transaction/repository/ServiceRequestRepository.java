package com.bank.transaction.repository;

import com.bank.transaction.model.ServiceRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {
    Optional<ServiceRequest> findByRequestId(String requestId);
    Page<ServiceRequest> findByBranchIdOrderByCreatedAtDesc(Long branchId, Pageable pageable);
    Page<ServiceRequest> findByBranchIdAndStatusOrderByCreatedAtDesc(Long branchId, String status, Pageable pageable);
    Page<ServiceRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<ServiceRequest> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    long countByBranchIdAndStatusIn(Long branchId, Collection<String> statuses);
}
