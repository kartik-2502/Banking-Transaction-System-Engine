package com.bank.transaction.fraud;

import com.bank.transaction.repository.FailedTransactionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

@Component
public class RapidRepeatedFailuresRule implements FraudRule {

    private final FailedTransactionRepository failedTransactionRepository;
    private final int failureCountThreshold;
    private final int failureWindowMinutes;

    public RapidRepeatedFailuresRule(
            FailedTransactionRepository failedTransactionRepository,
            @Value("${banking.fraud.failure-count-threshold:3}") int failureCountThreshold,
            @Value("${banking.fraud.failure-window-minutes:10}") int failureWindowMinutes) {
        this.failedTransactionRepository = failedTransactionRepository;
        this.failureCountThreshold = failureCountThreshold;
        this.failureWindowMinutes = failureWindowMinutes;
    }

    @Override
    public String getRuleName() {
        return "REPEATED_FAILED_TRANSACTIONS";
    }

    @Override
    public FraudRuleResult evaluate(FraudEvaluationContext context) {
        Long accountId = context.getSourceAccount() != null
                ? context.getSourceAccount().getId()
                : null;

        if (accountId == null) {
            return FraudRuleResult.pass();
        }

        OffsetDateTime since = OffsetDateTime.now().minusMinutes(failureWindowMinutes);
        long failedCount = failedTransactionRepository.countRecentFailuresForAccount(accountId, since);

        if (failedCount >= failureCountThreshold) {
            return FraudRuleResult.trigger(
                    getRuleName(),
                    45,
                    String.format("Suspicious repeated failures: %d failed transaction attempts within the last %d minutes",
                            failedCount, failureWindowMinutes)
            );
        }

        return FraudRuleResult.pass();
    }
}
