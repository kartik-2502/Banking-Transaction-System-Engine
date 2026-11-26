package com.bank.transaction.repository;

import com.bank.transaction.model.TrustedDevice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface TrustedDeviceRepository extends JpaRepository<TrustedDevice, Long> {
    List<TrustedDevice> findByUserIdAndRevokedFalseOrderByLastLoginAtDesc(Long userId);
    List<TrustedDevice> findByUserIdOrderByLastLoginAtDesc(Long userId);
    Optional<TrustedDevice> findByDeviceIdAndUserId(String deviceId, Long userId);
    Optional<TrustedDevice> findByUserIdAndDeviceFingerprintHashAndRevokedFalse(Long userId, String deviceFingerprintHash);
    long countByUserIdAndTrustedTrueAndRevokedFalseAndExpiresAtAfter(Long userId, OffsetDateTime now);
}
