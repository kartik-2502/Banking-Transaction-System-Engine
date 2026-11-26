package com.bank.transaction.controller;

import com.bank.transaction.dto.ApiResponse;
import com.bank.transaction.dto.AuthResponse;
import com.bank.transaction.dto.LoginRequest;
import com.bank.transaction.dto.RegisterRequest;
import com.bank.transaction.dto.UserProfileResponse;
import com.bank.transaction.dto.mfa.ChangePasswordRequest;
import com.bank.transaction.dto.mfa.SecurityEventResponse;
import com.bank.transaction.model.SecurityEvent;
import com.bank.transaction.model.User;
import com.bank.transaction.repository.UserRepository;
import com.bank.transaction.service.AdaptiveMfaService;
import com.bank.transaction.service.AuthService;
import com.bank.transaction.service.SecurityEventService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final SecurityEventService securityEventService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService,
                          SecurityEventService securityEventService,
                          UserRepository userRepository) {
        this.authService = authService;
        this.securityEventService = securityEventService;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request,
                                                           HttpServletRequest httpRequest) {
        String ip = extractClientIp(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");
        AdaptiveMfaService.ClientContext ctx = new AdaptiveMfaService.ClientContext(
                ip,
                ua,
                request.getDeviceFingerprint(),
                request.getDeviceName(),
                request.getBrowser(),
                request.getOperatingSystem(),
                request.getLocationHint()
        );
        AuthResponse response = authService.login(request, ctx);
        return ResponseEntity.ok(ApiResponse.ok(
                response.isMfaRequired() ? "Adaptive verification required" : "Login successful",
                response
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.ok("Registration successful", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        AuthResponse response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(ApiResponse.ok("Token refreshed successfully", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        UserProfileResponse profile = authService.getCurrentUserProfile(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("User profile retrieved", profile));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@AuthenticationPrincipal UserDetails userDetails,
                                                            @Valid @RequestBody ChangePasswordRequest request,
                                                            HttpServletRequest httpRequest) {
        AdaptiveMfaService.ClientContext ctx = new AdaptiveMfaService.ClientContext(
                extractClientIp(httpRequest),
                httpRequest.getHeader("User-Agent"),
                httpRequest.getHeader("X-Device-Fingerprint"),
                null, null, null, null
        );
        authService.changePassword(userDetails.getUsername(), request, ctx);
        return ResponseEntity.ok(ApiResponse.ok("Password updated successfully", null));
    }

    @GetMapping("/security-events")
    public ResponseEntity<ApiResponse<Page<SecurityEventResponse>>> getSecurityEvents(
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication,
            @RequestParam(name = "all", defaultValue = "false") boolean all,
            @PageableDefault(size = 20) Pageable pageable) {
        boolean isPrivileged = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_RISK_ANALYST"));

        Page<SecurityEvent> events;
        if (all && isPrivileged) {
            events = securityEventService.getAllEvents(pageable);
        } else {
            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));
            events = securityEventService.getUserEvents(user.getId(), pageable);
        }

        return ResponseEntity.ok(ApiResponse.ok("Security events retrieved", events.map(this::mapEvent)));
    }

    private SecurityEventResponse mapEvent(SecurityEvent e) {
        SecurityEventResponse r = new SecurityEventResponse();
        r.setEventId(e.getEventId());
        r.setUserId(e.getUserId());
        r.setUsername(e.getUsername());
        r.setEventType(e.getEventType());
        r.setSeverity(e.getSeverity());
        r.setRiskScore(e.getRiskScore());
        r.setRiskLevel(e.getRiskLevel());
        r.setIpAddress(e.getIpAddress());
        r.setUserAgent(e.getUserAgent());
        r.setDeviceId(e.getDeviceId());
        r.setOutcome(e.getOutcome());
        r.setDetails(e.getDetails());
        r.setCreatedAt(e.getCreatedAt());
        return r;
    }

    private String extractClientIp(HttpServletRequest req) {
        String fwd = req.getHeader("X-Forwarded-For");
        if (fwd != null && !fwd.isBlank()) {
            return fwd.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }
}
