package com.bank.transaction.repository;

import com.bank.transaction.model.Account;
import com.bank.transaction.model.AccountStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByAccountNumber(String accountNumber);

    List<Account> findByCustomerId(Long customerId);

    List<Account> findByStatus(AccountStatus status);

    boolean existsByAccountNumber(String accountNumber);

    /**
     * Acquires an explicit pessimistic write lock (SELECT ... FOR UPDATE) on a single account.
     * Guarantees atomic reads and mutations during concurrent transaction execution.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.accountNumber = :accountNumber")
    Optional<Account> findByAccountNumberWithPessimisticLock(@Param("accountNumber") String accountNumber);

    /**
     * Acquires an explicit pessimistic write lock (SELECT ... FOR UPDATE) by Account ID.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.id = :id")
    Optional<Account> findByIdWithPessimisticLock(@Param("id") Long id);

    /**
     * Acquires pessimistic locks on accounts in deterministic ascending ID order to prevent deadlocks.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.id IN (:ids) ORDER BY a.id ASC")
    List<Account> findByIdsWithPessimisticLockSorted(@Param("ids") Collection<Long> ids);
}
