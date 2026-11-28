import React, { useEffect, useState } from 'react';
import { AlertTriangle, PhoneCall, RefreshCw } from 'lucide-react';
import { loanOfficerApi } from '../../services/api';
import { LoanFollowUpItem, LoanOverdueItem } from '../../types';
import { extractErrorMessage, formatCurrency, formatDateTime, getLoanBadgeClass } from './loanFormatters';

export const LoanOverdueTab: React.FC = () => {
  const [overdues, setOverdues] = useState<LoanOverdueItem[]>([]);
  const [followUps, setFollowUps] = useState<LoanFollowUpItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Follow-up Form
  const [loanId, setLoanId] = useState('LN_SEED_BR1_02');
  const [followupType, setFollowupType] = useState('CALL_REMINDER');
  const [commitmentAmount, setCommitmentAmount] = useState('');
  const [commitmentDate, setCommitmentDate] = useState('');
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [escalated, setEscalated] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [ov, fu] = await Promise.all([loanOfficerApi.listOverdue(), loanOfficerApi.listFollowUps(0, 20)]);
      setOverdues(ov || []);
      setFollowUps(fu.content || []);
      if (ov && ov.length > 0 && !loanId) {
        setLoanId(ov[0].loanId);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load overdue delinquencies.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const saved = await loanOfficerApi.logFollowUp(loanId.trim(), {
        followupType,
        commitmentAmount: commitmentAmount ? Number(commitmentAmount) : undefined,
        commitmentDate: commitmentDate || undefined,
        outcome: outcome.trim(),
        recoveryStatus: escalated ? 'ESCALATED' : commitmentDate ? 'PROMISED_TO_PAY' : 'OPEN',
        notes: notes.trim() || undefined,
        escalated,
      });
      setMessage(`Recovery follow-up ${saved.followupId} recorded for ${saved.loanId}.`);
      setOutcome('');
      setNotes('');
      setEscalated(false);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not record follow-up activity.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1B130D]">Overdue Loans &amp; Default Management</h2>
          <p className="text-sm text-[#3F3124]">
            Monitor Days Past Due (DPD), SMA/NPA aging buckets, record customer recovery follow-ups &amp; repayment commitments, and escalate defaults. Write-offs and waivers remain locked to Bank Manager / Admin authority.
          </p>
        </div>
        <button type="button" onClick={load} className="px-4 py-2 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold flex items-center gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && <div className="p-3.5 rounded-xl bg-rose-900/10 border border-rose-700/30 text-sm text-rose-900">{error}</div>}
      {message && <div className="p-3.5 rounded-xl bg-emerald-900/10 border border-emerald-700/30 text-sm text-emerald-900">{message}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-7 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
          <h3 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-800" /> Active Delinquent &amp; Overdue Accounts ({overdues.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#E9D9C0] text-[#3F3124]">
                <tr>
                  <th className="py-2.5 px-3">Loan ID / Customer</th>
                  <th className="py-2.5 px-3">DPD / Bucket</th>
                  <th className="py-2.5 px-3 text-right">Overdue Amt</th>
                  <th className="py-2.5 px-3">Oldest Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D0B4]">
                {overdues.length === 0 ? (
                  <tr><td colSpan={4} className="py-6 text-center text-[#3F3124]">Zero overdue loans in branch scope.</td></tr>
                ) : (
                  overdues.map((o) => (
                    <tr key={o.loanId} className="hover:bg-[#E9D9C0]/60 cursor-pointer" onClick={() => setLoanId(o.loanId)}>
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-[#70411A]">{o.loanId}</div>
                        <div className="font-semibold">{o.customerName} ({o.maskedPhone})</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-rose-900">{o.daysPastDue} DPD</div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getLoanBadgeClass(o.delinquencyBucket)}`}>
                          {o.delinquencyBucket}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-900">
                        {formatCurrency(o.overdueAmount)}
                        <div className="text-[11px] font-normal text-[#3F3124]">{o.overdueInstallmentCount} inst(s)</div>
                      </td>
                      <td className="py-2.5 px-3">{o.oldestDueDate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <form onSubmit={handleLogFollowUp} className="xl:col-span-5 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3 text-xs">
          <h3 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-[#70411A]" /> Record Recovery Follow-Up
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold mb-1">Loan ID</label>
              <input required value={loanId} onChange={(e) => setLoanId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Follow-Up Channel</label>
              <select value={followupType} onChange={(e) => setFollowupType(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
                <option value="CALL_REMINDER">Phone Call</option>
                <option value="BRANCH_VISIT">Branch Visit</option>
                <option value="NOTICE_ISSUED">Formal Notice</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Commitment Amt (INR)</label>
              <input type="number" min="0" value={commitmentAmount} onChange={(e) => setCommitmentAmount(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Commitment Date</label>
              <input type="date" value={commitmentDate} onChange={(e) => setCommitmentDate(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]" />
            </div>
          </div>
          <input required value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="Contact outcome (e.g. Borrower promised partial payment by Friday)" className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]" />
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional recovery remarks..." className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]" />
          <label className="flex items-center gap-2 font-semibold text-rose-900">
            <input type="checkbox" checked={escalated} onChange={(e) => setEscalated(e.target.checked)} />
            Escalate serious delinquency to Legal / Recovery Team
          </label>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-[#8E4322] text-white font-semibold">
            Log Recovery Activity
          </button>
        </form>
      </div>

      {/* Follow-up Audit Trail */}
      <div className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
        <h3 className="text-base font-bold text-[#1B130D]">Recent Recovery &amp; Commitment Log</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#E9D9C0] text-[#3F3124]">
              <tr>
                <th className="py-2 px-3">Follow-Up ID / Loan</th>
                <th className="py-2 px-3">Channel / DPD</th>
                <th className="py-2 px-3">Outcome &amp; Notes</th>
                <th className="py-2 px-3">Commitment</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Logged At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2D0B4]">
              {followUps.map((f) => (
                <tr key={f.followupId}>
                  <td className="py-2 px-3 font-mono font-bold">{f.followupId} &bull; {f.loanId}</td>
                  <td className="py-2 px-3">{f.followupType} ({f.dpdAtFollowup} DPD)</td>
                  <td className="py-2 px-3">{f.outcome}</td>
                  <td className="py-2 px-3 font-mono">{f.commitmentAmount ? `${formatCurrency(f.commitmentAmount)} (${f.commitmentDate})` : '—'}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getLoanBadgeClass(f.recoveryStatus)}`}>
                      {f.recoveryStatus}
                    </span>
                  </td>
                  <td className="py-2 px-3">{formatDateTime(f.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
