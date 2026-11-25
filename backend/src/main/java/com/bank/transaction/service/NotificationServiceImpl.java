package com.bank.transaction.service;

import com.bank.transaction.dto.NotificationResponse;
import com.bank.transaction.exception.CustomerNotFoundException;
import com.bank.transaction.exception.InvalidTransactionException;
import com.bank.transaction.model.Notification;
import com.bank.transaction.model.NotificationStatus;
import com.bank.transaction.model.User;
import com.bank.transaction.repository.NotificationRepository;
import com.bank.transaction.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public NotificationResponse createNotification(Long userId, String type, String title, String message) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomerNotFoundException("User not found with id: " + userId));

        Notification notification = new Notification(user, type, title, message);
        notification.setStatus(NotificationStatus.SENT);
        Notification saved = notificationRepository.save(notification);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndStatusNot(userId, NotificationStatus.READ);
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new InvalidTransactionException("Notification not found with id: " + notificationId));

        if (!notification.getUser().getId().equals(userId)) {
            throw new InvalidTransactionException("Unauthorized: Cannot update notification of another user");
        }

        notification.setStatus(NotificationStatus.READ);
        notification.setReadAt(OffsetDateTime.now());
        Notification saved = notificationRepository.save(notification);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, NotificationStatus.SENT);
        unread.addAll(notificationRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, NotificationStatus.PENDING));

        OffsetDateTime now = OffsetDateTime.now();
        for (Notification n : unread) {
            n.setStatus(NotificationStatus.READ);
            n.setReadAt(now);
        }
        notificationRepository.saveAll(unread);
        log.info("Marked {} notifications as read for user id: {}", unread.size(), userId);
    }

    private NotificationResponse mapToResponse(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getUser() != null ? n.getUser().getId() : null,
                n.getType(),
                n.getTitle(),
                n.getMessage(),
                n.getStatus(),
                n.getCreatedAt(),
                n.getReadAt()
        );
    }
}
