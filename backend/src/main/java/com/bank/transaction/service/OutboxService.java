package com.bank.transaction.service;

import com.bank.transaction.dto.NotificationEvent;

public interface OutboxService {

    void publishEvent(String eventType, Object payload);

    void publishNotificationEvent(NotificationEvent event);
}
