-- ==============================================================================
-- Apex Banking System: Report 6 - Loan Portfolio Underwriting & Risk Analysis
-- Description: Aggregates total loan portfolio volume, outstanding exposure,
--              status distributions, DTI tier segmentation, and credit risk bands.
-- Performance: Utilizes idx_loans_status, idx_loans_customer_id, and idx_loans_created_at
-- ==============================================================================

-- Section 1: Portfolio Summary by Application Status
SELECT
    status AS application_status,
    COUNT(*) AS total_applications,
    COUNT(CASE WHEN requires_admin_approval THEN 1 END) AS high_value_count,
    COALESCE(SUM(amount), 0.00) AS total_sanctioned_amount,
    COALESCE(SUM(outstanding_balance), 0.00) AS total_outstanding_balance,
    ROUND(COALESCE(AVG(interest_rate), 0.00), 2) AS avg_interest_rate_pct,
    ROUND(COALESCE(AVG(credit_score), 0), 0) AS avg_credit_score,
    ROUND(COALESCE(AVG(dti_ratio), 0.00), 2) AS avg_dti_ratio_pct,
    ROUND(COALESCE(SUM(emi_amount), 0.00), 2) AS total_monthly_emi_receivable
FROM loans
GROUP BY status
ORDER BY total_applications DESC;

-- Section 2: Underwriting Risk Tiers & DTI Bracket Segmentation
WITH loan_risk_classification AS (
    SELECT
        id,
        loan_id,
        amount,
        outstanding_balance,
        interest_rate,
        status,
        credit_score,
        dti_ratio,
        CASE
            WHEN credit_score >= 750 AND dti_ratio <= 40 THEN '1_PRIME (Score >= 750, DTI <= 40%)'
            WHEN credit_score >= 650 AND dti_ratio <= 50 THEN '2_NEAR_PRIME (Score >= 650, DTI <= 50%)'
            ELSE '3_SUBPRIME (Score < 650 or DTI > 50%)'
        END AS risk_tier,
        CASE
            WHEN dti_ratio <= 30 THEN '<= 30% (Low Risk)'
            WHEN dti_ratio <= 40 THEN '30% - 40% (Moderate Risk)'
            WHEN dti_ratio <= 50 THEN '40% - 50% (Acceptable Boundary)'
            ELSE '> 50% (High Debt Burden)'
        END AS dti_bracket
    FROM loans
)
SELECT
    risk_tier,
    dti_bracket,
    COUNT(*) AS loan_count,
    COALESCE(SUM(amount), 0.00) AS total_amount,
    COALESCE(SUM(outstanding_balance), 0.00) AS total_outstanding,
    ROUND(COALESCE(AVG(credit_score), 0), 0) AS avg_credit_score,
    ROUND(COALESCE(AVG(dti_ratio), 0.00), 2) AS avg_dti
FROM loan_risk_classification
GROUP BY risk_tier, dti_bracket
ORDER BY risk_tier ASC, dti_bracket ASC;
