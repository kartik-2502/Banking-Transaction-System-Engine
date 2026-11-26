package com.bank.transaction.controller;

import com.bank.transaction.dto.*;
import com.bank.transaction.service.AdaptiveMfaService;
import com.bank.transaction.service.TransactionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;
    private final AdaptiveMfaService adaptiveMfaService;

    public TransactionController(TransactionService transactionService,
                                 AdaptiveMfaService adaptiveMfaService) {
        this.transactionService = transactionService;
        this.adaptiveMfaService = adaptiveMfaService;
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
    public ResponseEntity<ApiResponse<TransactionResponse>> transfer(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TransferRequest request,
            HttpServletRequest httpRequest) {
        if (userDetails != null) {
            String fwd = httpRequest.getHeader("X-Forwarded-For");
            String ip = (fwd != null && !fwd.isBlank()) ? fwd.split(",")[0].trim() : httpRequest.getRemoteAddr();
            String fp = request.getDeviceFingerprint() != null
                    ? request.getDeviceFingerprint()
                    : httpRequest.getHeader("X-Device-Fingerprint");
            AdaptiveMfaService.ClientContext ctx = new AdaptiveMfaService.ClientContext(
                    ip, httpRequest.getHeader("User-Agent"), fp, null, null, null, null
            );
            adaptiveMfaService.enforceTransferVerification(userDetails.getUsername(), request, ctx);
        }
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
