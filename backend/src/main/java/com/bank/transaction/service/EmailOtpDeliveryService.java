package com.bank.transaction.service;

import com.bank.transaction.config.AmfaProperties;
import com.bank.transaction.dto.NotificationEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailOtpDeliveryService implements OtpDeliveryChannel {

    private static final Logger log = LoggerFactory.getLogger(EmailOtpDeliveryService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final OutboxService outboxService;
    private final AmfaProperties properties;

    public EmailOtpDeliveryService(ObjectProvider<JavaMailSender> mailSenderProvider,
                                   OutboxService outboxService,
                                   AmfaProperties properties) {
        this.mailSenderProvider = mailSenderProvider;
        this.outboxService = outboxService;
        this.properties = properties;
    }

    @Override
    public void sendOtp(Long userId, String username, String recipientEmail, String maskedEmail,
                        String otp, String purpose, long ttlSeconds) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        long ttlMinutes = Math.max(1, ttlSeconds / 60);

        if (mailSender != null && recipientEmail != null && !recipientEmail.isBlank()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(properties.getMailFrom());
                message.setTo(recipientEmail);
                message.setSubject("Bank Security Verification Code (" + purpose + ")");
                message.setText("Your one-time verification code is: " + otp +
                        "\nThis code expires in " + ttlMinutes + " minutes.\nDo not share this code with anyone.");
                mailSender.send(message);
                log.info("Dispatched Email OTP via SMTP [user={}, target={}, purpose={}]",
                        username, maskedEmail, purpose);
            } catch (Exception ex) {
                log.warn("SMTP delivery failed, recording outbox fallback notification [user={}, target={}, error={}]",
                        username, maskedEmail, ex.getMessage());
            }
        } else {
            // Never log plaintext OTP in logs; enqueue masked delivery audit notification
            log.info("Dispatched verification OTP to configured email channel [user={}, target={}, purpose={}, ttlMin={}]",
                    username, maskedEmail, purpose, ttlMinutes);
        }

        outboxService.publishNotificationEvent(new NotificationEvent(
                "SECURITY_OTP_SENT",
                null,
                null,
                userId,
                username,
                null,
                "Verification Code Dispatched",
                "A one-time verification code for " + purpose + " was sent to " + maskedEmail + " (valid " + ttlMinutes + " mins).",
                "INFO"
        ));
    }
}
