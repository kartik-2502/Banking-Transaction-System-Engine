package com.bank.transaction.repository;

import com.bank.transaction.model.AuthenticationChallenge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuthenticationChallengeRepository extends JpaRepository<AuthenticationChallenge, Long> {
    Optional<AuthenticationChallenge> findByChallengeId(String challengeId);
    Optional<AuthenticationChallenge> findByChallengeIdAndUserId(String challengeId, Long userId);
}
