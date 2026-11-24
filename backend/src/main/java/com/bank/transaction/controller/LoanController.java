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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
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
            @RequestParam(name = "search", required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<LoanResponse> loans = loanService.getLoans(status, search, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Loans retrieved successfully", loans));
    }

    @GetMapping("/dashboard/stats")
    @PreAuthorize("hasAnyRole('LOAN_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<LoanOfficerDashboardStats>> getDashboardStats() {
        LoanOfficerDashboardStats stats = loanService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.ok("Loan officer dashboard statistics retrieved", stats));
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
            Authentication authentication,
            @RequestBody LoanReviewRequest request) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        LoanResponse response = loanService.reviewLoan(loanId, userDetails.getUsername(), isAdmin, request);
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

    @PostMapping("/{loanId}/repay")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'LOAN_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<LoanResponse>> repayInstallment(
            @PathVariable String loanId,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody LoanRepaymentRequest request) {
        LoanResponse response = loanService.repayInstallment(loanId, userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.ok("Loan repayment processed successfully", response));
    }

    @GetMapping("/{loanId}/schedule")
    @PreAuthorize("hasAnyRole('LOAN_OFFICER', 'ADMIN', 'CUSTOMER')")
    public ResponseEntity<ApiResponse<List<LoanRepaymentScheduleResponse>>> getRepaymentSchedule(
            @PathVariable String loanId) {
        List<LoanRepaymentScheduleResponse> schedule = loanService.getRepaymentSchedule(loanId);
        return ResponseEntity.ok(ApiResponse.ok("Repayment schedule retrieved successfully", schedule));
    }

    @GetMapping("/{loanId}/history")
    @PreAuthorize("hasAnyRole('LOAN_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<LoanStatusHistoryResponse>>> getLoanHistory(
            @PathVariable String loanId) {
        List<LoanStatusHistoryResponse> history = loanService.getLoanStatusHistory(loanId);
        return ResponseEntity.ok(ApiResponse.ok("Loan status audit history retrieved successfully", history));
    }

    @PostMapping("/eligibility-check")
    @PreAuthorize("hasAnyRole('LOAN_OFFICER', 'ADMIN', 'CUSTOMER')")
    public ResponseEntity<ApiResponse<LoanEligibilityAssessmentResponse>> checkEligibility(
            @RequestParam BigDecimal monthlyIncome,
            @RequestParam(required = false, defaultValue = "0") BigDecimal existingMonthlyDebt,
            @RequestParam BigDecimal amount,
            @RequestParam(required = false, defaultValue = "12") Integer termMonths,
            @RequestParam(required = false, defaultValue = "700") Integer creditScore) {
        LoanEligibilityAssessmentResponse assessment = loanService.assessEligibility(
                monthlyIncome, existingMonthlyDebt, amount, termMonths, creditScore);
        return ResponseEntity.ok(ApiResponse.ok("Eligibility assessment completed", assessment));
    }
}
