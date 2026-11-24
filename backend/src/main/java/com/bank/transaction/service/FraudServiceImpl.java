package com.bank.transaction.service;

import com.bank.transaction.dto.FraudAlertResponse;
import com.bank.transaction.dto.FraudAlertReviewRequest;
import com.bank.transaction.dto.FraudSummaryResponse;
import com.bank.transaction.exception.InvalidTransactionException;
import com.bank.transaction.model.FraudAlert;
import com.bank.transaction.model.FraudAlertStatus;
import com.bank.transaction.model.RiskAssessment;
import com.bank.transaction.model.RiskLevel;
import com.bank.transaction.repository.FraudAlertRepository;
import com.bank.transaction.repository.RiskAssessmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
public class FraudServiceImpl implements FraudService {

    private static final Logger log = LoggerFactory.getLogger(FraudServiceImpl.class);

    private final FraudAlertRepository fraudAlertRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;

    public FraudServiceImpl(FraudAlertRepository fraudAlertRepository,
                            RiskAssessmentRepository riskAssessmentRepository) {
        this.fraudAlertRepository = fraudAlertRepository;
        this.riskAssessmentRepository = riskAssessmentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FraudAlertResponse> getAlerts(FraudAlertStatus status, Pageable pageable) {
        if (status != null) {
            return fraudAlertRepository.findByStatus(status, pageable).map(this::mapToResponse);
        }
        return fraudAlertRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public FraudAlertResponse getAlertById(Long alertId) {
        return fraudAlertRepository.findById(alertId)
                .map(this::mapToResponse)
                .orElseThrow(() -> new InvalidTransactionException("Fraud alert not found with ID: " + alertId));
    }

    @Override
    @Transactional
    public FraudAlertResponse reviewAlert(Long alertId, String reviewerUsername, FraudAlertReviewRequest request) {
        log.info("Analyst '{}' reviewing fraud alert ID {}: status={}, notes={}",
                reviewerUsername, alertId, request.getStatus(), request.getReviewerNotes());

        FraudAlert alert = fraudAlertRepository.findById(alertId)
                .orElseThrow(() -> new InvalidTransactionException("Fraud alert not found with ID: " + alertId));

        alert.setStatus(request.getStatus());
        alert.setReviewerNotes(request.getReviewerNotes());
        alert.setResolvedBy(reviewerUsername);
        if (request.getStatus() == FraudAlertStatus.RESOLVED || request.getStatus() == FraudAlertStatus.DISMISSED) {
            alert.setResolvedAt(OffsetDateTime.now());
        }

        FraudAlert updated = fraudAlertRepository.save(alert);
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public RiskAssessment getAssessmentByTransactionId(String transactionId) {
        return riskAssessmentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new InvalidTransactionException("Risk assessment not found for transaction: " + transactionId));
    }

    @Override
    @Transactional(readOnly = true)
    public FraudSummaryResponse getFraudSummary() {
        FraudSummaryResponse summary = new FraudSummaryResponse();
        summary.setTotalAlerts(fraudAlertRepository.count());
        summary.setNewAlerts(fraudAlertRepository.countByStatus(FraudAlertStatus.NEW));
        summary.setUnderReviewAlerts(fraudAlertRepository.countByStatus(FraudAlertStatus.UNDER_REVIEW));
        summary.setResolvedAlerts(fraudAlertRepository.countByStatus(FraudAlertStatus.RESOLVED));
        summary.setDismissedAlerts(fraudAlertRepository.countByStatus(FraudAlertStatus.DISMISSED));

        summary.setLowRiskAssessments(riskAssessmentRepository.countByRiskLevel(RiskLevel.LOW));
        summary.setMediumRiskAssessments(riskAssessmentRepository.countByRiskLevel(RiskLevel.MEDIUM));
        summary.setHighRiskAssessments(riskAssessmentRepository.countByRiskLevel(RiskLevel.HIGH));
        summary.setCriticalRiskAssessments(riskAssessmentRepository.countByRiskLevel(RiskLevel.CRITICAL));

        return summary;
    }

    private FraudAlertResponse mapToResponse(FraudAlert alert) {
        FraudAlertResponse res = new FraudAlertResponse();
        res.setId(alert.getId());
        res.setTransactionId(alert.getTransactionId());
        res.setAccountId(alert.getAccountId());
        res.setStatus(alert.getStatus());
        res.setReviewerNotes(alert.getReviewerNotes());
        res.setResolvedBy(alert.getResolvedBy());
        res.setCreatedAt(alert.getCreatedAt());
        res.setResolvedAt(alert.getResolvedAt());

        if (alert.getRiskAssessment() != null) {
            res.setRiskScore(alert.getRiskAssessment().getRiskScore());
            res.setRiskLevel(alert.getRiskAssessment().getRiskLevel());
            res.setTriggeredRule(alert.getRiskAssessment().getTriggeredRule());
            res.setDetails(alert.getRiskAssessment().getDetails());
        }
        return res;
    }
}
