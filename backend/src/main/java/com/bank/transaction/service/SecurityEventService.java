package com.bank.transaction.service;

import com.bank.transaction.dto.NotificationEvent;
import com.bank.transaction.model.RiskLevel;
import com.bank.transaction.model.SecurityEvent;
import com.bank.transaction.repository.SecurityEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class SecurityEventService {

    private static final Logger log = LoggerFactory.getLogger(SecurityEventService.class);

    private final SecurityEventRepository securityEventRepository;
    private final OutboxService outboxService;

    public SecurityEventService(SecurityEventRepository securityEventRepository,
                                OutboxService outboxService) {
        this.securityEventRepository = securityEventRepository;
        this.outboxService = outboxService;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public SecurityEvent recordEvent(Long userId,
                                     String username,
                                     String eventType,
                                     String severity,
                                     Integer riskScore,
                                     RiskLevel riskLevel,
                                     String ipAddress,
                                     String userAgent,
                                     String deviceId,
                                     String outcome,
                                     String details) {
        SecurityEvent event = new SecurityEvent();
        event.setEventId("SEC_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase());
        event.setUserId(userId);
        event.setUsername(username);
        event.setEventType(eventType);
        event.setSeverity(severity != null ? severity : "INFO");
        event.setRiskScore(riskScore);
        event.setRiskLevel(riskLevel != null ? riskLevel.name() : null);
        event.setIpAddress(ipAddress);
        event.setUserAgent(truncate(userAgent, 250));
        event.setDeviceId(deviceId);
        event.setOutcome(outcome);
        event.setDetails(truncate(details, 990));

        SecurityEvent saved = securityEventRepository.save(event);
        log.info("SecurityEvent [type={}, user={}, severity={}, outcome={}, riskLevel={}]",
                eventType, username, severity, outcome, riskLevel);

        if ("HIGH".equalsIgnoreCase(severity) || "CRITICAL".equalsIgnoreCase(severity)) {
            outboxService.publishNotificationEvent(new NotificationEvent(
                    "SECURITY_ALERT",
                    saved.getEventId(),
                    null,
                    userId,
                    username,
                    null,
                    "Security Alert: " + eventType,
                    details != null ? details : ("Security event recorded: " + eventType),
                    "CRITICAL".equalsIgnoreCase(severity) ? "CRITICAL" : "WARNING"
            ));
        }

        return saved;
    }

    @Transactional(readOnly = true)
    public Page<SecurityEvent> getUserEvents(Long userId, Pageable pageable) {
        return securityEventRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<SecurityEvent> getAllEvents(Pageable pageable) {
        return securityEventRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    @Transactional(readOnly = true)
    public long countRecentEvents(Long userId, String eventType, OffsetDateTime since) {
        return securityEventRepository.countByUserIdAndEventTypeAndCreatedAtAfter(userId, eventType, since);
    }

    private String truncate(String val, int max) {
        if (val == null) return null;
        return val.length() <= max ? val : val.substring(0, max);
    }
}
