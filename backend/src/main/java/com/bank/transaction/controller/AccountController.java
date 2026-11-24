package com.bank.transaction.controller;

import com.bank.transaction.dto.*;
import com.bank.transaction.model.AccountStatus;
import com.bank.transaction.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TELLER')")
    public ResponseEntity<ApiResponse<AccountResponse>> createAccount(@Valid @RequestBody AccountCreateRequest request) {
        AccountResponse response = accountService.createAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Bank account created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TELLER', 'RISK_ANALYST')")
    public ResponseEntity<ApiResponse<Page<AccountResponse>>> getAllAccounts(
            @RequestParam(name = "status", required = false) AccountStatus status,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        Page<AccountResponse> accounts = accountService.getAllAccounts(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(accounts));
    }

    @GetMapping("/{accountNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TELLER', 'RISK_ANALYST', 'CUSTOMER')")
    public ResponseEntity<ApiResponse<AccountResponse>> getAccountByNumber(
            @PathVariable("accountNumber") String accountNumber) {
        AccountResponse response = accountService.getAccountByAccountNumber(accountNumber);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{accountNumber}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'RISK_ANALYST')")
    public ResponseEntity<ApiResponse<AccountResponse>> updateAccountStatus(
            @PathVariable("accountNumber") String accountNumber,
            @Valid @RequestBody AccountStatusUpdateRequest request) {
        AccountResponse response = accountService.updateAccountStatus(accountNumber, request);
        return ResponseEntity.ok(ApiResponse.ok("Account status updated successfully", response));
    }

    @GetMapping("/{accountNumber}/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'RISK_ANALYST', 'TELLER')")
    public ResponseEntity<ApiResponse<List<AccountStatusHistoryResponse>>> getAccountStatusHistory(
            @PathVariable("accountNumber") String accountNumber) {
        List<AccountStatusHistoryResponse> history = accountService.getAccountStatusHistory(accountNumber);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }
}
