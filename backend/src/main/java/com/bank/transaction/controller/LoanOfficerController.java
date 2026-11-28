package com.bank.transaction.controller;

import com.bank.transaction.dto.ApiResponse;
import com.bank.transaction.dto.loan.*;
import com.bank.transaction.model.LoanStatus;
import com.bank.transaction.service.LoanDocumentService;
import com.bank.transaction.service.LoanServicingService;
import com.bank.transaction.service.LoanUnderwritingService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
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
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loan-officer")
public class LoanOfficerController {

    private final LoanServicingService servicingService;
    private final LoanUnderwritingService underwritingService;
    private final LoanDocumentService documentService;

    public LoanOfficerController(LoanServicingService servicingService,
                                 LoanUnderwritingService underwritingService,
                                 LoanDocumentService documentService) {
        this.servicingService = servicingService;
        this.underwritingService = underwritingService;
        this.documentService = documentService;
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('LOAN_DASHBOARD_VIEW')")
    public ResponseEntity<ApiResponse<LoanOfficerDashboardResponse>> getDashboard(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ApiResponse.ok("Loan Officer dashboard loaded", servicingService.getDashboard(user.getUsername())));
    }

    @GetMapping("/profile")
    @PreAuthorize("hasAuthority('LOAN_PROFILE_VIEW')")
    public ResponseEntity<ApiResponse<LoanOfficerProfileDto>> getProfile(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ApiResponse.ok(servicingService.getOfficerProfile(user.getUsername())));
    }

    @PostMapping("/profile/shift")
    @PreAuthorize("hasAuthority('LOAN_PROFILE_VIEW')")
    public ResponseEntity<ApiResponse<LoanOfficerProfileDto>> updateShift(@AuthenticationPrincipal UserDetails user,
                                                                          @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("Shift updated",
                servicingService.updateShiftStatus(user.getUsername(), body.getOrDefault("shiftStatus", "ON_SHIFT"))));
    }

    @GetMapping("/customers")
    @PreAuthorize("hasAuthority('LOAN_CUSTOMER_VIEW')")
    public ResponseEntity<ApiResponse<Page<LoanOfficerCustomerDto>>> searchCustomers(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(name = "kycStatus", required = false) String kycStatus,
            @PageableDefault(size = 15) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(underwritingService.searchCustomers(user.getUsername(), query, kycStatus, pageable)));
    }

    @GetMapping("/customers/{customerNumber}")
    @PreAuthorize("hasAuthority('LOAN_CUSTOMER_VIEW')")
    public ResponseEntity<ApiResponse<LoanOfficerCustomerDto>> getCustomerProfile(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String customerNumber) {
        return ResponseEntity.ok(ApiResponse.ok(underwritingService.getCustomerProfile(user.getUsername(), customerNumber)));
    }

    @GetMapping("/applications")
    @PreAuthorize("hasAuthority('LOAN_APPLICATION_VIEW')")
    public ResponseEntity<ApiResponse<Page<LoanApplicationSummaryDto>>> searchApplications(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(name = "status", required = false) LoanStatus status,
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "minAmount", required = false) BigDecimal minAmount,
            @RequestParam(name = "maxAmount", required = false) BigDecimal maxAmount,
            @RequestParam(name = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(name = "assignedOnly", defaultValue = "false") boolean assignedOnly,
            @PageableDefault(size = 15) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(underwritingService.searchApplications(
                user.getUsername(), status, category, q, minAmount, maxAmount, fromDate, toDate, assignedOnly, pageable)));
    }

    @PostMapping("/applications")
    @PreAuthorize("hasAuthority('LOAN_APPLICATION_CREATE')")
    public ResponseEntity<ApiResponse<LoanApplicationSummaryDto>> createApplication(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody LoanApplicationSummaryDto.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Loan application created", underwritingService.createApplication(user.getUsername(), request)));
    }

    @GetMapping("/applications/{loanId}/workspace")
    @PreAuthorize("hasAuthority('LOAN_APPLICATION_VIEW')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getWorkspace(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String loanId) {
        return ResponseEntity.ok(ApiResponse.ok(underwritingService.getApplicationWorkspace(user.getUsername(), loanId)));
    }

    @PutMapping("/applications/{loanId}")
    @PreAuthorize("hasAuthority('LOAN_APPLICATION_UPDATE')")
    public ResponseEntity<ApiResponse<LoanApplicationSummaryDto>> updateApplication(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String loanId,
            @RequestBody LoanApplicationSummaryDto.UpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Loan application updated",
                underwritingService.updateApplication(user.getUsername(), loanId, request)));
    }

    @PostMapping("/applications/{loanId}/assign")
    @PreAuthorize("hasAuthority('LOAN_APPLICATION_UPDATE')")
    public ResponseEntity<ApiResponse<LoanApplicationSummaryDto>> assignApplication(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String loanId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("Application assigned",
                underwritingService.assignApplication(user.getUsername(), loanId, body.get("officerUsername"))));
    }

    @PostMapping("/applications/{loanId}/stage")
    @PreAuthorize("hasAuthority('LOAN_PROCESSING_MANAGE')")
    public ResponseEntity<ApiResponse<LoanApplicationSummaryDto>> transitionStage(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String loanId,
            @RequestBody Map<String, String> body) {
        LoanStatus target = LoanStatus.valueOf(body.get("status").trim().toUpperCase());
        return ResponseEntity.ok(ApiResponse.ok("Application stage updated",
                underwritingService.transitionStage(user.getUsername(), loanId, target, body.get("remarks"))));
    }

    @GetMapping("/documents")
    @PreAuthorize("hasAuthority('LOAN_DOCUMENT_VIEW')")
    public ResponseEntity<ApiResponse<Page<LoanDocumentDto>>> listDocuments(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(name = "status", required = false) String status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(documentService.listDocuments(user.getUsername(), status, pageable)));
    }

    @GetMapping("/applications/{loanId}/documents")
    @PreAuthorize("hasAuthority('LOAN_DOCUMENT_VIEW')")
    public ResponseEntity<ApiResponse<List<LoanDocumentDto>>> listLoanDocuments(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String loanId) {
        return ResponseEntity.ok(ApiResponse.ok(documentService.listDocumentsForLoan(user.getUsername(), loanId)));
    }

    @PostMapping(value = "/applications/{loanId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyAuthority('LOAN_APPLICATION_CREATE', 'LOAN_DOCUMENT_VIEW') or hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<LoanDocumentDto>> uploadDocument(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String loanId,
            @RequestParam("documentType") String documentType,
            @RequestParam("file") MultipartFile file,
            @RequestParam(name = "expiryDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate expiryDate,
            @RequestParam(name = "remarks", required = false) String remarks) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Loan document uploaded",
                        documentService.uploadDocument(user.getUsername(), loanId, documentType, file, expiryDate, remarks)));
    }

    @PostMapping("/documents/{documentId}/verify")
    @PreAuthorize("hasAnyAuthority('LOAN_DOCUMENT_VERIFY', 'LOAN_DOCUMENT_REJECT')")
    public ResponseEntity<ApiResponse<LoanDocumentDto>> verifyDocument(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String documentId,
            @Valid @RequestBody LoanDocumentDto.VerifyDecisionRequest decision) {
        return ResponseEntity.ok(ApiResponse.ok("Document verification updated",
                documentService.verifyOrRejectDocument(user.getUsername(), documentId, decision)));
    }

    @GetMapping("/documents/{documentId}/download")
    @PreAuthorize("hasAuthority('LOAN_DOCUMENT_VIEW') or hasRole('CUSTOMER')")
    public ResponseEntity<Resource> downloadDocument(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String documentId) {
        LoanDocumentService.DocumentResourceResult res = documentService.loadDocumentResource(user.getUsername(), documentId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + res.document().getFileName() + "\"")
                .contentType(MediaType.parseMediaType(res.document().getContentType()))
                .body(res.resource());
    }

    @PostMapping("/assessments/simulate")
    @PreAuthorize("hasAuthority('LOAN_CREDIT_ASSESS')")
    public ResponseEntity<ApiResponse<LoanCreditAssessmentDto>> simulateAssessment(
            @Valid @RequestBody LoanCreditAssessmentDto.AssessRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Credit calculation completed",
                underwritingService.computeCreditMetrics(null, request)));
    }

    @PostMapping("/applications/{loanId}/credit-assessment")
    @PreAuthorize("hasAuthority('LOAN_CREDIT_ASSESS')")
    public ResponseEntity<ApiResponse<LoanCreditAssessmentDto>> assessLoan(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String loanId,
            @Valid @RequestBody LoanCreditAssessmentDto.AssessRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Credit assessment saved",
                        underwritingService.performCreditAssessment(user.getUsername(), loanId, request)));
    }

    @PostMapping("/applications/{loanId}/recommend")
    @PreAuthorize("hasAuthority('LOAN_APPROVAL_RECOMMEND')")
    public ResponseEntity<ApiResponse<LoanApprovalDto>> submitRecommendation(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String loanId,
            @Valid @RequestBody LoanApprovalDto.RecommendRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Approval recommendation submitted",
                        underwritingService.submitRecommendation(user.getUsername(), loanId, request)));
    }

    @GetMapping("/approvals")
    @PreAuthorize("hasAuthority('LOAN_APPROVAL_VIEW')")
    public ResponseEntity<ApiResponse<Page<LoanApprovalDto>>> listApprovals(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(name = "status", required = false) String status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(underwritingService.listApprovals(user.getUsername(), status, pageable)));
    }

    @PostMapping("/approvals/{approvalId}/decision")
    @PreAuthorize("hasAuthority('LOAN_FINAL_APPROVE')")
    public ResponseEntity<ApiResponse<LoanApprovalDto>> decideApproval(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String approvalId,
            @Valid @RequestBody LoanApprovalDto.DecisionRequest decision) {
        return ResponseEntity.ok(ApiResponse.ok("Loan approval decision recorded",
                underwritingService.decideApproval(user.getUsername(), approvalId, decision)));
    }
}
