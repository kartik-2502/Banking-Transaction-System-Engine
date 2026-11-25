package com.bank.transaction.service;

import com.bank.transaction.dto.NotificationEvent;
import com.bank.transaction.model.NotificationOutbox;
import com.bank.transaction.repository.NotificationOutboxRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OutboxServiceImpl implements OutboxService {

    private static final Logger log = LoggerFactory.getLogger(OutboxServiceImpl.class);

    private final NotificationOutboxRepository outboxRepository;
    private final ObjectMapper objectMapper;

    public OutboxServiceImpl(NotificationOutboxRepository outboxRepository, ObjectMapper objectMapper) {
        this.outboxRepository = outboxRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void publishEvent(String eventType, Object payload) {
        try {
            String payloadJson = objectMapper.writeValueAsString(payload);
            NotificationOutbox outbox = new NotificationOutbox(eventType, payloadJson);
            outboxRepository.save(outbox);
            log.debug("Enqueued event into notification outbox [type={}, id={}]", eventType, outbox.getId());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize outbox event payload for type: {}", eventType, e);
            throw new RuntimeException("Could not serialize event payload", e);
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void publishNotificationEvent(NotificationEvent event) {
        publishEvent(event.getEventType(), event);
    }
}
