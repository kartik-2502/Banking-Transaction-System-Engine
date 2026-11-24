package com.bank.transaction.service;

import com.bank.transaction.model.FailedTransaction;
import com.bank.transaction.model.TransactionAudit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface TransactionAuditService {
    void recordAudit(String transactionId, Long accountId, String operationType, String result, long durationMs);
    void recordFailure(String transactionId, Long accountId, String errorCategory, String failureReason, String payloadJson);

    List<TransactionAudit> getAuditTrail(String transactionId);
    List<TransactionAudit> getAccountAuditTrail(Long accountId);
    Page<TransactionAudit> getAllAudits(Pageable pageable);

    List<FailedTransaction> getAccountFailures(Long accountId);
    Page<FailedTransaction> getAllFailures(Pageable pageable);
}
