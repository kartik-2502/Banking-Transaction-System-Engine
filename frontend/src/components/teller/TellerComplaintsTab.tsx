import React, { useEffect, useState } from 'react';
import { AlertTriangle, MessageSquareWarning, RefreshCw } from 'lucide-react';
import { tellerApi } from '../../services/api';
import { ComplaintItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { extractErrorMessage, formatDateTime, getStatusBadgeClass } from './tellerFormatters';

export const TellerComplaintsTab: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Form
  const [customerNumber, setCustomerNumber] = useState('CUST1001');
  const [accountNumber, setAccountNumber] = useState('ACC1001');
  const [transactionId, setTransactionId] = useState('');
  const [category, setCategory] = useState('UNAUTHORIZED_DEBIT');
  const [priority, setPriority] = useState('MEDIUM');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const canResolveComplaint = Boolean(
    user?.roles?.some((r) => r === 'BANK_MANAGER' || r === 'RISK_ANALYST' || r === 'ADMIN') ||
      user?.permissions?.includes('COMPLAINT_RESOLVE')
  );

  const loadComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await tellerApi.listComplaints(statusFilter, 0, 25);
      setComplaints(res.content || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load customer complaints.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const created = await tellerApi.createComplaint({
        customerNumber: customerNumber.trim().toUpperCase(),
        accountNumber: accountNumber.trim().toUpperCase() || undefined,
        transactionId: transactionId.trim() || undefined,
        category,
        subject: subject.trim(),
        description: description.trim(),
        priority,
      });
      setMessage(`Complaint ${created.complaintId} registered for tracking.`);
      setSubject('');
      setDescription('');
      setTransactionId('');
      await loadComplaints();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not register complaint.'));
    }
  };

  const handleAction = async (complaintId: string, payload: { status?: string; escalated?: boolean; internalRemarks?: string }) => {
    setError('');
    setMessage('');
    try {
      const updated = await tellerApi.updateComplaint(complaintId, payload);
      setMessage(`Complaint ${updated.complaintId} updated to ${updated.status}.`);
      await loadComplaints();
    } catch (err) {
      setError(extractErrorMessage(err, 'Complaint update rejected.'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1B130D]">Disputes &amp; Customer Complaints</h2>
        <p className="text-sm text-[#3F3124]">
          Register transaction disputes and service complaints, assign cases, escalate to branch compliance, and track full resolution lifecycles.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-900/10 border border-rose-700/30 text-sm text-rose-900">{error}</div>
      )}
      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-900/10 border border-emerald-700/30 text-sm text-emerald-900">{message}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <form onSubmit={handleCreate} className="xl:col-span-4 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
          <h3 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
            <MessageSquareWarning className="w-4 h-4 text-[#8E4322]" /> Log Dispute / Complaint
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#3F3124] mb-1">Customer ID</label>
              <input
                type="text"
                required
                value={customerNumber}
                onChange={(e) => setCustomerNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3F3124] mb-1">Account (Optional)</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#3F3124] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
              >
                <option value="UNAUTHORIZED_DEBIT">Unauthorized Debit</option>
                <option value="FAILED_TRANSFER">Failed Transfer / Stuck Funds</option>
                <option value="CASH_DISCREPANCY">ATM / Counter Cash Discrepancy</option>
                <option value="FEE_DISPUTE">Charge / Fee Dispute</option>
                <option value="SERVICE_QUALITY">Branch Service Feedback</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3F3124] mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>
          <input
            type="text"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Linked Transaction ID (optional)"
            className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono text-xs"
          />
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Short summary / subject"
            className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
          />
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed customer grievance and supporting voucher/reference facts..."
            className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#8E4322] text-white text-xs font-semibold"
          >
            Register Complaint
          </button>
        </form>

        <div className="xl:col-span-8 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[#1B130D]">Branch Complaints Register</h3>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
              >
                <option value="ALL">ALL</option>
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="ESCALATED">ESCALATED</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
              <button type="button" onClick={loadComplaints} className="p-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#E9D9C0] text-[#3F3124]">
                <tr>
                  <th className="py-2.5 px-3">Complaint ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Issue / Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D0B4]">
                {complaints.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-[#3F3124]">No complaints registered.</td></tr>
                ) : (
                  complaints.map((cmp) => (
                    <tr key={cmp.complaintId}>
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold">{cmp.complaintId}</div>
                        <div className="text-[11px] text-[#3F3124]">{formatDateTime(cmp.createdAt)}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold">{cmp.customerName}</div>
                        <div className="font-mono text-[11px] text-[#70411A]">
                          {cmp.customerNumber} {cmp.transactionId ? `• ${cmp.transactionId}` : ''}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="font-semibold">{cmp.subject}</div>
                        <div className="text-[11px] text-[#3F3124]">{cmp.category} &bull; Priority: {cmp.priority}</div>
                        {cmp.internalRemarks && (
                          <div className="text-[11px] italic text-[#70411A] mt-0.5">Note: {cmp.internalRemarks}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(cmp.status)}`}>
                          {cmp.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1">
                        {cmp.status !== 'ESCALATED' && cmp.status !== 'RESOLVED' && cmp.status !== 'CLOSED' && (
                          <button
                            type="button"
                            onClick={() => handleAction(cmp.complaintId, { escalated: true, status: 'ESCALATED', internalRemarks: 'Escalated by branch counter for urgent supervisor resolution' })}
                            className="px-2 py-1 rounded-lg bg-amber-800 text-white font-semibold inline-flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3 h-3" /> Escalate
                          </button>
                        )}
                        {canResolveComplaint && cmp.status !== 'RESOLVED' && cmp.status !== 'CLOSED' && (
                          <button
                            type="button"
                            onClick={() => handleAction(cmp.complaintId, { status: 'RESOLVED', internalRemarks: 'Investigated and resolved by branch compliance authority' })}
                            className="px-2 py-1 rounded-lg bg-emerald-800 text-white font-semibold"
                          >
                            Resolve
                          </button>
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
