package com.bank.transaction.controller;

import com.bank.transaction.dto.ApiResponse;
import com.bank.transaction.model.FailedTransaction;
import com.bank.transaction.model.TransactionAudit;
import com.bank.transaction.service.TransactionAuditService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
@PreAuthorize("hasAnyRole('ADMIN', 'RISK_ANALYST')")
public class AuditController {

    private final TransactionAuditService auditService;

    public AuditController(TransactionAuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping("/transactions/{transactionId}")
    public ResponseEntity<ApiResponse<List<TransactionAudit>>> getTransactionAudit(@PathVariable String transactionId) {
        List<TransactionAudit> auditTrail = auditService.getAuditTrail(transactionId);
        return ResponseEntity.ok(ApiResponse.ok("Audit trail retrieved", auditTrail));
    }

    @GetMapping("/accounts/{accountId}")
    public ResponseEntity<ApiResponse<List<TransactionAudit>>> getAccountAuditTrail(@PathVariable Long accountId) {
        List<TransactionAudit> auditTrail = auditService.getAccountAuditTrail(accountId);
        return ResponseEntity.ok(ApiResponse.ok("Account audit trail retrieved", auditTrail));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<Page<TransactionAudit>>> getAllAudits(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<TransactionAudit> page = auditService.getAllAudits(pageable);
        return ResponseEntity.ok(ApiResponse.ok("Audits retrieved", page));
    }

    @GetMapping("/failures")
    public ResponseEntity<ApiResponse<Page<FailedTransaction>>> getAllFailures(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<FailedTransaction> page = auditService.getAllFailures(pageable);
        return ResponseEntity.ok(ApiResponse.ok("Failed transactions retrieved", page));
    }

    @GetMapping("/failures/accounts/{accountId}")
    public ResponseEntity<ApiResponse<List<FailedTransaction>>> getAccountFailures(@PathVariable Long accountId) {
        List<FailedTransaction> failures = auditService.getAccountFailures(accountId);
        return ResponseEntity.ok(ApiResponse.ok("Account failures retrieved", failures));
    }
}
