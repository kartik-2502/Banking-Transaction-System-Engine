import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Plus, RefreshCw } from 'lucide-react';
import { tellerApi } from '../../services/api';
import { ApprovalItem, ServiceRequestItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { extractErrorMessage, formatCurrency, formatDateTime, getStatusBadgeClass } from './tellerFormatters';

const REQUEST_CATEGORIES = [
  { value: 'CHEQUE_BOOK', label: 'Cheque Book Request' },
  { value: 'STATEMENT_REQUEST', label: 'Stamped Statement Request' },
  { value: 'BALANCE_CERTIFICATE', label: 'Balance Certificate' },
  { value: 'INTEREST_CERTIFICATE', label: 'Interest Certificate' },
  { value: 'CONTACT_UPDATE', label: 'Mobile / Email / Address Update' },
  { value: 'DEBIT_CARD_REQUEST', label: 'Debit Card Issue / Re-issue' },
  { value: 'NOMINEE_UPDATE', label: 'Nominee Update' },
  { value: 'NEW_ACCOUNT_OPENING', label: 'New Account Opening' },
  { value: 'ACCOUNT_FREEZE', label: 'Account Freeze (Supervisor Approval)' },
  { value: 'ACCOUNT_UNFREEZE', label: 'Account Unfreeze (Supervisor Approval)' },
  { value: 'ACCOUNT_CLOSURE', label: 'Account Closure (Supervisor Approval)' },
];

export const TellerServiceRequestsTab: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

  const [customerNumber, setCustomerNumber] = useState('CUST1001');
  const [accountNumber, setAccountNumber] = useState('ACC1001');
  const [requestType, setRequestType] = useState('CHEQUE_BOOK');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const canApprove = Boolean(
    user?.roles?.some((r) => r === 'BANK_MANAGER' || r === 'ADMIN') ||
      user?.permissions?.includes('APPROVAL_MANAGE')
  );

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [reqRes, appRes] = await Promise.all([
        tellerApi.listServiceRequests(statusFilter, 0, 25),
        tellerApi.listApprovals(0, 20),
      ]);
      setRequests(reqRes.content || []);
      setApprovals(appRes.content || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load branch service requests.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const created = await tellerApi.createServiceRequest({
        customerNumber: customerNumber.trim().toUpperCase(),
        accountNumber: accountNumber.trim().toUpperCase() || undefined,
        requestType,
        description: description.trim(),
      });
      setMessage(`Service request ${created.requestId} logged (${created.approvalStatus}).`);
      setDescription('');
      await loadData();
    } catch (err) {
      setError(extractErrorMessage(err, 'Service request submission failed.'));
    }
  };

  const handleDecision = async (requestId: string, approved: boolean) => {
    setError('');
    setMessage('');
    try {
      const updated = await tellerApi.decideServiceRequest(
        requestId,
        approved,
        approved ? 'Verified customer instruction & approved' : 'Rejected by branch supervisor'
      );
      setMessage(`Request ${updated.requestId} is now ${updated.status} (${updated.approvalStatus}).`);
      await loadData();
    } catch (err) {
      setError(extractErrorMessage(err, 'Supervisor approval failed.'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1B130D]">Branch Service Requests &amp; Approvals</h2>
        <p className="text-sm text-[#3F3124]">
          Log customer service requests with auditable request IDs, approval tracking, and segregation-of-duties enforcement.
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
            <Plus className="w-4 h-4 text-[#70411A]" /> New Service Request
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
          <div>
            <label className="block text-xs font-semibold text-[#3F3124] mb-1">Request Type</label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
            >
              {REQUEST_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#3F3124] mb-1">Request Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Customer request particulars, delivery address, or compliance justification..."
              className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold"
          >
            Submit Service Request
          </button>
        </form>

        <div className="xl:col-span-8 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-[#70411A]" /> Service Request Queue
            </h3>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
              >
                <option value="ALL">ALL</option>
                <option value="OPEN">OPEN</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
              <button type="button" onClick={loadData} className="p-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#E9D9C0] text-[#3F3124]">
                <tr>
                  <th className="py-2.5 px-3">Request ID</th>
                  <th className="py-2.5 px-3">Customer / Acct</th>
                  <th className="py-2.5 px-3">Type &amp; Details</th>
                  <th className="py-2.5 px-3">Approval</th>
                  <th className="py-2.5 px-3">Submitted</th>
                  <th className="py-2.5 px-3 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D0B4]">
                {requests.length === 0 ? (
                  <tr><td colSpan={6} className="py-6 text-center text-[#3F3124]">No service requests logged yet.</td></tr>
                ) : (
                  requests.map((sr) => (
                    <tr key={sr.requestId}>
                      <td className="py-2.5 px-3 font-mono font-bold">{sr.requestId}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold">{sr.customerName}</div>
                        <div className="font-mono text-[11px] text-[#70411A]">
                          {sr.customerNumber} {sr.accountNumber ? `• ${sr.accountNumber}` : ''}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="font-semibold">{sr.requestType}</div>
                        <div className="text-[11px] text-[#3F3124] truncate">{sr.description}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(sr.approvalStatus)}`}>
                          {sr.approvalStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div>{sr.submittedBy}</div>
                        <div className="text-[11px] text-[#3F3124]">{formatDateTime(sr.createdAt)}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {sr.approvalStatus === 'PENDING' && canApprove ? (
                          <div className="inline-flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDecision(sr.requestId, true)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDecision(sr.requestId, false)}
                              className="px-2.5 py-1 rounded-lg bg-rose-800 text-white font-semibold"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[#3F3124]">{sr.approvedBy || sr.status}</span>
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

      {/* Unified Branch Approval Audit Queue */}
      <div className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
        <h3 className="text-base font-bold text-[#1B130D]">Branch Approval Audit Log</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#E9D9C0] text-[#3F3124]">
              <tr>
                <th className="py-2 px-3">Approval ID</th>
                <th className="py-2 px-3">Entity</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3 text-right">Amount</th>
                <th className="py-2 px-3">Requested By</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Reviewed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2D0B4]">
              {approvals.length === 0 ? (
                <tr><td colSpan={7} className="py-4 text-center text-[#3F3124]">No pending or historical approvals recorded.</td></tr>
              ) : (
                approvals.map((app) => (
                  <tr key={app.approvalId}>
                    <td className="py-2 px-3 font-mono font-bold">{app.approvalId}</td>
                    <td className="py-2 px-3 font-mono">{app.entityType} • {app.entityRef}</td>
                    <td className="py-2 px-3">{app.actionType}</td>
                    <td className="py-2 px-3 text-right font-mono">{app.amount ? formatCurrency(app.amount) : '—'}</td>
                    <td className="py-2 px-3">{app.requestedBy}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">{app.reviewedBy || 'Awaiting Review'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
