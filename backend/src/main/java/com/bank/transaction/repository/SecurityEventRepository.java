package com.bank.transaction.repository;

import com.bank.transaction.model.SecurityEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;

public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {
    Page<SecurityEvent> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<SecurityEvent> findAllByOrderByCreatedAtDesc(Pageable pageable);
    long countByUserIdAndEventTypeAndCreatedAtAfter(Long userId, String eventType, OffsetDateTime since);
}
