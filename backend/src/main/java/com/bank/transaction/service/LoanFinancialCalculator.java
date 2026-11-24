package com.bank.transaction.service;

import com.bank.transaction.dto.LoanEligibilityAssessmentResponse;
import com.bank.transaction.model.Loan;
import com.bank.transaction.model.LoanRepaymentSchedule;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
public class LoanFinancialCalculator {

    private static final MathContext MC = new MathContext(10, RoundingMode.HALF_UP);

    /**
     * Calculates Equated Monthly Installment (EMI) using standard reducing balance formula:
     * EMI = [P * r * (1+r)^n] / [(1+r)^n - 1]
     */
    public BigDecimal calculateMonthlyEmi(BigDecimal principal, BigDecimal annualInterestRate, int termMonths) {
        if (principal == null || principal.compareTo(BigDecimal.ZERO) <= 0 || termMonths <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        if (annualInterestRate == null || annualInterestRate.compareTo(BigDecimal.ZERO) == 0) {
            return principal.divide(BigDecimal.valueOf(termMonths), 2, RoundingMode.HALF_UP);
        }

        // Monthly interest rate r = (annualRate / 100) / 12
        BigDecimal monthlyRate = annualInterestRate.divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);

        // (1 + r)^n
        BigDecimal onePlusRPowN = BigDecimal.ONE.add(monthlyRate).pow(termMonths, MC);

        // Numerator = P * r * (1 + r)^n
        BigDecimal numerator = principal.multiply(monthlyRate, MC).multiply(onePlusRPowN, MC);

        // Denominator = (1 + r)^n - 1
        BigDecimal denominator = onePlusRPowN.subtract(BigDecimal.ONE);

        return numerator.divide(denominator, 2, RoundingMode.HALF_UP);
    }

    /**
     * Calculates Debt-To-Income (DTI) ratio percentage:
     * DTI = ((existingMonthlyDebt + newEmi) / monthlyIncome) * 100
     */
    public BigDecimal calculateDtiRatio(BigDecimal monthlyIncome, BigDecimal existingMonthlyDebt, BigDecimal newEmi) {
        if (monthlyIncome == null || monthlyIncome.compareTo(BigDecimal.ZERO) <= 0) {
            return new BigDecimal("100.00");
        }

        BigDecimal existing = existingMonthlyDebt != null ? existingMonthlyDebt : BigDecimal.ZERO;
        BigDecimal emi = newEmi != null ? newEmi : BigDecimal.ZERO;
        BigDecimal totalDebt = existing.add(emi);

        return totalDebt.multiply(BigDecimal.valueOf(100)).divide(monthlyIncome, 2, RoundingMode.HALF_UP);
    }

    /**
     * Evaluates loan applicant eligibility, credit tier, and repayment capacity.
     */
    public LoanEligibilityAssessmentResponse assessEligibility(BigDecimal monthlyIncome,
                                                               BigDecimal existingMonthlyDebt,
                                                               BigDecimal principal,
                                                               BigDecimal annualInterestRate,
                                                               int termMonths,
                                                               int creditScore) {
        BigDecimal income = monthlyIncome != null ? monthlyIncome : BigDecimal.ZERO;
        BigDecimal debt = existingMonthlyDebt != null ? existingMonthlyDebt : BigDecimal.ZERO;
        BigDecimal emi = calculateMonthlyEmi(principal, annualInterestRate, termMonths);
        BigDecimal dti = calculateDtiRatio(income, debt, emi);

        // Maximum total debt allowable is 50% of gross monthly income
        BigDecimal maxDebtCapacity = income.multiply(new BigDecimal("0.50")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal maxAllowableEmi = maxDebtCapacity.subtract(debt).max(BigDecimal.ZERO);

        String riskGrade;
        if (creditScore >= 750 && dti.compareTo(new BigDecimal("40.00")) <= 0) {
            riskGrade = "PRIME";
        } else if (creditScore >= 650 && dti.compareTo(new BigDecimal("50.00")) <= 0) {
            riskGrade = "NEAR_PRIME";
        } else {
            riskGrade = "SUBPRIME";
        }

        boolean eligible = creditScore >= 620
                && dti.compareTo(new BigDecimal("50.00")) <= 0
                && emi.compareTo(maxAllowableEmi) <= 0;

        String recommendation;
        if (eligible && "PRIME".equals(riskGrade)) {
            recommendation = "Highly Recommended: Applicant exhibits exceptional creditworthiness and low debt burden.";
        } else if (eligible) {
            recommendation = "Conditionally Approved: Applicant meets standard underwriting parameters. Recommend standard verification.";
        } else if (creditScore < 620) {
            recommendation = "Declined: Credit score (" + creditScore + ") below statutory retail underwriting threshold of 620.";
        } else {
            recommendation = "Declined: Projected DTI (" + dti + "%) exceeds maximum allowable threshold of 50.00%.";
        }

        return new LoanEligibilityAssessmentResponse(
                eligible,
                creditScore,
                income,
                debt,
                emi,
                maxAllowableEmi,
                dti,
                riskGrade,
                recommendation
        );
    }

    /**
     * Generates standard amortization schedule table with reducing balance breakdown.
     */
    public List<LoanRepaymentSchedule> generateRepaymentSchedule(Loan loan, LocalDate startDate) {
        List<LoanRepaymentSchedule> schedules = new ArrayList<>();
        BigDecimal balance = loan.getAmount();
        BigDecimal emi = loan.getEmiAmount();
        BigDecimal monthlyRate = loan.getInterestRate().divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);

        LocalDate dueDate = startDate != null ? startDate.plusMonths(1) : LocalDate.now().plusMonths(1);

        for (int i = 1; i <= loan.getTermMonths(); i++) {
            BigDecimal interest = balance.multiply(monthlyRate, MC).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principal = emi.subtract(interest).setScale(2, RoundingMode.HALF_UP);

            // In final month or rounding residual, adjust principal
            if (i == loan.getTermMonths() || principal.compareTo(balance) > 0) {
                principal = balance;
                emi = principal.add(interest).setScale(2, RoundingMode.HALF_UP);
            }

            LoanRepaymentSchedule schedule = new LoanRepaymentSchedule(
                    loan,
                    i,
                    dueDate,
                    principal,
                    interest,
                    emi
            );
            schedules.add(schedule);

            balance = balance.subtract(principal).max(BigDecimal.ZERO);
            dueDate = dueDate.plusMonths(1);
        }

        return schedules;
    }
}
