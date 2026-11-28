package com.bank.transaction.controller;

import com.bank.transaction.dto.ApiResponse;
import com.bank.transaction.dto.TransactionResponse;
import com.bank.transaction.dto.teller.*;
import com.bank.transaction.model.TransactionStatus;
import com.bank.transaction.model.TransactionType;
import com.bank.transaction.service.AdaptiveMfaService;
import com.bank.transaction.service.TellerAccessService;
import com.bank.transaction.service.TellerCashAndTransactionService;
import jakarta.servlet.http.HttpServletRequest;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teller")
public class TellerController {

    private final TellerAccessService accessService;
    private final TellerCashAndTransactionService cashTxService;

    public TellerController(TellerAccessService accessService,
                            TellerCashAndTransactionService cashTxService) {
        this.accessService = accessService;
        this.cashTxService = cashTxService;
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('TRANSACTION_VIEW') and hasAnyRole('TELLER', 'BANK_MANAGER', 'ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<TellerDashboardResponse>> getDashboard(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ApiResponse.ok("Teller dashboard loaded", cashTxService.getDashboard(user.getUsername())));
    }

    @GetMapping("/profile")
    @PreAuthorize("hasAuthority('PROFILE_VIEW')")
    public ResponseEntity<ApiResponse<TellerProfileResponse>> getProfile(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ApiResponse.ok(accessService.getProfileResponse(user.getUsername())));
    }

    @GetMapping("/drawer")
    @PreAuthorize("hasAuthority('CASH_RECONCILIATION')")
    public ResponseEntity<ApiResponse<TellerDrawerResponse>> getDrawer(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ApiResponse.ok(cashTxService.getCurrentDrawer(user.getUsername())));
    }

    @PostMapping("/drawer/open")
    @PreAuthorize("hasAuthority('CASH_RECONCILIATION')")
    public ResponseEntity<ApiResponse<TellerDrawerResponse>> openDrawer(@AuthenticationPrincipal UserDetails user,
                                                                        @RequestBody(required = false) Map<String, BigDecimal> body) {
        BigDecimal opening = (body != null && body.get("openingBalance") != null)
                ? body.get("openingBalance") : new BigDecimal("250000.00");
        return ResponseEntity.ok(ApiResponse.ok("Cash drawer opened", cashTxService.openDrawer(user.getUsername(), opening)));
    }

    @PostMapping("/drawer/adjust")
    @PreAuthorize("hasAuthority('CASH_RECONCILIATION')")
    public ResponseEntity<ApiResponse<TellerDrawerResponse>> adjustDrawer(@AuthenticationPrincipal UserDetails user,
                                                                          @Valid @RequestBody CashAdjustmentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Drawer adjustment recorded", cashTxService.adjustDrawer(user.getUsername(), request)));
    }

    @PostMapping("/drawer/reconcile")
    @PreAuthorize("hasAuthority('CASH_RECONCILIATION')")
    public ResponseEntity<ApiResponse<CashReconciliationResponse>> reconcileDrawer(@AuthenticationPrincipal UserDetails user,
                                                                                 @Valid @RequestBody CashReconciliationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("EOD cash reconciliation submitted", cashTxService.submitReconciliation(user.getUsername(), request)));
    }

    @GetMapping("/drawer/reconciliations")
    @PreAuthorize("hasAnyAuthority('CASH_RECONCILIATION', 'CASH_RECONCILIATION_VERIFY')")
    public ResponseEntity<ApiResponse<List<CashReconciliationResponse>>> listReconciliations(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ApiResponse.ok(cashTxService.listReconciliations(user.getUsername())));
    }

    @PostMapping("/drawer/reconciliations/{reconciliationId}/verify")
    @PreAuthorize("hasAuthority('CASH_RECONCILIATION_VERIFY')")
    public ResponseEntity<ApiResponse<CashReconciliationResponse>> verifyReconciliation(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String reconciliationId,
            @Valid @RequestBody ApprovalDecisionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Cash reconciliation reviewed",
                cashTxService.verifyReconciliation(user.getUsername(), reconciliationId, request)));
    }

    @PostMapping("/cash/deposit")
    @PreAuthorize("hasAuthority('CASH_DEPOSIT')")
    public ResponseEntity<ApiResponse<TransactionResponse>> cashDeposit(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody TellerCashOperationRequest request) {
        TransactionResponse res = cashTxService.processCashDeposit(user.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Cash deposit completed", res));
    }

    @PostMapping("/cash/withdrawal")
    @PreAuthorize("hasAuthority('CASH_WITHDRAWAL')")
    public ResponseEntity<ApiResponse<TransactionResponse>> cashWithdrawal(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody TellerCashOperationRequest request) {
        TransactionResponse res = cashTxService.processCashWithdrawal(user.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Cash withdrawal completed", res));
    }

    @PostMapping("/transfers")
    @PreAuthorize("hasAuthority('FUND_TRANSFER_INITIATE')")
    public ResponseEntity<ApiResponse<TransactionResponse>> fundTransfer(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody TellerTransferRequest request,
            HttpServletRequest httpRequest) {
        String fwd = httpRequest.getHeader("X-Forwarded-For");
        String ip = (fwd != null && !fwd.isBlank()) ? fwd.split(",")[0].trim() : httpRequest.getRemoteAddr();
        String fp = request.getDeviceFingerprint() != null ? request.getDeviceFingerprint() : httpRequest.getHeader("X-Device-Fingerprint");
        AdaptiveMfaService.ClientContext ctx = new AdaptiveMfaService.ClientContext(
                ip, httpRequest.getHeader("User-Agent"), fp, null, null, null, null);
        TransactionResponse res = cashTxService.processTellerTransfer(user.getUsername(), request, ctx);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Transfer processed", res));
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasAuthority('TRANSACTION_VIEW')")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> searchTransactions(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(name = "type", required = false) TransactionType type,
            @RequestParam(name = "status", required = false) TransactionStatus status,
            @RequestParam(name = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(
                cashTxService.searchTransactions(user.getUsername(), query, type, status, fromDate, toDate, pageable)));
    }

    @PostMapping("/transactions/{transactionId}/reversal-request")
    @PreAuthorize("hasAuthority('TRANSACTION_VIEW')")
    public ResponseEntity<ApiResponse<ReversalResponse>> requestReversal(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String transactionId,
            @Valid @RequestBody ReversalCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Reversal request submitted for supervisor approval",
                        cashTxService.requestReversal(user.getUsername(), transactionId, request)));
    }

    @GetMapping("/reversals")
    @PreAuthorize("hasAuthority('TRANSACTION_VIEW')")
    public ResponseEntity<ApiResponse<Page<ReversalResponse>>> listReversals(
            @AuthenticationPrincipal UserDetails user,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(cashTxService.listReversals(user.getUsername(), pageable)));
    }

    @PostMapping("/reversals/{reversalId}/decision")
    @PreAuthorize("hasAuthority('REVERSAL_APPROVE')")
    public ResponseEntity<ApiResponse<ReversalResponse>> decideReversal(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String reversalId,
            @Valid @RequestBody ApprovalDecisionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Reversal decision processed",
                cashTxService.decideReversal(user.getUsername(), reversalId, request)));
    }

    @GetMapping("/reports/daily")
    @PreAuthorize("hasAuthority('DAILY_REPORT_VIEW')")
    public ResponseEntity<ApiResponse<DailyReportResponse>> getDailyReport(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(name = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.ok(cashTxService.getDailyReport(user.getUsername(), date)));
    }

    @GetMapping("/reports/export/csv")
    @PreAuthorize("hasAuthority('DAILY_REPORT_VIEW')")
    public ResponseEntity<String> exportCsv(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(name = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        String csv = cashTxService.exportDailyReportCsv(user.getUsername(), date);
        String filename = "teller_daily_report_" + (date != null ? date : LocalDate.now()) + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }
}
