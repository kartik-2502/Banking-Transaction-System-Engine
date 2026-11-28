import React, { useEffect, useState } from 'react';
import { Download, Printer, RefreshCw, RotateCcw, Search } from 'lucide-react';
import { tellerApi } from '../../services/api';
import { ReversalItem, Transaction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { downloadTransactionReceipt, printTransactionReceipt } from '../../utils/receipt';
import {
  extractErrorMessage,
  formatCurrency,
  formatDateTime,
  getStatusBadgeClass,
} from './tellerFormatters';

export const TellerTransactionsTab: React.FC = () => {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [reversals, setReversals] = useState<ReversalItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Reversal modal
  const [revTargetTx, setRevTargetTx] = useState<Transaction | null>(null);
  const [revReason, setRevReason] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const canDecideReversal = Boolean(
    user?.roles?.some((r) => r === 'BANK_MANAGER' || r === 'ADMIN') ||
      user?.permissions?.includes('REVERSAL_APPROVE')
  );

  const loadData = async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const [txRes, revRes] = await Promise.all([
        tellerApi.searchTransactions({
          q: q.trim() || undefined,
          type: typeFilter,
          status: statusFilter,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          page: targetPage,
          size: 12,
        }),
        tellerApi.listReversals(0, 20),
      ]);
      setTransactions(txRes.content || []);
      setTotalElements(txRes.totalElements || 0);
      setReversals(revRes.content || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load branch transaction ledger.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter]);

  const handleRequestReversal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revTargetTx) return;
    setError('');
    setMessage('');
    try {
      const created = await tellerApi.requestReversal(revTargetTx.transactionId, revReason.trim());
      setMessage(`Reversal request ${created.reversalId} submitted for supervisor review.`);
      setRevTargetTx(null);
      setRevReason('');
      await loadData(page);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not log reversal request.'));
    }
  };

  const handleDecideReversal = async (reversalId: string, approved: boolean) => {
    setError('');
    setMessage('');
    try {
      const decided = await tellerApi.decideReversal(
        reversalId,
        approved,
        approved ? 'Verified & approved compensating reversal' : 'Rejected after ledger review'
      );
      setMessage(`Reversal ${decided.reversalId} updated to ${decided.status}.`);
      await loadData(page);
    } catch (err) {
      setError(extractErrorMessage(err, 'Reversal decision rejected.'));
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalElements / 12));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1B130D]">Transaction Management &amp; Reversals</h2>
        <p className="text-sm text-[#3F3124]">
          Filter branch transactions, reprint official customer receipts, request compensating reversals, and review supervisor approvals.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-900/10 border border-rose-700/30 text-sm text-rose-900">{error}</div>
      )}
      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-900/10 border border-emerald-700/30 text-sm text-emerald-900">{message}</div>
      )}

      {/* Filter Toolbar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
          loadData(0);
        }}
        className="p-4 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] flex flex-wrap gap-3 items-end"
      >
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[11px] font-semibold text-[#3F3124] mb-1">Search ID / Account</label>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="TXN... or ACC..."
            className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs font-mono"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-[#3F3124] mb-1">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
          >
            <option value="ALL">ALL TYPES</option>
            <option value="DEPOSIT">DEPOSIT</option>
            <option value="WITHDRAWAL">WITHDRAWAL</option>
            <option value="TRANSFER">TRANSFER</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-[#3F3124] mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
          >
            <option value="ALL">ALL STATUSES</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="PENDING">PENDING</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="FAILED">FAILED</option>
            <option value="REVERSED">REVERSED</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-[#3F3124] mb-1">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-[#3F3124] mb-1">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold flex items-center gap-1.5"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          Filter
        </button>
      </form>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#E9D9C0] text-[#3F3124] uppercase">
              <tr>
                <th className="py-3 px-4">Txn ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Accounts</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2D0B4]">
              {transactions.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-[#3F3124]">No matching transactions found.</td></tr>
              ) : (
                transactions.map((tx) => {
                  const acct = tx.sourceAccountNumber || tx.destinationAccountNumber || '';
                  return (
                    <tr key={tx.transactionId} className="hover:bg-[#E9D9C0]/50">
                      <td className="py-2.5 px-4 font-mono font-bold">{tx.transactionId}</td>
                      <td className="py-2.5 px-4 font-semibold">{tx.type}</td>
                      <td className="py-2.5 px-4 font-mono">
                        {tx.sourceAccountNumber || 'CASH'} &rarr; {tx.destinationAccountNumber || 'CASH'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold">{formatCurrency(tx.amount)}</td>
                      <td className="py-2.5 px-4">{formatDateTime(tx.createdAt)}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => printTransactionReceipt(tx, acct, 'Verified Branch Customer')}
                          className="p-1.5 rounded-lg bg-[#F3E7D4] border border-[#D9C7AB] text-[#1B130D]"
                          title="Print receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadTransactionReceipt(tx, acct, 'Verified Branch Customer')}
                          className="p-1.5 rounded-lg bg-[#F3E7D4] border border-[#D9C7AB] text-[#70411A]"
                          title="Download receipt"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {tx.status === 'SUCCESS' && (
                          <button
                            type="button"
                            onClick={() => setRevTargetTx(tx)}
                            className="px-2 py-1 rounded-lg bg-[#8E4322] text-white font-semibold inline-flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" /> Reverse
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-[#E9D9C0]/60 border-t border-[#D9C7AB] flex items-center justify-between text-xs">
          <span>Total {totalElements} transactions (Page {page + 1} of {totalPages})</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => {
                const next = page - 1;
                setPage(next);
                loadData(next);
              }}
              className="px-3 py-1 rounded-lg bg-[#EFE2CE] border border-[#D9C7AB] disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => {
                const next = page + 1;
                setPage(next);
                loadData(next);
              }}
              className="px-3 py-1 rounded-lg bg-[#EFE2CE] border border-[#D9C7AB] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Reversal Queue Table */}
      <div className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
        <h3 className="text-base font-bold text-[#1B130D]">Transaction Reversal Requests &amp; Supervisor Queue</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#E9D9C0] text-[#3F3124]">
              <tr>
                <th className="py-2 px-3">Reversal ID</th>
                <th className="py-2 px-3">Original Txn</th>
                <th className="py-2 px-3">Account</th>
                <th className="py-2 px-3 text-right">Amount</th>
                <th className="py-2 px-3">Requested By / Reason</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3 text-right">Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2D0B4]">
              {reversals.length === 0 ? (
                <tr><td colSpan={7} className="py-5 text-center text-[#3F3124]">No reversal requests on record.</td></tr>
              ) : (
                reversals.map((r) => (
                  <tr key={r.reversalId}>
                    <td className="py-2 px-3 font-mono font-bold">{r.reversalId}</td>
                    <td className="py-2 px-3 font-mono">{r.transactionId}</td>
                    <td className="py-2 px-3 font-mono">{r.accountNumber || '—'}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold">{formatCurrency(r.amount)}</td>
                    <td className="py-2 px-3">
                      <span className="font-semibold">{r.requestedBy}</span>: {r.reason}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      {r.status === 'PENDING' && canDecideReversal ? (
                        <div className="inline-flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDecideReversal(r.reversalId, true)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecideReversal(r.reversalId, false)}
                            className="px-2.5 py-1 rounded-lg bg-rose-800 text-white font-semibold"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[#3F3124]">
                          {r.reversalTransactionId ? `Comp: ${r.reversalTransactionId}` : r.reviewedBy || 'Pending'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reversal Request Modal */}
      {revTargetTx && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleRequestReversal}
            className="bg-[#F3E7D4] border border-[#CEB896] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-[#1B130D]">Submit Reversal Request</h3>
            <div className="text-xs text-[#3F3124] p-3 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB]">
              Original Txn: <strong className="font-mono">{revTargetTx.transactionId}</strong> &bull; Amount:{' '}
              <strong className="font-mono">{formatCurrency(revTargetTx.amount)}</strong>
            </div>
            <textarea
              required
              rows={3}
              value={revReason}
              onChange={(e) => setRevReason(e.target.value)}
              placeholder="State exact error/dispute reason (requires Bank Manager approval; teller cannot self-approve)..."
              className="w-full px-3 py-2 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB] text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRevTargetTx(null)}
                className="px-4 py-2 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#8E4322] text-white text-xs font-semibold"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
