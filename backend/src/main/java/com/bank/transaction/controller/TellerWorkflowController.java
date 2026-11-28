package com.bank.transaction.controller;

import com.bank.transaction.dto.AccountResponse;
import com.bank.transaction.dto.ApiResponse;
import com.bank.transaction.dto.TransactionResponse;
import com.bank.transaction.dto.teller.*;
import com.bank.transaction.service.TellerOperationsService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/teller")
public class TellerWorkflowController {

    private final TellerOperationsService operationsService;

    public TellerWorkflowController(TellerOperationsService operationsService) {
        this.operationsService = operationsService;
    }

    @PostMapping("/profile/shift")
    @PreAuthorize("hasAuthority('PROFILE_VIEW')")
    public ResponseEntity<ApiResponse<TellerProfileResponse>> updateShift(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("shiftStatus", "ON_SHIFT");
        return ResponseEntity.ok(ApiResponse.ok("Shift status updated", operationsService.updateShiftStatus(user.getUsername(), status)));
    }

    @GetMapping("/customers")
    @PreAuthorize("hasAuthority('CUSTOMER_VIEW')")
    public ResponseEntity<ApiResponse<Page<TellerCustomerSummaryResponse>>> searchCustomers(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(name = "kycStatus", required = false) String kycStatus,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.searchCustomers(user.getUsername(), query, kycStatus, pageable)));
    }

    @GetMapping("/customers/{customerNumber}/history")
    @PreAuthorize("hasAuthority('CUSTOMER_VIEW')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCustomerHistory(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String customerNumber) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.getCustomerHistory(user.getUsername(), customerNumber)));
    }

    @PutMapping("/customers/{customerNumber}/kyc")
    @PreAuthorize("hasAuthority('KYC_VERIFY')")
    public ResponseEntity<ApiResponse<TellerCustomerSummaryResponse>> updateKycStatus(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String customerNumber,
            @RequestBody Map<String, String> body) {
        String kycStatus = body.getOrDefault("kycStatus", "VERIFIED");
        return ResponseEntity.ok(ApiResponse.ok("Customer KYC status updated",
                operationsService.updateKycStatus(user.getUsername(), customerNumber, kycStatus)));
    }

    @GetMapping("/accounts/{accountNumber}")
    @PreAuthorize("hasAuthority('ACCOUNT_VIEW')")
    public ResponseEntity<ApiResponse<AccountResponse>> getAccountDetails(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String accountNumber) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.getAccountDetails(user.getUsername(), accountNumber)));
    }

    @GetMapping("/accounts/{accountNumber}/statement")
    @PreAuthorize("hasAuthority('ACCOUNT_STATEMENT_VIEW')")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getAccountStatement(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String accountNumber,
            @RequestParam(name = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(
                operationsService.getAccountStatement(user.getUsername(), accountNumber, fromDate, toDate, pageable)));
    }

    @GetMapping("/cheques")
    @PreAuthorize("hasAuthority('CHEQUE_VIEW')")
    public ResponseEntity<ApiResponse<Page<ChequeResponse>>> listCheques(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(name = "status", required = false) String status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.listCheques(user.getUsername(), status, pageable)));
    }

    @PostMapping("/cheques")
    @PreAuthorize("hasAuthority('CHEQUE_DEPOSIT')")
    public ResponseEntity<ApiResponse<ChequeResponse>> registerCheque(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody ChequeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Cheque request registered", operationsService.registerCheque(user.getUsername(), request)));
    }

    @PostMapping("/cheques/{chequeRef}/status")
    @PreAuthorize("hasAnyAuthority('CHEQUE_DEPOSIT', 'CHEQUE_CLEAR')")
    public ResponseEntity<ApiResponse<ChequeResponse>> updateChequeStatus(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String chequeRef,
            @Valid @RequestBody ChequeStatusUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Cheque status updated",
                operationsService.updateChequeStatus(user.getUsername(), chequeRef, request)));
    }

    @GetMapping("/service-requests")
    @PreAuthorize("hasAuthority('SERVICE_REQUEST_CREATE')")
    public ResponseEntity<ApiResponse<Page<ServiceRequestResponse>>> listServiceRequests(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(name = "status", required = false) String status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.listServiceRequests(user.getUsername(), status, pageable)));
    }

    @PostMapping("/service-requests")
    @PreAuthorize("hasAuthority('SERVICE_REQUEST_CREATE')")
    public ResponseEntity<ApiResponse<ServiceRequestResponse>> createServiceRequest(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody ServiceRequestCreateDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Service request submitted", operationsService.createServiceRequest(user.getUsername(), request)));
    }

    @PostMapping("/service-requests/{requestId}/decision")
    @PreAuthorize("hasAuthority('APPROVAL_MANAGE')")
    public ResponseEntity<ApiResponse<ServiceRequestResponse>> decideServiceRequest(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String requestId,
            @Valid @RequestBody ApprovalDecisionRequest decision) {
        return ResponseEntity.ok(ApiResponse.ok("Service request decision recorded",
                operationsService.decideServiceRequest(user.getUsername(), requestId, decision)));
    }

    @GetMapping("/complaints")
    @PreAuthorize("hasAuthority('COMPLAINT_CREATE')")
    public ResponseEntity<ApiResponse<Page<ComplaintResponse>>> listComplaints(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(name = "status", required = false) String status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.listComplaints(user.getUsername(), status, pageable)));
    }

    @PostMapping("/complaints")
    @PreAuthorize("hasAuthority('COMPLAINT_CREATE')")
    public ResponseEntity<ApiResponse<ComplaintResponse>> createComplaint(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody ComplaintCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Customer complaint registered", operationsService.createComplaint(user.getUsername(), request)));
    }

    @PatchMapping("/complaints/{complaintId}")
    @PreAuthorize("hasAnyAuthority('COMPLAINT_CREATE', 'COMPLAINT_RESOLVE')")
    public ResponseEntity<ApiResponse<ComplaintResponse>> updateComplaint(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String complaintId,
            @RequestBody ComplaintUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Complaint updated",
                operationsService.updateComplaint(user.getUsername(), complaintId, request)));
    }

    @GetMapping("/approvals")
    @PreAuthorize("hasAnyAuthority('SERVICE_REQUEST_CREATE', 'APPROVAL_MANAGE', 'AUDIT_VIEW')")
    public ResponseEntity<ApiResponse<Page<ApprovalRequestResponse>>> listApprovals(
            @AuthenticationPrincipal UserDetails user,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.listApprovals(user.getUsername(), pageable)));
    }
}
