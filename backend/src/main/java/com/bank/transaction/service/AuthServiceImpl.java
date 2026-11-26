package com.bank.transaction.service;

import com.bank.transaction.dto.AuthResponse;
import com.bank.transaction.dto.LoginRequest;
import com.bank.transaction.dto.RegisterRequest;
import com.bank.transaction.dto.UserProfileResponse;
import com.bank.transaction.dto.mfa.ChangePasswordRequest;
import com.bank.transaction.exception.InvalidTransactionException;
import com.bank.transaction.model.ChallengeType;
import com.bank.transaction.model.Customer;
import com.bank.transaction.model.Role;
import com.bank.transaction.model.RoleName;
import com.bank.transaction.model.User;
import com.bank.transaction.repository.CustomerRepository;
import com.bank.transaction.repository.RoleRepository;
import com.bank.transaction.repository.UserRepository;
import com.bank.transaction.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AdaptiveMfaService adaptiveMfaService;
    private final SecurityEventService securityEventService;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           UserRepository userRepository,
                           RoleRepository roleRepository,
                           CustomerRepository customerRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider tokenProvider,
                           AdaptiveMfaService adaptiveMfaService,
                           SecurityEventService securityEventService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.adaptiveMfaService = adaptiveMfaService;
        this.securityEventService = securityEventService;
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        return login(request, new AdaptiveMfaService.ClientContext(
                "127.0.0.1",
                "API-Client",
                request.getDeviceFingerprint(),
                request.getDeviceName(),
                request.getBrowser(),
                request.getOperatingSystem(),
                request.getLocationHint()
        ));
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request, AdaptiveMfaService.ClientContext clientContext) {
        log.info("Authenticating user: {}", request.getUsername());
        userRepository.findByUsername(request.getUsername()).ifPresent(adaptiveMfaService::assertNotLocked);

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (BadCredentialsException ex) {
            adaptiveMfaService.recordFailedLogin(request.getUsername(), clientContext);
            throw ex;
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + request.getUsername()));

        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return adaptiveMfaService.evaluateLogin(user, roles, clientContext);
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering new user: {}", request.getUsername());

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new InvalidTransactionException("Username already in use: " + request.getUsername());
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new InvalidTransactionException("Email already in use: " + request.getEmail());
        }

        User user = new User(
                request.getUsername(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword())
        );

        final RoleName targetRole = (request.getRole() != null && !request.getRole().trim().isEmpty())
                ? parseRole(request.getRole().trim())
                : RoleName.CUSTOMER;

        Role role = roleRepository.findByName(targetRole)
                .orElseThrow(() -> new IllegalStateException("Role not initialized: " + targetRole));
        user.setRoles(Collections.singleton(role));

        User savedUser = userRepository.save(user);

        // Auto-create customer profile if role is CUSTOMER
        if (targetRole == RoleName.CUSTOMER) {
            long sequenceNum = 1000L + savedUser.getId();
            String customerNumber = "CUST" + sequenceNum;
            while (customerRepository.existsByCustomerNumber(customerNumber)) {
                sequenceNum += 1;
                customerNumber = "CUST" + sequenceNum;
            }
            Customer customer = new Customer(
                    customerNumber,
                    savedUser.getUsername(),
                    "User",
                    savedUser.getEmail(),
                    "+91 0000000000",
                    "Default Address"
            );
            customer.setUser(savedUser);
            customerRepository.save(customer);
        }

        List<String> roles = List.of("ROLE_" + role.getName().name());
        String accessToken = tokenProvider.generateAccessToken(savedUser.getUsername(), roles);
        String refreshToken = tokenProvider.generateRefreshToken(savedUser.getUsername());

        return new AuthResponse(
                accessToken,
                refreshToken,
                tokenProvider.getExpirationMs(),
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                roles
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse refreshToken(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new InvalidTransactionException("Invalid or expired refresh token");
        }

        String username = tokenProvider.getUsernameFromToken(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        List<String> roles = user.getRoles().stream()
                .map(r -> "ROLE_" + r.getName().name())
                .collect(Collectors.toList());

        String newAccessToken = tokenProvider.generateAccessToken(username, roles);
        String newRefreshToken = tokenProvider.generateRefreshToken(username);

        return new AuthResponse(
                newAccessToken,
                newRefreshToken,
                tokenProvider.getExpirationMs(),
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                roles
        );
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setEnabled(user.isEnabled());
        response.setRoles(user.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toList()));

        customerRepository.findByUserId(user.getId()).ifPresent(c -> {
            response.setCustomerId(c.getId());
            response.setCustomerNumber(c.getCustomerNumber());
        });

        return response;
    }

    @Override
    @Transactional
    public void changePassword(String username, ChangePasswordRequest request, AdaptiveMfaService.ClientContext clientContext) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new InvalidTransactionException("Current password is incorrect.");
        }

        adaptiveMfaService.enforceSensitiveOperationVerification(
                username,
                ChallengeType.PASSWORD_CHANGE,
                null,
                null,
                null,
                "PASSWORD_CHANGE:" + username,
                request.getChallengeId(),
                false,
                clientContext
        );

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        securityEventService.recordEvent(
                user.getId(), username, "PASSWORD_CHANGED",
                "MEDIUM", 30, com.bank.transaction.model.RiskLevel.MEDIUM,
                clientContext.getIpAddress(), clientContext.getUserAgent(), null, "SUCCESS",
                "Password changed after adaptive MFA verification"
        );
    }

    private RoleName parseRole(String roleStr) {
        try {
            return RoleName.valueOf(roleStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidTransactionException("Invalid role specified: " + roleStr);
        }
    }
}
