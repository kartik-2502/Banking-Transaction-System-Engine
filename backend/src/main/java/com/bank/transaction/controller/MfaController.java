package com.bank.transaction.controller;

import com.bank.transaction.dto.ApiResponse;
import com.bank.transaction.dto.mfa.*;
import com.bank.transaction.model.AuthenticationChallenge;
import com.bank.transaction.model.ChallengeType;
import com.bank.transaction.model.User;
import com.bank.transaction.repository.UserRepository;
import com.bank.transaction.service.AdaptiveMfaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/mfa")
public class MfaController {

    private final AdaptiveMfaService adaptiveMfaService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public MfaController(AdaptiveMfaService adaptiveMfaService,
                         UserRepository userRepository,
                         PasswordEncoder passwordEncoder) {
        this.adaptiveMfaService = adaptiveMfaService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<OtpSendResponse>> sendOtp(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody(required = false) SendOtpRequest request,
            HttpServletRequest httpRequest) {
        User user = requireUser(userDetails);
        OtpSendResponse response = adaptiveMfaService.sendOtp(user, request, buildContext(httpRequest, null));
        return ResponseEntity.ok(ApiResponse.ok("Verification OTP sent to " + response.getMaskedDestination(), response));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<ChallengeVerificationResponse>> verifyOtp(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody VerifyOtpRequest request,
            HttpServletRequest httpRequest) {
        User user = requireUser(userDetails);
        ChallengeVerificationResponse response = adaptiveMfaService.verifyOtp(
                user, request, buildContext(httpRequest, request.getDeviceFingerprint())
        );
        return ResponseEntity.ok(ApiResponse.ok(response.getMessage(), response));
    }

    @PostMapping("/totp/setup")
    public ResponseEntity<ApiResponse<TotpSetupResponse>> setupTotp(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) {
        User user = requireUser(userDetails);
        TotpSetupResponse response = adaptiveMfaService.setupTotp(user, buildContext(httpRequest, null));
        return ResponseEntity.ok(ApiResponse.ok("Authenticator setup generated", response));
    }

    @PostMapping("/totp/verify")
    public ResponseEntity<ApiResponse<ChallengeVerificationResponse>> verifyTotp(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TotpVerifyRequest request,
            HttpServletRequest httpRequest) {
        User user = requireUser(userDetails);
        ChallengeVerificationResponse response = adaptiveMfaService.verifyTotp(
                user, request, buildContext(httpRequest, request.getDeviceFingerprint())
        );
        return ResponseEntity.ok(ApiResponse.ok(response.getMessage(), response));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<MfaStatusResponse>> getStatus(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = requireUser(userDetails);
        return ResponseEntity.ok(ApiResponse.ok("MFA status retrieved", adaptiveMfaService.getMfaStatus(user)));
    }

    @PostMapping("/enable")
    public ResponseEntity<ApiResponse<MfaStatusResponse>> enableMfa(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody(required = false) MfaToggleRequest request,
            HttpServletRequest httpRequest) {
        User user = requireUser(userDetails);
        MfaStatusResponse status = adaptiveMfaService.enableMfa(user, request, buildContext(httpRequest, null));
        return ResponseEntity.ok(ApiResponse.ok("Multi-factor authentication enabled", status));
    }

    @PostMapping("/disable")
    public ResponseEntity<ApiResponse<MfaStatusResponse>> disableMfa(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody MfaToggleRequest request,
            HttpServletRequest httpRequest) {
        User user = requireUser(userDetails);
        MfaStatusResponse status = adaptiveMfaService.disableMfa(
                user, request, passwordEncoder, buildContext(httpRequest, null)
        );
        return ResponseEntity.ok(ApiResponse.ok("Multi-factor authentication disabled", status));
    }

    @GetMapping("/devices")
    public ResponseEntity<ApiResponse<List<TrustedDeviceResponse>>> getTrustedDevices(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = requireUser(userDetails);
        return ResponseEntity.ok(ApiResponse.ok("Trusted devices retrieved", adaptiveMfaService.getTrustedDevices(user)));
    }

    @DeleteMapping("/devices/{deviceId}")
    public ResponseEntity<ApiResponse<Void>> revokeDevice(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("deviceId") String deviceId,
            HttpServletRequest httpRequest) {
        User user = requireUser(userDetails);
        adaptiveMfaService.revokeDevice(user, deviceId, buildContext(httpRequest, null));
        return ResponseEntity.ok(ApiResponse.ok("Trusted device revoked", null));
    }

    @DeleteMapping("/devices")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> revokeAllDevices(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) {
        User user = requireUser(userDetails);
        int count = adaptiveMfaService.revokeAllDevices(user, buildContext(httpRequest, null));
        return ResponseEntity.ok(ApiResponse.ok("All trusted devices revoked", Map.of("revokedCount", count)));
    }

    @PostMapping("/transaction-challenge")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createTransactionChallenge(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody TransactionChallengeRequest request,
            HttpServletRequest httpRequest) {
        User user = requireUser(userDetails);
        ChallengeType type = ChallengeType.TRANSACTION_VERIFICATION;
        if (request.getOperationType() != null && !request.getOperationType().isBlank()) {
            try {
                type = ChallengeType.valueOf(request.getOperationType().trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                type = ChallengeType.TRANSACTION_VERIFICATION;
            }
        }

        String targetRef = request.getSourceAccountNumber() != null
                ? request.getSourceAccountNumber() + "->" + (request.getDestinationAccountNumber() != null ? request.getDestinationAccountNumber() : "")
                : type.name();

        AuthenticationChallenge challenge = adaptiveMfaService.createOperationChallenge(
                user,
                type,
                request.getSourceAccountNumber(),
                request.getDestinationAccountNumber(),
                request.getAmount(),
                targetRef,
                buildContext(httpRequest, request.getDeviceFingerprint())
        );

        return ResponseEntity.ok(ApiResponse.ok(
                "Authentication challenge created",
                adaptiveMfaService.challengeMetadataMap(challenge, List.of(challenge.getRiskReasons()))
        ));
    }

    private User requireUser(UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    private AdaptiveMfaService.ClientContext buildContext(HttpServletRequest req, String bodyFingerprint) {
        String fwd = req.getHeader("X-Forwarded-For");
        String ip = (fwd != null && !fwd.isBlank()) ? fwd.split(",")[0].trim() : req.getRemoteAddr();
        String fp = (bodyFingerprint != null && !bodyFingerprint.isBlank())
                ? bodyFingerprint
                : req.getHeader("X-Device-Fingerprint");
        return new AdaptiveMfaService.ClientContext(
                ip,
                req.getHeader("User-Agent"),
                fp,
                req.getHeader("X-Device-Name"),
                req.getHeader("X-Browser-Name"),
                req.getHeader("X-OS-Name"),
                null
        );
    }
}
