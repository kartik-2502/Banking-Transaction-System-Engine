package com.bank.transaction.service;

public interface TransactionAuditService {
    void recordAudit(String transactionId, Long accountId, String operationType, String result, long durationMs);
    void recordFailure(String transactionId, Long accountId, String errorCategory, String failureReason, String payloadJson);
}
