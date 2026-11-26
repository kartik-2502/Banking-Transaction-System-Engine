package com.bank.transaction.security;

import com.bank.transaction.model.RiskLevel;
import com.bank.transaction.service.SecurityEventService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Set;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Set<String> MFA_PENDING_ALLOWED_PATHS = Set.of(
            "/api/auth/mfa/send-otp",
            "/api/auth/mfa/verify-otp",
            "/api/auth/mfa/totp/verify"
    );

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;
    private final SecurityEventService securityEventService;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider,
                                   CustomUserDetailsService userDetailsService,
                                   SecurityEventService securityEventService) {
        this.tokenProvider = tokenProvider;
        this.userDetailsService = userDetailsService;
        this.securityEventService = securityEventService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                String username = tokenProvider.getUsernameFromToken(jwt);
                String tokenStage = tokenProvider.getTokenStage(jwt);
                String path = request.getRequestURI();

                if ("MFA_PENDING".equals(tokenStage)) {
                    if (MFA_PENDING_ALLOWED_PATHS.contains(path)) {
                        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        userDetails,
                                        null,
                                        List.of(new SimpleGrantedAuthority("ROLE_MFA_PENDING"))
                                );
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        MDC.put("user", username);
                    } else {
                        // Prevent MFA bypass using a pre-MFA challenge token on protected endpoints
                        securityEventService.recordEvent(
                                null,
                                username,
                                "MFA_BYPASS_ATTEMPT",
                                "HIGH",
                                75,
                                RiskLevel.HIGH,
                                request.getRemoteAddr(),
                                request.getHeader("User-Agent"),
                                null,
                                "BLOCKED",
                                "Blocked attempt to invoke protected API (" + path + ") with MFA_PENDING token"
                        );
                    }
                } else {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    MDC.put("user", username);
                }
            }
        } catch (Exception ex) {
            logger.error("Could not set user authentication in security context", ex);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove("user");
        }
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
