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
    @PreAuthorize("hasAnyRole('ADMIN', 'TELLER', 'RISK_ANALYST', 'LOAN_OFFICER')")
    public ResponseEntity<ApiResponse<Page<AccountResponse>>> getAllAccounts(
            @RequestParam(name = "status", required = false) AccountStatus status,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        Page<AccountResponse> accounts = accountService.getAllAccounts(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(accounts));
    }

    @GetMapping("/transfer-targets")
    @PreAuthorize("hasAnyRole('ADMIN', 'TELLER', 'RISK_ANALYST', 'CUSTOMER', 'LOAN_OFFICER')")
    public ResponseEntity<ApiResponse<List<AccountResponse>>> getTransferTargets() {
        List<AccountResponse> targets = accountService.getAllAccounts(AccountStatus.ACTIVE, Pageable.ofSize(100))
                .getContent()
                .stream()
                .filter(acc -> acc.getStatus() == AccountStatus.ACTIVE)
                .map(acc -> {
                    AccountResponse safe = new AccountResponse();
                    safe.setId(acc.getId());
                    safe.setAccountNumber(acc.getAccountNumber());
                    safe.setCustomerNumber(acc.getCustomerNumber());
                    safe.setCustomerName(acc.getCustomerName());
                    safe.setCurrency(acc.getCurrency());
                    safe.setStatus(acc.getStatus());
                    return safe;
                })
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(targets));
    }

    @GetMapping("/{accountNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TELLER', 'RISK_ANALYST', 'CUSTOMER', 'LOAN_OFFICER')")
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
    @PreAuthorize("hasAnyRole('ADMIN', 'RISK_ANALYST', 'TELLER', 'LOAN_OFFICER')")
    public ResponseEntity<ApiResponse<List<AccountStatusHistoryResponse>>> getAccountStatusHistory(
            @PathVariable("accountNumber") String accountNumber) {
        List<AccountStatusHistoryResponse> history = accountService.getAccountStatusHistory(accountNumber);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }

    @PostMapping("/{accountNumber}/freeze")
    @PreAuthorize("hasAnyRole('ADMIN', 'RISK_ANALYST')")
    public ResponseEntity<ApiResponse<AccountResponse>> freezeAccount(
            @PathVariable("accountNumber") String accountNumber,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            @Valid @RequestBody AccountFreezeRequest request) {
        AccountResponse response = accountService.freezeAccount(accountNumber, request.getReason(), userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Account frozen successfully", response));
    }

    @PostMapping("/{accountNumber}/unfreeze")
    @PreAuthorize("hasAnyRole('ADMIN', 'RISK_ANALYST')")
    public ResponseEntity<ApiResponse<AccountResponse>> unfreezeAccount(
            @PathVariable("accountNumber") String accountNumber,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            @Valid @RequestBody AccountFreezeRequest request) {
        AccountResponse response = accountService.unfreezeAccount(accountNumber, request.getReason(), userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Account unfrozen successfully", response));
    }

    @GetMapping("/{accountNumber}/limits")
    @PreAuthorize("hasAnyRole('ADMIN', 'RISK_ANALYST', 'TELLER', 'CUSTOMER', 'LOAN_OFFICER')")
    public ResponseEntity<ApiResponse<AccountTransactionLimitResponse>> getAccountLimits(
            @PathVariable("accountNumber") String accountNumber) {
        AccountTransactionLimitResponse response = accountService.getAccountLimits(accountNumber);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{accountNumber}/limits")
    @PreAuthorize("hasAnyRole('ADMIN', 'RISK_ANALYST')")
    public ResponseEntity<ApiResponse<AccountTransactionLimitResponse>> updateAccountLimits(
            @PathVariable("accountNumber") String accountNumber,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            @Valid @RequestBody AccountTransactionLimitUpdateRequest request) {
        AccountTransactionLimitResponse response = accountService.updateAccountLimits(accountNumber, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Account limits updated successfully", response));
    }

    @GetMapping("/{accountNumber}/risk")
    @PreAuthorize("hasAnyRole('ADMIN', 'RISK_ANALYST', 'TELLER')")
    public ResponseEntity<ApiResponse<AccountRiskProfileResponse>> getAccountRiskProfile(
            @PathVariable("accountNumber") String accountNumber) {
        AccountRiskProfileResponse response = accountService.getAccountRiskProfile(accountNumber);
        return ResponseEntity.ok(ApiResponse.ok("Account risk profile retrieved", response));
    }
}
