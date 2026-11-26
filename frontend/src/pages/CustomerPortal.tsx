import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  DollarSign,
  Calculator,
  Bell,
  X,
  CreditCard,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import {
  Account,
  Transaction,
  Loan,
  LoanRepaymentSchedule,
  LoanEligibilityAssessment,
  NotificationItem
} from '../types';
import { accountApi, transactionApi, loanApi, notificationApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const CustomerPortal: React.FC = () => {
  const { user } = useAuth();

  // Accounts State
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: 1,
      accountNumber: 'ACC1001',
      customerId: 1,
      customerName: 'John Doe',
      balance: 10000.0,
      status: 'ACTIVE',
      currency: 'USD',
      createdAt: '2026-11-20T10:00:00Z',
    },
    {
      id: 2,
      accountNumber: 'ACC2004',
      customerId: 2,
      customerName: 'Jane Smith',
      balance: 25000.0,
      status: 'ACTIVE',
      currency: 'USD',
      createdAt: '2026-11-21T11:00:00Z',
    },
    {
      id: 3,
      accountNumber: 'ACC3005',
      customerId: 3,
      customerName: 'Robert Johnson',
      balance: 5000.0,
      status: 'ACTIVE',
      currency: 'USD',
      createdAt: '2026-11-22T09:30:00Z',
    },
  ]);
  const [selectedAccount, setSelectedAccount] = useState<Account>(accounts[0]);
  const [accountTransactions, setAccountTransactions] = useState<Transaction[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(false);

  // Operations State
  const [activeTab, setActiveTab] = useState<'TRANSFER' | 'DEPOSIT' | 'WITHDRAW' | 'LOANS'>('TRANSFER');
  const [transferTarget, setTransferTarget] = useState('ACC2004');
  const [actionAmount, setActionAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Loans State
  const [myLoans, setMyLoans] = useState<Loan[]>([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [loanSchedule, setLoanSchedule] = useState<{ loanId: string; schedule: LoanRepaymentSchedule[] } | null>(null);

  // Loan Calculator / Simulator State
  const [loanAmount, setLoanAmount] = useState(50000);
  const [loanTenure, setLoanTenure] = useState(24);
  const [monthlyIncome, setMonthlyIncome] = useState(75000);
  const [monthlyDebt, setMonthlyDebt] = useState(10000);
  const [creditScore, setCreditScore] = useState(750);
  const [loanPurpose, setLoanPurpose] = useState('Home Improvement & Renovation');
  const [simulation, setSimulation] = useState<LoanEligibilityAssessment | null>(null);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Select account appropriate for logged-in user
  useEffect(() => {
    if (user) {
      const match = accounts.find(
        (a) =>
          (user.accountNumber && a.accountNumber === user.accountNumber) ||
          (user.fullName && a.customerName?.toLowerCase() === user.fullName.toLowerCase()) ||
          (user.id && a.customerId === user.id) ||
          (user.username && a.customerName?.toLowerCase().includes(user.username.toLowerCase()))
      );
      if (match) {
        setSelectedAccount(match);
      } else if (user.roles?.includes('CUSTOMER')) {
        const customAcc: Account = {
          id: user.id || 99,
          accountNumber: user.accountNumber || `ACC${1000 + (user.id || 1)}`,
          customerId: user.id || 1,
          customerName: user.fullName || user.username,
          balance: 15000.0,
          status: 'ACTIVE',
          currency: 'USD',
          createdAt: new Date().toISOString(),
        };
        setAccounts((prev) => [customAcc, ...prev.filter((a) => a.accountNumber !== customAcc.accountNumber)]);
        setSelectedAccount(customAcc);
      }
    }
  }, [user]);

  // Adjust transfer target if it matches currently selected account
  useEffect(() => {
    if (transferTarget === selectedAccount.accountNumber) {
      const other = accounts.find((a) => a.accountNumber !== selectedAccount.accountNumber);
      if (other) {
        setTransferTarget(other.accountNumber);
      }
    }
  }, [selectedAccount.accountNumber, accounts, transferTarget]);

  // Load Initial Data
  useEffect(() => {
    fetchLiveAccounts();
    fetchNotifications();
  }, []);

  // Fetch transactions and loans when selected account changes
  useEffect(() => {
    if (selectedAccount?.accountNumber) {
      fetchTransactions(selectedAccount.accountNumber);
      fetchLoans();
    }
  }, [selectedAccount]);

  const fetchLiveAccounts = async () => {
    try {
      const data = await accountApi.getAccounts(0, 10);
      if (data && data.content && data.content.length > 0) {
        setAccounts(data.content);
        const match = user
          ? data.content.find(
              (a) =>
                (user.accountNumber && a.accountNumber === user.accountNumber) ||
                (user.fullName && a.customerName?.toLowerCase() === user.fullName.toLowerCase()) ||
                (user.id && a.customerId === user.id)
            )
          : null;
        setSelectedAccount(match || data.content[0]);
      }
    } catch {
      console.log('Using fallback seeded account state');
    }
  };

  const fetchTransactions = async (accNum: string) => {
    setLoadingTxns(true);
    try {
      const data = await transactionApi.getAccountTransactions(accNum, 0, 15);
      if (data && data.content) {
        setAccountTransactions(data.content);
      }
    } catch {
      // Fallback local mock transactions if API is offline
      setAccountTransactions([
        {
          id: 101,
          transactionId: 'TXN-DEMO-991',
          type: 'DEPOSIT',
          destinationAccountNumber: accNum,
          amount: 2500.0,
          status: 'SUCCESS',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: 102,
          transactionId: 'TXN-DEMO-992',
          type: 'TRANSFER',
          sourceAccountNumber: accNum,
          destinationAccountNumber: 'ACC2004',
          amount: 500.0,
          status: 'SUCCESS',
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
      ]);
    } finally {
      setLoadingTxns(false);
    }
  };

  const fetchLoans = async () => {
    try {
      const data = await loanApi.getLoans();
      if (data && data.content) {
        setMyLoans(data.content.filter((l) => l.accountNumber === selectedAccount.accountNumber));
      }
    } catch {
      console.log('Using seeded loans');
    }
  };

  const fetchNotifications = async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
      const data = await notificationApi.getMyNotifications(0, 10);
      if (data && data.content) {
        setNotifications(data.content);
      }
    } catch {
      // Demo notifications
      setNotifications([
        {
          id: 1,
          userId: 1,
          type: 'TRANSACTION_SUCCESS',
          title: 'Deposit Successful',
          message: `USD 2,500.00 credited to ${selectedAccount.accountNumber}. Available balance updated.`,
          status: 'SENT',
          createdAt: new Date().toISOString(),
        },
      ]);
      setUnreadCount(1);
    }
  };

  // Execute Deposit
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(actionAmount);
    if (!amt || amt <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid deposit amount.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const txn = await transactionApi.deposit(selectedAccount.accountNumber, amt, 'CustomerPortal');
      setFeedback({ type: 'success', message: `Successfully deposited $${amt.toFixed(2)}! Txn ID: ${txn.transactionId}` });
      setSelectedAccount((prev) => ({ ...prev, balance: prev.balance + amt }));
      setAccounts((prev) =>
        prev.map((a) => (a.accountNumber === selectedAccount.accountNumber ? { ...a, balance: a.balance + amt } : a))
      );
      setActionAmount('');
      fetchTransactions(selectedAccount.accountNumber);
      fetchNotifications();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Deposit failed. Ensure the account is not frozen.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Withdrawal
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(actionAmount);
    if (!amt || amt <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid withdrawal amount.' });
      return;
    }
    if (amt > selectedAccount.balance) {
      setFeedback({ type: 'error', message: 'Insufficient funds for this withdrawal.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const txn = await transactionApi.withdraw(selectedAccount.accountNumber, amt, 'CustomerPortal');
      setFeedback({ type: 'success', message: `Successfully withdrew $${amt.toFixed(2)}! Txn ID: ${txn.transactionId}` });
      setSelectedAccount((prev) => ({ ...prev, balance: prev.balance - amt }));
      setAccounts((prev) =>
        prev.map((a) => (a.accountNumber === selectedAccount.accountNumber ? { ...a, balance: a.balance - amt } : a))
      );
      setActionAmount('');
      fetchTransactions(selectedAccount.accountNumber);
      fetchNotifications();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Withdrawal failed. Check transaction limits or account status.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Transfer
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(actionAmount);
    if (!amt || amt <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid transfer amount.' });
      return;
    }
    if (amt > selectedAccount.balance) {
      setFeedback({ type: 'error', message: 'Insufficient balance to complete transfer.' });
      return;
    }
    if (transferTarget === selectedAccount.accountNumber) {
      setFeedback({ type: 'error', message: 'Source and destination accounts must be different.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const txn = await transactionApi.transfer(
        selectedAccount.accountNumber,
        transferTarget,
        amt,
        'CustomerPortal'
      );
      setFeedback({
        type: 'success',
        message: `Transferred $${amt.toFixed(2)} to ${transferTarget}! Txn ID: ${txn.transactionId}`,
      });
      setSelectedAccount((prev) => ({ ...prev, balance: prev.balance - amt }));
      setAccounts((prev) =>
        prev.map((a) => {
          if (a.accountNumber === selectedAccount.accountNumber) return { ...a, balance: a.balance - amt };
          if (a.accountNumber === transferTarget) return { ...a, balance: a.balance + amt };
          return a;
        })
      );
      setActionAmount('');
      fetchTransactions(selectedAccount.accountNumber);
      fetchNotifications();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Transfer failed. Check account status or limits.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulate Eligibility
  const handleSimulateEligibility = async () => {
    try {
      const res = await loanApi.simulateEligibility(
        monthlyIncome,
        monthlyDebt,
        loanAmount,
        loanTenure,
        8.5,
        creditScore
      );
      setSimulation(res);
    } catch {
      // Local fallback calculation
      const r = 8.5 / 12 / 100;
      const emi = (loanAmount * r * Math.pow(1 + r, loanTenure)) / (Math.pow(1 + r, loanTenure) - 1);
      const dti = ((monthlyDebt + emi) / monthlyIncome) * 100;
      setSimulation({
        eligible: dti <= 45 && creditScore >= 650,
        creditScore,
        monthlyIncome,
        existingMonthlyDebt: monthlyDebt,
        proposedEmi: Math.round(emi * 100) / 100,
        maxAllowableEmi: Math.round(monthlyIncome * 0.45 - monthlyDebt),
        dtiRatio: Math.round(dti * 100) / 100,
        riskGrade: creditScore >= 750 ? 'PRIME' : creditScore >= 680 ? 'NEAR_PRIME' : 'SUBPRIME',
        recommendation:
          dti <= 45 && creditScore >= 650
            ? 'Strong financial profile. Pre-approved for instant underwriting.'
            : 'DTI ratio exceeds safety threshold (45%). Higher risk bracket.',
      });
    }
  };

  // Submit Loan Application
  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await loanApi.apply({
        accountNumber: selectedAccount.accountNumber,
        amount: loanAmount,
        interestRate: 8.5,
        termMonths: loanTenure,
        purpose: loanPurpose,
        monthlyIncome,
        existingMonthlyDebt: monthlyDebt,
        creditScore,
      });
      setShowApplyModal(false);
      setFeedback({
        type: 'success',
        message: 'Loan application submitted successfully! Our Loan Officers will review your application shortly.',
      });
      fetchLoans();
      fetchNotifications();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit loan application.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // View Schedule
  const handleViewSchedule = async (loanId: string) => {
    try {
      const schedule = await loanApi.getRepaymentSchedule(loanId);
      setLoanSchedule({ loanId, schedule });
    } catch {
      alert('Repayment schedule is generated upon loan approval and disbursement.');
    }
  };

  const currentPersonName = user?.fullName || (user?.username ? user.username : (selectedAccount.customerName || 'Customer'));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & Notification Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Personal Banking</h1>
            <p className="text-sm text-slate-400">
              Welcome back, <span className="text-blue-400 font-semibold">{currentPersonName}</span> &bull; Account overview and daily transfers
            </p>
          </div>
        </div>

        {/* Account Selector & Live Notification Bell */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedAccount.accountNumber}
              onChange={(e) => {
                const found = accounts.find((a) => a.accountNumber === e.target.value);
                if (found) setSelectedAccount(found);
              }}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-2.5 pr-8 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
            >
              {accounts.map((acc) => (
                <option key={acc.accountNumber} value={acc.accountNumber}>
                  {acc.accountNumber} ({acc.currency} ${(acc.balance || 0).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Drawer */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-400" /> Live Outbox Notifications
                  </h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No recent notifications</p>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-blue-400">{item.title}</span>
                          <span className="text-slate-500 text-[10px]">
                            {new Date(item.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-300">{item.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={async () => {
                    await notificationApi.markAllAsRead();
                    setUnreadCount(0);
                  }}
                  className="w-full py-1.5 text-xs text-center text-blue-400 hover:text-blue-300 font-medium"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Highlights & Real-Time Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Number</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {selectedAccount.status}
            </span>
          </div>
          <div className="text-2xl font-mono font-bold text-white mb-2">{selectedAccount.accountNumber}</div>
          <div className="flex items-center text-xs text-slate-400 gap-1.5">
            <CreditCard className="w-4 h-4 text-slate-500" />
            <span>Primary Checking &bull; {selectedAccount.currency}</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900/40 via-slate-850 to-slate-900 border border-indigo-700/40 shadow-sm relative">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Available Balance</span>
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            ${(selectedAccount.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-400 font-medium">Real-time Row-Locked Balance</div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Credit Underwriting</span>
              <span className="text-xs font-bold text-indigo-400">8.50% APR</span>
            </div>
            <div className="text-lg font-bold text-slate-200">Personal & Business Loans</div>
            <p className="text-xs text-slate-400 mt-1">Instant pre-qualification with automated DTI assessment.</p>
          </div>
          <button
            onClick={() => {
              setActiveTab('LOANS');
              setShowApplyModal(true);
            }}
            className="mt-4 w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
          >
            <DollarSign className="w-4 h-4" /> Apply for Loan
          </button>
        </div>
      </div>

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Transaction Desk (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-6 shadow-md">
            {/* Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl mb-6 text-xs font-semibold">
              <button
                onClick={() => {
                  setActiveTab('TRANSFER');
                  setFeedback(null);
                }}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'TRANSFER'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer
              </button>
              <button
                onClick={() => {
                  setActiveTab('DEPOSIT');
                  setFeedback(null);
                }}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'DEPOSIT'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" /> Deposit
              </button>
              <button
                onClick={() => {
                  setActiveTab('WITHDRAW');
                  setFeedback(null);
                }}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'WITHDRAW'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> Withdraw
              </button>
            </div>

            {/* Feedback Alert */}
            {feedback && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Transfer Form */}
            {activeTab === 'TRANSFER' && (
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">From Account</label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedAccount.accountNumber} ($${selectedAccount.balance.toLocaleString()})`}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">To Account</label>
                  <select
                    value={transferTarget}
                    onChange={(e) => setTransferTarget(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {accounts
                      .filter((a) => a.accountNumber !== selectedAccount.accountNumber)
                      .map((a) => (
                        <option key={a.accountNumber} value={a.accountNumber}>
                          {a.accountNumber} ({a.customerName || 'Customer'})
                        </option>
                      ))}
                    <option value="ACC3005">ACC3005 (Robert Johnson)</option>
                    <option value="ACC1002">ACC1002 (Jane Smith Commercial)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Transfer Amount ($ USD)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={actionAmount}
                      onChange={(e) => setActionAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-sm text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/50 text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Settlement Method:</span>
                    <span className="text-emerald-400 font-medium">Instant Electronic Transfer</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Time:</span>
                    <span className="text-slate-300 font-medium">Immediate (Real-Time)</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRightLeft className="w-4 h-4" />
                  )}
                  Execute Real-Time Transfer
                </button>
              </form>
            )}

            {/* Deposit Form */}
            {activeTab === 'DEPOSIT' && (
              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Account</label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedAccount.accountNumber} ($${selectedAccount.balance.toLocaleString()})`}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Deposit Amount ($ USD)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={actionAmount}
                      onChange={(e) => setActionAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-sm text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[100, 500, 2000].map((quick) => (
                    <button
                      type="button"
                      key={quick}
                      onClick={() => setActionAmount(quick.toString())}
                      className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-mono"
                    >
                      +${quick}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowDownLeft className="w-4 h-4" />
                  )}
                  Credit Instant Deposit
                </button>
              </form>
            )}

            {/* Withdraw Form */}
            {activeTab === 'WITHDRAW' && (
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Source Account</label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedAccount.accountNumber} (Available: $${selectedAccount.balance.toLocaleString()})`}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Withdrawal Amount ($ USD)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={actionAmount}
                      onChange={(e) => setActionAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-sm text-slate-100 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                  Authorize Cash Withdrawal
                </button>
              </form>
            )}
          </div>

          {/* Quick Loan Simulator Card */}
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-400" /> Interactive Loan Underwriting Preview
              </h3>
              <button
                onClick={handleSimulateEligibility}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Re-Calculate
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Loan Amount:</span>
                  <span className="font-bold text-slate-200">${loanAmount.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="500000"
                  step="5000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Tenure (Months):</span>
                  <span className="font-bold text-slate-200">{loanTenure} Months</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="60"
                  step="6"
                  value={loanTenure}
                  onChange={(e) => setLoanTenure(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              {simulation && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 space-y-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated EMI:</span>
                    <span className="font-bold text-white font-mono">${simulation.proposedEmi.toLocaleString()}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">DTI Ratio:</span>
                    <span
                      className={`font-bold font-mono ${
                        simulation.dtiRatio <= 40
                          ? 'text-emerald-400'
                          : simulation.dtiRatio <= 50
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {simulation.dtiRatio}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Risk Assessment:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                      {simulation.riskGrade}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Transaction History & Active Loans (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Transaction Ledger Table */}
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" /> Account Transaction Ledger
                </h2>
                <p className="text-xs text-slate-400">Showing recent activity for {selectedAccount.accountNumber}</p>
              </div>
              <button
                onClick={() => fetchTransactions(selectedAccount.accountNumber)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
                title="Refresh Ledger"
              >
                <RefreshCw className={`w-4 h-4 ${loadingTxns ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-semibold">Txn ID / Time</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Details</th>
                    <th className="pb-3 font-semibold text-right">Amount</th>
                    <th className="pb-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {accountTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No transactions recorded for this account yet.
                      </td>
                    </tr>
                  ) : (
                    accountTransactions.map((tx) => (
                      <tr key={tx.id || tx.transactionId} className="hover:bg-slate-750/50 transition-colors">
                        <td className="py-3 font-mono">
                          <div className="font-semibold text-slate-200">{tx.transactionId}</div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(tx.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.type === 'DEPOSIT'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : tx.type === 'WITHDRAWAL'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 text-slate-300 font-mono text-[11px]">
                          {tx.type === 'TRANSFER' ? (
                            <span>
                              {tx.sourceAccountNumber} &rarr; {tx.destinationAccountNumber}
                            </span>
                          ) : (
                            <span>Self &bull; {selectedAccount.accountNumber}</span>
                          )}
                        </td>
                        <td
                          className={`py-3 text-right font-mono font-bold ${
                            tx.type === 'DEPOSIT'
                              ? 'text-emerald-400'
                              : tx.type === 'WITHDRAWAL'
                              ? 'text-amber-400'
                              : 'text-slate-200'
                          }`}
                        >
                          {tx.type === 'DEPOSIT' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              tx.status === 'SUCCESS'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Loans Section */}
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-400" /> Active Loans & Applications
                </h2>
                <p className="text-xs text-slate-400">Applications tied to account {selectedAccount.accountNumber}</p>
              </div>
              <button
                onClick={() => setShowApplyModal(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1"
              >
                + New Loan
              </button>
            </div>

            <div className="space-y-3">
              {myLoans.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-700 rounded-xl text-slate-400 text-xs">
                  No active loans found for this account. Apply today with competitive 8.5% interest rate.
                </div>
              ) : (
                myLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">{loan.loanId}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            loan.status === 'DISBURSED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : loan.status === 'APPROVED'
                              ? 'bg-blue-500/20 text-blue-400'
                              : loan.status === 'UNDER_REVIEW'
                              ? 'bg-amber-500/20 text-amber-400'
                              : loan.status === 'REJECTED'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{loan.purpose}</p>
                      <div className="text-xs text-slate-500 font-mono">
                        Tenure: {loan.termMonths} Months &bull; EMI: ${loan.emiAmount?.toLocaleString()}/mo
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-sm font-bold text-white font-mono">${loan.amount.toLocaleString()}</div>
                      <button
                        onClick={() => handleViewSchedule(loan.loanId)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                      >
                        Repayment Schedule <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Apply for Loan */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-400" /> Apply for Loan Underwriting
              </h3>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLoan} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Disbursement Account</label>
                <input
                  type="text"
                  disabled
                  value={selectedAccount.accountNumber}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-slate-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Requested Amount ($)</label>
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tenure (Months)</label>
                  <select
                    value={loanTenure}
                    onChange={(e) => setLoanTenure(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value={12}>12 Months (1 Year)</option>
                    <option value={24}>24 Months (2 Years)</option>
                    <option value={36}>36 Months (3 Years)</option>
                    <option value={48}>48 Months (4 Years)</option>
                    <option value={60}>60 Months (5 Years)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Loan Purpose</label>
                <input
                  type="text"
                  value={loanPurpose}
                  onChange={(e) => setLoanPurpose(e.target.value)}
                  placeholder="e.g., Home Renovation, Commercial Inventory"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Monthly Income ($)</label>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Existing Debt ($)</label>
                  <input
                    type="number"
                    value={monthlyDebt}
                    onChange={(e) => setMonthlyDebt(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Credit Score</label>
                  <input
                    type="number"
                    value={creditScore}
                    onChange={(e) => setCreditScore(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1 text-slate-400">
                <div className="flex justify-between">
                  <span>Standard Interest Rate:</span>
                  <span className="text-white font-mono">8.50% p.a.</span>
                </div>
                <div className="flex justify-between">
                  <span>Underwriting Process:</span>
                  <span className="text-indigo-400 font-medium">Assigned to Loan Officer</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Repayment Schedule */}
      {loanSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-white">Repayment Schedule & EMI Ledger</h3>
                <p className="text-xs text-slate-400 font-mono">Loan ID: {loanSchedule.loanId}</p>
              </div>
              <button onClick={() => setLoanSchedule(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-2">#</th>
                    <th className="pb-2">Due Date</th>
                    <th className="pb-2 text-right">Principal</th>
                    <th className="pb-2 text-right">Interest</th>
                    <th className="pb-2 text-right">Total EMI</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {loanSchedule.schedule.map((row) => (
                    <tr key={row.installmentNumber} className="hover:bg-slate-800/40">
                      <td className="py-2.5 font-mono text-slate-400">{row.installmentNumber}</td>
                      <td className="py-2.5 text-slate-300">{row.dueDate}</td>
                      <td className="py-2.5 text-right font-mono text-slate-300">${row.principalAmount.toFixed(2)}</td>
                      <td className="py-2.5 text-right font-mono text-slate-400">${row.interestAmount.toFixed(2)}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-white">${row.totalInstallment.toFixed(2)}</td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            row.status === 'PAID'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPortal;
