package com.bank.transaction.repository;

import com.bank.transaction.model.LoanOfficerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoanOfficerProfileRepository extends JpaRepository<LoanOfficerProfile, Long> {
    @Query("SELECT p FROM LoanOfficerProfile p JOIN FETCH p.user u JOIN FETCH p.branch b WHERE u.username = :username")
    Optional<LoanOfficerProfile> findByUsernameWithDetails(@Param("username") String username);

    List<LoanOfficerProfile> findByBranchId(Long branchId);
}
