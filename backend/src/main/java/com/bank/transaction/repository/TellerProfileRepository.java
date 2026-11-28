package com.bank.transaction.repository;

import com.bank.transaction.model.TellerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TellerProfileRepository extends JpaRepository<TellerProfile, Long> {
    Optional<TellerProfile> findByUserId(Long userId);
    @Query("SELECT tp FROM TellerProfile tp JOIN FETCH tp.user u JOIN FETCH tp.branch b WHERE u.username = :username")
    Optional<TellerProfile> findByUsernameWithDetails(@Param("username") String username);
    List<TellerProfile> findByBranchId(Long branchId);
}
