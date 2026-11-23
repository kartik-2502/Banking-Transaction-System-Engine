package com.bank.transaction.repository;

import com.bank.transaction.model.NotificationOutbox;
import com.bank.transaction.model.OutboxStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationOutboxRepository extends JpaRepository<NotificationOutbox, Long> {

    @Query("SELECT o FROM NotificationOutbox o WHERE o.status = :status AND o.retryCount < 5 ORDER BY o.createdAt ASC")
    List<NotificationOutbox> findPendingEvents(@Param("status") OutboxStatus status, Pageable pageable);
}
