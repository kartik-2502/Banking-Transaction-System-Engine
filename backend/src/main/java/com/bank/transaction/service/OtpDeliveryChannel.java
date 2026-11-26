package com.bank.transaction.service;

public interface OtpDeliveryChannel {
    void sendOtp(Long userId, String username, String recipientEmail, String maskedEmail, String otp, String purpose, long ttlSeconds);
}
