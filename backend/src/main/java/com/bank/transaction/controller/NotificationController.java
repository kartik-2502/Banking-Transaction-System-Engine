package com.bank.transaction.controller;

import com.bank.transaction.dto.ApiResponse;
import com.bank.transaction.dto.NotificationResponse;
import com.bank.transaction.exception.CustomerNotFoundException;
import com.bank.transaction.model.User;
import com.bank.transaction.repository.UserRepository;
import com.bank.transaction.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NotificationController(NotificationService notificationService, UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getMyNotifications(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Long userId = resolveUserId(userDetails.getUsername());
        Page<NotificationResponse> notifications = notificationService.getUserNotifications(userId, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Notifications retrieved successfully", notifications));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails.getUsername());
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.ok("Unread count retrieved", Map.of("unreadCount", count)));
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        Long userId = resolveUserId(userDetails.getUsername());
        NotificationResponse response = notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read", response));
    }

    @PutMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> markAllAsRead(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails.getUsername());
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read", "SUCCESS"));
    }

    private Long resolveUserId(String username) {
        return userRepository.findByUsername(username)
                .map(User::getId)
                .orElseThrow(() -> new CustomerNotFoundException("User not found: " + username));
    }
}
