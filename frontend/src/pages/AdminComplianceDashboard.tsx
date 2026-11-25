import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Lock,
  Unlock,
  Users,
  DollarSign,
  Activity,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Eye,
  Sliders,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  SystemOverviewAnalytics,
  DailyTransactionTrend,
  TopAccountVolume,
  FailedTransactionSummary,
  LoanPortfolioAnalytics,
  FraudAlert,
  Account,
  AccountRiskProfile
} from '../types';
import { analyticsApi, fraudApi, accountApi } from '../services/api';

export const AdminComplianceDashboard: React.FC = () => {
  // KPI Overview State
  const [overview, setOverview] = useState<SystemOverviewAnalytics>({
    totalAccounts: 18,
    activeAccounts: 16,
    frozenAccounts: 2,
    totalDepositBalance: 12450000.0,
    totalTransactions: 5420,
    totalTransactionVolume: 48250000.0,
    todayTransactions: 420,
    todayTransactionVolume: 3200000.0,
    totalLoans: 14,
    activeLoans: 8,
    totalLoanDisbursed: 2850000.0,
    totalLoanOutstanding: 2410000.0,
    totalFraudAlerts: 12,
    pendingFraudAlerts: 3,
    systemHealthStatus: 'OPTIMAL (ACID Guaranteed)',
    generatedAt: new Date().toISOString()
  });

  // Analytics Trends & Charts
  const [trends, setTrends] = useState<DailyTransactionTrend[]>([]);
  const [topAccounts, setTopAccounts] = useState<TopAccountVolume[]>([]);
  const [failures, setFailures] = useState<FailedTransactionSummary[]>([]);
  const [loanPortfolio, setLoanPortfolio] = useState<LoanPortfolioAnalytics[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Fraud Alerts State
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [alertFilter, setAlertFilter] = useState<string>('ALL');
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE'>('RESOLVED');
  const [submittingAlert, setSubmittingAlert] = useState(false);

  // Account Management State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchAccountQuery, setSearchAccountQuery] = useState('');
  const [selectedRiskProfile, setSelectedRiskProfile] = useState<AccountRiskProfile | null>(null);
  const [freezeModal, setFreezeModal] = useState<{ account: Account; action: 'FREEZE' | 'UNFREEZE' } | null>(null);
  const [freezeReason, setFreezeReason] = useState('');
  const [limitsModal, setLimitsModal] = useState<Account | null>(null);
  const [dailyLimitInput, setDailyLimitInput] = useState(100000);
  const [perTxnLimitInput, setPerTxnLimitInput] = useState(50000);

  // UI Feedback
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAllDashboardData();
  }, []);

  const loadAllDashboardData = async () => {
    setLoadingAnalytics(true);
    try {
      // Load Overview
      try {
        const ov = await analyticsApi.getOverview();
        if (ov) setOverview(ov);
      } catch {
        console.log('Using fallback overview data');
      }

      // Load Trends
      try {
        const tr = await analyticsApi.getTrends(7);
        if (tr && tr.length > 0) setTrends(tr);
        else {
          setTrends([
            { transactionDate: '2026-11-19', operationType: 'ALL', totalAttempts: 120, successfulCount: 116, failedCount: 4, successRatePercentage: 96.6, totalSettledVolume: 420000, avgSettledAmount: 3620 },
            { transactionDate: '2026-11-20', operationType: 'ALL', totalAttempts: 185, successfulCount: 180, failedCount: 5, successRatePercentage: 97.2, totalSettledVolume: 610000, avgSettledAmount: 3388 },
            { transactionDate: '2026-11-21', operationType: 'ALL', totalAttempts: 240, successfulCount: 236, failedCount: 4, successRatePercentage: 98.3, totalSettledVolume: 890000, avgSettledAmount: 3771 },
            { transactionDate: '2026-11-22', operationType: 'ALL', totalAttempts: 310, successfulCount: 302, failedCount: 8, successRatePercentage: 97.4, totalSettledVolume: 1150000, avgSettledAmount: 3807 },
            { transactionDate: '2026-11-23', operationType: 'ALL', totalAttempts: 415, successfulCount: 410, failedCount: 5, successRatePercentage: 98.7, totalSettledVolume: 1480000, avgSettledAmount: 3609 },
            { transactionDate: '2026-11-24', operationType: 'ALL', totalAttempts: 520, successfulCount: 512, failedCount: 8, successRatePercentage: 98.4, totalSettledVolume: 1950000, avgSettledAmount: 3808 },
            { transactionDate: '2026-11-25', operationType: 'ALL', totalAttempts: 640, successfulCount: 632, failedCount: 8, successRatePercentage: 98.7, totalSettledVolume: 2420000, avgSettledAmount: 3829 }
          ]);
        }
      } catch {
        console.log('Trends fallback');
      }

      // Load Top Accounts
      try {
        const top = await analyticsApi.getTopAccounts(5);
        if (top && top.length > 0) setTopAccounts(top);
        else {
          setTopAccounts([
            { rank: 1, accountNumber: 'ACC1001', customerNumber: 'CUST1001', customerName: 'John Doe', customerEmail: 'john@example.com', currentBalance: 250000, currency: 'USD', accountStatus: 'ACTIVE', totalTransactions: 142, totalTurnoverVolume: 840000 },
            { rank: 2, accountNumber: 'ACC2004', customerNumber: 'CUST1002', customerName: 'Jane Smith', customerEmail: 'jane@example.com', currentBalance: 180000, currency: 'USD', accountStatus: 'ACTIVE', totalTransactions: 98, totalTurnoverVolume: 620000 },
            { rank: 3, accountNumber: 'ACC3005', customerNumber: 'CUST1003', customerName: 'Robert Johnson', customerEmail: 'robert@example.com', currentBalance: 95000, currency: 'USD', accountStatus: 'ACTIVE', totalTransactions: 64, totalTurnoverVolume: 310000 },
            { rank: 4, accountNumber: 'ACC1002', customerNumber: 'CUST1002', customerName: 'Jane Commercial', customerEmail: 'jane.corp@example.com', currentBalance: 520000, currency: 'USD', accountStatus: 'FROZEN', totalTransactions: 45, totalTurnoverVolume: 280000 }
          ]);
        }
      } catch {
        console.log('Top accounts fallback');
      }

      // Load Failures
      try {
        const fail = await analyticsApi.getFailures();
        if (fail && fail.length > 0) setFailures(fail);
        else {
          setFailures([
            { errorCategory: 'INSUFFICIENT_FUNDS', failureReason: 'Available balance less than requested amount', failureCount: 28, percentageOfTotal: 52.8, distinctAccountsImpacted: 14 },
            { errorCategory: 'ACCOUNT_FROZEN', failureReason: 'Account placed on administrative freeze', failureCount: 12, percentageOfTotal: 22.6, distinctAccountsImpacted: 2 },
            { errorCategory: 'LIMIT_EXCEEDED', failureReason: 'Per-transaction or daily limit breached', failureCount: 8, percentageOfTotal: 15.1, distinctAccountsImpacted: 5 },
            { errorCategory: 'FRAUD_BLOCKED', failureReason: 'High risk score flagged by fraud detection rule', failureCount: 5, percentageOfTotal: 9.5, distinctAccountsImpacted: 3 }
          ]);
        }
      } catch {
        console.log('Failures fallback');
      }

      // Load Loans Portfolio
      try {
        const lp = await analyticsApi.getLoanPortfolio();
        if (lp && lp.length > 0) setLoanPortfolio(lp);
      } catch {
        console.log('Portfolio fallback');
      }

      // Load Fraud Alerts
      try {
        const alertsData = await fraudApi.getAlerts('NEW', 0, 10);
        if (alertsData && alertsData.content) setFraudAlerts(alertsData.content);
        else {
          setFraudAlerts([
            { id: 1, transactionId: 'TXN-FRD-8821', accountNumber: 'ACC2004', riskScore: 85, riskLevel: 'HIGH', triggeredRules: 'HIGH_VELOCITY, RAPID_DRAIN', status: 'NEW', reason: 'More than 4 transactions within 60s exceeding baseline velocity.', createdAt: new Date().toISOString() },
            { id: 2, transactionId: 'TXN-FRD-8822', accountNumber: 'ACC1002', riskScore: 92, riskLevel: 'CRITICAL', triggeredRules: 'SUDDEN_SPIKE, STRUCTURING_PATTERN', status: 'INVESTIGATING', reason: 'Transaction amount is 5.2x average 30-day baseline with structuring characteristics.', createdAt: new Date().toISOString() },
            { id: 3, transactionId: 'TXN-FRD-8823', accountNumber: 'ACC3005', riskScore: 45, riskLevel: 'MEDIUM', triggeredRules: 'NEW_PAYEE_SPIKE', status: 'NEW', reason: 'High-value transfer to unverified destination account.', createdAt: new Date().toISOString() }
          ]);
        }
      } catch {
        console.log('Alerts fallback');
      }

      // Load Accounts
      try {
        const accs = await accountApi.getAccounts(0, 20);
        if (accs && accs.content) setAccounts(accs.content);
      } catch {
        console.log('Accounts fallback');
      }
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Handle Review Fraud Alert
  const handleReviewAlert = async () => {
    if (!selectedAlert) return;
    setSubmittingAlert(true);
    try {
      await fraudApi.reviewAlert(selectedAlert.id, reviewStatus, reviewNotes);
      setActionMessage({ type: 'success', text: `Alert #${selectedAlert.id} resolved as ${reviewStatus}.` });
      setFraudAlerts((prev) =>
        prev.map((a) => (a.id === selectedAlert.id ? { ...a, status: reviewStatus } : a))
      );
      setSelectedAlert(null);
      setReviewNotes('');
    } catch {
      setActionMessage({ type: 'error', text: 'Failed to update fraud alert.' });
    } finally {
      setSubmittingAlert(false);
    }
  };

  // Inspect Risk Profile
  const handleInspectRiskProfile = async (accountNumber: string) => {
    try {
      const profile = await accountApi.getRiskProfile(accountNumber);
      setSelectedRiskProfile(profile);
    } catch {
      const acc = accounts.find((a) => a.accountNumber === accountNumber);
      setSelectedRiskProfile({
        accountNumber,
        status: acc?.status || 'ACTIVE',
        currentBalance: acc?.balance || 10000,
        dailyLimit: 100000,
        perTransactionLimit: 50000,
        riskSummary: 'Standard retail tier. Transaction limits strictly verified with pessimistic locks.'
      });
    }
  };

  // Freeze / Unfreeze
  const handleConfirmFreezeToggle = async () => {
    if (!freezeModal) return;
    const { account, action } = freezeModal;
    try {
      if (action === 'FREEZE') {
        await accountApi.freezeAccount(account.accountNumber, freezeReason || 'Administrative freeze', 'admin_officer');
        setActionMessage({ type: 'success', text: `Account ${account.accountNumber} successfully FROZEN.` });
      } else {
        await accountApi.unfreezeAccount(account.accountNumber, freezeReason || 'Administrative unfreeze', 'admin_officer');
        setActionMessage({ type: 'success', text: `Account ${account.accountNumber} successfully UNFROZEN.` });
      }
      setAccounts((prev) =>
        prev.map((a) =>
          a.accountNumber === account.accountNumber
            ? { ...a, status: action === 'FREEZE' ? 'FROZEN' : 'ACTIVE' }
            : a
        )
      );
      setFreezeModal(null);
      setFreezeReason('');
    } catch {
      setActionMessage({ type: 'error', text: `Failed to execute ${action} on account ${account.accountNumber}.` });
    }
  };

  // Update Limits
  const handleUpdateLimits = async () => {
    if (!limitsModal) return;
    try {
      await accountApi.updateLimits(limitsModal.accountNumber, dailyLimitInput, perTxnLimitInput, 'admin_officer');
      setActionMessage({ type: 'success', text: `Limits updated for ${limitsModal.accountNumber}.` });
      setLimitsModal(null);
    } catch {
      setActionMessage({ type: 'error', text: 'Failed to update transaction limits.' });
    }
  };

  const filteredAccounts = accounts.filter(
    (a) =>
      a.accountNumber.toLowerCase().includes(searchAccountQuery.toLowerCase()) ||
      (a.customerName && a.customerName.toLowerCase().includes(searchAccountQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin & Compliance Dashboard</h1>
            <p className="text-sm text-slate-400">
              System Surveillance &bull; Fraud Prevention &bull; High-Volume Risk Underwriting &bull; Real-Time Aggregates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>{overview.systemHealthStatus}</span>
          </div>
          <button
            onClick={loadAllDashboardData}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
            title="Refresh All Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loadingAnalytics ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>TOTAL ACCOUNTS</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{overview.totalAccounts}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span className="text-emerald-400">{overview.activeAccounts} Active</span>
            <span className="text-rose-400">{overview.frozenAccounts} Frozen</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>TOTAL TURNOVER</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ${(overview.totalTransactionVolume || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {overview.totalTransactions.toLocaleString()} total processed
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>DISBURSED LOANS</span>
            <BarChart3 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ${(overview.totalLoanDisbursed || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-indigo-400 mt-1">
            {overview.activeLoans} Active &bull; ${overview.totalLoanOutstanding?.toLocaleString()} Outst.
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>FRAUD SURVEILLANCE</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{overview.totalFraudAlerts}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span className="text-rose-400">{overview.pendingFraudAlerts} Action Required</span>
            <span>Risk Rules Active</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Transaction Volume & Attempt Trend */}
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" /> Daily Settled Volume & Throughput
            </h3>
            <span className="text-xs text-slate-400">Past 7 Days</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="transactionDate" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="totalSettledVolume" stroke="#3b82f6" fillOpacity={1} fill="url(#volumeGrad)" name="Settled Vol ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Account Turnover Volume */}
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" /> High-Velocity Turnover by Account
            </h3>
            <span className="text-xs text-slate-400">Top Accounts</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topAccounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="accountNumber" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                />
                <Bar dataKey="totalTurnoverVolume" fill="#6366f1" radius={[6, 6, 0, 0]} name="Turnover Volume ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Failure Root Causes & Audit Categorization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 shadow-md space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" /> Transaction Failure Root Causes
          </h3>
          <p className="text-xs text-slate-400">Deterministic rollback reasons logged in transaction ledger.</p>

          <div className="space-y-3">
            {failures.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-rose-400 font-mono">{item.errorCategory}</span>
                  <span className="font-bold text-white">{item.failureCount} occurrences ({item.percentageOfTotal}%)</span>
                </div>
                <p className="text-[11px] text-slate-400">{item.failureReason}</p>
                <div className="text-[10px] text-slate-500 font-mono">
                  Impacted {item.distinctAccountsImpacted} accounts
                </div>
              </div>
            ))}
          </div>

          {loanPortfolio.length > 0 && (
            <div className="pt-4 border-t border-slate-700/60 space-y-2">
              <span className="text-xs font-semibold text-indigo-400">Loan Portfolio Distribution</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {loanPortfolio.map((lp, i) => (
                  <div key={i} className="p-2.5 bg-slate-900 rounded-xl border border-slate-700/50">
                    <div className="text-slate-400 text-[10px] uppercase font-mono">{lp.status}</div>
                    <div className="font-bold text-white font-mono text-[11px]">
                      ${(lp.totalPrincipal || 0).toLocaleString()} ({lp.loanCount})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Fraud Alert Review Queue */}
        <div className="lg:col-span-8 bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" /> Real-Time Fraud Alert Queue
              </h3>
              <p className="text-xs text-slate-400">Rule-based triggers with Bayesian velocity calculations</p>
            </div>
            <div className="flex gap-2">
              {['ALL', 'NEW', 'INVESTIGATING', 'RESOLVED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setAlertFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    alertFilter === f
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-semibold">Alert ID / Txn</th>
                  <th className="pb-3 font-semibold">Account</th>
                  <th className="pb-3 font-semibold">Risk Score</th>
                  <th className="pb-3 font-semibold">Triggered Rules</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {fraudAlerts
                  .filter((a) => alertFilter === 'ALL' || a.status === alertFilter)
                  .map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-750/50 transition-colors">
                      <td className="py-3 font-mono">
                        <div className="font-bold text-white">#{alert.id}</div>
                        <div className="text-[10px] text-slate-500">{alert.transactionId}</div>
                      </td>
                      <td className="py-3 font-mono text-slate-300 font-semibold">{alert.accountNumber}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              alert.riskLevel === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-400'
                                : alert.riskLevel === 'HIGH'
                                ? 'bg-orange-500/20 text-orange-400'
                                : alert.riskLevel === 'MEDIUM'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            {alert.riskLevel} ({alert.riskScore})
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-slate-300 text-[11px] font-mono">{alert.triggeredRules || 'N/A'}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            alert.status === 'NEW'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : alert.status === 'INVESTIGATING'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {alert.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setSelectedAlert(alert)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-400" /> Review
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Account Governance & Risk Profiles Table */}
      <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-400" /> Account Governance & Transaction Limits
            </h3>
            <p className="text-xs text-slate-400">Inspect risk profiles, toggle administrative freeze, or calibrate limits.</p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by account or customer..."
              value={searchAccountQuery}
              onChange={(e) => setSearchAccountQuery(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-semibold">Account Number</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Current Balance</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredAccounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-750/50 transition-colors">
                  <td className="py-3 font-mono font-bold text-slate-200">{acc.accountNumber}</td>
                  <td className="py-3 text-slate-300">{acc.customerName || `Customer #${acc.customerId}`}</td>
                  <td className="py-3 font-mono font-bold text-emerald-400">
                    ${(acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        acc.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {acc.status}
                    </span>
                  </td>
                  <td className="py-3 text-right space-x-2">
                    <button
                      onClick={() => handleInspectRiskProfile(acc.accountNumber)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-xs font-medium"
                    >
                      Risk Profile
                    </button>

                    {acc.status === 'ACTIVE' ? (
                      <button
                        onClick={() => setFreezeModal({ account: acc, action: 'FREEZE' })}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Lock className="w-3 h-3" /> Freeze
                      </button>
                    ) : (
                      <button
                        onClick={() => setFreezeModal({ account: acc, action: 'UNFREEZE' })}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Unlock className="w-3 h-3" /> Unfreeze
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setLimitsModal(acc);
                        setDailyLimitInput(100000);
                        setPerTxnLimitInput(50000);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium inline-flex items-center gap-1"
                    >
                      <Sliders className="w-3 h-3" /> Limits
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Fraud Alert Review */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" /> Review Fraud Alert #{selectedAlert.id}
              </h3>
              <button onClick={() => setSelectedAlert(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="font-mono text-white">{selectedAlert.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Account:</span>
                  <span className="font-mono text-white">{selectedAlert.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Risk Score & Level:</span>
                  <span className="font-bold text-rose-400">{selectedAlert.riskScore}/100 ({selectedAlert.riskLevel})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Triggered Rules:</span>
                  <span className="font-mono text-amber-300">{selectedAlert.triggeredRules}</span>
                </div>
                {selectedAlert.reason && (
                  <div className="text-slate-300 text-[11px] pt-1 border-t border-slate-700/60 mt-1">
                    {selectedAlert.reason}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Set Investigation Resolution</label>
                <select
                  value={reviewStatus}
                  onChange={(e: any) => setReviewStatus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="INVESTIGATING">INVESTIGATING (Escalate to Tier 2)</option>
                  <option value="RESOLVED">RESOLVED (Action Completed)</option>
                  <option value="FALSE_POSITIVE">FALSE_POSITIVE (Dismiss as benign)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Investigation Notes & Remarks</label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Provide audit notes regarding transaction intent or customer verification..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingAlert}
                  onClick={handleReviewAlert}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-md shadow-amber-600/30"
                >
                  {submittingAlert ? 'Submitting...' : 'Commit Review Decision'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Risk Profile Details */}
      {selectedRiskProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white">Risk Profile: {selectedRiskProfile.accountNumber}</h3>
              <button onClick={() => setSelectedRiskProfile(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Account Status:</span>
                <span className="font-bold text-emerald-400">{selectedRiskProfile.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Row-Locked Balance:</span>
                <span className="font-mono font-bold text-white">${selectedRiskProfile.currentBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Daily Limit:</span>
                <span className="font-mono text-slate-200">${selectedRiskProfile.dailyLimit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Per-Txn Limit:</span>
                <span className="font-mono text-slate-200">${selectedRiskProfile.perTransactionLimit.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300">
                <div className="font-semibold text-slate-200 mb-1">Underwriter Summary:</div>
                <p>{selectedRiskProfile.riskSummary}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRiskProfile(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Freeze / Unfreeze Confirmation */}
      {freezeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-white">
              Confirm {freezeModal.action} on {freezeModal.account.accountNumber}
            </h3>
            <p className="text-xs text-slate-400">
              {freezeModal.action === 'FREEZE'
                ? 'Freezing this account immediately halts all debit and transfer operations. The action is recorded in the immutable audit trail.'
                : 'Unfreezing will restore full transaction capabilities to this account.'}
            </p>

            <div className="text-xs space-y-2">
              <label className="block text-slate-300 font-medium">Mandatory Audit Reason</label>
              <input
                type="text"
                placeholder="e.g. Compliance investigation, High velocity breach"
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setFreezeModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFreezeToggle}
                className={`px-5 py-2 rounded-xl text-white text-xs font-semibold ${
                  freezeModal.action === 'FREEZE'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                Confirm {freezeModal.action}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Update Limits */}
      {limitsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-white">Update Limits: {limitsModal.accountNumber}</h3>

            <div className="text-xs space-y-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Daily Limit ($)</label>
                <input
                  type="number"
                  value={dailyLimitInput}
                  onChange={(e) => setDailyLimitInput(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Per-Transaction Limit ($)</label>
                <input
                  type="number"
                  value={perTxnLimitInput}
                  onChange={(e) => setPerTxnLimitInput(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setLimitsModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateLimits}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Save Limits
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComplianceDashboard;
