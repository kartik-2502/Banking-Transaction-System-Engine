import React, { useEffect, useState } from 'react';
import { BellRing, RefreshCw, Send } from 'lucide-react';
import { loanOfficerApi } from '../../services/api';
import { LoanCommunicationItem } from '../../types';
import { extractErrorMessage, formatDateTime, getLoanBadgeClass } from './loanFormatters';

const COMM_TYPES = [
  { value: 'APPLICATION_STATUS_UPDATE', label: 'Application Status Notification' },
  { value: 'MISSING_DOCUMENT_REMINDER', label: 'Missing Document Reminder' },
  { value: 'ADDITIONAL_DOC_REQUEST', label: 'Additional Document Request' },
  { value: 'APPROVAL_DECISION_NOTICE', label: 'Approval Decision Notification' },
  { value: 'EMI_PAYMENT_REMINDER', label: 'Upcoming / Overdue EMI Reminder' },
  { value: 'FOLLOW_UP_CALL_LOG', label: 'Follow-Up Summary Log' },
];

export const LoanCommunicationTab: React.FC<{ initialLoanId?: string }> = ({ initialLoanId }) => {
  const [history, setHistory] = useState<LoanCommunicationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [customerNumber, setCustomerNumber] = useState('CUST1001');
  const [loanId, setLoanId] = useState(initialLoanId || 'LN_SEED_BR1_01');
  const [communicationType, setCommunicationType] = useState('MISSING_DOCUMENT_REMINDER');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await loanOfficerApi.listCommunications(0, 25);
      setHistory(res.content || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load customer communications history.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const created = await loanOfficerApi.sendCommunication({
        customerNumber: customerNumber.trim().toUpperCase(),
        loanId: loanId.trim() || undefined,
        channel: 'IN_APP_NOTIFICATION',
        communicationType,
        subject: subject.trim(),
        message: body.trim(),
      });
      setMessage(`Internal notification ${created.communicationId} dispatched to customer portal & logged.`);
      setSubject('');
      setBody('');
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to send internal loan notification.'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1B130D]">Customer Communication &amp; Notices</h2>
        <p className="text-sm text-[#3F3124]">
          Dispatch auditable in-app notifications, document requests, approval updates, and EMI reminders through the transactional outbox notification service (no external SMS/email gateway claims).
        </p>
      </div>

      {error && <div className="p-3.5 rounded-xl bg-rose-900/10 border border-rose-700/30 text-sm text-rose-900">{error}</div>}
      {message && <div className="p-3.5 rounded-xl bg-emerald-900/10 border border-emerald-700/30 text-sm text-emerald-900">{message}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <form onSubmit={handleSend} className="xl:col-span-4 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3 text-xs">
          <h3 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
            <BellRing className="w-4 h-4 text-[#70411A]" /> Send Internal Notification
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold mb-1">Customer ID</label>
              <input required value={customerNumber} onChange={(e) => setCustomerNumber(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Loan ID (Optional)</label>
              <input value={loanId} onChange={(e) => setLoanId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1">Notice Category</label>
            <select value={communicationType} onChange={(e) => setCommunicationType(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              {COMM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Notification subject" className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]" />
          <textarea required rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write clear instructions for the customer..." className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]" />
          <button type="submit" className="w-full py-2.5 rounded-xl bg-[#261D15] text-[#F4ECE0] font-semibold flex items-center justify-center gap-1.5">
            <Send className="w-3.5 h-3.5" /> Send &amp; Log Notice
          </button>
        </form>

        <div className="xl:col-span-8 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1B130D]">Branch Communication Audit Log</h3>
            <button type="button" onClick={load} className="p-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#E9D9C0] text-[#3F3124]">
                <tr>
                  <th className="py-2.5 px-3">Comm ID / Customer</th>
                  <th className="py-2.5 px-3">Type &amp; Subject</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Sender &amp; Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D0B4]">
                {history.length === 0 ? (
                  <tr><td colSpan={4} className="py-6 text-center text-[#3F3124]">No customer communications logged yet.</td></tr>
                ) : (
                  history.map((c) => (
                    <tr key={c.communicationId}>
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold">{c.communicationId}</div>
                        <div className="text-[11px] text-[#70411A]">{c.customerName} {c.loanId ? `• ${c.loanId}` : ''}</div>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="font-bold">{c.subject}</div>
                        <div className="text-[11px] text-[#3F3124] truncate">{c.message}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getLoanBadgeClass('VERIFIED')}`}>
                          {c.deliveryStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono">{c.sentBy}</div>
                        <div className="text-[11px] text-[#3F3124]">{formatDateTime(c.createdAt)}</div>
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
