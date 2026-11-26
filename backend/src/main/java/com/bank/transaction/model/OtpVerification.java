package com.bank.transaction.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "otp_verifications")
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "otp_id", nullable = false, unique = true, length = 64)
    private String otpId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "challenge_id", length = 64)
    private String challengeId;

    @Column(nullable = false, length = 40)
    private String purpose;

    @Column(name = "otp_hash", nullable = false, length = 128)
    private String otpHash;

    @Column(nullable = false, length = 64)
    private String salt;

    @Column(name = "delivery_target_masked", nullable = false, length = 120)
    private String deliveryTargetMasked;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount = 0;

    @Column(name = "max_attempts", nullable = false)
    private int maxAttempts = 5;

    @Column(nullable = false)
    private boolean consumed = false;

    @Column(name = "resend_available_at", nullable = false)
    private OffsetDateTime resendAvailableAt;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public OtpVerification() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOtpId() { return otpId; }
    public void setOtpId(String otpId) { this.otpId = otpId; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getChallengeId() { return challengeId; }
    public void setChallengeId(String challengeId) { this.challengeId = challengeId; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public String getOtpHash() { return otpHash; }
    public void setOtpHash(String otpHash) { this.otpHash = otpHash; }

    public String getSalt() { return salt; }
    public void setSalt(String salt) { this.salt = salt; }

    public String getDeliveryTargetMasked() { return deliveryTargetMasked; }
    public void setDeliveryTargetMasked(String deliveryTargetMasked) { this.deliveryTargetMasked = deliveryTargetMasked; }

    public int getAttemptCount() { return attemptCount; }
    public void setAttemptCount(int attemptCount) { this.attemptCount = attemptCount; }

    public int getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(int maxAttempts) { this.maxAttempts = maxAttempts; }

    public boolean isConsumed() { return consumed; }
    public void setConsumed(boolean consumed) { this.consumed = consumed; }

    public OffsetDateTime getResendAvailableAt() { return resendAvailableAt; }
    public void setResendAvailableAt(OffsetDateTime resendAvailableAt) { this.resendAvailableAt = resendAvailableAt; }

    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
}
