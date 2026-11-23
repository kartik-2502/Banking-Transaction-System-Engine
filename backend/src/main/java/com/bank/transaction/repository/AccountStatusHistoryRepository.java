package com.bank.transaction.repository;

import com.bank.transaction.model.AccountStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccountStatusHistoryRepository extends JpaRepository<AccountStatusHistory, Long> {
    List<AccountStatusHistory> findByAccountIdOrderByCreatedAtDesc(Long accountId);
}
