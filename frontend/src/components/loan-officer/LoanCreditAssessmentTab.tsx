import React, { useState } from 'react';
import { Calculator, Save, ShieldAlert } from 'lucide-react';
import { loanOfficerApi } from '../../services/api';
import { LoanCreditAssessmentItem } from '../../types';
import { extractErrorMessage, formatCurrency, getLoanBadgeClass } from './loanFormatters';

export const LoanCreditAssessmentTab: React.FC<{ initialLoanId?: string }> = ({ initialLoanId }) => {
  const [loanId, setLoanId] = useState(initialLoanId || 'LN_SEED_BR1_01');
  const [monthlyIncome, setMonthlyIncome] = useState('95000');
  const [existingDebt, setExistingDebt] = useState('10000');
  const [requestedAmount, setRequestedAmount] = useState('350000');
  const [interestRate, setInterestRate] = useState('8.75');
  const [tenureMonths, setTenureMonths] = useState('36');
  const [creditScore, setCreditScore] = useState('775');
  const [creditSource, setCreditSource] = useState('SIMULATED_CIBIL');
  const [employmentStability, setEmploymentStability] = useState('STABLE');
  const [collateralValue, setCollateralValue] = useState('1200000');
  const [officerRemarks, setOfficerRemarks] = useState('');

  const [report, setReport] = useState<LoanCreditAssessmentItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const buildPayload = (saveToApplication: boolean) => ({
    monthlyIncome: Number(monthlyIncome),
    existingDebt: Number(existingDebt || 0),
    requestedAmount: Number(requestedAmount),
    interestRate: Number(interestRate),
    tenureMonths: Number(tenureMonths),
    creditScore: Number(creditScore),
    creditSource,
    employmentStability,
    collateralValue: collateralValue ? Number(collateralValue) : undefined,
    officerRemarks: officerRemarks.trim() || undefined,
    saveToApplication,
  });

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await loanOfficerApi.simulateAssessment(buildPayload(false));
      setReport(res);
    } catch (err) {
      setError(extractErrorMessage(err, 'Calculation failed.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!loanId.trim()) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await loanOfficerApi.saveCreditAssessment(loanId.trim(), buildPayload(true));
      setReport(res);
      setMessage(`Formal Credit Assessment ${res.assessmentId} persisted for application ${res.loanId}.`);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to save assessment report.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1B130D]">Credit Assessment &amp; Financial Affordability Engine</h2>
        <p className="text-sm text-[#3F3124]">
          Compute exact reducing-balance EMI, Debt-to-Income (DTI), Loan-to-Value (LTV), eligible borrowing ceiling, and indicative credit risk grading.
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-amber-900/10 border border-amber-700/30 text-xs text-amber-950 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-900" />
        <span>
          <strong>Regulatory Disclaimer:</strong> Bureau scores marked <em>SIMULATED_CIBIL</em> represent supplied/simulated inputs. Computed eligibility is an underwriting aid, not an automated final credit approval.
        </span>
      </div>

      {error && <div className="p-3.5 rounded-xl bg-rose-900/10 border border-rose-700/30 text-sm text-rose-900">{error}</div>}
      {message && <div className="p-3.5 rounded-xl bg-emerald-900/10 border border-emerald-700/30 text-sm text-emerald-900">{message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <form onSubmit={handleSimulate} className="lg:col-span-6 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Loan Application ID (for saving)</label>
              <input value={loanId} onChange={(e) => setLoanId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Credit Score Source</label>
              <select value={creditSource} onChange={(e) => setCreditSource(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
                <option value="SIMULATED_CIBIL">SIMULATED_CIBIL (Academic Demo)</option>
                <option value="OFFICER_SUPPLIED_BUREAU">OFFICER_SUPPLIED_BUREAU</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Gross Monthly Income (INR)</label>
              <input type="number" required value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Existing Monthly Debt (INR)</label>
              <input type="number" required value={existingDebt} onChange={(e) => setExistingDebt(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Requested Principal P (INR)</label>
              <input type="number" required value={requestedAmount} onChange={(e) => setRequestedAmount(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Interest Rate (% p.a.)</label>
              <input type="number" step="0.05" required value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Tenure n (Months)</label>
              <input type="number" min="3" max="360" required value={tenureMonths} onChange={(e) => setTenureMonths(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Credit Score (300 - 900)</label>
              <input type="number" min="300" max="900" required value={creditScore} onChange={(e) => setCreditScore(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Employment Stability</label>
              <select value={employmentStability} onChange={(e) => setEmploymentStability(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
                <option value="STABLE">STABLE (&ge; 2 yrs)</option>
                <option value="MODERATE">MODERATE (1 - 2 yrs)</option>
                <option value="PROBATIONARY">PROBATIONARY (&lt; 1 yr)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Collateral Value (INR, optional)</label>
              <input type="number" min="0" value={collateralValue} onChange={(e) => setCollateralValue(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
          </div>

          <textarea rows={2} value={officerRemarks} onChange={(e) => setOfficerRemarks(e.target.value)} placeholder="Underwriting observations & risk justification..." className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]" />

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={loading} className="px-4 py-2.5 rounded-xl bg-[#261D15] text-[#F4ECE0] font-semibold flex items-center gap-1.5">
              <Calculator className="w-4 h-4" /> Calculate EMI &amp; DTI
            </button>
            <button type="button" disabled={loading} onClick={handleSave} className="px-4 py-2.5 rounded-xl bg-[#70411A] text-white font-semibold flex items-center gap-1.5">
              <Save className="w-4 h-4" /> Save Assessment to Loan
            </button>
          </div>
        </form>

        {/* Computed Report Card */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-4">
          <h3 className="text-base font-bold text-[#1B130D]">Generated Credit Assessment Report</h3>
          {!report ? (
            <div className="p-6 rounded-xl bg-[#F3E7D4] border border-dashed border-[#D9C7AB] text-xs text-[#3F3124] text-center">
              Click &ldquo;Calculate EMI &amp; DTI&rdquo; to preview reducing-balance affordability or &ldquo;Save Assessment to Loan&rdquo; to record on the application.
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#D9C7AB]">
                <span className="font-mono font-bold text-[#70411A]">
                  {report.assessmentId ? `Saved: ${report.assessmentId}` : 'Simulated Preview'}
                </span>
                <div className="flex gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full font-bold border ${getLoanBadgeClass(report.riskCategory)}`}>
                    RISK: {report.riskCategory}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold border ${getLoanBadgeClass(report.recommendation)}`}>
                    {report.recommendation}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
                  <div className="text-[#3F3124]">Estimated Monthly EMI</div>
                  <div className="text-base font-bold font-mono mt-0.5">{formatCurrency(report.estimatedEmi)}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
                  <div className="text-[#3F3124]">DTI Ratio</div>
                  <div className="text-base font-bold font-mono mt-0.5">{report.dtiRatio}%</div>
                </div>
                <div className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
                  <div className="text-[#3F3124]">Max Eligible Amount</div>
                  <div className="text-base font-bold font-mono text-emerald-900 mt-0.5">{formatCurrency(report.eligibleAmount)}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
                  <div className="text-[#3F3124]">Total Interest Payable</div>
                  <div className="font-bold font-mono mt-0.5">{formatCurrency(report.totalInterest)}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
                  <div className="text-[#3F3124]">Total Repayment</div>
                  <div className="font-bold font-mono mt-0.5">{formatCurrency(report.totalRepayment)}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
                  <div className="text-[#3F3124]">Remaining Income / mo</div>
                  <div className="font-bold font-mono mt-0.5">{formatCurrency(report.remainingMonthlyIncome)}</div>
                </div>
              </div>

              {report.ltvRatio != null && (
                <div className="p-3 rounded-xl bg-[#E9D9C0] border border-[#D9C7AB] flex justify-between">
                  <span className="font-semibold">Collateral Loan-to-Value (LTV) Ratio</span>
                  <span className="font-mono font-bold">{report.ltvRatio}%</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
