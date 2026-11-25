package com.bank.transaction.service;

import com.bank.transaction.dto.NotificationEvent;
import com.bank.transaction.model.Notification;
import com.bank.transaction.model.NotificationOutbox;
import com.bank.transaction.model.NotificationStatus;
import com.bank.transaction.model.OutboxStatus;
import com.bank.transaction.model.User;
import com.bank.transaction.repository.NotificationOutboxRepository;
import com.bank.transaction.repository.NotificationRepository;
import com.bank.transaction.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.List;

@Component
public class NotificationOutboxProcessor {

    private static final Logger log = LoggerFactory.getLogger(NotificationOutboxProcessor.class);
    private static final int BATCH_SIZE = 50;

    private final NotificationOutboxRepository outboxRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    public NotificationOutboxProcessor(NotificationOutboxRepository outboxRepository,
                                       NotificationRepository notificationRepository,
                                       UserRepository userRepository,
                                       SimpMessagingTemplate messagingTemplate,
                                       ObjectMapper objectMapper) {
        this.outboxRepository = outboxRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
    }

    @Scheduled(fixedDelayString = "${banking.outbox.poll-rate-ms:2000}", initialDelay = 5000)
    public void scheduleProcessPendingEvents() {
        processPendingEvents();
    }

    public int processPendingEvents() {
        List<NotificationOutbox> pendingEvents = outboxRepository.findPendingEvents(
                OutboxStatus.PENDING, PageRequest.of(0, BATCH_SIZE)
        );

        if (pendingEvents.isEmpty()) {
            return 0;
        }

        log.debug("Processing {} pending notification outbox events", pendingEvents.size());
        int processedCount = 0;

        for (NotificationOutbox outbox : pendingEvents) {
            try {
                processSingleEvent(outbox);
                processedCount++;
            } catch (Exception ex) {
                log.error("Failed to process notification outbox record [id={}, type={}]: {}",
                        outbox.getId(), outbox.getEventType(), ex.getMessage(), ex);
                handleEventFailure(outbox);
            }
        }

        return processedCount;
    }

    private void processSingleEvent(NotificationOutbox outbox) throws Exception {
        NotificationEvent event = objectMapper.readValue(outbox.getPayloadJson(), NotificationEvent.class);

        // 1. Broadcast to global topic
        messagingTemplate.convertAndSend("/topic/notifications", event);

        // 2. Broadcast to account-specific topic if account is present
        if (event.getAccountNumber() != null && !event.getAccountNumber().isBlank()) {
            messagingTemplate.convertAndSend("/topic/accounts/" + event.getAccountNumber(), event);
        }

        // 3. Broadcast to dedicated channels based on category
        String eventType = event.getEventType() != null ? event.getEventType() : "";
        if (eventType.startsWith("FRAUD")) {
            messagingTemplate.convertAndSend("/topic/admin/fraud", event);
        }
        if (eventType.startsWith("LOAN")) {
            messagingTemplate.convertAndSend("/topic/loans", event);
        }

        // 4. Create persistent user notification record if userId is provided
        if (event.getUserId() != null) {
            userRepository.findById(event.getUserId()).ifPresent(user -> {
                Notification notification = new Notification(
                        user,
                        event.getEventType(),
                        event.getTitle() != null ? event.getTitle() : "Notification",
                        event.getMessage() != null ? event.getMessage() : ""
                );
                notification.setStatus(NotificationStatus.SENT);
                notificationRepository.save(notification);
            });
        }

        // 5. Mark outbox entry as PROCESSED
        outbox.setStatus(OutboxStatus.PROCESSED);
        outbox.setProcessedAt(OffsetDateTime.now());
        outboxRepository.save(outbox);

        log.debug("Successfully processed outbox event [id={}, type={}]", outbox.getId(), outbox.getEventType());
    }

    private void handleEventFailure(NotificationOutbox outbox) {
        outbox.setRetryCount(outbox.getRetryCount() + 1);
        if (outbox.getRetryCount() >= 5) {
            outbox.setStatus(OutboxStatus.FAILED);
            log.warn("Outbox record [id={}] exceeded max retry limit, marked as FAILED", outbox.getId());
        }
        outboxRepository.save(outbox);
    }
}
