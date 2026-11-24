package com.bank.transaction.fraud;

import com.bank.transaction.model.TransactionType;
import com.bank.transaction.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

@Component
public class FrequentDestinationRule implements FraudRule {

    private final TransactionRepository transactionRepository;
    private final int destinationCountThreshold;
    private final int destinationWindowMinutes;

    public FrequentDestinationRule(
            TransactionRepository transactionRepository,
            @Value("${banking.fraud.frequent-dest-threshold:3}") int destinationCountThreshold,
            @Value("${banking.fraud.frequent-dest-window-minutes:5}") int destinationWindowMinutes) {
        this.transactionRepository = transactionRepository;
        this.destinationCountThreshold = destinationCountThreshold;
        this.destinationWindowMinutes = destinationWindowMinutes;
    }

    @Override
    public String getRuleName() {
        return "REPEATED_DESTINATION_TRANSFERS";
    }

    @Override
    public FraudRuleResult evaluate(FraudEvaluationContext context) {
        if (context.getTransactionType() != TransactionType.TRANSFER
                || context.getSourceAccount() == null
                || context.getDestinationAccount() == null) {
            return FraudRuleResult.pass();
        }

        OffsetDateTime since = OffsetDateTime.now().minusMinutes(destinationWindowMinutes);
        long count = transactionRepository.countRecentTransfersBetweenAccounts(
                context.getSourceAccount().getId(),
                context.getDestinationAccount().getId(),
                since
        );

        if (count >= destinationCountThreshold) {
            return FraudRuleResult.trigger(
                    getRuleName(),
                    35,
                    String.format("Rapid consecutive transfers: %d transfers between Account %s and %s in %d minutes",
                            count,
                            context.getSourceAccount().getAccountNumber(),
                            context.getDestinationAccount().getAccountNumber(),
                            destinationWindowMinutes)
            );
        }

        return FraudRuleResult.pass();
    }
}
