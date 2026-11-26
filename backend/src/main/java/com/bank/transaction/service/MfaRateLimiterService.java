package com.bank.transaction.service;

import com.bank.transaction.config.AmfaProperties;
import com.bank.transaction.exception.RateLimitExceededException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MfaRateLimiterService {

    private final AmfaProperties properties;
    private final Map<String, Deque<Instant>> requestBuckets = new ConcurrentHashMap<>();

    public MfaRateLimiterService(AmfaProperties properties) {
        this.properties = properties;
    }

    public void checkRateLimit(String key, String actionLabel) {
        Instant now = Instant.now();
        Instant cutoff = now.minusSeconds(properties.getRateLimitWindowSeconds());
        Deque<Instant> timestamps = requestBuckets.computeIfAbsent(key, k -> new ArrayDeque<>());

        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(cutoff)) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= properties.getRateLimitMaxRequests()) {
                throw new RateLimitExceededException(
                        "Too many " + actionLabel + " requests. Please wait before retrying."
                );
            }
            timestamps.addLast(now);
        }
    }

    public void resetBucket(String key) {
        requestBuckets.remove(key);
    }
}
