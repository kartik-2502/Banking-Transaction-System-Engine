package com.bank.transaction.service;

import com.bank.transaction.model.FailedTransaction;
import com.bank.transaction.model.TransactionAudit;
import com.bank.transaction.repository.FailedTransactionRepository;
import com.bank.transaction.repository.TransactionAuditRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TransactionAuditServiceImpl implements TransactionAuditService {

    private static final Logger log = LoggerFactory.getLogger(TransactionAuditServiceImpl.class);

    private final TransactionAuditRepository auditRepository;
    private final FailedTransactionRepository failedTransactionRepository;

    public TransactionAuditServiceImpl(TransactionAuditRepository auditRepository,
                                       FailedTransactionRepository failedTransactionRepository) {
        this.auditRepository = auditRepository;
        this.failedTransactionRepository = failedTransactionRepository;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void recordAudit(String transactionId, Long accountId, String operationType, String result, long durationMs) {
        String threadName = Thread.currentThread().getName();
        TransactionAudit audit = new TransactionAudit(
                transactionId,
                accountId,
                threadName,
                operationType,
                result,
                durationMs
        );
        auditRepository.save(audit);

        // Structured logging with MDC
        MDC.put("txnId", transactionId);
        MDC.put("accountId", String.valueOf(accountId));
        MDC.put("opType", operationType);
        MDC.put("durationMs", String.valueOf(durationMs));
        try {
            log.info("Transaction Audit [result={}, duration={}ms, thread={}]", result, durationMs, threadName);
        } finally {
            MDC.remove("txnId");
            MDC.remove("accountId");
            MDC.remove("opType");
            MDC.remove("durationMs");
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailure(String transactionId, Long accountId, String errorCategory, String failureReason, String payloadJson) {
        FailedTransaction failedTx = new FailedTransaction(
                transactionId,
                accountId,
                errorCategory,
                failureReason,
                payloadJson
        );
        failedTransactionRepository.save(failedTx);

        log.warn("Persisted failed transaction record: txnId={}, category={}, reason={}",
                transactionId, errorCategory, failureReason);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionAudit> getAuditTrail(String transactionId) {
        return auditRepository.findByTransactionIdOrderByCreatedAtDesc(transactionId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionAudit> getAccountAuditTrail(Long accountId) {
        return auditRepository.findByAccountIdOrderByCreatedAtDesc(accountId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionAudit> getAllAudits(Pageable pageable) {
        return auditRepository.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FailedTransaction> getAccountFailures(Long accountId) {
        return failedTransactionRepository.findByAccountIdOrderByCreatedAtDesc(accountId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FailedTransaction> getAllFailures(Pageable pageable) {
        return failedTransactionRepository.findAll(pageable);
    }
}
