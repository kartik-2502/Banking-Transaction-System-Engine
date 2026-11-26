package com.bank.transaction.repository;

import com.bank.transaction.model.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.Optional;

public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findTopByUserIdAndPurposeAndConsumedFalseOrderByCreatedAtDesc(Long userId, String purpose);
    Optional<OtpVerification> findTopByChallengeIdAndConsumedFalseOrderByCreatedAtDesc(String challengeId);
    Optional<OtpVerification> findTopByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserIdAndCreatedAtAfter(Long userId, OffsetDateTime since);
}
