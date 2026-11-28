package com.bank.transaction.repository;

import com.bank.transaction.model.CustomerComplaint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;

@Repository
public interface CustomerComplaintRepository extends JpaRepository<CustomerComplaint, Long> {
    Optional<CustomerComplaint> findByComplaintId(String complaintId);
    Page<CustomerComplaint> findByBranchIdOrderByCreatedAtDesc(Long branchId, Pageable pageable);
    Page<CustomerComplaint> findByBranchIdAndStatusOrderByCreatedAtDesc(Long branchId, String status, Pageable pageable);
    Page<CustomerComplaint> findAllByOrderByCreatedAtDesc(Pageable pageable);
    long countByBranchIdAndStatusIn(Long branchId, Collection<String> statuses);
}
