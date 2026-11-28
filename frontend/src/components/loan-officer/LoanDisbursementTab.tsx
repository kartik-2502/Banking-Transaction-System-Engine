import React, { useEffect, useState } from 'react';
import { Banknote, CheckCircle2, RefreshCw } from 'lucide-react';
import { loanOfficerApi } from '../../services/api';
import { LoanDisbursementItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { extractErrorMessage, formatCurrency, formatDateTime, getLoanBadgeClass } from './loanFormatters';

export const LoanDisbursementTab: React.FC<{ initialLoanId?: string }> = ({ initialLoanId }) => {
  const { user } = useAuth();
  const [disbursements, setDisbursements] = useState<LoanDisbursementItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Initiate Form
  const [loanId, setLoanId] = useState(initialLoanId || '');
  const [conditionsVerified, setConditionsVerified] = useState(false);
  const [beneficiaryVerified, setBeneficiaryVerified] = useState(false);
  const [disbursementMode, setDisbursementMode] = useState('CORE_LEDGER_SIMULATED');
  const [remarks, setRemarks] = useState('');

  const canAuthorize = Boolean(
    user?.roles?.some((r) => r === 'BANK_MANAGER' || r === 'ADMIN') ||
      user?.permissions?.includes('LOAN_DISBURSEMENT_APPROVE')
  );

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await loanOfficerApi.listDisbursements('ALL', 0, 25);
      setDisbursements(res.content || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load loan disbursements.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const created = await loanOfficerApi.initiateDisbursement(loanId.trim(), {
        conditionsVerified,
        beneficiaryVerified,
        disbursementMode,
        remarks: remarks.trim() || undefined,
      });
      setMessage(`Disbursement ${created.disbursementId} initiated (awaiting independent supervisor release).`);
      setLoanId('');
      setConditionsVerified(false);
      setBeneficiaryVerified(false);
      setRemarks('');
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, 'Disbursement initiation failed.'));
    }
  };

  const handleAuthorize = async (disbursementId: string, approved: boolean) => {
    setError('');
    setMessage('');
    try {
      const res = await loanOfficerApi.authorizeDisbursement(
        disbursementId,
        approved,
        approved ? 'Verified & released through Core Ledger' : 'Returned by disbursement authorizer'
      );
      setMessage(
        res.status === 'DISBURSED'
          ? `Disbursed ${formatCurrency(res.amount)} to ${res.accountNumber} (Ref: ${res.transactionRef}).`
          : `Disbursement ${res.disbursementId} marked ${res.status}.`
      );
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, 'Disbursement authorization rejected.'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1B130D]">Loan Disbursement Coordination</h2>
        <p className="text-sm text-[#3F3124]">
          Verify disbursement conditions and beneficiary account details for APPROVED loans. Credits post exclusively via the core ledger transaction workflow (simulated external clearing when selected).
        </p>
      </div>

      {error && <div className="p-3.5 rounded-xl bg-rose-900/10 border border-rose-700/30 text-sm text-rose-900">{error}</div>}
      {message && <div className="p-3.5 rounded-xl bg-emerald-900/10 border border-emerald-700/30 text-sm text-emerald-900">{message}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <form onSubmit={handleInitiate} className="xl:col-span-4 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3 text-xs">
          <h3 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
            <Banknote className="w-4 h-4 text-[#70411A]" /> Initiate Disbursement Request
          </h3>
          <div>
            <label className="block font-semibold mb-1">Approved Loan ID</label>
            <input required value={loanId} onChange={(e) => setLoanId(e.target.value)} placeholder="LN..." className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Disbursement Rail</label>
            <select value={disbursementMode} onChange={(e) => setDisbursementMode(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <option value="CORE_LEDGER_SIMULATED">Core Account Credit (Simulated/Internal Ledger)</option>
              <option value="NEFT_SIMULATED">NEFT Beneficiary Settlement (Simulated)</option>
              <option value="RTGS_SIMULATED">RTGS High-Value Settlement (Simulated)</option>
            </select>
          </div>
          <label className="flex items-start gap-2 p-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
            <input type="checkbox" checked={conditionsVerified} onChange={(e) => setConditionsVerified(e.target.checked)} className="mt-0.5" />
            <span>I confirm all sanction conditions, signed agreements, and collateral charges are verified.</span>
          </label>
          <label className="flex items-start gap-2 p-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
            <input type="checkbox" checked={beneficiaryVerified} onChange={(e) => setBeneficiaryVerified(e.target.checked)} className="mt-0.5" />
            <span>I confirm the beneficiary repayment/disbursement account number and ACTIVE status.</span>
          </label>
          <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Disbursement tranche & voucher remarks" className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]" />
          <button
            type="submit"
            disabled={!conditionsVerified || !beneficiaryVerified}
            className="w-full py-2.5 rounded-xl bg-[#261D15] text-[#F4ECE0] font-semibold disabled:opacity-40"
          >
            Submit Disbursement Request
          </button>
        </form>

        <div className="xl:col-span-8 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1B130D]">Disbursement Pipeline &amp; History</h3>
            <button type="button" onClick={load} className="p-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#E9D9C0] text-[#3F3124]">
                <tr>
                  <th className="py-2.5 px-3">Disb ID / Loan</th>
                  <th className="py-2.5 px-3">Beneficiary Acct</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3">Ledger Ref</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Release</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D0B4]">
                {disbursements.length === 0 ? (
                  <tr><td colSpan={6} className="py-6 text-center text-[#3F3124]">No disbursements queued or completed yet.</td></tr>
                ) : (
                  disbursements.map((d) => (
                    <tr key={d.disbursementId}>
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold">{d.disbursementId}</div>
                        <div className="font-mono text-[11px] text-[#70411A]">{d.loanId}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold">{d.customerName}</div>
                        <div className="font-mono text-[11px] text-[#3F3124]">{d.accountNumber} &bull; {d.disbursementMode}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">{formatCurrency(d.amount)}</td>
                      <td className="py-2.5 px-3 font-mono">
                        {d.transactionRef || 'Pending'}
                        <div className="text-[11px] text-[#3F3124]">{formatDateTime(d.disbursedAt || d.createdAt)}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getLoanBadgeClass(d.status)}`}>{d.status}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {d.status === 'INITIATED' && canAuthorize ? (
                          <div className="inline-flex gap-1">
                            <button onClick={() => handleAuthorize(d.disbursementId, true)} className="px-2 py-1 rounded-lg bg-emerald-800 text-white font-semibold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Release
                            </button>
                            <button onClick={() => handleAuthorize(d.disbursementId, false)} className="px-2 py-1 rounded-lg bg-rose-800 text-white font-semibold">Reject</button>
                          </div>
                        ) : (
                          <span className="text-[#3F3124]">{d.approvedBy || 'Awaiting Authorizer'}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
