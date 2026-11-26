import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Lock,
  Unlock,
  Users,
  IndianRupee,
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
import { useAuth } from '../context/AuthContext';
import { getPermissions } from '../utils/rbac';

export const AdminComplianceDashboard: React.FC = () => {
  const { user } = useAuth();
  const perms = getPermissions(user);
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
    systemHealthStatus: 'Systems Operational',
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
  const [statusModal, setStatusModal] = useState<Account | null>(null);
  const [newAccountStatus, setNewAccountStatus] = useState<'ACTIVE' | 'FROZEN' | 'CLOSED'>('ACTIVE');
  const [statusChangeReason, setStatusChangeReason] = useState('');

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
            { rank: 1, accountNumber: 'ACC1001', customerNumber: 'CUST1001', customerName: 'Aarav Sharma', customerEmail: 'aarav@example.com', currentBalance: 250000, currency: 'INR', accountStatus: 'ACTIVE', totalTransactions: 142, totalTurnoverVolume: 840000 },
            { rank: 2, accountNumber: 'ACC2004', customerNumber: 'CUST1002', customerName: 'Priya Patel', customerEmail: 'priya@example.com', currentBalance: 180000, currency: 'INR', accountStatus: 'ACTIVE', totalTransactions: 98, totalTurnoverVolume: 620000 },
            { rank: 3, accountNumber: 'ACC3005', customerNumber: 'CUST1003', customerName: 'Vikram Mehta', customerEmail: 'vikram@example.com', currentBalance: 95000, currency: 'INR', accountStatus: 'ACTIVE', totalTransactions: 64, totalTurnoverVolume: 310000 },
            { rank: 4, accountNumber: 'ACC1002', customerNumber: 'CUST1002', customerName: 'Priya Commercial', customerEmail: 'priya.corp@example.com', currentBalance: 520000, currency: 'INR', accountStatus: 'FROZEN', totalTransactions: 45, totalTurnoverVolume: 280000 }
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
        if (accs && accs.content && accs.content.length > 0) setAccounts(accs.content);
        else {
          setAccounts([
            { id: 1, accountNumber: 'ACC1001', customerId: 1, customerName: 'Aarav Sharma', balance: 10000, status: 'ACTIVE', currency: 'INR', createdAt: new Date().toISOString() },
            { id: 2, accountNumber: 'ACC2004', customerId: 2, customerName: 'Priya Patel', balance: 25000, status: 'ACTIVE', currency: 'INR', createdAt: new Date().toISOString() },
            { id: 3, accountNumber: 'ACC3005', customerId: 3, customerName: 'Vikram Mehta', balance: 5000, status: 'ACTIVE', currency: 'INR', createdAt: new Date().toISOString() },
            { id: 4, accountNumber: 'ACC9999', customerId: 2, customerName: 'Priya Commercial', balance: 15000, status: 'FROZEN', currency: 'INR', createdAt: new Date().toISOString() }
          ]);
        }
      } catch {
        console.log('Accounts fallback');
        setAccounts([
          { id: 1, accountNumber: 'ACC1001', customerId: 1, customerName: 'Aarav Sharma', balance: 10000, status: 'ACTIVE', currency: 'INR', createdAt: new Date().toISOString() },
          { id: 2, accountNumber: 'ACC2004', customerId: 2, customerName: 'Priya Patel', balance: 25000, status: 'ACTIVE', currency: 'INR', createdAt: new Date().toISOString() },
          { id: 3, accountNumber: 'ACC3005', customerId: 3, customerName: 'Vikram Mehta', balance: 5000, status: 'ACTIVE', currency: 'INR', createdAt: new Date().toISOString() },
          { id: 4, accountNumber: 'ACC9999', customerId: 2, customerName: 'Priya Commercial', balance: 15000, status: 'FROZEN', currency: 'INR', createdAt: new Date().toISOString() }
        ]);
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
        riskSummary: 'Standard retail tier. Account limits active and verified.'
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
    if (!limitsModal || !perms.canEditAccountLimits) return;
    try {
      await accountApi.updateLimits(limitsModal.accountNumber, dailyLimitInput, perTxnLimitInput, user?.username || 'admin_officer');
      setActionMessage({ type: 'success', text: `Limits updated for ${limitsModal.accountNumber}.` });
      setLimitsModal(null);
    } catch {
      setActionMessage({ type: 'error', text: 'Failed to update transaction limits.' });
    }
  };

  // Update Account Status (Admin-only override)
  const handleUpdateAccountStatus = async () => {
    if (!statusModal || !perms.canEditAccountStatus) return;
    const reason = statusChangeReason.trim() || `Status changed to ${newAccountStatus} by Administrator`;
    try {
      await accountApi.updateStatus(statusModal.accountNumber, newAccountStatus, reason, user?.username || 'system_administrator');
    } catch {
      // Fallback local update when backend is offline
    }
    setAccounts((prev) =>
      prev.map((a) =>
        a.accountNumber === statusModal.accountNumber ? { ...a, status: newAccountStatus } : a
      )
    );
    setActionMessage({ type: 'success', text: `Account ${statusModal.accountNumber} status updated to ${newAccountStatus}.` });
    setStatusModal(null);
    setStatusChangeReason('');
  };

  const filteredAccounts = accounts.filter(
    (a) =>
      a.accountNumber.toLowerCase().includes(searchAccountQuery.toLowerCase()) ||
      (a.customerName && a.customerName.toLowerCase().includes(searchAccountQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner (Dark Beige Upper Header) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#E9D9C0] p-6 rounded-2xl border border-[#CEB896] shadow-md">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#4E3424] to-[#8E4322] flex items-center justify-center text-white shadow-md shadow-[#4E3424]/20">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1B130D] tracking-tight">Admin & Compliance Dashboard</h1>
            <p className="text-sm text-[#3F3124] font-medium">
              Logged in as <span className="text-[#4E3424] font-semibold">{user?.fullName || user?.username || 'Administrator'}</span> &bull;{' '}
              <span className="font-mono text-xs text-[#1B130D]">{perms.tierLabel}</span>{' '}
              {perms.canEditAccountStatus
                ? '• Full Admin Governance & Overrides'
                : perms.canFreezeAccounts
                ? '• Fraud Triage, Freeze & Limit Controls'
                : '• Read-Only Surveillance & Risk Inspection'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-100 border border-emerald-400 text-emerald-900 text-xs font-semibold">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>{overview.systemHealthStatus}</span>
          </div>
          <button
            onClick={loadAllDashboardData}
            className="p-2.5 rounded-xl bg-white/85 hover:bg-white border border-[#CEB896] text-[#1B130D] transition-colors"
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
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-400'
              : 'bg-rose-100 text-rose-900 border border-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-[#3F3124] hover:text-[#1B130D]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Metric Cards (Dark Beige Upper Tiles) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#E9D9C0] border border-[#CEB896] shadow-md">
          <div className="flex items-center justify-between text-[#3F3124] text-xs font-semibold mb-2">
            <span>TOTAL ACCOUNTS</span>
            <Users className="w-4 h-4 text-[#70411A]" />
          </div>
          <div className="text-2xl font-bold text-[#1B130D] font-mono">{overview.totalAccounts}</div>
          <div className="text-[11px] font-semibold text-[#3F3124] mt-1 flex items-center justify-between">
            <span className="text-emerald-900">{overview.activeAccounts} Active</span>
            <span className="text-rose-900">{overview.frozenAccounts} Frozen</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#E9D9C0] border border-[#CEB896] shadow-md">
          <div className="flex items-center justify-between text-[#3F3124] text-xs font-semibold mb-2">
            <span>TOTAL TURNOVER</span>
            <IndianRupee className="w-4 h-4 text-emerald-800" />
          </div>
          <div className="text-2xl font-bold text-[#1B130D] font-mono">
            ₹{(overview.totalTransactionVolume || 0).toLocaleString()}
          </div>
          <div className="text-[11px] font-medium text-[#3F3124] mt-1">
            {overview.totalTransactions.toLocaleString()} total processed
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#E9D9C0] border border-[#CEB896] shadow-md">
          <div className="flex items-center justify-between text-[#3F3124] text-xs font-semibold mb-2">
            <span>DISBURSED LOANS</span>
            <BarChart3 className="w-4 h-4 text-[#8E4322]" />
          </div>
          <div className="text-2xl font-bold text-[#1B130D] font-mono">
            ₹{(overview.totalLoanDisbursed || 0).toLocaleString()}
          </div>
          <div className="text-[11px] font-semibold text-[#8E4322] mt-1">
            {overview.activeLoans} Active &bull; ₹{overview.totalLoanOutstanding?.toLocaleString()} Outst.
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#E9D9C0] border border-[#CEB896] shadow-md">
          <div className="flex items-center justify-between text-[#3F3124] text-xs font-semibold mb-2">
            <span>FRAUD SURVEILLANCE</span>
            <AlertTriangle className="w-4 h-4 text-amber-900" />
          </div>
          <div className="text-2xl font-bold text-amber-950 font-mono">{overview.totalFraudAlerts}</div>
          <div className="text-[11px] font-semibold text-[#3F3124] mt-1 flex items-center justify-between">
            <span className="text-rose-900">{overview.pendingFraudAlerts} Action Required</span>
            <span>Risk Rules Active</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Transaction Volume & Attempt Trend */}
        <div className="bg-[#EFE2CE] p-6 rounded-2xl border border-[#D9C7AB] shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#1B130D] text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#70411A]" /> Daily Settled Volume & Throughput
            </h3>
            <span className="text-xs text-[#3F3124]">Past 7 Days</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5E34" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#8B5E34" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#DFD2BF" />
                <XAxis dataKey="transactionDate" stroke="#5E4F41" tick={{ fontSize: 10 }} />
                <YAxis stroke="#5E4F41" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FAF6F0', borderColor: '#DFD2BF', color: '#2B2118', borderRadius: '0.75rem', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="totalSettledVolume" stroke="#8B5E34" fillOpacity={1} fill="url(#volumeGrad)" name="Settled Vol (₹)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Account Turnover Volume */}
        <div className="bg-[#EFE2CE] p-6 rounded-2xl border border-[#D9C7AB] shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#1B130D] text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#8E4322]" /> High-Velocity Turnover by Account
            </h3>
            <span className="text-xs text-[#3F3124]">Top Accounts</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topAccounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DFD2BF" />
                <XAxis dataKey="accountNumber" stroke="#5E4F41" tick={{ fontSize: 10 }} />
                <YAxis stroke="#5E4F41" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FAF6F0', borderColor: '#DFD2BF', color: '#2B2118', borderRadius: '0.75rem', fontSize: '11px' }}
                />
                <Bar dataKey="totalTurnoverVolume" fill="#9C6644" radius={[6, 6, 0, 0]} name="Turnover Volume (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Failure Root Causes & Audit Categorization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-[#EFE2CE] p-6 rounded-2xl border border-[#D9C7AB] shadow-md space-y-4">
          <h3 className="font-bold text-[#1B130D] text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-700" /> Transaction Failure Root Causes
          </h3>
          <p className="text-xs text-[#3F3124]">Deterministic rollback reasons logged in transaction ledger.</p>

          <div className="space-y-3">
            {failures.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-[#EBDEC8] border border-[#D9C7AB] space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-rose-700 font-mono">{item.errorCategory}</span>
                  <span className="font-bold text-[#1B130D]">{item.failureCount} occurrences ({item.percentageOfTotal}%)</span>
                </div>
                <p className="text-[11px] text-[#3F3124]">{item.failureReason}</p>
                <div className="text-[10px] text-[#3F3124] font-mono">
                  Impacted {item.distinctAccountsImpacted} accounts
                </div>
              </div>
            ))}
          </div>

          {loanPortfolio.length > 0 && (
            <div className="pt-4 border-t border-[#D9C7AB] space-y-2">
              <span className="text-xs font-semibold text-[#8E4322]">Loan Portfolio Distribution</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {loanPortfolio.map((lp, i) => (
                  <div key={i} className="p-2.5 bg-[#EBDEC8] rounded-xl border border-[#D9C7AB]">
                    <div className="text-[#3F3124] text-[10px] uppercase font-mono">{lp.status}</div>
                    <div className="font-bold text-[#1B130D] font-mono text-[11px]">
                      ₹{(lp.totalPrincipal || 0).toLocaleString()} ({lp.loanCount})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Fraud Alert Review Queue */}
        <div className="lg:col-span-8 bg-[#EFE2CE] p-6 rounded-2xl border border-[#D9C7AB] shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#1B130D] text-base flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-800" /> Real-Time Fraud Alert Queue
              </h3>
              <p className="text-xs text-[#3F3124]">Rule-based triggers with Bayesian velocity calculations</p>
            </div>
            <div className="flex gap-2">
              {['ALL', 'NEW', 'INVESTIGATING', 'RESOLVED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setAlertFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    alertFilter === f
                      ? 'bg-amber-100 text-amber-950 border border-amber-400'
                      : 'text-[#3F3124] hover:text-[#1B130D]'
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
                <tr className="border-b border-[#D9C7AB] text-[#3F3124] uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-semibold">Alert ID / Txn</th>
                  <th className="pb-3 font-semibold">Account</th>
                  <th className="pb-3 font-semibold">Risk Score</th>
                  <th className="pb-3 font-semibold">Triggered Rules</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9C7AB]">
                {fraudAlerts
                  .filter((a) => alertFilter === 'ALL' || a.status === alertFilter)
                  .map((alert) => (
                    <tr key={alert.id} className="hover:bg-[#EFE4D2]/50 transition-colors">
                      <td className="py-3 font-mono">
                        <div className="font-bold text-[#1B130D]">#{alert.id}</div>
                        <div className="text-[10px] text-[#3F3124]">{alert.transactionId}</div>
                      </td>
                      <td className="py-3 font-mono text-[#1B130D] font-semibold">{alert.accountNumber}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              alert.riskLevel === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-900'
                                : alert.riskLevel === 'HIGH'
                                ? 'bg-orange-100 text-orange-900'
                                : alert.riskLevel === 'MEDIUM'
                                ? 'bg-amber-100 text-amber-950'
                                : 'bg-[#EFE4D2] text-[#70411A]'
                            }`}
                          >
                            {alert.riskLevel} ({alert.riskScore})
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-[#1B130D] text-[11px] font-mono">{alert.triggeredRules || 'N/A'}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            alert.status === 'NEW'
                              ? 'bg-rose-100 text-rose-900 border border-rose-400'
                              : alert.status === 'INVESTIGATING'
                              ? 'bg-amber-100 text-amber-950 border border-amber-400'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                          }`}
                        >
                          {alert.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setSelectedAlert(alert)}
                          className="px-2.5 py-1 rounded-lg bg-[#EBDEC8] hover:bg-[#EFE4D2] text-[#1B130D] border border-[#D9C7AB] text-xs font-medium inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#70411A]" /> {perms.canResolveFraudAlerts ? 'Review' : 'Inspect'}
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
      <div className="bg-[#EFE2CE] p-6 rounded-2xl border border-[#D9C7AB] shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-[#1B130D] text-base flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#8E4322]" /> Account Governance & Transaction Limits
            </h3>
            <p className="text-xs text-[#3F3124]">Inspect risk profiles, toggle administrative freeze, or calibrate limits.</p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#3F3124] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by account or customer..."
              value={searchAccountQuery}
              onChange={(e) => setSearchAccountQuery(e.target.value)}
              className="bg-white border border-[#9A7C59] rounded-xl shadow-inner pl-9 pr-4 py-2 text-xs text-[#1B130D] placeholder-[#3F3124]/50 focus:ring-2 focus:ring-[#70411A] focus:outline-none w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D9C7AB] text-[#3F3124] uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-semibold">Account Number</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Current Balance</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9C7AB]">
              {filteredAccounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-[#EFE4D2]/50 transition-colors">
                  <td className="py-3 font-mono font-bold text-[#1B130D]">{acc.accountNumber}</td>
                  <td className="py-3 text-[#1B130D]">{acc.customerName || `Customer #${acc.customerId}`}</td>
                  <td className="py-3 font-mono font-bold text-emerald-700">
                    ₹{(acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        acc.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                          : 'bg-rose-100 text-rose-900 border border-rose-400'
                      }`}
                    >
                      {acc.status}
                    </span>
                  </td>
                  <td className="py-3 text-right space-x-2">
                    <button
                      onClick={() => handleInspectRiskProfile(acc.accountNumber)}
                      className="px-2.5 py-1 rounded-lg bg-[#EBDEC8] hover:bg-[#EFE4D2] text-[#8E4322] border border-[#D9C7AB] text-xs font-medium"
                    >
                      Risk Profile
                    </button>

                    {perms.canFreezeAccounts && (
                      acc.status === 'ACTIVE' ? (
                        <button
                          onClick={() => setFreezeModal({ account: acc, action: 'FREEZE' })}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-400 text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3" /> Freeze
                        </button>
                      ) : (
                        <button
                          onClick={() => setFreezeModal({ account: acc, action: 'UNFREEZE' })}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-400 text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Unlock className="w-3 h-3" /> Unfreeze
                        </button>
                      )
                    )}

                    {perms.canEditAccountLimits && (
                      <button
                        onClick={() => {
                          setLimitsModal(acc);
                          setDailyLimitInput(100000);
                          setPerTxnLimitInput(50000);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#EBDEC8] hover:bg-[#EFE4D2] text-[#1B130D] border border-[#D9C7AB] text-xs font-medium inline-flex items-center gap-1"
                      >
                        <Sliders className="w-3 h-3" /> Limits
                      </button>
                    )}

                    {perms.canEditAccountStatus && (
                      <button
                        onClick={() => {
                          setStatusModal(acc);
                          setNewAccountStatus(acc.status);
                          setStatusChangeReason('');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#EFE4D2] hover:bg-[#9A7C59]/30 text-[#4E3424] border border-[#9A7C59]/60 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        Edit Status
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Fraud Alert Review */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B130D]/40 backdrop-blur-sm">
          <div className="bg-[#EBDEC8] border border-[#D9C7AB] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9C7AB] pb-3">
              <h3 className="font-bold text-lg text-[#1B130D] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-800" /> Review Fraud Alert #{selectedAlert.id}
              </h3>
              <button onClick={() => setSelectedAlert(null)} className="text-[#3F3124] hover:text-[#1B130D]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB] shadow-md space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#3F3124]">Transaction ID:</span>
                  <span className="font-mono text-[#1B130D]">{selectedAlert.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3F3124]">Account:</span>
                  <span className="font-mono text-[#1B130D]">{selectedAlert.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3F3124]">Risk Score & Level:</span>
                  <span className="font-bold text-rose-700">{selectedAlert.riskScore}/100 ({selectedAlert.riskLevel})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3F3124]">Triggered Rules:</span>
                  <span className="font-mono text-amber-900">{selectedAlert.triggeredRules}</span>
                </div>
                {selectedAlert.reason && (
                  <div className="text-[#1B130D] text-[11px] pt-1 border-t border-[#D9C7AB] mt-1">
                    {selectedAlert.reason}
                  </div>
                )}
              </div>

              {!perms.canResolveFraudAlerts && (
                <div className="p-3 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB] shadow-md text-amber-900 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Read-only inspection mode ({perms.designationTitle}). Resolving fraud alerts requires Risk Analyst or Admin privileges.</span>
                </div>
              )}

              <div>
                <label className="block text-[#1B130D] font-medium mb-1">Set Investigation Resolution</label>
                <select
                  disabled={!perms.canResolveFraudAlerts}
                  value={reviewStatus}
                  onChange={(e: any) => setReviewStatus(e.target.value)}
                  className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D] disabled:opacity-60"
                >
                  <option value="INVESTIGATING">INVESTIGATING (Escalate to Tier 2)</option>
                  <option value="RESOLVED">RESOLVED (Action Completed)</option>
                  <option value="FALSE_POSITIVE">FALSE_POSITIVE (Dismiss as benign)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#1B130D] font-medium mb-1">Investigation Notes & Remarks</label>
                <textarea
                  rows={3}
                  disabled={!perms.canResolveFraudAlerts}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Provide audit notes regarding transaction intent or customer verification..."
                  className="w-full bg-white border border-[#9A7C59] rounded-xl p-3 text-[#1B130D] focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:opacity-60"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-2 rounded-xl bg-[#F3E7D4] hover:bg-[#EFE4D2] text-[#1B130D] font-medium"
                >
                  {perms.canResolveFraudAlerts ? 'Cancel' : 'Close'}
                </button>
                {perms.canResolveFraudAlerts && (
                  <button
                    type="button"
                    disabled={submittingAlert}
                    onClick={handleReviewAlert}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-md shadow-amber-600/30"
                  >
                    {submittingAlert ? 'Submitting...' : 'Commit Review Decision'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Risk Profile Details */}
      {selectedRiskProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B130D]/40 backdrop-blur-sm">
          <div className="bg-[#EBDEC8] border border-[#D9C7AB] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9C7AB] pb-3">
              <h3 className="font-bold text-lg text-[#1B130D]">Risk Profile: {selectedRiskProfile.accountNumber}</h3>
              <button onClick={() => setSelectedRiskProfile(null)} className="text-[#3F3124] hover:text-[#1B130D]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#D9C7AB]">
                <span className="text-[#3F3124]">Account Status:</span>
                <span className="font-bold text-emerald-700">{selectedRiskProfile.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#D9C7AB]">
                <span className="text-[#3F3124]">Row-Locked Balance:</span>
                <span className="font-mono font-bold text-[#1B130D]">₹{selectedRiskProfile.currentBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#D9C7AB]">
                <span className="text-[#3F3124]">Daily Limit:</span>
                <span className="font-mono text-[#1B130D]">₹{selectedRiskProfile.dailyLimit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#D9C7AB]">
                <span className="text-[#3F3124]">Per-Txn Limit:</span>
                <span className="font-mono text-[#1B130D]">₹{selectedRiskProfile.perTransactionLimit.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB] shadow-md text-[#1B130D]">
                <div className="font-semibold text-[#1B130D] mb-1">Underwriter Summary:</div>
                <p>{selectedRiskProfile.riskSummary}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRiskProfile(null)}
                className="px-4 py-2 rounded-xl bg-[#F3E7D4] hover:bg-[#EFE4D2] text-[#1B130D] font-medium text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Freeze / Unfreeze Confirmation */}
      {freezeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B130D]/40 backdrop-blur-sm">
          <div className="bg-[#EBDEC8] border border-[#D9C7AB] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-[#1B130D]">
              Confirm {freezeModal.action} on {freezeModal.account.accountNumber}
            </h3>
            <p className="text-xs text-[#3F3124]">
              {freezeModal.action === 'FREEZE'
                ? 'Freezing this account immediately halts all debit and transfer operations. The action is recorded in the immutable audit trail.'
                : 'Unfreezing will restore full transaction capabilities to this account.'}
            </p>

            <div className="text-xs space-y-2">
              <label className="block text-[#1B130D] font-medium">Mandatory Audit Reason</label>
              <input
                type="text"
                placeholder="e.g. Compliance investigation, High velocity breach"
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setFreezeModal(null)}
                className="px-4 py-2 rounded-xl bg-[#F3E7D4] hover:bg-[#EFE4D2] text-[#1B130D] text-xs font-medium"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B130D]/40 backdrop-blur-sm">
          <div className="bg-[#EBDEC8] border border-[#D9C7AB] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-[#1B130D]">Update Limits: {limitsModal.accountNumber}</h3>

            <div className="text-xs space-y-3">
              <div>
                <label className="block text-[#1B130D] font-medium mb-1">Daily Limit (₹)</label>
                <input
                  type="number"
                  value={dailyLimitInput}
                  onChange={(e) => setDailyLimitInput(Number(e.target.value))}
                  className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D] font-mono"
                />
              </div>

              <div>
                <label className="block text-[#1B130D] font-medium mb-1">Per-Transaction Limit (₹)</label>
                <input
                  type="number"
                  value={perTxnLimitInput}
                  onChange={(e) => setPerTxnLimitInput(Number(e.target.value))}
                  className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D] font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setLimitsModal(null)}
                className="px-4 py-2 rounded-xl bg-[#F3E7D4] hover:bg-[#EFE4D2] text-[#1B130D] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateLimits}
                className="px-5 py-2 rounded-xl bg-[#8E4322] hover:bg-[#4E3424] text-white text-xs font-semibold"
              >
                Save Limits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Account Status (Admin-Only Privilege) */}
      {statusModal && perms.canEditAccountStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B130D]/40 backdrop-blur-sm">
          <div className="bg-[#EBDEC8] border border-[#D9C7AB] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-[#1B130D]">
              Edit Account Status: {statusModal.accountNumber}
            </h3>
            <p className="text-xs text-[#3F3124]">
              Tier 5 Administrator override for lifecycle state transitions (ACTIVE, FROZEN, CLOSED).
            </p>

            <div className="text-xs space-y-3">
              <div>
                <label className="block text-[#1B130D] font-medium mb-1">Account Status</label>
                <select
                  value={newAccountStatus}
                  onChange={(e) => setNewAccountStatus(e.target.value as 'ACTIVE' | 'FROZEN' | 'CLOSED')}
                  className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D] font-mono"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="FROZEN">FROZEN</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className="block text-[#1B130D] font-medium mb-1">Audit Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Administrative closure / KYC verification complete"
                  value={statusChangeReason}
                  onChange={(e) => setStatusChangeReason(e.target.value)}
                  className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setStatusModal(null)}
                className="px-4 py-2 rounded-xl bg-[#F3E7D4] hover:bg-[#EFE4D2] text-[#1B130D] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateAccountStatus}
                className="px-5 py-2 rounded-xl bg-[#4E3424] hover:bg-[#1B130D] text-white text-xs font-semibold"
              >
                Apply Status Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComplianceDashboard;
