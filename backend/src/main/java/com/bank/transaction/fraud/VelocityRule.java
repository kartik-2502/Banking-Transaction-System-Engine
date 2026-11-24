package com.bank.transaction.fraud;

import com.bank.transaction.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

@Component
public class VelocityRule implements FraudRule {

    private final TransactionRepository transactionRepository;
    private final int velocityThreshold;
    private final int windowSeconds;

    public VelocityRule(
            TransactionRepository transactionRepository,
            @Value("${banking.fraud.velocity-threshold:3}") int velocityThreshold,
            @Value("${banking.fraud.velocity-window-seconds:60}") int windowSeconds) {
        this.transactionRepository = transactionRepository;
        this.velocityThreshold = velocityThreshold;
        this.windowSeconds = windowSeconds;
    }

    @Override
    public String getRuleName() {
        return "HIGH_VELOCITY_TRANSACTIONS";
    }

    @Override
    public FraudRuleResult evaluate(FraudEvaluationContext context) {
        Long accountId = context.getSourceAccount() != null
                ? context.getSourceAccount().getId()
                : (context.getDestinationAccount() != null ? context.getDestinationAccount().getId() : null);

        if (accountId == null) {
            return FraudRuleResult.pass();
        }

        OffsetDateTime since = OffsetDateTime.now().minusSeconds(windowSeconds);
        long count = transactionRepository.findRecentTransactionsForAccount(accountId, since).size();

        if (count >= velocityThreshold) {
            return FraudRuleResult.trigger(
                    getRuleName(),
                    40,
                    String.format("High transaction velocity: %d transactions detected in %d seconds (Threshold: %d)",
                            count, windowSeconds, velocityThreshold)
            );
        }

        return FraudRuleResult.pass();
    }
}
