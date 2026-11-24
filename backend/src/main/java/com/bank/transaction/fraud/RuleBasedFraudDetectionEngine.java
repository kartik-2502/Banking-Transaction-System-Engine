package com.bank.transaction.fraud;

import com.bank.transaction.model.FraudAlert;
import com.bank.transaction.model.RiskAssessment;
import com.bank.transaction.model.RiskLevel;
import com.bank.transaction.repository.FraudAlertRepository;
import com.bank.transaction.repository.RiskAssessmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class RuleBasedFraudDetectionEngine implements FraudDetectionEngine {

    private static final Logger log = LoggerFactory.getLogger(RuleBasedFraudDetectionEngine.class);

    private final List<FraudRule> rules;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final FraudAlertRepository fraudAlertRepository;

    public RuleBasedFraudDetectionEngine(List<FraudRule> rules,
                                         RiskAssessmentRepository riskAssessmentRepository,
                                         FraudAlertRepository fraudAlertRepository) {
        this.rules = rules;
        this.riskAssessmentRepository = riskAssessmentRepository;
        this.fraudAlertRepository = fraudAlertRepository;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public RiskAssessment evaluateTransaction(FraudEvaluationContext context) {
        int totalScore = 0;
        List<String> triggeredRules = new ArrayList<>();
        List<String> reasonDetails = new ArrayList<>();

        for (FraudRule rule : rules) {
            try {
                FraudRuleResult result = rule.evaluate(context);
                if (result.isTriggered()) {
                    totalScore += result.getRiskScore();
                    triggeredRules.add(result.getRuleName());
                    reasonDetails.add(result.getReason());
                    log.warn("Fraud rule triggered: {} [score=+{}, reason={}] for txnId: {}",
                            result.getRuleName(), result.getRiskScore(), result.getReason(), context.getTransactionId());
                }
            } catch (Exception ex) {
                log.error("Error evaluating fraud rule: {}", rule.getRuleName(), ex);
            }
        }

        // Clamp score between 0 and 100
        int finalScore = Math.min(100, Math.max(0, totalScore));
        RiskLevel riskLevel = calculateRiskLevel(finalScore);

        Long accountId = context.getSourceAccount() != null
                ? context.getSourceAccount().getId()
                : (context.getDestinationAccount() != null ? context.getDestinationAccount().getId() : null);

        String rulesCombined = triggeredRules.isEmpty() ? "NONE" : String.join(", ", triggeredRules);
        String detailsCombined = reasonDetails.isEmpty() ? "Normal transaction profile" : String.join(" | ", reasonDetails);

        RiskAssessment assessment = new RiskAssessment(
                context.getTransactionId(),
                accountId,
                finalScore,
                riskLevel,
                rulesCombined,
                detailsCombined
        );
        RiskAssessment savedAssessment = riskAssessmentRepository.save(assessment);

        // If risk is HIGH or CRITICAL, automatically raise a fraud alert for analyst review
        if (riskLevel == RiskLevel.HIGH || riskLevel == RiskLevel.CRITICAL) {
            FraudAlert alert = new FraudAlert(savedAssessment, context.getTransactionId(), accountId);
            fraudAlertRepository.save(alert);
            log.warn("🚨 High-risk transaction detected! Raised FRAUD_ALERT for txnId: {}, riskLevel: {}, score: {}",
                    context.getTransactionId(), riskLevel, finalScore);
        }

        return savedAssessment;
    }

    private RiskLevel calculateRiskLevel(int score) {
        if (score >= 80) return RiskLevel.CRITICAL;
        if (score >= 50) return RiskLevel.HIGH;
        if (score >= 25) return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }
}
