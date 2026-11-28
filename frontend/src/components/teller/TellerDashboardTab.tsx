import React, { useEffect, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  Clock,
  FileCheck2,
  Landmark,
  RefreshCw,
  Search,
  Wallet,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Building2,
} from 'lucide-react';
import { tellerApi } from '../../services/api';
import { TellerDashboardData, Transaction } from '../../types';
import {
  formatCurrency,
  formatDateTime,
  getStatusBadgeClass,
  maskAccountNumber,
  extractErrorMessage,
} from './tellerFormatters';

export type TellerTabId =
  | 'dashboard'
  | 'customers'
  | 'accounts'
  | 'cash'
  | 'transfers'
  | 'transactions'
  | 'cheques'
  | 'service-requests'
  | 'complaints'
  | 'reports'
  | 'profile';

interface Props {
  onNavigateTab: (tab: TellerTabId) => void;
  onSelectTransactionReceipt?: (tx: Transaction) => void;
}

export const TellerDashboardTab: React.FC<Props> = ({ onNavigateTab }) => {
  const [data, setData] = useState<TellerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unmaskedAccounts, setUnmaskedAccounts] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await tellerApi.getDashboard();
      setData(res);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load teller operational dashboard.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="p-8 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] text-[#3F3124] flex items-center gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-[#70411A]" />
        <span>Loading real-time teller branch operations...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-900/10 border border-rose-700/30 text-rose-900 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
        <button
          onClick={loadDashboard}
          className="px-4 py-2 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const summaryCards = [
    {
      label: "Today's Cash Deposits",
      value: formatCurrency(data.todayCashDeposits),
      sub: `Received in drawer: ${formatCurrency(data.cashReceived)}`,
      icon: ArrowDownCircle,
      accent: 'text-emerald-900 bg-emerald-900/10 border-emerald-700/20',
    },
    {
      label: "Today's Cash Withdrawals",
      value: formatCurrency(data.todayCashWithdrawals),
      sub: `Paid from drawer: ${formatCurrency(data.cashPaidOut)}`,
      icon: ArrowUpCircle,
      accent: 'text-rose-900 bg-rose-900/10 border-rose-700/20',
    },
    {
      label: 'Total Transactions Processed',
      value: String(data.totalTransactionsProcessed),
      sub: `${data.successfulTransactions} success • ${data.failedTransactions} failed`,
      icon: ArrowLeftRight,
      accent: 'text-[#70411A] bg-[#70411A]/10 border-[#70411A]/20',
    },
    {
      label: 'Current Teller Drawer Balance',
      value: formatCurrency(data.drawerBalance),
      sub: `Drawer ${data.tellerProfile?.drawerCode || '—'} (${data.drawerStatus})`,
      icon: Wallet,
      accent: 'text-[#1B130D] bg-[#D9A86C]/25 border-[#D9A86C]/40',
    },
    {
      label: 'Pending Transactions',
      value: String(data.pendingTransactions),
      sub: `Approvals awaiting queue: ${data.pendingApprovals}`,
      icon: Clock,
      accent: 'text-amber-900 bg-amber-900/10 border-amber-700/20',
    },
    {
      label: 'Pending Service Requests',
      value: String(data.pendingServiceRequests),
      sub: `${data.pendingCheques} cheques • ${data.openComplaints} complaints`,
      icon: FileCheck2,
      accent: 'text-[#8E4322] bg-[#8E4322]/10 border-[#8E4322]/20',
    },
  ];

  const quickActions: { id: TellerTabId; label: string; desc: string; icon: React.ElementType }[] = [
    { id: 'cash', label: 'Cash Deposit', desc: 'Credit account & drawer', icon: ArrowDownCircle },
    { id: 'cash', label: 'Cash Withdrawal', desc: 'Verified cash payout', icon: ArrowUpCircle },
    { id: 'transfers', label: 'Fund Transfer', desc: 'Internal / NEFT / RTGS / IMPS', icon: ArrowLeftRight },
    { id: 'customers', label: 'Customer Search', desc: 'KYC, accounts & history', icon: Search },
    { id: 'accounts', label: 'Account Enquiry', desc: 'Balances & statements', icon: Landmark },
    { id: 'cheques', label: 'Cheque Deposit', desc: 'Register & track clearing', icon: FileCheck2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1B130D] tracking-tight">Teller Operations Dashboard</h2>
          <p className="text-sm text-[#3F3124]">
            Live branch drawer telemetry, queue workload, and transaction feed for {data.tellerProfile?.branchName} ({data.tellerProfile?.branchCode})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setUnmaskedAccounts((v) => !v)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#EFE2CE] border border-[#D9C7AB] text-[#1B130D] hover:bg-[#E9D9C0]"
          >
            {unmaskedAccounts ? 'Mask Accounts' : 'Reveal Accounts'}
          </button>
          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#261D15] text-[#F4ECE0] hover:bg-[#3A2D21] flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* 6 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] shadow-sm flex items-start justify-between gap-3"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#3F3124]">{card.label}</p>
                <p className="text-2xl font-bold text-[#1B130D] mt-1 font-mono">{card.value}</p>
                <p className="text-xs text-[#3F3124] mt-1.5">{card.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${card.accent}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Row: Daily Summary + Teller Info + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* A. Daily Transaction Summary */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1B130D]">A. Daily Transaction Summary</h3>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-semibold text-[#8E4322] hover:underline"
            >
              Full Report &rarr;
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <p className="text-xs text-[#3F3124]">Total Deposits</p>
              <p className="font-bold text-[#1B130D] font-mono mt-0.5">{formatCurrency(data.todayCashDeposits)}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <p className="text-xs text-[#3F3124]">Total Withdrawals</p>
              <p className="font-bold text-[#1B130D] font-mono mt-0.5">{formatCurrency(data.todayCashWithdrawals)}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <p className="text-xs text-[#3F3124]">Total Transfers</p>
              <p className="font-bold text-[#1B130D] font-mono mt-0.5">{formatCurrency(data.todayTransfers)}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <p className="text-xs text-[#3F3124]">Opening Balance</p>
              <p className="font-bold text-[#1B130D] font-mono mt-0.5">{formatCurrency(data.openingBalance)}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-emerald-900/10 border border-emerald-700/20 text-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-900 mx-auto mb-1" />
              <div className="text-lg font-bold text-emerald-900 font-mono">{data.successfulTransactions}</div>
              <div className="text-[11px] font-medium text-emerald-900">Successful</div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-900/10 border border-rose-700/20 text-center">
              <XCircle className="w-4 h-4 text-rose-900 mx-auto mb-1" />
              <div className="text-lg font-bold text-rose-900 font-mono">{data.failedTransactions}</div>
              <div className="text-[11px] font-medium text-rose-900">Failed</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-900/10 border border-amber-700/20 text-center">
              <Clock className="w-4 h-4 text-amber-900 mx-auto mb-1" />
              <div className="text-lg font-bold text-amber-900 font-mono">{data.pendingTransactions}</div>
              <div className="text-[11px] font-medium text-amber-900">Pending</div>
            </div>
          </div>
        </div>

        {/* B. Quick Actions */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
          <h3 className="text-base font-bold text-[#1B130D]">B. Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map((qa) => {
              const Icon = qa.icon;
              return (
                <button
                  key={qa.label}
                  type="button"
                  onClick={() => onNavigateTab(qa.id)}
                  className="p-3 rounded-xl bg-[#F3E7D4] hover:bg-[#E9D9C0] border border-[#D9C7AB] text-left transition-all group"
                >
                  <Icon className="w-4 h-4 text-[#8E4322] group-hover:scale-110 transition-transform mb-1.5" />
                  <div className="text-xs font-bold text-[#1B130D]">{qa.label}</div>
                  <div className="text-[11px] text-[#3F3124] truncate">{qa.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* E. Teller Information */}
        <div className="lg:col-span-3 p-5 rounded-2xl bg-[#261D15] text-[#F4ECE0] border border-[#3F3124] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#D9A86C] uppercase tracking-wider">E. Teller Information</h3>
            <Building2 className="w-4 h-4 text-[#D9A86C]" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-white/10">
              <span className="text-[#CEB896]">Teller Username</span>
              <span className="font-mono font-semibold">{data.tellerProfile?.username}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/10">
              <span className="text-[#CEB896]">Employee ID</span>
              <span className="font-mono font-semibold">{data.tellerProfile?.employeeId}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/10">
              <span className="text-[#CEB896]">Teller ID</span>
              <span className="font-mono font-semibold">{data.tellerProfile?.tellerId}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/10">
              <span className="text-[#CEB896]">Assigned Branch</span>
              <span className="font-semibold text-right">
                {data.tellerProfile?.branchCode} • {data.tellerProfile?.branchCity}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/10">
              <span className="text-[#CEB896]">Drawer Counter</span>
              <span className="font-mono font-semibold">{data.tellerProfile?.drawerCode}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#CEB896]">Shift Status</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#D9A86C]/20 text-[#D9A86C]">
                {data.tellerProfile?.shiftStatus}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('profile')}
            className="w-full py-2 rounded-xl bg-[#D9A86C] text-[#1B130D] text-xs font-bold hover:opacity-95"
          >
            Manage Shift &amp; Profile
          </button>
        </div>
      </div>

      {/* Row: C. Recent Transactions & D. Pending Requests */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* C. Recent Transactions */}
        <div className="xl:col-span-8 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1B130D]">C. Recent Branch Transactions</h3>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-xs font-semibold text-[#8E4322] hover:underline"
            >
              Manage All &rarr;
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#D9C7AB] text-[#3F3124] uppercase tracking-wider">
                  <th className="py-2 pr-3">Transaction ID</th>
                  <th className="py-2 pr-3">Account</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3 text-right">Amount</th>
                  <th className="py-2 pr-3">Date &amp; Time</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D0B4]">
                {data.recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-[#3F3124]">
                      No recent transactions recorded for this branch yet.
                    </td>
                  </tr>
                ) : (
                  data.recentTransactions.map((tx) => {
                    const acct = tx.sourceAccountNumber || tx.destinationAccountNumber || '—';
                    return (
                      <tr key={tx.transactionId} className="hover:bg-[#E9D9C0]/60">
                        <td className="py-2.5 pr-3 font-mono font-semibold text-[#1B130D]">{tx.transactionId}</td>
                        <td className="py-2.5 pr-3 font-mono text-[#3F3124]">
                          {unmaskedAccounts ? acct : maskAccountNumber(acct)}
                          {tx.destinationAccountNumber && tx.sourceAccountNumber ? (
                            <span className="ml-1 text-[10px] text-[#70411A]">
                              &rarr; {unmaskedAccounts ? tx.destinationAccountNumber : maskAccountNumber(tx.destinationAccountNumber)}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-2.5 pr-3 font-semibold">{tx.type}</td>
                        <td className="py-2.5 pr-3 text-right font-mono font-bold text-[#1B130D]">
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="py-2.5 pr-3 text-[#3F3124]">{formatDateTime(tx.createdAt)}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(tx.status)}`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* D. Pending Requests */}
        <div className="xl:col-span-4 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
          <h3 className="text-base font-bold text-[#1B130D]">D. Pending Branch Queues</h3>
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => onNavigateTab('service-requests')}
              className="w-full p-3.5 rounded-xl bg-[#F3E7D4] hover:bg-[#E9D9C0] border border-[#D9C7AB] flex items-center justify-between text-left"
            >
              <div>
                <div className="text-sm font-bold text-[#1B130D]">Account Service Requests</div>
                <div className="text-xs text-[#3F3124]">Opening, closure, freeze/unfreeze, contact</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#261D15] text-[#F4ECE0] font-mono text-xs font-bold">
                {data.pendingServiceRequests}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('cheques')}
              className="w-full p-3.5 rounded-xl bg-[#F3E7D4] hover:bg-[#E9D9C0] border border-[#D9C7AB] flex items-center justify-between text-left"
            >
              <div>
                <div className="text-sm font-bold text-[#1B130D]">Cheque Clearing Queue</div>
                <div className="text-xs text-[#3F3124]">Deposits awaiting clearing confirmation</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#70411A] text-[#F4ECE0] font-mono text-xs font-bold">
                {data.pendingCheques}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('complaints')}
              className="w-full p-3.5 rounded-xl bg-[#F3E7D4] hover:bg-[#E9D9C0] border border-[#D9C7AB] flex items-center justify-between text-left"
            >
              <div>
                <div className="text-sm font-bold text-[#1B130D]">Open Customer Complaints</div>
                <div className="text-xs text-[#3F3124]">Disputes &amp; escalated cases</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#8E4322] text-[#F4ECE0] font-mono text-xs font-bold">
                {data.openComplaints}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('transactions')}
              className="w-full p-3.5 rounded-xl bg-[#F3E7D4] hover:bg-[#E9D9C0] border border-[#D9C7AB] flex items-center justify-between text-left"
            >
              <div>
                <div className="text-sm font-bold text-[#1B130D]">Pending Transactions &amp; Approvals</div>
                <div className="text-xs text-[#3F3124]">Under-review txns &amp; supervisor queue</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-900 text-[#F4ECE0] font-mono text-xs font-bold">
                {data.pendingTransactions + data.pendingApprovals}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
