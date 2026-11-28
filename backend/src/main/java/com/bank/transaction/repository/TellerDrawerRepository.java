package com.bank.transaction.repository;

import com.bank.transaction.model.TellerDrawer;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TellerDrawerRepository extends JpaRepository<TellerDrawer, Long> {
    Optional<TellerDrawer> findByTellerProfileIdAndBusinessDate(Long tellerProfileId, LocalDate businessDate);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM TellerDrawer d WHERE d.tellerProfile.id = :profileId AND d.businessDate = :businessDate")
    Optional<TellerDrawer> findWithLockByTellerProfileIdAndBusinessDate(@Param("profileId") Long profileId,
                                                                        @Param("businessDate") LocalDate businessDate);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM TellerDrawer d WHERE d.id = :id")
    Optional<TellerDrawer> findWithLockById(@Param("id") Long id);

    List<TellerDrawer> findByBranchIdOrderByBusinessDateDesc(Long branchId);
}
