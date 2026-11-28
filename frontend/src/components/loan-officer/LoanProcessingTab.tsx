import React, { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Clock, Search, Send } from 'lucide-react';
import { loanOfficerApi } from '../../services/api';
import { extractErrorMessage, formatCurrency, formatDateTime, getLoanBadgeClass } from './loanFormatters';

const PROCESS_STAGES = [
  'UNDER_REVIEW',
  'DOCUMENT_VERIFICATION',
  'CREDIT_ASSESSMENT',
  'ADDITIONAL_INFORMATION_REQUIRED',
  'CANCELLED',
];

export const LoanProcessingTab: React.FC<{ initialLoanId?: string }> = ({ initialLoanId }) => {
  const [loanIdInput, setLoanIdInput] = useState(initialLoanId || 'LN_SEED_BR1_01');
  const [workspace, setWorkspace] = useState<any>(null);
  const [targetStage, setTargetStage] = useState('DOCUMENT_VERIFICATION');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadWorkspace = async (id = loanIdInput) => {
    const clean = id.trim();
    if (!clean) return;
    setLoading(true);
    setError('');
    try {
      const res = await loanOfficerApi.getWorkspace(clean);
      setWorkspace(res);
    } catch (err) {
      setWorkspace(null);
      setError(extractErrorMessage(err, 'Unable to load loan processing workspace.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace(initialLoanId || loanIdInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoanId]);

  const handleStageChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace?.application?.loanId) return;
    setError('');
    setMessage('');
    try {
      const updated = await loanOfficerApi.transitionStage(
        workspace.application.loanId,
        targetStage,
        remarks.trim() || `Moved stage to ${targetStage}`
      );
      setMessage(`Loan ${updated.loanId} transitioned to ${updated.status}.`);
      setRemarks('');
      await loadWorkspace(updated.loanId);
    } catch (err) {
      setError(extractErrorMessage(err, 'Stage transition blocked.'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1B130D]">Loan Processing &amp; Application Timeline</h2>
        <p className="text-sm text-[#3F3124]">
          Inspect application completeness, KYC &amp; document counts, latest credit assessment, internal underwriting notes, and immutable audit history.
        </p>
      </div>

      {error && <div className="p-3.5 rounded-xl bg-rose-900/10 border border-rose-700/30 text-sm text-rose-900">{error}</div>}
      {message && <div className="p-3.5 rounded-xl bg-emerald-900/10 border border-emerald-700/30 text-sm text-emerald-900">{message}</div>}

      <div className="p-4 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] flex flex-wrap gap-3 items-center">
        <input
          value={loanIdInput}
          onChange={(e) => setLoanIdInput(e.target.value)}
          placeholder="Enter Loan Application ID (e.g. LN_SEED_BR1_01)"
          className="flex-1 min-w-[220px] px-3.5 py-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono text-sm"
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => loadWorkspace(loanIdInput)}
          className="px-5 py-2.5 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold flex items-center gap-1.5"
        >
          <Search className="w-4 h-4" /> Load Application Workspace
        </button>
      </div>

      {workspace && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Application Completeness + Transition Controls */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-[#70411A]" /> {workspace.application.loanId}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getLoanBadgeClass(workspace.application.status)}`}>
                  {workspace.application.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
                  <span className="text-[#3F3124]">Applicant</span>
                  <div className="font-bold">{workspace.application.customerName}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
                  <span className="text-[#3F3124]">Requested</span>
                  <div className="font-mono font-bold">{formatCurrency(workspace.application.amount)}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
                  <span className="text-[#3F3124]">Documents Verified</span>
                  <div className="font-mono font-bold">{workspace.verifiedDocumentCount} / {workspace.documentCount}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
                  <span className="text-[#3F3124]">Credit Assessment</span>
                  <div className="font-bold">
                    {workspace.latestAssessment ? `${workspace.latestAssessment.riskCategory} (${workspace.latestAssessment.recommendation})` : 'Pending'}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleStageChange} className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3 text-xs">
              <h3 className="text-base font-bold text-[#1B130D]">Controlled Stage Transition</h3>
              <select value={targetStage} onChange={(e) => setTargetStage(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-semibold">
                {PROCESS_STAGES.map((st) => <option key={st} value={st}>{st}</option>)}
              </select>
              <textarea
                rows={3}
                required
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Internal processing remarks or missing document instructions..."
                className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]"
              />
              <button type="submit" className="w-full py-2.5 rounded-xl bg-[#261D15] text-[#F4ECE0] font-semibold flex items-center justify-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> Update Processing Stage
              </button>
            </form>
          </div>

          {/* Stage Timeline + Audit History */}
          <div className="lg:col-span-7 space-y-5">
            <div className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
              <h3 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#70411A]" /> Processing Stage Timeline
              </h3>
              <div className="space-y-2.5 text-xs">
                {(workspace.timeline || []).length === 0 ? (
                  <p className="text-[#3F3124]">No workflow events recorded yet.</p>
                ) : (
                  workspace.timeline.map((step: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-[#1B130D]">
                            {step.previousStatus ? `${step.previousStatus} → ${step.newStatus}` : step.newStatus}
                          </div>
                          <div className="text-[#3F3124] mt-0.5">{step.remarks}</div>
                          <div className="text-[11px] font-mono text-[#70411A] mt-0.5">Actor: {step.changedBy}</div>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#3F3124] shrink-0">{formatDateTime(step.createdAt)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-2">
              <h3 className="text-sm font-bold text-[#1B130D]">Immutable Compliance Audit Log</h3>
              <div className="max-h-52 overflow-y-auto space-y-1.5 text-xs">
                {(workspace.auditLogs || []).map((a: any) => (
                  <div key={a.auditId} className="p-2.5 rounded-lg bg-[#F3E7D4] border border-[#D9C7AB] flex justify-between gap-2">
                    <div>
                      <span className="font-bold">{a.action}</span> &bull; <span className="font-mono">{a.username}</span>
                      {a.remarks && <div className="text-[11px] text-[#3F3124]">{a.remarks}</div>}
                    </div>
                    <span className="text-[11px] text-[#3F3124] shrink-0">{formatDateTime(a.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
