package com.bank.transaction.repository;

import com.bank.transaction.model.UserMfaSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserMfaSettingsRepository extends JpaRepository<UserMfaSettings, Long> {
    Optional<UserMfaSettings> findByUserId(Long userId);
    Optional<UserMfaSettings> findByUserUsername(String username);
}
