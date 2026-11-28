import React, { useState } from 'react';
import { FileText, Landmark, Search, Send, RefreshCw, Printer } from 'lucide-react';
import { tellerApi } from '../../services/api';
import { Account, ServiceRequestItem, Transaction } from '../../types';
import { downloadTransactionReceipt, printTransactionReceipt } from '../../utils/receipt';
import {
  extractErrorMessage,
  formatCurrency,
  formatDateTime,
  getStatusBadgeClass,
} from './tellerFormatters';

const SERVICE_REQUEST_TYPES = [
  { value: 'NEW_ACCOUNT_OPENING', label: 'New Account Opening Request' },
  { value: 'ACCOUNT_ACTIVATION', label: 'Account Activation Request (Approval Required)' },
  { value: 'ACCOUNT_CLOSURE', label: 'Account Closure Request (Approval Required)' },
  { value: 'ACCOUNT_FREEZE', label: 'Account Freeze Request (Approval Required)' },
  { value: 'ACCOUNT_UNFREEZE', label: 'Account Unfreeze Request (Approval Required)' },
  { value: 'CONTACT_UPDATE', label: 'Customer Contact Update Request' },
  { value: 'NOMINEE_UPDATE', label: 'Nominee Update Request' },
];

export const TellerAccountsTab: React.FC = () => {
  const [accountNumberInput, setAccountNumberInput] = useState('ACC1001');
  const [account, setAccount] = useState<Account | null>(null);
  const [statement, setStatement] = useState<Transaction[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Service request submission state
  const [customerNumber, setCustomerNumber] = useState('CUST1001');
  const [requestType, setRequestType] = useState('ACCOUNT_FREEZE');
  const [description, setDescription] = useState('');
  const [submittedRequest, setSubmittedRequest] = useState<ServiceRequestItem | null>(null);
  const [submittingReq, setSubmittingReq] = useState(false);

  const lookupAccountAndStatement = async (targetPage = 0) => {
    const cleanAcc = accountNumberInput.trim().toUpperCase();
    if (!cleanAcc) return;
    setLoading(true);
    setError('');
    try {
      const [accRes, stmtRes] = await Promise.all([
        tellerApi.getAccountDetails(cleanAcc),
        tellerApi.getAccountStatement(
          cleanAcc,
          fromDate || undefined,
          toDate || undefined,
          targetPage,
          15
        ),
      ]);
      setAccount(accRes);
      setStatement(stmtRes.content || []);
      setTotalElements(stmtRes.totalElements || 0);
      setPage(targetPage);
    } catch (err) {
      setAccount(null);
      setStatement([]);
      setError(extractErrorMessage(err, 'Account enquiry failed (check branch authorization & account number).'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitServiceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReq(true);
    setError('');
    setSubmittedRequest(null);
    try {
      const created = await tellerApi.createServiceRequest({
        customerNumber: customerNumber.trim().toUpperCase(),
        accountNumber: account?.accountNumber || accountNumberInput.trim().toUpperCase() || undefined,
        requestType,
        description: description.trim(),
      });
      setSubmittedRequest(created);
      setDescription('');
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to submit account service request.'));
    } finally {
      setSubmittingReq(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalElements / 15));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1B130D]">Account Services &amp; Statement Enquiry</h2>
        <p className="text-sm text-[#3F3124]">
          Inspect branch account balances, view filtered transaction statements, and submit auditable account lifecycle requests. Sensitive actions route through Supervisor approval.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-900/10 border border-rose-700/30 text-sm text-rose-900">{error}</div>
      )}

      {/* Lookup Form */}
      <div className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-[#3F3124] mb-1">Account Number</label>
            <input
              type="text"
              value={accountNumberInput}
              onChange={(e) => setAccountNumberInput(e.target.value)}
              placeholder="e.g. ACC1001"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-sm font-mono text-[#1B130D]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#3F3124] mb-1">Statement From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-sm text-[#1B130D]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#3F3124] mb-1">Statement To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-sm text-[#1B130D]"
            />
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => lookupAccountAndStatement(0)}
            className="px-5 py-2.5 rounded-xl bg-[#261D15] text-[#F4ECE0] text-sm font-semibold hover:bg-[#3A2D21] flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Enquire Account
          </button>
        </div>

        {account && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <span className="text-[11px] font-semibold uppercase text-[#3F3124]">Account Holder</span>
              <p className="text-sm font-bold text-[#1B130D] mt-0.5">{account.customerName || 'Customer'}</p>
              <p className="text-xs font-mono text-[#70411A]">{account.accountNumber}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <span className="text-[11px] font-semibold uppercase text-[#3F3124]">Available Balance</span>
              <p className="text-lg font-bold font-mono text-[#1B130D] mt-0.5">
                {formatCurrency(account.balance, account.currency)}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <span className="text-[11px] font-semibold uppercase text-[#3F3124]">Account Status</span>
              <div className="mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeClass(account.status)}`}>
                  {account.status}
                </span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <span className="text-[11px] font-semibold uppercase text-[#3F3124]">Opened On</span>
              <p className="text-xs font-semibold text-[#1B130D] mt-1">{formatDateTime(account.createdAt)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Two columns: Statement Viewer + Account Service Request Submission */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-7 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#70411A]" />
              Account Statement Ledger
            </h3>
            <span className="text-xs text-[#3F3124]">{totalElements} entries</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#D9C7AB] text-[#3F3124] uppercase">
                  <th className="py-2 pr-2">Ref ID</th>
                  <th className="py-2 pr-2">Type</th>
                  <th className="py-2 pr-2 text-right">Amount</th>
                  <th className="py-2 pr-2">Date</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D0B4]">
                {statement.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-[#3F3124]">
                      Enter an account number above and click &ldquo;Enquire Account&rdquo; to load its live statement.
                    </td>
                  </tr>
                ) : (
                  statement.map((tx) => (
                    <tr key={tx.transactionId}>
                      <td className="py-2 pr-2 font-mono font-semibold">{tx.transactionId}</td>
                      <td className="py-2 pr-2">{tx.type}</td>
                      <td className="py-2 pr-2 text-right font-mono font-bold">{formatCurrency(tx.amount)}</td>
                      <td className="py-2 pr-2">{formatDateTime(tx.createdAt)}</td>
                      <td className="py-2 pr-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => printTransactionReceipt(tx, account?.accountNumber || '', account?.customerName || 'Account Holder')}
                          className="p-1.5 rounded-lg hover:bg-[#E9D9C0] text-[#70411A]"
                          title="Print receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadTransactionReceipt(tx, account?.accountNumber || '', account?.customerName || 'Account Holder')}
                          className="ml-1 text-[11px] font-semibold text-[#8E4322] hover:underline"
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalElements > 15 && (
            <div className="flex justify-between items-center pt-2 text-xs">
              <span>Page {page + 1} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 0}
                  onClick={() => lookupAccountAndStatement(page - 1)}
                  className="px-3 py-1 rounded-lg bg-[#F3E7D4] border border-[#D9C7AB] disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={page + 1 >= totalPages}
                  onClick={() => lookupAccountAndStatement(page + 1)}
                  className="px-3 py-1 rounded-lg bg-[#F3E7D4] border border-[#D9C7AB] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Account Service Request Form */}
        <form onSubmit={handleSubmitServiceRequest} className="xl:col-span-5 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-4">
          <h3 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
            <Landmark className="w-4 h-4 text-[#8E4322]" />
            Submit Account Service Request
          </h3>
          <div>
            <label className="block text-xs font-semibold text-[#3F3124] mb-1">Customer Number</label>
            <input
              type="text"
              required
              value={customerNumber}
              onChange={(e) => setCustomerNumber(e.target.value)}
              placeholder="CUST1001"
              className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-sm font-mono text-[#1B130D]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#3F3124] mb-1">Request Type</label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-sm text-[#1B130D]"
            >
              {SERVICE_REQUEST_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#3F3124] mb-1">Reason / Operational Details</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Document customer request verification details, nominee details, or compliance justification..."
              className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-sm text-[#1B130D]"
            />
          </div>
          <button
            type="submit"
            disabled={submittingReq}
            className="w-full py-2.5 rounded-xl bg-[#261D15] text-[#F4ECE0] text-sm font-semibold hover:bg-[#3A2D21] flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {submittingReq ? 'Submitting...' : 'Submit Account Request'}
          </button>

          {submittedRequest && (
            <div className="p-3 rounded-xl bg-emerald-900/10 border border-emerald-700/30 text-xs text-emerald-950 space-y-1">
              <div className="font-bold">Request Logged: {submittedRequest.requestId}</div>
              <div>
                Type: {submittedRequest.requestType} &bull; Approval: <span className="font-bold">{submittedRequest.approvalStatus}</span>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
