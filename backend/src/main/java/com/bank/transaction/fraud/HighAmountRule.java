package com.bank.transaction.fraud;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class HighAmountRule implements FraudRule {

    private final BigDecimal highAmountThreshold;
    private final BigDecimal criticalAmountThreshold;

    public HighAmountRule(
            @Value("${banking.fraud.high-amount-threshold:200000.00}") BigDecimal highAmountThreshold,
            @Value("${banking.fraud.critical-amount-threshold:500000.00}") BigDecimal criticalAmountThreshold) {
        this.highAmountThreshold = highAmountThreshold;
        this.criticalAmountThreshold = criticalAmountThreshold;
    }

    @Override
    public String getRuleName() {
        return "UNUSUALLY_LARGE_AMOUNT";
    }

    @Override
    public FraudRuleResult evaluate(FraudEvaluationContext context) {
        if (context.getAmount() == null) {
            return FraudRuleResult.pass();
        }

        if (context.getAmount().compareTo(criticalAmountThreshold) >= 0) {
            return FraudRuleResult.trigger(
                    getRuleName(),
                    65,
                    String.format("Critical transaction amount: ₹%s exceeds critical threshold of ₹%s",
                            context.getAmount().toPlainString(), criticalAmountThreshold.toPlainString())
            );
        }

        if (context.getAmount().compareTo(highAmountThreshold) >= 0) {
            return FraudRuleResult.trigger(
                    getRuleName(),
                    35,
                    String.format("Unusually large amount: ₹%s exceeds warning threshold of ₹%s",
                            context.getAmount().toPlainString(), highAmountThreshold.toPlainString())
            );
        }

        return FraudRuleResult.pass();
    }
}
