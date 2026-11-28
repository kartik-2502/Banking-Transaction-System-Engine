package com.bank.transaction.controller;

import com.bank.transaction.dto.ApiResponse;
import com.bank.transaction.dto.loan.*;
import com.bank.transaction.model.LoanStatus;
import com.bank.transaction.service.LoanServicingService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loan-officer")
public class LoanServicingController {

    private final LoanServicingService servicingService;

    public LoanServicingController(LoanServicingService servicingService) {
        this.servicingService = servicingService;
    }

    @GetMapping("/disbursements")
    @PreAuthorize("hasAuthority('LOAN_DISBURSEMENT_VIEW')")
    public ResponseEntity<ApiResponse<Page<LoanDisbursementDto>>> listDisbursements(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(name = "status", required = false) String status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(servicingService.listDisbursements(user.getUsername(), status, pageable)));
    }

    @PostMapping("/applications/{loanId}/disbursement-initiate")
    @PreAuthorize("hasAuthority('LOAN_DISBURSEMENT_INITIATE')")
    public ResponseEntity<ApiResponse<LoanDisbursementDto>> initiateDisbursement(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String loanId,
            @RequestBody LoanDisbursementDto.InitiateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Disbursement request initiated",
                        servicingService.initiateDisbursement(user.getUsername(), loanId, request)));
    }

    @PostMapping("/disbursements/{disbursementId}/authorize")
    @PreAuthorize("hasAuthority('LOAN_DISBURSEMENT_APPROVE')")
    public ResponseEntity<ApiResponse<LoanDisbursementDto>> authorizeDisbursement(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String disbursementId,
            @RequestBody Map<String, Object> body) {
        boolean approved = Boolean.TRUE.equals(body.get("approved"));
        String remarks = body.get("remarks") != null ? String.valueOf(body.get("remarks")) : null;
        return ResponseEntity.ok(ApiResponse.ok("Disbursement decision executed",
                servicingService.executeOrRejectDisbursement(user.getUsername(), disbursementId, approved, remarks)));
    }

    @GetMapping("/repayments/{loanId}")
    @PreAuthorize("hasAuthority('LOAN_REPAYMENT_VIEW')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRepayments(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String loanId) {
        return ResponseEntity.ok(ApiResponse.ok(servicingService.getRepaymentDetails(user.getUsername(), loanId)));
    }

    @GetMapping("/overdue")
    @PreAuthorize("hasAuthority('LOAN_OVERDUE_MANAGE')")
    public ResponseEntity<ApiResponse<List<LoanOverdueDto>>> listOverdue(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ApiResponse.ok(servicingService.getOverdueLoans(user.getUsername())));
    }

    @PostMapping("/overdue/{loanId}/follow-up")
    @PreAuthorize("hasAuthority('LOAN_OVERDUE_MANAGE')")
    public ResponseEntity<ApiResponse<LoanOverdueDto.FollowUpDto>> logFollowUp(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String loanId,
            @Valid @RequestBody LoanOverdueDto.CreateFollowUpRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Follow-up logged", servicingService.logFollowUp(user.getUsername(), loanId, request)));
    }

    @GetMapping("/overdue/follow-ups")
    @PreAuthorize("hasAuthority('LOAN_OVERDUE_MANAGE')")
    public ResponseEntity<ApiResponse<Page<LoanOverdueDto.FollowUpDto>>> listFollowUps(
            @AuthenticationPrincipal UserDetails user,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(servicingService.listFollowUps(user.getUsername(), pageable)));
    }

    @GetMapping("/portfolio")
    @PreAuthorize("hasAuthority('LOAN_PORTFOLIO_VIEW')")
    public ResponseEntity<ApiResponse<LoanPortfolioDto>> getPortfolio(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(name = "category", required = false) String category) {
        return ResponseEntity.ok(ApiResponse.ok(servicingService.getPortfolioAnalytics(user.getUsername(), category)));
    }

    @GetMapping("/communications")
    @PreAuthorize("hasAuthority('LOAN_CUSTOMER_COMMUNICATE')")
    public ResponseEntity<ApiResponse<Page<LoanCommunicationDto>>> listCommunications(
            @AuthenticationPrincipal UserDetails user,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(servicingService.listCommunications(user.getUsername(), pageable)));
    }

    @PostMapping("/communications")
    @PreAuthorize("hasAuthority('LOAN_CUSTOMER_COMMUNICATE')")
    public ResponseEntity<ApiResponse<LoanCommunicationDto>> sendCommunication(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody LoanCommunicationDto.SendRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Customer communication sent and logged",
                        servicingService.sendCustomerCommunication(user.getUsername(), request)));
    }

    @GetMapping("/reports")
    @PreAuthorize("hasAuthority('LOAN_REPORT_VIEW')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReport(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(name = "reportType", required = false) String reportType,
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "status", required = false) LoanStatus status,
            @RequestParam(name = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @PageableDefault(size = 25) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(servicingService.buildReport(
                user.getUsername(), reportType, category, status, fromDate, toDate, pageable)));
    }

    @GetMapping("/reports/export/csv")
    @PreAuthorize("hasAuthority('LOAN_REPORT_VIEW')")
    public ResponseEntity<String> exportReportCsv(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(name = "reportType", required = false) String reportType,
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "status", required = false) LoanStatus status) {
        String csv = servicingService.exportReportCsv(user.getUsername(), reportType, category, status);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"loan_officer_report_" + LocalDate.now() + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }
}
