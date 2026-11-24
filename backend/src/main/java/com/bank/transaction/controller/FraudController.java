package com.bank.transaction.controller;

import com.bank.transaction.dto.ApiResponse;
import com.bank.transaction.dto.FraudAlertResponse;
import com.bank.transaction.dto.FraudAlertReviewRequest;
import com.bank.transaction.dto.FraudSummaryResponse;
import com.bank.transaction.model.FraudAlertStatus;
import com.bank.transaction.model.RiskAssessment;
import com.bank.transaction.service.FraudService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/fraud")
@PreAuthorize("hasAnyRole('RISK_ANALYST', 'ADMIN')")
public class FraudController {

    private final FraudService fraudService;

    public FraudController(FraudService fraudService) {
        this.fraudService = fraudService;
    }

    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<Page<FraudAlertResponse>>> getAlerts(
            @RequestParam(name = "status", required = false) FraudAlertStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<FraudAlertResponse> alerts = fraudService.getAlerts(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Fraud alerts retrieved", alerts));
    }

    @GetMapping("/alerts/{id}")
    public ResponseEntity<ApiResponse<FraudAlertResponse>> getAlertById(@PathVariable Long id) {
        FraudAlertResponse alert = fraudService.getAlertById(id);
        return ResponseEntity.ok(ApiResponse.ok("Fraud alert retrieved", alert));
    }

    @PutMapping("/alerts/{id}/review")
    public ResponseEntity<ApiResponse<FraudAlertResponse>> reviewAlert(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody FraudAlertReviewRequest request) {
        FraudAlertResponse alert = fraudService.reviewAlert(id, userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.ok("Fraud alert reviewed successfully", alert));
    }

    @GetMapping("/assessments/{transactionId}")
    public ResponseEntity<ApiResponse<RiskAssessment>> getAssessmentByTransactionId(@PathVariable String transactionId) {
        RiskAssessment assessment = fraudService.getAssessmentByTransactionId(transactionId);
        return ResponseEntity.ok(ApiResponse.ok("Risk assessment retrieved", assessment));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<FraudSummaryResponse>> getFraudSummary() {
        FraudSummaryResponse summary = fraudService.getFraudSummary();
        return ResponseEntity.ok(ApiResponse.ok("Fraud analytics summary retrieved", summary));
    }
}
