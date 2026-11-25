package com.bank.transaction;

import com.bank.transaction.dto.DepositRequest;
import com.bank.transaction.dto.NotificationResponse;
import com.bank.transaction.dto.TransactionResponse;
import com.bank.transaction.model.Notification;
import com.bank.transaction.model.NotificationOutbox;
import com.bank.transaction.model.NotificationStatus;
import com.bank.transaction.model.OutboxStatus;
import com.bank.transaction.model.TransactionStatus;
import com.bank.transaction.repository.NotificationOutboxRepository;
import com.bank.transaction.repository.NotificationRepository;
import com.bank.transaction.repository.UserRepository;
import com.bank.transaction.service.NotificationOutboxProcessor;
import com.bank.transaction.service.NotificationService;
import com.bank.transaction.service.TransactionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class OutboxAndWebSocketIntegrationTest {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private NotificationOutboxRepository outboxRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationOutboxProcessor outboxProcessor;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private com.bank.transaction.repository.AccountRepository accountRepository;

    @org.junit.jupiter.api.BeforeEach
    void setupCleanState() {
        notificationRepository.deleteAll();
        outboxRepository.deleteAll();
    }

    @org.junit.jupiter.api.AfterEach
    void resetAccountState() {
        accountRepository.findByAccountNumber("ACC1001").ifPresent(acc -> {
            acc.setBalance(new BigDecimal("10000.00"));
            accountRepository.saveAndFlush(acc);
        });
    }

    @Test
    @DisplayName("Transactional Outbox: Deposit emits outbox event in the same transaction")
    void testDepositCreatesOutboxRecord() {
        String txnId = "TXN_OUTBOX_DEP_" + System.currentTimeMillis();
        DepositRequest request = new DepositRequest(txnId, "ACC1001", new BigDecimal("150.00"), "WEB");
        TransactionResponse response = transactionService.processDeposit(request);

        assertNotNull(response);
        assertEquals(TransactionStatus.SUCCESS, response.getStatus());

        Optional<NotificationOutbox> found = outboxRepository.findAll().stream()
                .filter(o -> o.getPayloadJson() != null && o.getPayloadJson().contains(txnId))
                .findFirst();
        assertTrue(found.isPresent(), "Outbox record must be enqueued for transaction ID: " + txnId);
        assertEquals(OutboxStatus.PENDING, found.get().getStatus());
    }

    @Test
    @DisplayName("Outbox Processor: Pending events are dispatched, marked PROCESSED, and user notifications created")
    void testOutboxProcessorProcessesEvents() {
        String txnId = "TXN_OUTBOX_PROC_" + System.currentTimeMillis();
        DepositRequest request = new DepositRequest(txnId, "ACC1001", new BigDecimal("250.00"), "MOBILE");
        transactionService.processDeposit(request);

        int processed = outboxProcessor.processPendingEvents();
        assertTrue(processed > 0, "Processor should have processed at least 1 pending event");

        List<NotificationOutbox> all = outboxRepository.findAll();
        NotificationOutbox matching = all.stream()
                .filter(o -> o.getPayloadJson() != null && o.getPayloadJson().contains(txnId))
                .findFirst()
                .orElse(null);

        assertNotNull(matching, "Processed outbox entry should exist in DB");
        assertEquals(OutboxStatus.PROCESSED, matching.getStatus());
        assertNotNull(matching.getProcessedAt(), "processedAt timestamp must be set");
    }

    @Test
    @DisplayName("Notification Service: Unread count, paginated retrieval, and mark as read workflow")
    void testNotificationServiceWorkflow() {
        Long userId = userRepository.findByUsername("john_doe").orElseThrow().getId();

        NotificationResponse created = notificationService.createNotification(
                userId, "SYSTEM_ALERT", "Security Notice", "Your account security settings were updated."
        );
        assertNotNull(created.getId());
        assertEquals(NotificationStatus.SENT, created.getStatus());

        long unreadBefore = notificationService.getUnreadCount(userId);
        assertTrue(unreadBefore >= 1, "Unread count should be >= 1");

        Page<NotificationResponse> page = notificationService.getUserNotifications(userId, PageRequest.of(0, 10));
        assertFalse(page.isEmpty());

        NotificationResponse marked = notificationService.markAsRead(created.getId(), userId);
        assertEquals(NotificationStatus.READ, marked.getStatus());
        assertNotNull(marked.getReadAt());

        notificationService.markAllAsRead(userId);
        assertEquals(0, notificationService.getUnreadCount(userId), "All notifications should now be READ");
    }

    @Test
    @DisplayName("WebSocket: Messaging template correctly broadcasts to destination channels")
    void testWebSocketBroadcast() {
        assertDoesNotThrow(() -> {
            messagingTemplate.convertAndSend("/topic/notifications", "Heartbeat test");
            messagingTemplate.convertAndSend("/topic/accounts/ACC1001", "Account ping");
            messagingTemplate.convertAndSend("/topic/admin/fraud", "Fraud channel ping");
            messagingTemplate.convertAndSend("/topic/loans", "Loan channel ping");
        });
    }
}
