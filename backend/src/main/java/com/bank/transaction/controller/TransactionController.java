package com.bank.transaction.controller;

import com.bank.transaction.dto.*;
import com.bank.transaction.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping("/deposit")
    @PreAuthorize("hasAnyRole('ADMIN', 'TELLER', 'CUSTOMER')")
    public ResponseEntity<ApiResponse<TransactionResponse>> deposit(@Valid @RequestBody DepositRequest request) {
        TransactionResponse response = transactionService.processDeposit(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Deposit processed successfully", response));
    }

    @PostMapping("/withdrawal")
    @PreAuthorize("hasAnyRole('ADMIN', 'TELLER', 'CUSTOMER')")
    public ResponseEntity<ApiResponse<TransactionResponse>> withdraw(@Valid @RequestBody WithdrawalRequest request) {
        TransactionResponse response = transactionService.processWithdrawal(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Withdrawal processed successfully", response));
    }

    @PostMapping("/transfer")
    @PreAuthorize("hasAnyRole('ADMIN', 'TELLER', 'CUSTOMER')")
    public ResponseEntity<ApiResponse<TransactionResponse>> transfer(@Valid @RequestBody TransferRequest request) {
        TransactionResponse response = transactionService.processTransfer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Account-to-account transfer processed successfully", response));
    }

    @GetMapping("/{transactionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TELLER', 'CUSTOMER', 'RISK_ANALYST')")
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransaction(
            @PathVariable("transactionId") String transactionId) {
        TransactionResponse response = transactionService.getTransactionById(transactionId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/account/{accountNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TELLER', 'CUSTOMER', 'RISK_ANALYST')")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getAccountTransactions(
            @PathVariable("accountNumber") String accountNumber,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        Page<TransactionResponse> transactions = transactionService.getAccountTransactions(accountNumber, pageable);
        return ResponseEntity.ok(ApiResponse.ok(transactions));
    }
}
