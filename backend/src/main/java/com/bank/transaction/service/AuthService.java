package com.bank.transaction.service;

import com.bank.transaction.dto.AuthResponse;
import com.bank.transaction.dto.LoginRequest;
import com.bank.transaction.dto.RegisterRequest;
import com.bank.transaction.dto.UserProfileResponse;
import com.bank.transaction.dto.mfa.ChangePasswordRequest;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse login(LoginRequest request, AdaptiveMfaService.ClientContext clientContext);
    AuthResponse register(RegisterRequest request);
    AuthResponse refreshToken(String refreshToken);
    UserProfileResponse getCurrentUserProfile(String username);
    void changePassword(String username, ChangePasswordRequest request, AdaptiveMfaService.ClientContext clientContext);
}
