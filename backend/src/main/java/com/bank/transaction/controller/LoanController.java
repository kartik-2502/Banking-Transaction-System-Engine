package com.bank.transaction.controller;

import com.bank.transaction.dto.*;
import com.bank.transaction.model.LoanStatus;
import com.bank.transaction.service.LoanService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    private final LoanService loanService;

    public LoanController(LoanService loanService) {
        this.loanService = loanService;
    }

    @PostMapping("/apply")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<LoanResponse>> applyForLoan(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody LoanApplicationRequest request) {
        LoanResponse response = loanService.applyForLoan(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Loan application submitted successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('LOAN_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Page<LoanResponse>>> getLoans(
            @RequestParam(name = "status", required = false) LoanStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<LoanResponse> loans = loanService.getLoans(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Loans retrieved successfully", loans));
    }

    @GetMapping("/{loanId}")
    @PreAuthorize("hasAnyRole('LOAN_OFFICER', 'ADMIN', 'CUSTOMER')")
    public ResponseEntity<ApiResponse<LoanResponse>> getLoanById(@PathVariable String loanId) {
        LoanResponse response = loanService.getLoanById(loanId);
        return ResponseEntity.ok(ApiResponse.ok("Loan retrieved successfully", response));
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyRole('LOAN_OFFICER', 'ADMIN', 'CUSTOMER')")
    public ResponseEntity<ApiResponse<List<LoanResponse>>> getCustomerLoans(@PathVariable Long customerId) {
        List<LoanResponse> loans = loanService.getCustomerLoans(customerId);
        return ResponseEntity.ok(ApiResponse.ok("Customer loans retrieved successfully", loans));
    }

    @PutMapping("/{loanId}/review")
    @PreAuthorize("hasAnyRole('LOAN_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<LoanResponse>> reviewLoan(
            @PathVariable String loanId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody LoanReviewRequest request) {
        LoanResponse response = loanService.reviewLoan(loanId, userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.ok("Loan review updated successfully", response));
    }

    @PostMapping("/{loanId}/disburse")
    @PreAuthorize("hasAnyRole('LOAN_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<LoanResponse>> disburseLoan(
            @PathVariable String loanId,
            @AuthenticationPrincipal UserDetails userDetails) {
        LoanResponse response = loanService.disburseLoan(loanId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Loan disbursed successfully and funds credited to customer account", response));
    }
}
