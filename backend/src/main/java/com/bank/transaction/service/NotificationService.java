package com.bank.transaction.service;

import com.bank.transaction.dto.NotificationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    NotificationResponse createNotification(Long userId, String type, String title, String message);

    Page<NotificationResponse> getUserNotifications(Long userId, Pageable pageable);

    long getUnreadCount(Long userId);

    NotificationResponse markAsRead(Long notificationId, Long userId);

    void markAllAsRead(Long userId);
}
