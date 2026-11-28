import React, { useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { loanOfficerApi } from '../../services/api';
import { LoanApprovalItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { extractErrorMessage, formatCurrency, formatDateTime, getLoanBadgeClass } from './loanFormatters';

export const LoanApprovalsTab: React.FC<{ initialLoanId?: string }> = ({ initialLoanId }) => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<LoanApprovalItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Maker recommendation form
  const [loanId, setLoanId] = useState(initialLoanId || 'LN_SEED_BR1_01');
  const [recommendedAction, setRecommendedAction] = useState('APPROVE');
  const [recommendedAmount, setRecommendedAmount] = useState('350000');
  const [recommendedRate, setRecommendedRate] = useState('8.75');
  const [recommendedTerm, setRecommendedTerm] = useState('36');
  const [officerRemarks, setOfficerRemarks] = useState('');

  const canDecideFinal = Boolean(
    user?.roles?.some((r) => r === 'BANK_MANAGER' || r === 'ADMIN') ||
      user?.permissions?.includes('LOAN_FINAL_APPROVE')
  );

  const loadApprovals = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await loanOfficerApi.listApprovals(statusFilter, 0, 25);
      setApprovals(res.content || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load maker-checker approval queue.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const created = await loanOfficerApi.submitRecommendation(loanId.trim(), {
        recommendedAction,
        recommendedAmount: Number(recommendedAmount),
        recommendedInterestRate: Number(recommendedRate),
        recommendedTermMonths: Number(recommendedTerm),
        officerRemarks: officerRemarks.trim(),
      });
      setMessage(`Maker recommendation ${created.approvalId} submitted for Bank Manager / Admin review.`);
      setOfficerRemarks('');
      await loadApprovals();
    } catch (err) {
      setError(extractErrorMessage(err, 'Recommendation submission rejected.'));
    }
  };

  const handleDecision = async (approvalId: string, decision: string) => {
    const notes = window.prompt(`Enter ${decision} audit remarks for ${approvalId}:`) || `${decision} by credit approver`;
    setError('');
    setMessage('');
    try {
      const decided = await loanOfficerApi.decideApproval(approvalId, decision, notes);
      setMessage(`Approval ${decided.approvalId} finalized as ${decided.status}.`);
      await loadApprovals();
    } catch (err) {
      setError(extractErrorMessage(err, 'Approval decision blocked (check authority & self-approval policy).'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1B130D]">Maker-Checker Approval Management</h2>
        <p className="text-sm text-[#3F3124]">
          Loan Officers submit structured recommendations (amount, interest rate, tenure). Final approvals require independent Bank Manager or Admin authorization with self-approval prevented.
        </p>
      </div>

      {error && <div className="p-3.5 rounded-xl bg-rose-900/10 border border-rose-700/30 text-sm text-rose-900">{error}</div>}
      {message && <div className="p-3.5 rounded-xl bg-emerald-900/10 border border-emerald-700/30 text-sm text-emerald-900">{message}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <form onSubmit={handleRecommend} className="xl:col-span-4 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3 text-xs">
          <h3 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#70411A]" /> Submit Maker Recommendation
          </h3>
          <div>
            <label className="block font-semibold mb-1">Loan ID</label>
            <input required value={loanId} onChange={(e) => setLoanId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold mb-1">Recommendation</label>
              <select value={recommendedAction} onChange={(e) => setRecommendedAction(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
                <option value="APPROVE">APPROVE</option>
                <option value="REJECT">REJECT</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Recommended Amt (INR)</label>
              <input type="number" min="1000" required value={recommendedAmount} onChange={(e) => setRecommendedAmount(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Interest Rate (%)</label>
              <input type="number" step="0.05" required value={recommendedRate} onChange={(e) => setRecommendedRate(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Tenure (Months)</label>
              <input type="number" min="3" required value={recommendedTerm} onChange={(e) => setRecommendedTerm(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
          </div>
          <textarea required rows={3} value={officerRemarks} onChange={(e) => setOfficerRemarks(e.target.value)} placeholder="Summarize KYC, document checks, DTI/LTV credit memo..." className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]" />
          <button type="submit" className="w-full py-2.5 rounded-xl bg-[#261D15] text-[#F4ECE0] font-semibold">
            Submit Recommendation for Approval
          </button>
        </form>

        <div className="xl:col-span-8 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[#1B130D]">Approval Decision Queue</h3>
            <div className="flex gap-2">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs">
                <option value="ALL">ALL</option>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="RETURNED_FOR_REVIEW">RETURNED_FOR_REVIEW</option>
                <option value="ESCALATED">ESCALATED</option>
              </select>
              <button type="button" onClick={loadApprovals} className="p-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#E9D9C0] text-[#3F3124]">
                <tr>
                  <th className="py-2.5 px-3">Approval / Loan</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Recommended Terms</th>
                  <th className="py-2.5 px-3">Maker</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Checker Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D0B4]">
                {approvals.length === 0 ? (
                  <tr><td colSpan={6} className="py-6 text-center text-[#3F3124]">No approval requests found.</td></tr>
                ) : (
                  approvals.map((app) => (
                    <tr key={app.approvalId}>
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold">{app.approvalId}</div>
                        <div className="font-mono text-[11px] text-[#70411A]">{app.loanId}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold">{app.customerName}</div>
                        <div className="text-[11px] text-[#3F3124]">{app.loanCategory} &bull; {app.recommendedAction}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <div className="font-bold">{formatCurrency(app.recommendedAmount)}</div>
                        <div className="text-[11px]">{app.recommendedInterestRate}% &bull; {app.recommendedTermMonths}m</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono">{app.submittedBy}</div>
                        <div className="text-[11px] text-[#3F3124]">{formatDateTime(app.createdAt)}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getLoanBadgeClass(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1">
                        {app.status === 'PENDING' && canDecideFinal ? (
                          <>
                            <button onClick={() => handleDecision(app.approvalId, 'APPROVED')} className="px-2 py-1 rounded-lg bg-emerald-800 text-white font-semibold">Approve</button>
                            <button onClick={() => handleDecision(app.approvalId, 'RETURNED_FOR_REVIEW')} className="px-2 py-1 rounded-lg bg-amber-800 text-white font-semibold">Return</button>
                            <button onClick={() => handleDecision(app.approvalId, 'REJECTED')} className="px-2 py-1 rounded-lg bg-rose-800 text-white font-semibold">Reject</button>
                          </>
                        ) : (
                          <span className="text-[#3F3124]">{app.decisionBy || 'Awaiting Manager'}</span>
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
