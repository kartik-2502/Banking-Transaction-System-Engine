package com.bank.transaction.service;

import com.bank.transaction.config.AmfaProperties;
import com.bank.transaction.dto.AuthResponse;
import com.bank.transaction.dto.NotificationEvent;
import com.bank.transaction.dto.TransferRequest;
import com.bank.transaction.dto.mfa.*;
import com.bank.transaction.exception.AccountLockedException;
import com.bank.transaction.exception.InvalidTransactionException;
import com.bank.transaction.exception.MfaRequiredException;
import com.bank.transaction.exception.RateLimitExceededException;
import com.bank.transaction.model.*;
import com.bank.transaction.repository.*;
import com.bank.transaction.security.AmfaCryptoService;
import com.bank.transaction.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdaptiveMfaService {

    private static final Logger log = LoggerFactory.getLogger(AdaptiveMfaService.class);

    private final UserRepository userRepository;
    private final UserMfaSettingsRepository mfaSettingsRepository;
    private final TrustedDeviceRepository trustedDeviceRepository;
    private final AuthenticationChallengeRepository challengeRepository;
    private final OtpVerificationRepository otpRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final AmfaProperties properties;
    private final AmfaCryptoService cryptoService;
    private final AdaptiveRiskEngine riskEngine;
    private final OtpDeliveryChannel otpDeliveryChannel;
    private final SecurityEventService securityEventService;
    private final OutboxService outboxService;
    private final MfaRateLimiterService rateLimiterService;
    private final JwtTokenProvider jwtTokenProvider;

    public AdaptiveMfaService(UserRepository userRepository,
                              UserMfaSettingsRepository mfaSettingsRepository,
                              TrustedDeviceRepository trustedDeviceRepository,
                              AuthenticationChallengeRepository challengeRepository,
                              OtpVerificationRepository otpRepository,
                              AccountRepository accountRepository,
                              TransactionRepository transactionRepository,
                              AmfaProperties properties,
                              AmfaCryptoService cryptoService,
                              AdaptiveRiskEngine riskEngine,
                              OtpDeliveryChannel otpDeliveryChannel,
                              SecurityEventService securityEventService,
                              OutboxService outboxService,
                              MfaRateLimiterService rateLimiterService,
                              JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.mfaSettingsRepository = mfaSettingsRepository;
        this.trustedDeviceRepository = trustedDeviceRepository;
        this.challengeRepository = challengeRepository;
        this.otpRepository = otpRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.properties = properties;
        this.cryptoService = cryptoService;
        this.riskEngine = riskEngine;
        this.otpDeliveryChannel = otpDeliveryChannel;
        this.securityEventService = securityEventService;
        this.outboxService = outboxService;
        this.rateLimiterService = rateLimiterService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public static class ClientContext {
        private final String ipAddress;
        private final String userAgent;
        private final String deviceFingerprint;
        private final String deviceName;
        private final String browser;
        private final String operatingSystem;
        private final String locationHint;

        public ClientContext(String ipAddress, String userAgent, String deviceFingerprint,
                             String deviceName, String browser, String operatingSystem, String locationHint) {
            this.ipAddress = normalizeIp(ipAddress);
            this.userAgent = userAgent != null ? userAgent : "Unknown";
            this.deviceFingerprint = deviceFingerprint;
            this.deviceName = deviceName != null && !deviceName.isBlank() ? deviceName : "Web Browser";
            this.browser = browser != null && !browser.isBlank() ? browser : "Unknown Browser";
            this.operatingSystem = operatingSystem != null && !operatingSystem.isBlank() ? operatingSystem : "Unknown OS";
            this.locationHint = locationHint;
        }

        private static String normalizeIp(String ip) {
            if (ip == null || ip.isBlank()) return "127.0.0.1";
            String trimmed = ip.trim();
            if ("0:0:0:0:0:0:0:1".equals(trimmed) || "::1".equals(trimmed)) {
                return "127.0.0.1";
            }
            return trimmed;
        }

        public static ClientContext empty() {
            return new ClientContext("127.0.0.1", "API-Client", null, "API Client", "API", "Server", null);
        }

        public String getIpAddress() { return ipAddress; }
        public String getUserAgent() { return userAgent; }
        public String getDeviceFingerprint() { return deviceFingerprint; }
        public String getDeviceName() { return deviceName; }
        public String getBrowser() { return browser; }
        public String getOperatingSystem() { return operatingSystem; }
        public String getLocationHint() { return locationHint; }
    }

    @Transactional
    public UserMfaSettings getOrCreateSettings(User user) {
        return mfaSettingsRepository.findByUserId(user.getId())
                .orElseGet(() -> mfaSettingsRepository.save(new UserMfaSettings(user)));
    }

    @Transactional(noRollbackFor = {AccountLockedException.class})
    public void assertNotLocked(User user) {
        UserMfaSettings settings = getOrCreateSettings(user);
        if (settings.getLockedUntil() != null && settings.getLockedUntil().isAfter(OffsetDateTime.now())) {
            securityEventService.recordEvent(
                    user.getId(), user.getUsername(), "LOGIN_BLOCKED_LOCKED",
                    "HIGH", 85, RiskLevel.CRITICAL, null, null, null, "BLOCKED",
                    "Attempted login while account is temporarily locked until " + settings.getLockedUntil()
            );
            throw new AccountLockedException(
                    "Account temporarily locked due to multiple failed authentication attempts. Try again after " + settings.getLockedUntil()
            );
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailedLogin(String username, ClientContext ctx) {
        userRepository.findByUsername(username).ifPresent(user -> {
            UserMfaSettings settings = getOrCreateSettings(user);
            int attempts = settings.getFailedLoginAttempts() + 1;
            settings.setFailedLoginAttempts(attempts);

            boolean lockedNow = attempts >= properties.getMaxFailedLoginAttempts();
            if (lockedNow) {
                settings.setLockedUntil(OffsetDateTime.now().plusMinutes(properties.getLockoutDurationMinutes()));
            }
            mfaSettingsRepository.save(settings);

            securityEventService.recordEvent(
                    user.getId(),
                    username,
                    lockedNow ? "ACCOUNT_LOCKED" : "LOGIN_FAILED",
                    lockedNow ? "CRITICAL" : (attempts >= 3 ? "HIGH" : "MEDIUM"),
                    lockedNow ? 90 : attempts * 15,
                    lockedNow ? RiskLevel.CRITICAL : (attempts >= 3 ? RiskLevel.HIGH : RiskLevel.MEDIUM),
                    ctx.getIpAddress(),
                    ctx.getUserAgent(),
                    null,
                    lockedNow ? "BLOCKED" : "FAILED",
                    "Failed login attempt #" + attempts + (lockedNow ? " (account locked)" : "")
            );
        });
    }

    @Transactional(noRollbackFor = AccountLockedException.class)
    public AuthResponse evaluateLogin(User user, List<String> roles, ClientContext ctx) {
        UserMfaSettings settings = getOrCreateSettings(user);
        OffsetDateTime now = OffsetDateTime.now();

        if (settings.getLockedUntil() != null && settings.getLockedUntil().isAfter(now)) {
            throw new AccountLockedException("Account is temporarily locked until " + settings.getLockedUntil());
        }

        String rawFp = ctx.getDeviceFingerprint();
        boolean hasDeviceSignal = rawFp != null && !rawFp.isBlank();
        String fpHash = hasDeviceSignal
                ? cryptoService.hashDeviceFingerprint(user.getId(), rawFp, ctx.getUserAgent())
                : null;

        Optional<TrustedDevice> matchedDevice = Optional.empty();
        if (fpHash != null) {
            matchedDevice = trustedDeviceRepository
                    .findByUserIdAndDeviceFingerprintHashAndRevokedFalse(user.getId(), fpHash)
                    .filter(d -> d.isTrusted() && d.getExpiresAt().isAfter(now));
        }

        long activeTrustedCount = trustedDeviceRepository
                .countByUserIdAndTrustedTrueAndRevokedFalseAndExpiresAtAfter(user.getId(), now);

        boolean unrecognizedDevice = false;
        if (hasDeviceSignal && matchedDevice.isEmpty()) {
            // Unrecognized if user already has MFA enabled, or has trusted devices, or previously logged in from a different device
            if (settings.isMfaEnabled()
                    || activeTrustedCount > 0
                    || (settings.getLastLoginDeviceHash() != null && !settings.getLastLoginDeviceHash().equals(fpHash))) {
                unrecognizedDevice = true;
            }
        }

        boolean ipChanged = hasDeviceSignal
                && settings.getLastLoginIp() != null
                && !settings.getLastLoginIp().equals(ctx.getIpAddress());

        boolean newBrowser = hasDeviceSignal
                && settings.getLastLoginUserAgent() != null
                && !"API-Client".equals(settings.getLastLoginUserAgent())
                && !settings.getLastLoginUserAgent().equalsIgnoreCase(ctx.getUserAgent())
                && matchedDevice.isEmpty();

        AdaptiveRiskEngine.RiskContext riskCtx = new AdaptiveRiskEngine.RiskContext();
        riskCtx.setMfaEnabled(settings.isMfaEnabled());
        riskCtx.setUnrecognizedDevice(unrecognizedDevice);
        riskCtx.setNewBrowser(newBrowser);
        riskCtx.setIpChanged(ipChanged);
        riskCtx.setRecentFailedAttempts(settings.getFailedLoginAttempts());

        AdaptiveRiskEngine.RiskAssessmentResult risk = riskEngine.evaluate(riskCtx);

        if (risk.isBlockOperation()) {
            settings.setLockedUntil(now.plusMinutes(properties.getLockoutDurationMinutes()));
            mfaSettingsRepository.save(settings);
            securityEventService.recordEvent(
                    user.getId(), user.getUsername(), "LOGIN_CRITICAL_BLOCKED",
                    "CRITICAL", risk.getScore(), risk.getLevel(),
                    ctx.getIpAddress(), ctx.getUserAgent(), null, "BLOCKED",
                    String.join("; ", risk.getReasons())
            );
            throw new AccountLockedException("Login blocked by adaptive risk engine due to critical risk signals.");
        }

        // If MFA challenge is required, issue ONLY a short-lived MFA_PENDING token (never full access JWT)
        if (risk.isRequiresMfa()) {
            String requiredMethod = resolveRequiredMethod(settings);
            AuthenticationChallenge challenge = createChallenge(
                    user,
                    ChallengeType.LOGIN_MFA,
                    requiredMethod,
                    risk.getScore(),
                    risk.getLevel(),
                    String.join("; ", risk.getReasons()),
                    null,
                    "LOGIN:" + user.getUsername(),
                    fpHash,
                    ctx.getIpAddress()
            );

            String pendingToken = jwtTokenProvider.generateMfaPendingToken(user.getUsername(), challenge.getChallengeId());

            if (unrecognizedDevice) {
                outboxService.publishNotificationEvent(new NotificationEvent(
                        "NEW_DEVICE_LOGIN_ATTEMPT",
                        challenge.getChallengeId(),
                        null,
                        user.getId(),
                        user.getUsername(),
                        null,
                        "New Device Sign-In Detected",
                        "Sign-in attempt from " + ctx.getDeviceName() + " (" + ctx.getBrowser() + ", IP " + ctx.getIpAddress() + ") requires verification.",
                        "WARNING"
                ));
            }

            securityEventService.recordEvent(
                    user.getId(), user.getUsername(), "LOGIN_MFA_CHALLENGE",
                    risk.getLevel() == RiskLevel.HIGH ? "HIGH" : "MEDIUM",
                    risk.getScore(), risk.getLevel(),
                    ctx.getIpAddress(), ctx.getUserAgent(), null, "CHALLENGE_REQUIRED",
                    String.join("; ", risk.getReasons())
            );

            AuthResponse response = new AuthResponse();
            response.setMfaRequired(true);
            response.setMfaPendingToken(pendingToken);
            response.setChallengeId(challenge.getChallengeId());
            response.setRequiredMethod(requiredMethod);
            response.setRiskLevel(risk.getLevel().name());
            response.setRiskScore(risk.getScore());
            response.setRiskReasons(risk.getReasons());
            response.setUserId(user.getId());
            response.setUsername(user.getUsername());
            response.setEmail(cryptoService.maskEmail(user.getEmail()));
            response.setRoles(roles);
            response.setTrustedDevice(false);
            return response;
        }

        // LOW risk: reset failed counters, update login metadata, and issue FULL_ACCESS JWT
        settings.setFailedLoginAttempts(0);
        settings.setLockedUntil(null);
        settings.setLastLoginAt(now);
        if (!"API-Client".equals(ctx.getUserAgent())) {
            settings.setLastLoginIp(ctx.getIpAddress());
            settings.setLastLoginUserAgent(truncate(ctx.getUserAgent(), 250));
            if (fpHash != null) {
                settings.setLastLoginDeviceHash(fpHash);
            }
        }
        mfaSettingsRepository.save(settings);

        String activeDeviceId = null;
        if (matchedDevice.isPresent()) {
            TrustedDevice dev = matchedDevice.get();
            dev.setLastLoginAt(now);
            dev.setIpAddress(ctx.getIpAddress());
            trustedDeviceRepository.save(dev);
            activeDeviceId = dev.getDeviceId();
        }

        securityEventService.recordEvent(
                user.getId(), user.getUsername(), "LOGIN_SUCCESS",
                "INFO", risk.getScore(), risk.getLevel(),
                ctx.getIpAddress(), ctx.getUserAgent(), activeDeviceId, "SUCCESS",
                matchedDevice.isPresent() ? "Recognized trusted device" : "Standard authentication"
        );

        String accessToken = jwtTokenProvider.generateAccessToken(user.getUsername(), roles, true);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUsername());

        AuthResponse response = new AuthResponse(
                accessToken,
                refreshToken,
                jwtTokenProvider.getExpirationMs(),
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                roles
        );
        response.setMfaRequired(false);
        response.setRiskLevel(risk.getLevel().name());
        response.setRiskScore(risk.getScore());
        response.setRiskReasons(risk.getReasons());
        response.setDeviceId(activeDeviceId);
        response.setTrustedDevice(matchedDevice.isPresent());
        return response;
    }

    @Transactional
    public OtpSendResponse sendOtp(User user, SendOtpRequest request, ClientContext ctx) {
        rateLimiterService.checkRateLimit("otp_send:" + user.getId(), "OTP send");

        String purpose = (request != null && request.getPurpose() != null && !request.getPurpose().isBlank())
                ? request.getPurpose().trim().toUpperCase()
                : "LOGIN_MFA";
        String challengeId = request != null ? request.getChallengeId() : null;

        if (challengeId != null && !challengeId.isBlank()) {
            AuthenticationChallenge challenge = challengeRepository
                    .findByChallengeIdAndUserId(challengeId, user.getId())
                    .orElseThrow(() -> new InvalidTransactionException("Invalid authentication challenge"));
            assertChallengeActive(challenge);
            purpose = challenge.getChallengeType().name();
        }

        // Enforce resend cooldown
        OffsetDateTime now = OffsetDateTime.now();
        Optional<OtpVerification> latestOpt = otpRepository
                .findTopByUserIdAndPurposeAndConsumedFalseOrderByCreatedAtDesc(user.getId(), purpose);
        if (latestOpt.isPresent()) {
            OtpVerification prev = latestOpt.get();
            if (prev.getResendAvailableAt().isAfter(now) && prev.getExpiresAt().isAfter(now)) {
                throw new RateLimitExceededException(
                        "Please wait before requesting another verification code."
                );
            }
            // Invalidate previous unconsumed OTP so only the newest OTP works
            prev.setConsumed(true);
            otpRepository.save(prev);
        }

        String rawOtp = cryptoService.generateNumericOtp(6);
        String salt = cryptoService.generateRandomSalt();
        String otpHash = cryptoService.hashOtp(rawOtp, salt);
        String maskedEmail = cryptoService.maskEmail(user.getEmail());

        OtpVerification otpEntity = new OtpVerification();
        otpEntity.setOtpId("OTP_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase());
        otpEntity.setUser(user);
        otpEntity.setChallengeId(challengeId);
        otpEntity.setPurpose(purpose);
        otpEntity.setOtpHash(otpHash);
        otpEntity.setSalt(salt);
        otpEntity.setDeliveryTargetMasked(maskedEmail);
        otpEntity.setMaxAttempts(properties.getOtpMaxAttempts());
        otpEntity.setResendAvailableAt(now.plusSeconds(properties.getOtpResendCooldownSeconds()));
        otpEntity.setExpiresAt(now.plusSeconds(properties.getOtpExpirationSeconds()));
        otpRepository.save(otpEntity);

        otpDeliveryChannel.sendOtp(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                maskedEmail,
                rawOtp,
                purpose,
                properties.getOtpExpirationSeconds()
        );

        securityEventService.recordEvent(
                user.getId(), user.getUsername(), "OTP_SENT",
                "INFO", null, null,
                ctx.getIpAddress(), ctx.getUserAgent(), null, "SUCCESS",
                "OTP dispatched to " + maskedEmail + " for " + purpose
        );

        OtpSendResponse res = new OtpSendResponse();
        res.setOtpId(otpEntity.getOtpId());
        res.setChallengeId(challengeId);
        res.setPurpose(purpose);
        res.setMaskedDestination(maskedEmail);
        res.setExpiresInSeconds(properties.getOtpExpirationSeconds());
        res.setResendCooldownSeconds(properties.getOtpResendCooldownSeconds());
        res.setExpiresAt(otpEntity.getExpiresAt());
        return res;
    }

    @Transactional(noRollbackFor = {InvalidTransactionException.class, AccountLockedException.class})
    public ChallengeVerificationResponse verifyOtp(User user, VerifyOtpRequest req, ClientContext ctx) {
        rateLimiterService.checkRateLimit("otp_verify:" + user.getId(), "OTP verification");
        OffsetDateTime now = OffsetDateTime.now();

        OtpVerification otpRecord;
        if (req.getChallengeId() != null && !req.getChallengeId().isBlank()) {
            otpRecord = otpRepository.findTopByChallengeIdAndConsumedFalseOrderByCreatedAtDesc(req.getChallengeId())
                    .orElseThrow(() -> new InvalidTransactionException("No active OTP found for this challenge. Request a new OTP."));
        } else {
            String purpose = req.getPurpose() != null ? req.getPurpose().trim().toUpperCase() : "LOGIN_MFA";
            otpRecord = otpRepository.findTopByUserIdAndPurposeAndConsumedFalseOrderByCreatedAtDesc(user.getId(), purpose)
                    .orElseThrow(() -> new InvalidTransactionException("No active OTP found. Request a new OTP."));
        }

        if (otpRecord.isConsumed()) {
            throw new InvalidTransactionException("OTP has already been used.");
        }
        if (otpRecord.getExpiresAt().isBefore(now)) {
            otpRecord.setConsumed(true);
            otpRepository.save(otpRecord);
            securityEventService.recordEvent(
                    user.getId(), user.getUsername(), "OTP_EXPIRED",
                    "MEDIUM", 35, RiskLevel.MEDIUM, ctx.getIpAddress(), ctx.getUserAgent(),
                    null, "FAILED", "Expired OTP verification attempt"
            );
            throw new InvalidTransactionException("Verification code has expired. Please request a new code.");
        }
        if (otpRecord.getAttemptCount() >= otpRecord.getMaxAttempts()) {
            otpRecord.setConsumed(true);
            otpRepository.save(otpRecord);
            throw new AccountLockedException("Maximum OTP verification attempts exceeded. Request a new challenge.");
        }

        boolean valid = cryptoService.verifyOtpHash(req.getOtp(), otpRecord.getSalt(), otpRecord.getOtpHash());
        if (!valid) {
            int nextAttempts = otpRecord.getAttemptCount() + 1;
            otpRecord.setAttemptCount(nextAttempts);
            if (nextAttempts >= otpRecord.getMaxAttempts()) {
                otpRecord.setConsumed(true);
            }
            otpRepository.save(otpRecord);

            securityEventService.recordEvent(
                    user.getId(), user.getUsername(), "OTP_FAILED",
                    nextAttempts >= otpRecord.getMaxAttempts() ? "HIGH" : "MEDIUM",
                    nextAttempts * 15, nextAttempts >= 4 ? RiskLevel.HIGH : RiskLevel.MEDIUM,
                    ctx.getIpAddress(), ctx.getUserAgent(), null, "FAILED",
                    "Invalid OTP attempt " + nextAttempts + " of " + otpRecord.getMaxAttempts()
            );

            if (nextAttempts >= otpRecord.getMaxAttempts()) {
                throw new AccountLockedException("Too many invalid OTP attempts. Verification locked; request a new code.");
            }
            throw new InvalidTransactionException(
                    "Invalid verification code (" + (otpRecord.getMaxAttempts() - nextAttempts) + " attempts remaining)."
            );
        }

        // Valid OTP: mark single-use consumed
        otpRecord.setConsumed(true);
        otpRepository.save(otpRecord);

        return completeChallengeVerification(
                user,
                otpRecord.getChallengeId(),
                "EMAIL_OTP",
                req.isTrustDevice(),
                new ClientContext(
                        ctx.getIpAddress(),
                        ctx.getUserAgent(),
                        req.getDeviceFingerprint() != null ? req.getDeviceFingerprint() : ctx.getDeviceFingerprint(),
                        req.getDeviceName() != null ? req.getDeviceName() : ctx.getDeviceName(),
                        req.getBrowser() != null ? req.getBrowser() : ctx.getBrowser(),
                        req.getOperatingSystem() != null ? req.getOperatingSystem() : ctx.getOperatingSystem(),
                        req.getLocationHint()
                )
        );
    }

    @Transactional
    public TotpSetupResponse setupTotp(User user, ClientContext ctx) {
        String secret = cryptoService.generateTotpSecret();
        UserMfaSettings settings = getOrCreateSettings(user);
        settings.setTotpPendingSecretEncrypted(cryptoService.encryptSecret(secret));
        mfaSettingsRepository.save(settings);

        String otpAuthUri = cryptoService.buildOtpAuthUri("Bank", user.getUsername(), secret);

        securityEventService.recordEvent(
                user.getId(), user.getUsername(), "TOTP_SETUP_INITIATED",
                "INFO", null, null,
                ctx.getIpAddress(), ctx.getUserAgent(), null, "SUCCESS",
                "Generated pending authenticator secret"
        );

        return new TotpSetupResponse(otpAuthUri, secret, "Bank", user.getUsername());
    }

    @Transactional(noRollbackFor = {InvalidTransactionException.class, AccountLockedException.class})
    public ChallengeVerificationResponse verifyTotp(User user, TotpVerifyRequest req, ClientContext ctx) {
        rateLimiterService.checkRateLimit("totp_verify:" + user.getId(), "TOTP verification");
        UserMfaSettings settings = getOrCreateSettings(user);
        OffsetDateTime now = OffsetDateTime.now();

        boolean isEnrollmentVerification = (req.getChallengeId() == null || req.getChallengeId().isBlank())
                && settings.getTotpPendingSecretEncrypted() != null;

        String encryptedSecret = isEnrollmentVerification
                ? settings.getTotpPendingSecretEncrypted()
                : (settings.getTotpSecretEncrypted() != null
                        ? settings.getTotpSecretEncrypted()
                        : settings.getTotpPendingSecretEncrypted());

        if (encryptedSecret == null) {
            throw new InvalidTransactionException("Authenticator app is not configured for this user.");
        }

        String rawSecret = cryptoService.decryptSecret(encryptedSecret);
        boolean valid = cryptoService.verifyTotpCode(rawSecret, req.getCode(), Instant.now().getEpochSecond());

        if (!valid) {
            securityEventService.recordEvent(
                    user.getId(), user.getUsername(), "TOTP_FAILED",
                    "MEDIUM", 35, RiskLevel.MEDIUM,
                    ctx.getIpAddress(), ctx.getUserAgent(), null, "FAILED",
                    "Invalid authenticator TOTP code submitted"
            );
            throw new InvalidTransactionException("Invalid authenticator code. Please check your device time and retry.");
        }

        if (isEnrollmentVerification || (!settings.isTotpEnabled() && settings.getTotpPendingSecretEncrypted() != null)) {
            settings.setTotpSecretEncrypted(settings.getTotpPendingSecretEncrypted());
            settings.setTotpPendingSecretEncrypted(null);
            settings.setTotpEnabled(true);
            settings.setMfaEnabled(true);
            settings.setPreferredMethod(MfaMethod.TOTP);
            settings.setTotpVerifiedAt(now);
            mfaSettingsRepository.save(settings);

            securityEventService.recordEvent(
                    user.getId(), user.getUsername(), "TOTP_ENABLED",
                    "INFO", null, null,
                    ctx.getIpAddress(), ctx.getUserAgent(), null, "SUCCESS",
                    "Authenticator app (TOTP) verified and activated"
            );
        }

        if (req.getChallengeId() != null && !req.getChallengeId().isBlank()) {
            return completeChallengeVerification(
                    user,
                    req.getChallengeId(),
                    "TOTP",
                    req.isTrustDevice(),
                    new ClientContext(
                            ctx.getIpAddress(),
                            ctx.getUserAgent(),
                            req.getDeviceFingerprint() != null ? req.getDeviceFingerprint() : ctx.getDeviceFingerprint(),
                            req.getDeviceName() != null ? req.getDeviceName() : ctx.getDeviceName(),
                            req.getBrowser() != null ? req.getBrowser() : ctx.getBrowser(),
                            req.getOperatingSystem() != null ? req.getOperatingSystem() : ctx.getOperatingSystem(),
                            req.getLocationHint()
                    )
            );
        }

        ChallengeVerificationResponse res = new ChallengeVerificationResponse();
        res.setVerified(true);
        res.setStatus("VERIFIED");
        res.setMessage("Authenticator app verified and enabled successfully.");
        return res;
    }

    @Transactional(readOnly = true)
    public MfaStatusResponse getMfaStatus(User user) {
        UserMfaSettings settings = mfaSettingsRepository.findByUserId(user.getId())
                .orElseGet(() -> new UserMfaSettings(user));
        long trustedCount = trustedDeviceRepository
                .countByUserIdAndTrustedTrueAndRevokedFalseAndExpiresAtAfter(user.getId(), OffsetDateTime.now());

        MfaStatusResponse res = new MfaStatusResponse();
        res.setMfaEnabled(settings.isMfaEnabled());
        res.setPreferredMethod(settings.getPreferredMethod().name());
        res.setEmailOtpEnabled(settings.isEmailOtpEnabled());
        res.setTotpEnabled(settings.isTotpEnabled());
        res.setTrustedDevicesCount(trustedCount);
        res.setLastLoginAt(settings.getLastLoginAt());
        res.setLastLoginIp(settings.getLastLoginIp());
        res.setFailedLoginAttempts(settings.getFailedLoginAttempts());
        res.setLockedUntil(settings.getLockedUntil());
        return res;
    }

    @Transactional
    public MfaStatusResponse enableMfa(User user, MfaToggleRequest req, ClientContext ctx) {
        UserMfaSettings settings = getOrCreateSettings(user);
        MfaMethod targetMethod = MfaMethod.EMAIL_OTP;
        if (req != null && req.getPreferredMethod() != null && !req.getPreferredMethod().isBlank()) {
            try {
                targetMethod = MfaMethod.valueOf(req.getPreferredMethod().trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new InvalidTransactionException("Unsupported MFA method: " + req.getPreferredMethod());
            }
        }

        if (targetMethod == MfaMethod.TOTP && !settings.isTotpEnabled()) {
            throw new InvalidTransactionException("Set up and verify an authenticator app before selecting TOTP as preferred MFA.");
        }

        // Require verification code if provided or verify active OTP when enabling from disabled state
        if (req != null && req.getOtpCode() != null && !req.getOtpCode().isBlank()) {
            VerifyOtpRequest otpReq = new VerifyOtpRequest();
            otpReq.setOtp(req.getOtpCode());
            otpReq.setPurpose("MFA_ENROLLMENT");
            verifyOtp(user, otpReq, ctx);
        } else if (req != null && req.getTotpCode() != null && !req.getTotpCode().isBlank()) {
            TotpVerifyRequest totpReq = new TotpVerifyRequest();
            totpReq.setCode(req.getTotpCode());
            verifyTotp(user, totpReq, ctx);
        }

        settings.setMfaEnabled(true);
        settings.setPreferredMethod(targetMethod);
        if (req != null && req.getEmailOtpEnabled() != null) {
            settings.setEmailOtpEnabled(req.getEmailOtpEnabled());
        } else {
            settings.setEmailOtpEnabled(true);
        }
        mfaSettingsRepository.save(settings);

        securityEventService.recordEvent(
                user.getId(), user.getUsername(), "MFA_ENABLED",
                "INFO", null, null,
                ctx.getIpAddress(), ctx.getUserAgent(), null, "SUCCESS",
                "MFA enabled with preferred method " + targetMethod.name()
        );

        return getMfaStatus(user);
    }

    @Transactional
    public MfaStatusResponse disableMfa(User user, MfaToggleRequest req, PasswordEncoder passwordEncoder, ClientContext ctx) {
        UserMfaSettings settings = getOrCreateSettings(user);
        if (req == null || req.getPassword() == null || !passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            securityEventService.recordEvent(
                    user.getId(), user.getUsername(), "MFA_DISABLE_DENIED",
                    "HIGH", 60, RiskLevel.HIGH,
                    ctx.getIpAddress(), ctx.getUserAgent(), null, "FAILED",
                    "Attempt to disable MFA without valid current password"
            );
            throw new InvalidTransactionException("Current password is required to disable MFA.");
        }

        if (settings.isMfaEnabled()) {
            boolean verifiedFactor = false;
            if (req.getTotpCode() != null && !req.getTotpCode().isBlank() && settings.isTotpEnabled()) {
                TotpVerifyRequest tReq = new TotpVerifyRequest();
                tReq.setCode(req.getTotpCode());
                verifyTotp(user, tReq, ctx);
                verifiedFactor = true;
            } else if (req.getOtpCode() != null && !req.getOtpCode().isBlank()) {
                VerifyOtpRequest oReq = new VerifyOtpRequest();
                oReq.setOtp(req.getOtpCode());
                oReq.setPurpose("SENSITIVE_OPERATION");
                verifyOtp(user, oReq, ctx);
                verifiedFactor = true;
            }
            if (!verifiedFactor) {
                throw new InvalidTransactionException("Provide an active OTP or TOTP verification code to disable MFA.");
            }
        }

        settings.setMfaEnabled(false);
        settings.setTotpEnabled(false);
        settings.setTotpSecretEncrypted(null);
        settings.setTotpPendingSecretEncrypted(null);
        settings.setPreferredMethod(MfaMethod.EMAIL_OTP);
        mfaSettingsRepository.save(settings);

        securityEventService.recordEvent(
                user.getId(), user.getUsername(), "MFA_DISABLED",
                "MEDIUM", 35, RiskLevel.MEDIUM,
                ctx.getIpAddress(), ctx.getUserAgent(), null, "SUCCESS",
                "User disabled multi-factor authentication after factor confirmation"
        );

        return getMfaStatus(user);
    }

    @Transactional
    public AuthenticationChallenge createOperationChallenge(User user,
                                                            ChallengeType challengeType,
                                                            String sourceAcc,
                                                            String destAcc,
                                                            BigDecimal amount,
                                                            String targetReference,
                                                            ClientContext ctx) {
        UserMfaSettings settings = getOrCreateSettings(user);
        String fpHash = ctx.getDeviceFingerprint() != null
                ? cryptoService.hashDeviceFingerprint(user.getId(), ctx.getDeviceFingerprint(), ctx.getUserAgent())
                : null;

        boolean unrecognizedDevice = false;
        if (fpHash != null) {
            boolean trusted = trustedDeviceRepository
                    .findByUserIdAndDeviceFingerprintHashAndRevokedFalse(user.getId(), fpHash)
                    .filter(d -> d.isTrusted() && d.getExpiresAt().isAfter(OffsetDateTime.now()))
                    .isPresent();
            if (!trusted && (settings.isMfaEnabled() || (settings.getLastLoginDeviceHash() != null && !settings.getLastLoginDeviceHash().equals(fpHash)))) {
                unrecognizedDevice = true;
            }
        }

        long recentTxCount = 0;
        if (sourceAcc != null) {
            recentTxCount = accountRepository.findByAccountNumber(sourceAcc)
                    .map(acc -> transactionRepository.countRecentByAccountAndTypeAndStatus(
                            acc.getId(), TransactionType.TRANSFER, TransactionStatus.SUCCESS, OffsetDateTime.now().minusMinutes(10)))
                    .orElse(0L);
        }

        AdaptiveRiskEngine.RiskContext riskCtx = new AdaptiveRiskEngine.RiskContext();
        riskCtx.setMfaEnabled(settings.isMfaEnabled());
        riskCtx.setUnrecognizedDevice(unrecognizedDevice);
        riskCtx.setTransactionAmount(amount);
        riskCtx.setRecentTransactionCount(recentTxCount);
        riskCtx.setSensitiveOperation(challengeType != ChallengeType.TRANSACTION_VERIFICATION);
        riskCtx.setOperationLabel(challengeType.name());

        AdaptiveRiskEngine.RiskAssessmentResult risk = riskEngine.evaluate(riskCtx);
        if (risk.isBlockOperation()) {
            securityEventService.recordEvent(
                    user.getId(), user.getUsername(), "OPERATION_CRITICAL_BLOCKED",
                    "CRITICAL", risk.getScore(), risk.getLevel(),
                    ctx.getIpAddress(), ctx.getUserAgent(), null, "BLOCKED",
                    String.join("; ", risk.getReasons())
            );
            throw new InvalidTransactionException("Operation blocked due to critical risk assessment: " + String.join(", ", risk.getReasons()));
        }

        String bindingHash = cryptoService.computeTransactionBindingHash(
                user.getId(),
                challengeType.name(),
                sourceAcc,
                destAcc,
                amount
        );

        String method = resolveRequiredMethod(settings);
        return createChallenge(
                user,
                challengeType,
                method,
                Math.max(risk.getScore(), 30),
                risk.getLevel() == RiskLevel.LOW ? RiskLevel.MEDIUM : risk.getLevel(),
                risk.getReasons().isEmpty() ? challengeType.name() + " verification" : String.join("; ", risk.getReasons()),
                bindingHash,
                targetReference,
                fpHash,
                ctx.getIpAddress()
        );
    }

    @Transactional(noRollbackFor = {MfaRequiredException.class, InvalidTransactionException.class})
    public void enforceTransferVerification(String username, TransferRequest req, ClientContext ctx) {
        if (!properties.isEnabled()) return;

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return;

        UserMfaSettings settings = getOrCreateSettings(user);
        String fpHash = ctx.getDeviceFingerprint() != null
                ? cryptoService.hashDeviceFingerprint(user.getId(), ctx.getDeviceFingerprint(), ctx.getUserAgent())
                : null;

        boolean unrecognizedDevice = fpHash != null
                && trustedDeviceRepository.findByUserIdAndDeviceFingerprintHashAndRevokedFalse(user.getId(), fpHash)
                        .filter(d -> d.isTrusted() && d.getExpiresAt().isAfter(OffsetDateTime.now()))
                        .isEmpty()
                && (settings.isMfaEnabled() || (settings.getLastLoginDeviceHash() != null && !settings.getLastLoginDeviceHash().equals(fpHash)));

        long recentTxCount = accountRepository.findByAccountNumber(req.getSourceAccountNumber())
                .map(acc -> transactionRepository.countRecentByAccountAndTypeAndStatus(
                        acc.getId(), TransactionType.TRANSFER, TransactionStatus.SUCCESS, OffsetDateTime.now().minusMinutes(10)))
                .orElse(0L);

        AdaptiveRiskEngine.RiskContext riskCtx = new AdaptiveRiskEngine.RiskContext();
        riskCtx.setMfaEnabled(settings.isMfaEnabled());
        riskCtx.setUnrecognizedDevice(unrecognizedDevice);
        riskCtx.setTransactionAmount(req.getAmount());
        riskCtx.setRecentTransactionCount(recentTxCount);
        riskCtx.setOperationLabel("TRANSFER");

        AdaptiveRiskEngine.RiskAssessmentResult risk = riskEngine.evaluate(riskCtx);

        if (risk.isBlockOperation()) {
            securityEventService.recordEvent(
                    user.getId(), user.getUsername(), "TRANSFER_CRITICAL_BLOCKED",
                    "CRITICAL", risk.getScore(), risk.getLevel(),
                    ctx.getIpAddress(), ctx.getUserAgent(), null, "BLOCKED",
                    "Blocked transfer " + req.getSourceAccountNumber() + " -> " + req.getDestinationAccountNumber()
            );
            throw new InvalidTransactionException("Transfer blocked by adaptive security policy (CRITICAL risk).");
        }

        if (!risk.isRequiresMfa()) {
            return;
        }

        String bindingHash = cryptoService.computeTransactionBindingHash(
                user.getId(),
                ChallengeType.TRANSACTION_VERIFICATION.name(),
                req.getSourceAccountNumber(),
                req.getDestinationAccountNumber(),
                req.getAmount()
        );

        if (req.getChallengeId() != null && !req.getChallengeId().isBlank()) {
            verifyAndConsumeChallenge(user, req.getChallengeId(), ChallengeType.TRANSACTION_VERIFICATION, bindingHash, ctx);
            return;
        }

        String method = resolveRequiredMethod(settings);
        AuthenticationChallenge challenge = createChallenge(
                user,
                ChallengeType.TRANSACTION_VERIFICATION,
                method,
                risk.getScore(),
                risk.getLevel(),
                String.join("; ", risk.getReasons()),
                bindingHash,
                req.getSourceAccountNumber() + "->" + req.getDestinationAccountNumber() + ":" + req.getAmount(),
                fpHash,
                ctx.getIpAddress()
        );

        securityEventService.recordEvent(
                user.getId(), user.getUsername(), "TRANSACTION_MFA_REQUIRED",
                risk.getLevel() == RiskLevel.HIGH ? "HIGH" : "MEDIUM",
                risk.getScore(), risk.getLevel(),
                ctx.getIpAddress(), ctx.getUserAgent(), null, "CHALLENGE_REQUIRED",
                "Step-up verification required for transfer " + req.getSourceAccountNumber() + " -> " + req.getDestinationAccountNumber()
        );

        throw new MfaRequiredException(
                "Additional verification required for this transfer (" + risk.getLevel().name() + " risk).",
                challengeMetadataMap(challenge, risk.getReasons())
        );
    }

    @Transactional(noRollbackFor = {MfaRequiredException.class, InvalidTransactionException.class})
    public void enforceSensitiveOperationVerification(String username,
                                                      ChallengeType type,
                                                      String sourceAcc,
                                                      String destAcc,
                                                      BigDecimal amount,
                                                      String targetRef,
                                                      String challengeId,
                                                      boolean onlyIfMfaEnabled,
                                                      ClientContext ctx) {
        if (!properties.isEnabled()) return;

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return;

        UserMfaSettings settings = getOrCreateSettings(user);
        if (onlyIfMfaEnabled && !settings.isMfaEnabled()) {
            return;
        }

        String bindingHash = cryptoService.computeTransactionBindingHash(
                user.getId(), type.name(), sourceAcc, destAcc, amount
        );

        if (challengeId != null && !challengeId.isBlank()) {
            verifyAndConsumeChallenge(user, challengeId, type, bindingHash, ctx);
            return;
        }

        AuthenticationChallenge challenge = createOperationChallenge(user, type, sourceAcc, destAcc, amount, targetRef, ctx);
        throw new MfaRequiredException(
                "Additional verification required for " + type.name(),
                challengeMetadataMap(challenge, List.of(challenge.getRiskReasons()))
        );
    }

    @Transactional(noRollbackFor = InvalidTransactionException.class)
    public void verifyAndConsumeChallenge(User user,
                                          String challengeId,
                                          ChallengeType expectedType,
                                          String expectedBindingHash,
                                          ClientContext ctx) {
        OffsetDateTime now = OffsetDateTime.now();
        AuthenticationChallenge challenge = challengeRepository
                .findByChallengeIdAndUserId(challengeId, user.getId())
                .orElseThrow(() -> new InvalidTransactionException("Authentication challenge not found for user."));

        if (challenge.getChallengeType() != expectedType) {
            throw new InvalidTransactionException("Challenge type mismatch.");
        }
        if (challenge.getStatus() == ChallengeStatus.CONSUMED) {
            securityEventService.recordEvent(
                    user.getId(), user.getUsername(), "CHALLENGE_REPLAY_BLOCKED",
                    "HIGH", 75, RiskLevel.HIGH,
                    ctx.getIpAddress(), ctx.getUserAgent(), null, "BLOCKED",
                    "Replay attempt on consumed challenge " + challengeId
            );
            throw new InvalidTransactionException("Verification challenge has already been consumed.");
        }
        if (challenge.getExpiresAt().isBefore(now)) {
            challenge.setStatus(ChallengeStatus.EXPIRED);
            challengeRepository.save(challenge);
            throw new InvalidTransactionException("Verification challenge has expired.");
        }
        if (challenge.getStatus() != ChallengeStatus.VERIFIED) {
            throw new InvalidTransactionException("Verification challenge has not been verified yet.");
        }
        if (expectedBindingHash != null && challenge.getTransactionBindingHash() != null
                && !expectedBindingHash.equals(challenge.getTransactionBindingHash())) {
            securityEventService.recordEvent(
                    user.getId(), user.getUsername(), "CHALLENGE_BINDING_MISMATCH",
                    "CRITICAL", 90, RiskLevel.CRITICAL,
                    ctx.getIpAddress(), ctx.getUserAgent(), null, "BLOCKED",
                    "Transaction details do not match verified challenge " + challengeId
            );
            throw new InvalidTransactionException("Transaction details were altered after verification. Re-verify required.");
        }

        challenge.setStatus(ChallengeStatus.CONSUMED);
        challenge.setConsumedAt(now);
        challengeRepository.save(challenge);
    }

    @Transactional(readOnly = true)
    public List<TrustedDeviceResponse> getTrustedDevices(User user) {
        return trustedDeviceRepository.findByUserIdOrderByLastLoginAtDesc(user.getId())
                .stream()
                .map(this::mapDevice)
                .collect(Collectors.toList());
    }

    @Transactional
    public void revokeDevice(User user, String deviceId, ClientContext ctx) {
        TrustedDevice device = trustedDeviceRepository.findByDeviceIdAndUserId(deviceId, user.getId())
                .orElseThrow(() -> new InvalidTransactionException("Trusted device not found: " + deviceId));

        device.setTrusted(false);
        device.setRevoked(true);
        device.setRevokedAt(OffsetDateTime.now());
        trustedDeviceRepository.save(device);

        securityEventService.recordEvent(
                user.getId(), user.getUsername(), "TRUSTED_DEVICE_REVOKED",
                "INFO", null, null,
                ctx.getIpAddress(), ctx.getUserAgent(), deviceId, "SUCCESS",
                "Revoked device " + device.getDeviceName()
        );
    }

    @Transactional
    public int revokeAllDevices(User user, ClientContext ctx) {
        List<TrustedDevice> devices = trustedDeviceRepository.findByUserIdAndRevokedFalseOrderByLastLoginAtDesc(user.getId());
        OffsetDateTime now = OffsetDateTime.now();
        for (TrustedDevice d : devices) {
            d.setTrusted(false);
            d.setRevoked(true);
            d.setRevokedAt(now);
        }
        trustedDeviceRepository.saveAll(devices);

        securityEventService.recordEvent(
                user.getId(), user.getUsername(), "ALL_TRUSTED_DEVICES_REVOKED",
                "MEDIUM", 25, RiskLevel.MEDIUM,
                ctx.getIpAddress(), ctx.getUserAgent(), null, "SUCCESS",
                "Revoked " + devices.size() + " trusted devices"
        );
        return devices.size();
    }

    public Map<String, Object> challengeMetadataMap(AuthenticationChallenge c, List<String> reasons) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("challengeId", c.getChallengeId());
        map.put("challengeType", c.getChallengeType().name());
        map.put("requiredMethod", c.getRequiredMethod());
        map.put("riskScore", c.getRiskScore());
        map.put("riskLevel", c.getRiskLevel().name());
        map.put("riskReasons", reasons);
        map.put("targetReference", c.getTargetReference());
        map.put("expiresAt", c.getExpiresAt());
        return map;
    }

    private ChallengeVerificationResponse completeChallengeVerification(User user,
                                                                      String challengeId,
                                                                      String methodUsed,
                                                                      boolean trustDevice,
                                                                      ClientContext ctx) {
        OffsetDateTime now = OffsetDateTime.now();
        ChallengeType completedType = ChallengeType.LOGIN_MFA;

        if (challengeId != null && !challengeId.isBlank()) {
            AuthenticationChallenge challenge = challengeRepository
                    .findByChallengeIdAndUserId(challengeId, user.getId())
                    .orElseThrow(() -> new InvalidTransactionException("Authentication challenge not found."));
            assertChallengeActive(challenge);
            challenge.setStatus(ChallengeStatus.VERIFIED);
            challenge.setVerifiedAt(now);
            challengeRepository.save(challenge);
            completedType = challenge.getChallengeType();
        }

        ChallengeVerificationResponse res = new ChallengeVerificationResponse();
        res.setVerified(true);
        res.setChallengeId(challengeId);
        res.setChallengeType(completedType.name());
        res.setStatus("VERIFIED");
        res.setMessage("Verification successful via " + methodUsed + ".");

        if (completedType == ChallengeType.LOGIN_MFA) {
            UserMfaSettings settings = getOrCreateSettings(user);
            settings.setFailedLoginAttempts(0);
            settings.setLockedUntil(null);
            settings.setLastLoginAt(now);
            settings.setLastLoginIp(ctx.getIpAddress());
            settings.setLastLoginUserAgent(truncate(ctx.getUserAgent(), 250));

            String deviceId = null;
            if (ctx.getDeviceFingerprint() != null && !ctx.getDeviceFingerprint().isBlank()) {
                String fpHash = cryptoService.hashDeviceFingerprint(user.getId(), ctx.getDeviceFingerprint(), ctx.getUserAgent());
                settings.setLastLoginDeviceHash(fpHash);

                if (trustDevice) {
                    TrustedDevice device = registerOrUpdateTrustedDevice(user, fpHash, ctx, now);
                    deviceId = device.getDeviceId();
                }
            }
            mfaSettingsRepository.save(settings);

            List<String> roles = user.getRoles().stream()
                    .map(r -> "ROLE_" + r.getName().name())
                    .collect(Collectors.toList());

            String fullToken = jwtTokenProvider.generateAccessToken(user.getUsername(), roles, true);
            String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUsername());

            AuthResponse auth = new AuthResponse(
                    fullToken, refreshToken, jwtTokenProvider.getExpirationMs(),
                    user.getId(), user.getUsername(), user.getEmail(), roles
            );
            auth.setMfaRequired(false);
            auth.setRiskLevel("LOW");
            auth.setDeviceId(deviceId);
            auth.setTrustedDevice(deviceId != null);
            res.setAuth(auth);
        }

        securityEventService.recordEvent(
                user.getId(), user.getUsername(), "MFA_CHALLENGE_VERIFIED",
                "INFO", null, RiskLevel.LOW,
                ctx.getIpAddress(), ctx.getUserAgent(), null, "SUCCESS",
                "Verified " + completedType.name() + " using " + methodUsed
        );

        return res;
    }

    private TrustedDevice registerOrUpdateTrustedDevice(User user, String fpHash, ClientContext ctx, OffsetDateTime now) {
        Optional<TrustedDevice> existing = trustedDeviceRepository
                .findByUserIdAndDeviceFingerprintHashAndRevokedFalse(user.getId(), fpHash);

        TrustedDevice device = existing.orElseGet(() -> {
            TrustedDevice d = new TrustedDevice();
            d.setDeviceId("DEV_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14).toUpperCase());
            d.setUser(user);
            d.setDeviceFingerprintHash(fpHash);
            return d;
        });

        boolean isNew = device.getId() == null;
        device.setDeviceName(ctx.getDeviceName());
        device.setBrowser(ctx.getBrowser());
        device.setOperatingSystem(ctx.getOperatingSystem());
        device.setIpAddress(ctx.getIpAddress());
        device.setLocationHint(ctx.getLocationHint());
        device.setTrusted(true);
        device.setRevoked(false);
        device.setLastLoginAt(now);
        device.setExpiresAt(now.plusDays(properties.getTrustedDeviceTtlDays()));
        TrustedDevice saved = trustedDeviceRepository.save(device);

        if (isNew) {
            outboxService.publishNotificationEvent(new NotificationEvent(
                    "TRUSTED_DEVICE_ADDED",
                    saved.getDeviceId(),
                    null,
                    user.getId(),
                    user.getUsername(),
                    null,
                    "New Trusted Device Registered",
                    "Device " + saved.getDeviceName() + " (" + saved.getBrowser() + ") was added to your trusted devices.",
                    "INFO"
            ));
        }

        return saved;
    }

    private AuthenticationChallenge createChallenge(User user,
                                                    ChallengeType type,
                                                    String requiredMethod,
                                                    int riskScore,
                                                    RiskLevel riskLevel,
                                                    String reasons,
                                                    String bindingHash,
                                                    String targetReference,
                                                    String fpHash,
                                                    String ip) {
        OffsetDateTime now = OffsetDateTime.now();
        AuthenticationChallenge challenge = new AuthenticationChallenge();
        challenge.setChallengeId("CHL_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase());
        challenge.setUser(user);
        challenge.setChallengeType(type);
        challenge.setRequiredMethod(requiredMethod);
        challenge.setRiskScore(riskScore);
        challenge.setRiskLevel(riskLevel);
        challenge.setRiskReasons(truncate(reasons, 980));
        challenge.setTransactionBindingHash(bindingHash);
        challenge.setTargetReference(truncate(targetReference, 155));
        challenge.setDeviceFingerprintHash(fpHash);
        challenge.setIpAddress(ip);
        challenge.setMaxAttempts(properties.getOtpMaxAttempts());
        challenge.setExpiresAt(now.plusSeconds(properties.getChallengeExpirationSeconds()));
        return challengeRepository.save(challenge);
    }

    private void assertChallengeActive(AuthenticationChallenge challenge) {
        OffsetDateTime now = OffsetDateTime.now();
        if (challenge.getStatus() == ChallengeStatus.CONSUMED) {
            throw new InvalidTransactionException("Authentication challenge has already been consumed.");
        }
        if (challenge.getExpiresAt().isBefore(now)) {
            challenge.setStatus(ChallengeStatus.EXPIRED);
            challengeRepository.save(challenge);
            throw new InvalidTransactionException("Authentication challenge has expired.");
        }
        if (challenge.getStatus() == ChallengeStatus.BLOCKED || challenge.getStatus() == ChallengeStatus.FAILED) {
            throw new InvalidTransactionException("Authentication challenge is no longer valid.");
        }
    }

    private String resolveRequiredMethod(UserMfaSettings settings) {
        if (settings.isTotpEnabled() && settings.getPreferredMethod() == MfaMethod.TOTP) {
            return "TOTP";
        }
        if (settings.isTotpEnabled() && settings.isEmailOtpEnabled()) {
            return "EMAIL_OTP_OR_TOTP";
        }
        return "EMAIL_OTP";
    }

    private TrustedDeviceResponse mapDevice(TrustedDevice d) {
        TrustedDeviceResponse r = new TrustedDeviceResponse();
        r.setDeviceId(d.getDeviceId());
        r.setDeviceName(d.getDeviceName());
        r.setBrowser(d.getBrowser());
        r.setOperatingSystem(d.getOperatingSystem());
        r.setIpAddress(d.getIpAddress());
        r.setLocationHint(d.getLocationHint());
        r.setTrusted(d.isTrusted());
        r.setRevoked(d.isRevoked());
        r.setLastLoginAt(d.getLastLoginAt());
        r.setExpiresAt(d.getExpiresAt());
        r.setCreatedAt(d.getCreatedAt());
        return r;
    }

    private String truncate(String val, int max) {
        if (val == null) return null;
        return val.length() <= max ? val : val.substring(0, max);
    }
}
