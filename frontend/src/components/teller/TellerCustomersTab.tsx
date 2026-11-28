import React, { useEffect, useState } from 'react';
import { Eye, Search, ShieldCheck, UserCheck, X, RefreshCw } from 'lucide-react';
import { tellerApi } from '../../services/api';
import { ServiceRequestItem, TellerCustomerSummary, Transaction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  extractErrorMessage,
  formatCurrency,
  formatDateTime,
  getStatusBadgeClass,
  maskAccountNumber,
} from './tellerFormatters';

export const TellerCustomersTab: React.FC = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [kycFilter, setKycFilter] = useState('ALL');
  const [customers, setCustomers] = useState<TellerCustomerSummary[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // History modal
  const [selectedHistory, setSelectedHistory] = useState<{
    customer: TellerCustomerSummary;
    transactions: Transaction[];
    serviceRequests: ServiceRequestItem[];
  } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [kycUpdating, setKycUpdating] = useState(false);

  const canVerifyKyc = Boolean(
    user?.roles?.some((r) => r === 'BANK_MANAGER' || r === 'ADMIN') ||
      user?.permissions?.includes('KYC_VERIFY')
  );

  const fetchCustomers = async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await tellerApi.searchCustomers(query.trim() || undefined, kycFilter, targetPage, 10);
      setCustomers(res.content || []);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to search branch customers.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kycFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchCustomers(0);
  };

  const openCustomerHistory = async (customerNumber: string) => {
    setHistoryLoading(true);
    setError('');
    try {
      const res = await tellerApi.getCustomerHistory(customerNumber);
      setSelectedHistory(res);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load customer profile & history.'));
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleKycChange = async (customerNumber: string, kycStatus: string) => {
    setKycUpdating(true);
    setError('');
    setMessage('');
    try {
      const updated = await tellerApi.updateCustomerKyc(customerNumber, kycStatus);
      setMessage(`KYC status for ${updated.fullName} updated to ${updated.kycStatus}.`);
      setCustomers((prev) => prev.map((c) => (c.customerNumber === customerNumber ? updated : c)));
      if (selectedHistory?.customer.customerNumber === customerNumber) {
        setSelectedHistory({ ...selectedHistory, customer: updated });
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'KYC update rejected.'));
    } finally {
      setKycUpdating(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalElements / 10));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[#1B130D]">Customer Management (Branch Scoped)</h2>
        <p className="text-sm text-[#3F3124]">
          Search assigned branch customers by name, Customer ID, account number, or registered mobile. Identity/KYC approval requires Bank Manager or Admin authority.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-900/10 border border-rose-700/30 text-sm text-rose-900">{error}</div>
      )}
      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-900/10 border border-emerald-700/30 text-sm text-emerald-900">{message}</div>
      )}

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="p-4 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#3F3124] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Name, Customer ID (CUST1001), Account Number (ACC1001), or Mobile..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-sm text-[#1B130D] focus:outline-none focus:ring-2 focus:ring-[#70411A]/30"
          />
        </div>
        <select
          value={kycFilter}
          onChange={(e) => {
            setKycFilter(e.target.value);
            setPage(0);
          }}
          className="px-3 py-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-sm text-[#1B130D]"
        >
          <option value="ALL">All KYC Statuses</option>
          <option value="VERIFIED">VERIFIED</option>
          <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
          <option value="REJECTED">REJECTED</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-[#261D15] text-[#F4ECE0] text-sm font-semibold hover:bg-[#3A2D21] flex items-center gap-2"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </form>

      {/* Customer Directory Table */}
      <div className="rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#E9D9C0] text-[#3F3124] uppercase tracking-wider border-b border-[#D9C7AB]">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact (Masked)</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">KYC Status</th>
                <th className="py-3 px-4">Linked Accounts</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2D0B4]">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-[#3F3124]">
                    {loading ? 'Searching branch directory...' : 'No customers matched in your assigned branch.'}
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.customerNumber} className="hover:bg-[#E9D9C0]/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-sm text-[#1B130D]">{c.fullName}</div>
                      <div className="font-mono text-[11px] text-[#70411A]">{c.customerNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-[#1B130D]">{c.maskedPhone}</div>
                      <div className="text-[11px] text-[#3F3124]">{c.maskedEmail}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {c.branchCode || '—'} <span className="font-normal text-[#3F3124]">({c.branchName || 'Branch'})</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(c.kycStatus)}`}>
                        {c.kycStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 space-y-1">
                      {(c.accounts || []).map((acc) => (
                        <div key={acc.accountNumber} className="flex items-center gap-2 font-mono">
                          <span className="font-semibold text-[#1B130D]">{maskAccountNumber(acc.accountNumber)}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] border ${getStatusBadgeClass(acc.status)}`}>
                            {acc.status}
                          </span>
                          <span className="text-[#3F3124]">{formatCurrency(acc.balance, acc.currency)}</span>
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openCustomerHistory(c.customerNumber)}
                        disabled={historyLoading}
                        className="px-3 py-1.5 rounded-lg bg-[#261D15] text-[#F4ECE0] font-semibold inline-flex items-center gap-1.5 hover:bg-[#3A2D21]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Profile &amp; History
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 bg-[#E9D9C0]/60 border-t border-[#D9C7AB] flex items-center justify-between text-xs text-[#3F3124]">
          <span>
            Showing {customers.length} of {totalElements} branch customers (Page {page + 1} of {totalPages})
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => {
                const next = page - 1;
                setPage(next);
                fetchCustomers(next);
              }}
              className="px-3 py-1 rounded-lg bg-[#EFE2CE] border border-[#D9C7AB] disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => {
                const next = page + 1;
                setPage(next);
                fetchCustomers(next);
              }}
              className="px-3 py-1 rounded-lg bg-[#EFE2CE] border border-[#D9C7AB] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Customer Profile & History Modal */}
      {selectedHistory && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F3E7D4] border border-[#CEB896] rounded-2xl max-w-4xl w-full max-h-[88vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#D9C7AB] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#70411A]" />
                  <h3 className="text-xl font-bold text-[#1B130D]">{selectedHistory.customer.fullName}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeClass(selectedHistory.customer.kycStatus)}`}>
                    {selectedHistory.customer.kycStatus}
                  </span>
                </div>
                <p className="text-xs text-[#3F3124] mt-1 font-mono">
                  {selectedHistory.customer.customerNumber} &bull; {selectedHistory.customer.maskedPhone} &bull;{' '}
                  {selectedHistory.customer.maskedEmail} &bull; Branch {selectedHistory.customer.branchCode}
                </p>
                {selectedHistory.customer.address && (
                  <p className="text-xs text-[#3F3124] mt-1">Address: {selectedHistory.customer.address}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistory(null)}
                className="p-2 rounded-lg hover:bg-[#E9D9C0] text-[#1B130D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* KYC Verification Section */}
            <div className="p-4 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-[#3F3124]">
                <ShieldCheck className="w-4 h-4 text-[#70411A]" />
                {canVerifyKyc
                  ? 'Supervisor Authority: Update customer KYC verification status.'
                  : 'Teller View-Only: Identity/KYC verification must be approved by a Bank Manager or Admin.'}
              </div>
              {canVerifyKyc && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={kycUpdating}
                    onClick={() => handleKycChange(selectedHistory.customer.customerNumber, 'VERIFIED')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900"
                  >
                    Approve KYC
                  </button>
                  <button
                    type="button"
                    disabled={kycUpdating}
                    onClick={() => handleKycChange(selectedHistory.customer.customerNumber, 'REJECTED')}
                    className="px-3 py-1.5 rounded-lg bg-rose-800 text-white text-xs font-semibold hover:bg-rose-900"
                  >
                    Reject KYC
                  </button>
                </div>
              )}
            </div>

            {/* Linked Accounts */}
            <div>
              <h4 className="text-sm font-bold text-[#1B130D] mb-2">Linked Bank Accounts</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedHistory.customer.accounts.map((acc) => (
                  <div key={acc.accountNumber} className="p-3.5 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB] flex justify-between items-center">
                    <div>
                      <div className="font-mono font-bold text-sm text-[#1B130D]">{acc.accountNumber}</div>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(acc.status)}`}>
                        {acc.status}
                      </span>
                    </div>
                    <div className="text-right font-mono font-bold text-[#1B130D]">
                      {formatCurrency(acc.balance, acc.currency)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Account Transactions */}
            <div>
              <h4 className="text-sm font-bold text-[#1B130D] mb-2">Account Transaction History ({selectedHistory.transactions.length})</h4>
              <div className="max-h-52 overflow-y-auto rounded-xl border border-[#D9C7AB] bg-[#EFE2CE]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#E9D9C0] sticky top-0 text-[#3F3124]">
                    <tr>
                      <th className="py-2 px-3">Txn ID</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2D0B4]">
                    {selectedHistory.transactions.length === 0 ? (
                      <tr><td colSpan={5} className="py-4 text-center text-[#3F3124]">No transactions found.</td></tr>
                    ) : (
                      selectedHistory.transactions.map((t) => (
                        <tr key={t.transactionId}>
                          <td className="py-2 px-3 font-mono font-semibold">{t.transactionId}</td>
                          <td className="py-2 px-3">{t.type}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold">{formatCurrency(t.amount)}</td>
                          <td className="py-2 px-3">{formatDateTime(t.createdAt)}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(t.status)}`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Service Request History */}
            <div>
              <h4 className="text-sm font-bold text-[#1B130D] mb-2">Service Request History ({selectedHistory.serviceRequests.length})</h4>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-[#D9C7AB] bg-[#EFE2CE]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#E9D9C0] sticky top-0 text-[#3F3124]">
                    <tr>
                      <th className="py-2 px-3">Request ID</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2D0B4]">
                    {selectedHistory.serviceRequests.length === 0 ? (
                      <tr><td colSpan={4} className="py-4 text-center text-[#3F3124]">No service requests logged.</td></tr>
                    ) : (
                      selectedHistory.serviceRequests.map((sr) => (
                        <tr key={sr.requestId}>
                          <td className="py-2 px-3 font-mono font-semibold">{sr.requestId}</td>
                          <td className="py-2 px-3">{sr.requestType}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(sr.status)}`}>
                              {sr.status}
                            </span>
                          </td>
                          <td className="py-2 px-3">{formatDateTime(sr.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
