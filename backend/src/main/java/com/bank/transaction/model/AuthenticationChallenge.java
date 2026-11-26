package com.bank.transaction.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "authentication_challenges")
public class AuthenticationChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "challenge_id", nullable = false, unique = true, length = 64)
    private String challengeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "challenge_type", nullable = false, length = 40)
    private ChallengeType challengeType;

    @Column(name = "required_method", nullable = false, length = 40)
    private String requiredMethod;

    @Column(name = "risk_score", nullable = false)
    private int riskScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false, length = 20)
    private RiskLevel riskLevel;

    @Column(name = "risk_reasons", length = 1000)
    private String riskReasons;

    @Column(name = "transaction_binding_hash", length = 128)
    private String transactionBindingHash;

    @Column(name = "target_reference", length = 160)
    private String targetReference;

    @Column(name = "device_fingerprint_hash", length = 128)
    private String deviceFingerprintHash;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ChallengeStatus status = ChallengeStatus.PENDING;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount = 0;

    @Column(name = "max_attempts", nullable = false)
    private int maxAttempts = 5;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "verified_at")
    private OffsetDateTime verifiedAt;

    @Column(name = "consumed_at")
    private OffsetDateTime consumedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public AuthenticationChallenge() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getChallengeId() { return challengeId; }
    public void setChallengeId(String challengeId) { this.challengeId = challengeId; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public ChallengeType getChallengeType() { return challengeType; }
    public void setChallengeType(ChallengeType challengeType) { this.challengeType = challengeType; }

    public String getRequiredMethod() { return requiredMethod; }
    public void setRequiredMethod(String requiredMethod) { this.requiredMethod = requiredMethod; }

    public int getRiskScore() { return riskScore; }
    public void setRiskScore(int riskScore) { this.riskScore = riskScore; }

    public RiskLevel getRiskLevel() { return riskLevel; }
    public void setRiskLevel(RiskLevel riskLevel) { this.riskLevel = riskLevel; }

    public String getRiskReasons() { return riskReasons; }
    public void setRiskReasons(String riskReasons) { this.riskReasons = riskReasons; }

    public String getTransactionBindingHash() { return transactionBindingHash; }
    public void setTransactionBindingHash(String transactionBindingHash) { this.transactionBindingHash = transactionBindingHash; }

    public String getTargetReference() { return targetReference; }
    public void setTargetReference(String targetReference) { this.targetReference = targetReference; }

    public String getDeviceFingerprintHash() { return deviceFingerprintHash; }
    public void setDeviceFingerprintHash(String deviceFingerprintHash) { this.deviceFingerprintHash = deviceFingerprintHash; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public ChallengeStatus getStatus() { return status; }
    public void setStatus(ChallengeStatus status) { this.status = status; }

    public int getAttemptCount() { return attemptCount; }
    public void setAttemptCount(int attemptCount) { this.attemptCount = attemptCount; }

    public int getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(int maxAttempts) { this.maxAttempts = maxAttempts; }

    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }

    public OffsetDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(OffsetDateTime verifiedAt) { this.verifiedAt = verifiedAt; }

    public OffsetDateTime getConsumedAt() { return consumedAt; }
    public void setConsumedAt(OffsetDateTime consumedAt) { this.consumedAt = consumedAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
}
