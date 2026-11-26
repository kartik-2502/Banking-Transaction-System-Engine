package com.bank.transaction;

import com.bank.transaction.dto.AuthResponse;
import com.bank.transaction.dto.LoginRequest;
import com.bank.transaction.dto.RegisterRequest;
import com.bank.transaction.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class AuthIntegrationTest {

    @Autowired
    private AuthService authService;

    @Test
    @DisplayName("Verify user login and JWT token generation for admin and customer")
    void testUserAuthentication() {
        AuthResponse adminAuth = authService.login(new LoginRequest("system_administrator", "password"));
        assertNotNull(adminAuth);
        assertNotNull(adminAuth.getAccessToken());
        assertNotNull(adminAuth.getRefreshToken());
        assertTrue(adminAuth.getRoles().contains("ROLE_ADMIN"));

        AuthResponse customerAuth = authService.login(new LoginRequest("aarav_sharma", "password"));
        assertNotNull(customerAuth);
        assertTrue(customerAuth.getRoles().contains("ROLE_CUSTOMER"));
    }

    @Test
    @DisplayName("Verify registration of new user and customer profile creation")
    void testUserRegistration() {
        String testUser = "testuser_" + System.currentTimeMillis();
        String testEmail = testUser + "@bank.com";

        RegisterRequest request = new RegisterRequest(testUser, testEmail, "securepass123", "CUSTOMER");
        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals(testUser, response.getUsername());
        assertNotNull(response.getAccessToken());
        assertTrue(response.getRoles().contains("ROLE_CUSTOMER"));
    }

    @Test
    @DisplayName("Verify refresh token rotation and new access token issuance")
    void testTokenRefresh() {
        AuthResponse loginResponse = authService.login(new LoginRequest("rohan_kulkarni", "password"));
        String refreshToken = loginResponse.getRefreshToken();

        AuthResponse refreshed = authService.refreshToken(refreshToken);
        assertNotNull(refreshed);
        assertNotNull(refreshed.getAccessToken());
        assertEquals("rohan_kulkarni", refreshed.getUsername());
    }
}
