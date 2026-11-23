package com.bank.transaction.repository;

import com.bank.transaction.model.AccountTransactionLimit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountTransactionLimitRepository extends JpaRepository<AccountTransactionLimit, Long> {
    Optional<AccountTransactionLimit> findByAccountId(Long accountId);
}
