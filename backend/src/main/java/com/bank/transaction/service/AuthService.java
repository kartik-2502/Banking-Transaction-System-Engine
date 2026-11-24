package com.bank.transaction.service;

import com.bank.transaction.dto.AuthResponse;
import com.bank.transaction.dto.LoginRequest;
import com.bank.transaction.dto.RegisterRequest;
import com.bank.transaction.dto.UserProfileResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse register(RegisterRequest request);
    AuthResponse refreshToken(String refreshToken);
    UserProfileResponse getCurrentUserProfile(String username);
}
