import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  IndianRupee,
  Calculator,
  Bell,
  X,
  CreditCard,
  ShieldCheck,
  ChevronRight,
  Pencil,
  Lock,
  Download,
  Printer
} from 'lucide-react';
import {
  Account,
  Transaction,
  Loan,
  LoanRepaymentSchedule,
  LoanEligibilityAssessment,
  MfaChallengeDetails,
  NotificationItem
} from '../types';
import { accountApi, transactionApi, loanApi, notificationApi, customerApi, mfaApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getPermissions } from '../utils/rbac';
import { CustomerBankingServices, CustomerSection } from '../components/CustomerBankingServices';
import { downloadTransactionReceipt, printTransactionReceipt } from '../utils/receipt';

const VALID_SECTIONS: CustomerSection[] = [
  'transfers',
  'receipts',
  'rtgs',
  'home-loan',
  'education-loan',
  'vehicle-loan',
  'loan-eligibility',
  'cibil-score',
  'emi-calculator',
  'loan-tracking',
  'loan-repayment',
  'fd',
  'rd',
  'fd-calculator',
  'rd-calculator',
  'fd-renewal',
];

export const CustomerPortal: React.FC = () => {
  const { user } = useAuth();
  const perms = getPermissions(user);
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionParam = searchParams.get('section') as CustomerSection | null;
  const activeSection: CustomerSection =
    sectionParam && VALID_SECTIONS.includes(sectionParam) ? sectionParam : 'transfers';

  const handleChangeSection = (nextSection: CustomerSection) => {
    if (nextSection === 'transfers') {
      setSearchParams({});
    } else {
      setSearchParams({ section: nextSection });
    }
    setFeedback(null);
  };

  const DEFAULT_ACCOUNTS: Account[] = [
    {
      id: 1,
      accountNumber: 'ACC1001',
      customerId: 1,
      customerName: 'Aarav Sharma',
      balance: 10000.0,
      status: 'ACTIVE',
      currency: 'INR',
      createdAt: '2026-11-20T10:00:00Z',
    },
    {
      id: 2,
      accountNumber: 'ACC2004',
      customerId: 2,
      customerName: 'Priya Patel',
      balance: 25000.0,
      status: 'ACTIVE',
      currency: 'INR',
      createdAt: '2026-11-21T11:00:00Z',
    },
    {
      id: 3,
      accountNumber: 'ACC3005',
      customerId: 3,
      customerName: 'Vikram Mehta',
      balance: 5000.0,
      status: 'ACTIVE',
      currency: 'INR',
      createdAt: '2026-11-22T09:30:00Z',
    },
  ];

  // Accounts State (hydrated from localStorage if offline, synced from PostgreSQL when live)
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const cached = localStorage.getItem('bank_demo_accounts');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage parse failure
    }
    return DEFAULT_ACCOUNTS;
  });
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

  // Edit Customer Details Modal State (Teller / Admin privilege)
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('+91 9876543210');
  const [editAddress, setEditAddress] = useState('101 Financial District, Hyderabad');

  // Adaptive Transaction MFA Modal State
  const [txMfaModal, setTxMfaModal] = useState<{
    challenge: MfaChallengeDetails;
    sourceAccountNumber: string;
    destinationAccountNumber: string;
    amount: number;
    method: 'EMAIL_OTP' | 'TOTP';
    code: string;
    info?: string;
    error?: string;
    cooldown: number;
    verifying: boolean;
  } | null>(null);

  const visibleAccounts = perms.canViewAllAccounts
    ? accounts
    : accounts.filter(
        (a) =>
          (user?.accountNumber && a.accountNumber === user.accountNumber) ||
          (user?.fullName && a.customerName?.toLowerCase() === user.fullName.toLowerCase()) ||
          (user?.id && a.customerId === user.id)
      );

  const handleOpenEditCustomer = () => {
    const parts = (selectedAccount.customerName || 'Aarav Sharma').split(' ');
    setEditFirstName(parts[0] || 'Aarav');
    setEditLastName(parts.slice(1).join(' ') || 'Sharma');
    setShowEditCustomerModal(true);
  };

  const handleSaveCustomerDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perms.canEditCustomerDetails) return;
    const updatedName = `${editFirstName.trim()} ${editLastName.trim()}`.trim();
    const customerNumber = `CUST100${selectedAccount.customerId || 1}`;
    try {
      await customerApi.updateCustomer(customerNumber, {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
      });
    } catch {
      // Fallback to local state update when backend is offline
    }
    setSelectedAccount((prev) => ({ ...prev, customerName: updatedName }));
    setAccounts((prev) =>
      prev.map((a) =>
        a.customerId === selectedAccount.customerId ? { ...a, customerName: updatedName } : a
      )
    );
    setFeedback({
      type: 'success',
      message: `Updated customer profile details for ${customerNumber} (${updatedName}).`,
    });
    setShowEditCustomerModal(false);
  };

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
          currency: 'INR',
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

  // Persist account list to localStorage cache so offline/demo balances also survive refresh
  useEffect(() => {
    try {
      localStorage.setItem('bank_demo_accounts', JSON.stringify(accounts));
    } catch {
      // ignore
    }
  }, [accounts]);

  // Load Initial Data (and refresh whenever user changes)
  useEffect(() => {
    fetchLiveAccounts();
    fetchNotifications();
  }, [user?.id, user?.accountNumber]);

  // Fetch transactions and loans when selected account number changes
  useEffect(() => {
    if (selectedAccount?.accountNumber) {
      fetchTransactions(selectedAccount.accountNumber);
      fetchLoans();
    }
  }, [selectedAccount?.accountNumber]);

  const selectBestAccount = (list: Account[]) => {
    if (list.length === 0) return;
    const currentStillExists = list.find(
      (a) => a.accountNumber === selectedAccount?.accountNumber
    );
    if (currentStillExists) {
      setSelectedAccount(currentStillExists);
      return;
    }
    const match = user
      ? list.find(
          (a) =>
            (user.accountNumber && a.accountNumber === user.accountNumber) ||
            (user.fullName && a.customerName?.toLowerCase() === user.fullName.toLowerCase()) ||
            (user.id && a.customerId === user.id)
        )
      : null;
    setSelectedAccount(match || list[0]);
  };

  const fetchLiveAccounts = async () => {
    const token = localStorage.getItem('bank_token');
    if (!token || token.startsWith('bank_token_')) return;

    if (perms.canViewAllAccounts) {
      try {
        // 1. Admin / Staff / Loan Officer / Teller: list all accounts
        const data = await accountApi.getAccounts(0, 50);
        if (data && data.content && data.content.length > 0) {
          setAccounts(data.content);
          selectBestAccount(data.content);
          return;
        }
      } catch {
        // Fall through if restricted
      }
    }

    try {
      // 2. Customer role: fetch own customer accounts & active transfer beneficiaries from PostgreSQL
      const customerNumber =
        user?.username === 'priya_patel'
          ? 'CUST1002'
          : user?.username === 'aarav_sharma'
          ? 'CUST1001'
          : `CUST100${user?.id || 1}`;
      const [custAccounts, targets] = await Promise.all([
        customerApi.getCustomerAccounts(customerNumber),
        accountApi.getTransferTargets().catch(() => [] as Account[]),
      ]);
      if (Array.isArray(custAccounts) && custAccounts.length > 0) {
        const merged = [...custAccounts];
        for (const t of targets) {
          if (!merged.some((m) => m.accountNumber === t.accountNumber)) {
            merged.push(t);
          }
        }
        setAccounts(merged);
        selectBestAccount(custAccounts);
        return;
      }
    } catch {
      // Try single-account endpoint as fallback
    }

    try {
      const targetAcc = user?.accountNumber || selectedAccount.accountNumber || 'ACC1001';
      const single = await accountApi.getAccountByNumber(targetAcc);
      if (single) {
        setAccounts((prev) =>
          prev.some((a) => a.accountNumber === single.accountNumber)
            ? prev.map((a) => (a.accountNumber === single.accountNumber ? single : a))
            : [single, ...prev]
        );
        setSelectedAccount(single);
      }
    } catch {
      console.log('Using cached/seeded account state');
    }
  };

  const fetchTransactions = async (accNum: string) => {
    setLoadingTxns(true);
    try {
      const token = localStorage.getItem('bank_token');
      if (token && !token.startsWith('bank_token_')) {
        const data = await transactionApi.getAccountTransactions(accNum, 0, 20);
        if (data && data.content) {
          setAccountTransactions(data.content);
          try {
            localStorage.setItem(`bank_demo_txns_${accNum}`, JSON.stringify(data.content));
          } catch {
            // ignore
          }
          return;
        }
      }
      throw new Error('Offline or demo session');
    } catch {
      // Load persisted local transactions first, otherwise fallback mock transactions
      try {
        const saved = localStorage.getItem(`bank_demo_txns_${accNum}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setAccountTransactions(parsed);
            return;
          }
        }
      } catch {
        // ignore
      }
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
    const token = localStorage.getItem('bank_token');
    if (token && !token.startsWith('bank_token_')) {
      try {
        const data = await loanApi.getLoans();
        if (data && data.content) {
          setMyLoans(data.content.filter((l) => l.accountNumber === selectedAccount.accountNumber));
          return;
        }
      } catch {
        // Expected 403 for CUSTOMER role; fetch customer's own loans directly
      }

      try {
        const customerLoans = await loanApi.getCustomerLoans(selectedAccount.customerId || user?.id || 1);
        if (Array.isArray(customerLoans)) {
          setMyLoans(customerLoans);
          return;
        }
      } catch {
        // ignore
      }
    }

    try {
      const savedLoans = localStorage.getItem(`bank_demo_loans_${selectedAccount.accountNumber}`);
      if (savedLoans) {
        setMyLoans(JSON.parse(savedLoans));
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
          message: `₹2,500.00 credited to ${selectedAccount.accountNumber}. Available balance updated.`,
          status: 'SENT',
          createdAt: new Date().toISOString(),
        },
      ]);
      setUnreadCount(1);
    }
  };

  const isDemoSession = () => {
    const token = localStorage.getItem('bank_token');
    return !token || token.startsWith('bank_token_');
  };

  const recordLocalDemoTransaction = (
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER',
    amt: number,
    srcAcc?: string,
    dstAcc?: string,
    customId?: string
  ) => {
    const prefix = type === 'DEPOSIT' ? 'DEP' : type === 'WITHDRAWAL' ? 'WTH' : 'TRF';
    const txnId = customId || `TXN_${prefix}_${Date.now()}`;
    const nowIso = new Date().toISOString();
    const newTxn: Transaction = {
      id: Date.now(),
      transactionId: txnId,
      type,
      sourceAccountNumber: srcAcc,
      destinationAccountNumber: dstAcc,
      amount: amt,
      status: 'SUCCESS',
      createdAt: nowIso,
    };

    setAccountTransactions((prev) => {
      const updated = [newTxn, ...prev];
      try {
        localStorage.setItem(`bank_demo_txns_${selectedAccount.accountNumber}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    const verb =
      type === 'DEPOSIT'
        ? `Deposited ₹${amt.toFixed(2)} into ${dstAcc}`
        : type === 'WITHDRAWAL'
        ? `Withdrew ₹${amt.toFixed(2)} from ${srcAcc}`
        : `Transferred ₹${amt.toFixed(2)} from ${srcAcc} to ${dstAcc}`;

    setNotifications((prev) => [
      {
        id: Date.now(),
        userId: user?.id || 1,
        type: 'TRANSACTION_SUCCESS',
        title: `${type.charAt(0) + type.slice(1).toLowerCase()} Successful`,
        message: `${verb}. Txn ID: ${txnId}`,
        status: 'SENT',
        createdAt: nowIso,
      },
      ...prev,
    ]);
    setUnreadCount((c) => c + 1);
    return txnId;
  };

  // Execute Deposit
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perms.canPerformTransactions) return;
    if (selectedAccount.status === 'FROZEN') {
      setFeedback({ type: 'error', message: 'Account is FROZEN. Deposits are temporarily restricted.' });
      return;
    }
    const amt = parseFloat(actionAmount);
    if (!amt || amt <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid deposit amount.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      if (isDemoSession()) {
        const txnId = recordLocalDemoTransaction('DEPOSIT', amt, undefined, selectedAccount.accountNumber);
        setFeedback({ type: 'success', message: `Successfully deposited ₹${amt.toFixed(2)}! Txn ID: ${txnId}` });
        setSelectedAccount((prev) => ({ ...prev, balance: prev.balance + amt }));
        setAccounts((prev) =>
          prev.map((a) => (a.accountNumber === selectedAccount.accountNumber ? { ...a, balance: a.balance + amt } : a))
        );
        setActionAmount('');
        return;
      }

      const txn = await transactionApi.deposit(selectedAccount.accountNumber, amt, user?.username || 'CustomerPortal');
      setFeedback({ type: 'success', message: `Successfully deposited ₹${amt.toFixed(2)}! Txn ID: ${txn.transactionId}` });
      setSelectedAccount((prev) => ({ ...prev, balance: prev.balance + amt }));
      setAccounts((prev) =>
        prev.map((a) => (a.accountNumber === selectedAccount.accountNumber ? { ...a, balance: a.balance + amt } : a))
      );
      setActionAmount('');
      await fetchLiveAccounts();
      fetchTransactions(selectedAccount.accountNumber);
      fetchNotifications();
    } catch (err: any) {
      if (!err.response || err.response.status === 401) {
        const txnId = recordLocalDemoTransaction('DEPOSIT', amt, undefined, selectedAccount.accountNumber);
        setFeedback({ type: 'success', message: `Successfully deposited ₹${amt.toFixed(2)} (Local Demo)! Txn ID: ${txnId}` });
        setSelectedAccount((prev) => ({ ...prev, balance: prev.balance + amt }));
        setAccounts((prev) =>
          prev.map((a) => (a.accountNumber === selectedAccount.accountNumber ? { ...a, balance: a.balance + amt } : a))
        );
        setActionAmount('');
      } else {
        setFeedback({
          type: 'error',
          message: err.response?.data?.message || 'Deposit failed. Ensure the account is not frozen.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Withdrawal
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perms.canPerformTransactions) return;
    if (selectedAccount.status === 'FROZEN') {
      setFeedback({ type: 'error', message: 'Account is FROZEN. Withdrawals are restricted.' });
      return;
    }
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
      if (isDemoSession()) {
        const txnId = recordLocalDemoTransaction('WITHDRAWAL', amt, selectedAccount.accountNumber);
        setFeedback({ type: 'success', message: `Successfully withdrew ₹${amt.toFixed(2)}! Txn ID: ${txnId}` });
        setSelectedAccount((prev) => ({ ...prev, balance: prev.balance - amt }));
        setAccounts((prev) =>
          prev.map((a) => (a.accountNumber === selectedAccount.accountNumber ? { ...a, balance: a.balance - amt } : a))
        );
        setActionAmount('');
        return;
      }

      const txn = await transactionApi.withdraw(selectedAccount.accountNumber, amt, user?.username || 'CustomerPortal');
      setFeedback({ type: 'success', message: `Successfully withdrew ₹${amt.toFixed(2)}! Txn ID: ${txn.transactionId}` });
      setSelectedAccount((prev) => ({ ...prev, balance: prev.balance - amt }));
      setAccounts((prev) =>
        prev.map((a) => (a.accountNumber === selectedAccount.accountNumber ? { ...a, balance: a.balance - amt } : a))
      );
      setActionAmount('');
      await fetchLiveAccounts();
      fetchTransactions(selectedAccount.accountNumber);
      fetchNotifications();
    } catch (err: any) {
      if (!err.response || err.response.status === 401) {
        const txnId = recordLocalDemoTransaction('WITHDRAWAL', amt, selectedAccount.accountNumber);
        setFeedback({ type: 'success', message: `Successfully withdrew ₹${amt.toFixed(2)} (Local Demo)! Txn ID: ${txnId}` });
        setSelectedAccount((prev) => ({ ...prev, balance: prev.balance - amt }));
        setAccounts((prev) =>
          prev.map((a) => (a.accountNumber === selectedAccount.accountNumber ? { ...a, balance: a.balance - amt } : a))
        );
        setActionAmount('');
      } else {
        setFeedback({
          type: 'error',
          message: err.response?.data?.message || 'Withdrawal failed. Check transaction limits or account status.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Transfer
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perms.canPerformTransactions) return;
    if (selectedAccount.status === 'FROZEN') {
      setFeedback({ type: 'error', message: 'Account is FROZEN. Transfers are restricted.' });
      return;
    }
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
      if (isDemoSession()) {
        const txnId = recordLocalDemoTransaction('TRANSFER', amt, selectedAccount.accountNumber, transferTarget);
        setFeedback({
          type: 'success',
          message: `Transferred ₹${amt.toFixed(2)} to ${transferTarget}! Txn ID: ${txnId}`,
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
        return;
      }

      const txn = await transactionApi.transfer(
        selectedAccount.accountNumber,
        transferTarget,
        amt,
        user?.username || 'CustomerPortal'
      );
      setFeedback({
        type: 'success',
        message: `Transferred ₹${amt.toFixed(2)} to ${transferTarget}! Txn ID: ${txn.transactionId}`,
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
      await fetchLiveAccounts();
      fetchTransactions(selectedAccount.accountNumber);
      fetchNotifications();
    } catch (err: any) {
      if (err.response?.status === 428 && err.response?.data?.data?.challengeId) {
        const ch = err.response.data.data as MfaChallengeDetails;
        const preferred = ch.requiredMethod === 'TOTP' ? 'TOTP' : 'EMAIL_OTP';
        let infoMsg: string | undefined;
        let cd = 0;
        if (preferred === 'EMAIL_OTP') {
          try {
            const sent = await mfaApi.sendOtp(ch.challengeId, 'TRANSACTION_VERIFICATION');
            infoMsg = `Verification OTP sent to ${sent.maskedDestination}.`;
            cd = sent.resendCooldownSeconds || 60;
          } catch {
            // ignore auto-send error; user can click Send OTP
          }
        }
        setTxMfaModal({
          challenge: ch,
          sourceAccountNumber: selectedAccount.accountNumber,
          destinationAccountNumber: transferTarget,
          amount: amt,
          method: preferred,
          code: '',
          info: infoMsg,
          cooldown: cd,
          verifying: false,
        });
      } else if (!err.response || err.response.status === 401) {
        const txnId = recordLocalDemoTransaction('TRANSFER', amt, selectedAccount.accountNumber, transferTarget);
        setFeedback({
          type: 'success',
          message: `Transferred ₹${amt.toFixed(2)} to ${transferTarget} (Local Demo)! Txn ID: ${txnId}`,
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
      } else {
        setFeedback({
          type: 'error',
          message: err.response?.data?.message || 'Transfer failed. Check account status or limits.',
        });
      }
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

  const handleBalanceDelta = (delta: number) => {
    setSelectedAccount((prev) => ({
      ...prev,
      balance: Math.round((prev.balance + delta) * 100) / 100,
    }));
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.accountNumber === selectedAccount.accountNumber
          ? { ...acc, balance: Math.round((acc.balance + delta) * 100) / 100 }
          : acc
      )
    );
  };

  const submitSpecializedLoan = async (loanData: {
    amount: number;
    interestRate: number;
    termMonths: number;
    purpose: string;
    monthlyIncome: number;
    existingMonthlyDebt: number;
    creditScore: number;
  }): Promise<boolean> => {
    setIsSubmitting(true);
    const applyDemoLoanLocally = () => {
      const r = loanData.interestRate / 12 / 100;
      const emi =
        (loanData.amount * r * Math.pow(1 + r, loanData.termMonths)) /
        (Math.pow(1 + r, loanData.termMonths) - 1);
      const dti = ((loanData.existingMonthlyDebt + emi) / loanData.monthlyIncome) * 100;
      const emiRounded = Math.round(emi * 100) / 100;
      const nowIso = new Date().toISOString();
      const newLoan: Loan = {
        id: Date.now(),
        loanId: `LN_${Date.now().toString().slice(-6)}`,
        customerId: selectedAccount.customerId || user?.id || 1,
        customerNumber: `CUST${selectedAccount.customerId || 1}`,
        customerName: selectedAccount.customerName || user?.fullName || 'Aarav Sharma',
        customerEmail: user?.email || 'aarav.sharma@bank.in',
        accountNumber: selectedAccount.accountNumber,
        amount: loanData.amount,
        interestRate: loanData.interestRate,
        termMonths: loanData.termMonths,
        status: dti <= 42 && loanData.creditScore >= 720 ? 'APPROVED' : 'UNDER_REVIEW',
        purpose: loanData.purpose,
        monthlyIncome: loanData.monthlyIncome,
        existingMonthlyDebt: loanData.existingMonthlyDebt,
        creditScore: loanData.creditScore,
        dtiRatio: Math.round(dti * 100) / 100,
        emiAmount: emiRounded,
        totalPayable: Math.round(emiRounded * loanData.termMonths * 100) / 100,
        outstandingBalance: loanData.amount,
        requiresAdminApproval: loanData.amount >= 1000000,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setMyLoans((prev) => {
        const updated = [newLoan, ...prev];
        try {
          localStorage.setItem(`bank_demo_loans_${selectedAccount.accountNumber}`, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
      setNotifications((prev) => [
        {
          id: Date.now(),
          userId: user?.id || 1,
          type: 'LOAN_UPDATE',
          title: `Loan Application ${newLoan.loanId}`,
          message: `Submitted ₹${loanData.amount.toLocaleString('en-IN')} (${loanData.purpose}). Status: ${newLoan.status}`,
          status: 'SENT',
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setUnreadCount((c) => c + 1);
      setFeedback({
        type: 'success',
        message: `Loan application ${newLoan.loanId} submitted (${newLoan.status}).`,
      });
    };

    try {
      if (isDemoSession()) {
        applyDemoLoanLocally();
        return true;
      }
      await loanApi.apply({
        accountNumber: selectedAccount.accountNumber,
        amount: loanData.amount,
        interestRate: loanData.interestRate,
        termMonths: loanData.termMonths,
        purpose: loanData.purpose,
        monthlyIncome: loanData.monthlyIncome,
        existingMonthlyDebt: loanData.existingMonthlyDebt,
        creditScore: loanData.creditScore,
      });
      setFeedback({
        type: 'success',
        message: 'Loan application submitted successfully! Our Loan Officers will review your application shortly.',
      });
      fetchLoans();
      fetchNotifications();
      return true;
    } catch (err: any) {
      if (!err.response || err.response.status === 401) {
        applyDemoLoanLocally();
        return true;
      }
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit loan application.',
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteServiceDebit = async (
    type: 'WITHDRAWAL' | 'TRANSFER',
    amount: number,
    dstAcc?: string,
    customId?: string
  ): Promise<{ ok: boolean; txnId?: string; message?: string }> => {
    const runLocalFallback = () => {
      handleBalanceDelta(-amount);
      if (type === 'TRANSFER' && dstAcc) {
        setAccounts((prev) =>
          prev.map((a) =>
            a.accountNumber === dstAcc
              ? { ...a, balance: Math.round((a.balance + amount) * 100) / 100 }
              : a
          )
        );
      }
      const txnId = recordLocalDemoTransaction(
        type,
        amount,
        selectedAccount.accountNumber,
        dstAcc,
        customId
      );
      return { ok: true, txnId };
    };

    if (isDemoSession()) {
      return runLocalFallback();
    }

    try {
      const txn =
        type === 'TRANSFER' && dstAcc && /^ACC\d+$/i.test(dstAcc)
          ? await transactionApi.transfer(
              selectedAccount.accountNumber,
              dstAcc,
              amount,
              user?.username || 'CustomerPortal'
            )
          : await transactionApi.withdraw(
              selectedAccount.accountNumber,
              amount,
              user?.username || 'CustomerPortal'
            );

      await fetchLiveAccounts();
      fetchTransactions(selectedAccount.accountNumber);
      fetchNotifications();
      return { ok: true, txnId: txn.transactionId };
    } catch (err: any) {
      if (err.response?.status === 428 && err.response?.data?.data?.challengeId && dstAcc) {
        const ch = err.response.data.data as MfaChallengeDetails;
        const preferred = ch.requiredMethod === 'TOTP' ? 'TOTP' : 'EMAIL_OTP';
        let infoMsg: string | undefined;
        let cd = 0;
        if (preferred === 'EMAIL_OTP') {
          try {
            const sent = await mfaApi.sendOtp(ch.challengeId, 'TRANSACTION_VERIFICATION');
            infoMsg = `Verification OTP sent to ${sent.maskedDestination}.`;
            cd = sent.resendCooldownSeconds || 60;
          } catch {
            // ignore
          }
        }
        setTxMfaModal({
          challenge: ch,
          sourceAccountNumber: selectedAccount.accountNumber,
          destinationAccountNumber: dstAcc,
          amount,
          method: preferred,
          code: '',
          info: infoMsg,
          cooldown: cd,
          verifying: false,
        });
        return { ok: false, message: 'Additional MFA verification required. Complete the security modal to finalize.' };
      }
      if (!err.response || err.response.status === 401) {
        return runLocalFallback();
      }
      return {
        ok: false,
        message: err.response?.data?.message || 'Transaction failed on server.',
      };
    }
  };

  const handlePayLoanEmi = async (loanId: string, emiAmount: number): Promise<boolean> => {
    const applyLocalEmi = () => {
      handleBalanceDelta(-emiAmount);
      setMyLoans((prev) => {
        const updated = prev.map((loan) => {
          if (loan.loanId !== loanId) return loan;
          const currentOut = loan.outstandingBalance ?? loan.amount;
          const nextOut = Math.max(0, Math.round((currentOut - emiAmount) * 100) / 100);
          return {
            ...loan,
            outstandingBalance: nextOut,
            status: nextOut <= 0 ? ('PAID' as const) : loan.status,
          };
        });
        try {
          localStorage.setItem(`bank_demo_loans_${selectedAccount.accountNumber}`, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
      recordLocalDemoTransaction(
        'WITHDRAWAL',
        emiAmount,
        selectedAccount.accountNumber,
        loanId,
        `EMI_${loanId}_${Date.now().toString().slice(-5)}`
      );
      return true;
    };

    if (isDemoSession()) {
      return applyLocalEmi();
    }

    try {
      await loanApi.repay(loanId, emiAmount, selectedAccount.accountNumber);
      await fetchLiveAccounts();
      await fetchLoans();
      fetchTransactions(selectedAccount.accountNumber);
      fetchNotifications();
      return true;
    } catch (err: any) {
      if (!err.response || err.response.status === 401) {
        return applyLocalEmi();
      }
      // If sample fallback loan LN1732456012 isn't in DB, still debit real account via withdrawal so DB balance persists
      if (loanId === 'LN1732456012') {
        const res = await handleExecuteServiceDebit('WITHDRAWAL', emiAmount, loanId);
        return res.ok;
      }
      return false;
    }
  };

  // Submit Loan Application
  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await submitSpecializedLoan({
      amount: loanAmount,
      interestRate: 8.5,
      termMonths: loanTenure,
      purpose: loanPurpose,
      monthlyIncome,
      existingMonthlyDebt: monthlyDebt,
      creditScore,
    });
    if (ok) {
      setShowApplyModal(false);
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

  const sanitizeDisplayName = (name?: string, fallback?: string) => {
    const raw = (name || fallback || 'Aarav Sharma').trim();
    if (/^john\s+doe$/i.test(raw)) return 'Aarav Sharma';
    if (/^jane\s+smith$/i.test(raw)) return 'Priya Patel';
    return raw;
  };

  const currentPersonName = sanitizeDisplayName(user?.fullName || user?.username, selectedAccount.customerName);
  const cardHolderName = sanitizeDisplayName(selectedAccount.customerName, currentPersonName);
  const cardLastFour = (selectedAccount.accountNumber.replace(/\D/g, '').slice(-4) || '1001').padStart(4, '0');

  const renderTransactionLedgerCard = () => (
    <div className="bg-[#EFE2CE] rounded-2xl border border-[#D9C7AB] shadow-md p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#1B130D] tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#70411A]" /> Account Transaction Ledger
          </h2>
          <p className="text-xs text-[#3F3124]">Showing recent activity for {selectedAccount.accountNumber}</p>
        </div>
        <button
          onClick={() => fetchTransactions(selectedAccount.accountNumber)}
          className="p-2 rounded-xl bg-[#EBDEC8] hover:bg-[#EFE4D2] border border-[#D9C7AB] text-[#1B130D] transition-colors"
          title="Refresh Ledger"
        >
          <RefreshCw className={`w-4 h-4 ${loadingTxns ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#D9C7AB] text-[#3F3124] uppercase text-[10px] tracking-wider">
              <th className="pb-3 font-semibold">Txn ID / Time</th>
              <th className="pb-3 font-semibold">Type</th>
              <th className="pb-3 font-semibold">Details</th>
              <th className="pb-3 font-semibold text-right">Amount</th>
              <th className="pb-3 font-semibold text-right">Status</th>
              <th className="pb-3 font-semibold text-right">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9C7AB]">
            {accountTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#3F3124]">
                  No transactions recorded for this account yet.
                </td>
              </tr>
            ) : (
              accountTransactions.map((tx) => {
                const isCredit =
                  tx.type === 'DEPOSIT' ||
                  (tx.type === 'TRANSFER' && tx.destinationAccountNumber === selectedAccount.accountNumber);
                return (
                  <tr key={tx.id || tx.transactionId} className="hover:bg-[#EFE4D2]/50 transition-colors">
                    <td className="py-3 font-mono">
                      <div className="font-semibold text-[#1B130D]">{tx.transactionId}</div>
                      <div className="text-[10px] text-[#3F3124]">
                        {new Date(tx.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.type === 'DEPOSIT'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                            : tx.type === 'WITHDRAWAL'
                            ? 'bg-amber-100 text-amber-950 border border-amber-400'
                            : 'bg-[#EFE4D2] text-[#70411A] border border-[#9A7C59]/50'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 text-[#1B130D] font-mono text-[11px]">
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
                        isCredit
                          ? 'text-emerald-700'
                          : tx.type === 'WITHDRAWAL'
                          ? 'text-amber-800'
                          : 'text-[#1B130D]'
                      }`}
                    >
                      {isCredit ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          tx.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            downloadTransactionReceipt(
                              tx,
                              selectedAccount.accountNumber,
                              selectedAccount.customerName || user?.fullName || 'Customer'
                            );
                            setFeedback({
                              type: 'success',
                              message: `Receipt_${tx.transactionId}.html downloaded.`,
                            });
                          }}
                          title="Download Receipt"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#EBDEC8] hover:bg-[#D9A86C]/35 text-[#70411A] border border-[#9A7C59]/40 text-[10px] font-semibold transition-colors"
                        >
                          <Download className="w-3 h-3" /> Save
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            printTransactionReceipt(
                              tx,
                              selectedAccount.accountNumber,
                              selectedAccount.customerName || user?.fullName || 'Customer'
                            )
                          }
                          title="Print / Save as PDF"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#EBDEC8] hover:bg-[#D9A86C]/35 text-[#1B130D] border border-[#9A7C59]/40 text-[10px] font-semibold transition-colors"
                        >
                          <Printer className="w-3 h-3" /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & Notification Bar (Dark Beige Upper Header) */}
      <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#E9D9C0] p-6 rounded-2xl border border-[#CEB896] shadow-md">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#70411A] to-[#8E4322] flex items-center justify-center text-white shadow-md shadow-[#70411A]/20">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1B130D] tracking-tight">Personal Banking</h1>
            <p className="text-sm text-[#3F3124]">
              Welcome back, <span className="text-[#70411A] font-semibold">{currentPersonName}</span> &bull;{' '}
              <span className="font-mono text-xs text-[#1B130D]">{perms.tierLabel}</span>
            </p>
          </div>
        </div>

        {/* Account Selector & Live Notification Bell */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedAccount.accountNumber}
              disabled={!perms.canViewAllAccounts}
              onChange={(e) => {
                const found = accounts.find((a) => a.accountNumber === e.target.value);
                if (found) setSelectedAccount(found);
              }}
              className="bg-[#EBDEC8] border border-[#D9C7AB] text-[#1B130D] text-sm rounded-xl px-4 py-2.5 pr-8 font-mono focus:ring-2 focus:ring-[#70411A] focus:outline-none appearance-none disabled:opacity-80"
              title={perms.canViewAllAccounts ? 'Switch customer account' : 'Standard users can only view their own account'}
            >
              {(visibleAccounts.length > 0 ? visibleAccounts : [selectedAccount]).map((acc) => (
                <option key={acc.accountNumber} value={acc.accountNumber}>
                  {acc.accountNumber} ({acc.currency} ₹{(acc.balance || 0).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl bg-[#EBDEC8] hover:bg-[#EFE4D2] border border-[#D9C7AB] text-[#1B130D] transition-colors"
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
              <div
                style={{ backgroundColor: '#FFFDF9' }}
                className="absolute right-0 mt-3 w-80 sm:w-96 bg-white opacity-100 border-2 border-[#CEB896] rounded-2xl shadow-2xl z-[100] p-4 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-[#D9C7AB] pb-2">
                  <h3 className="font-bold text-[#1B130D] text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#70411A]" /> Live Outbox Notifications
                  </h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-lg text-[#3F3124] hover:text-[#1B130D] hover:bg-[#EFE4D2]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-[#3F3124] text-center py-4">No recent notifications</p>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-[#EFE4D2] border border-[#D9C7AB] shadow-sm text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#70411A]">{item.title}</span>
                          <span className="text-[#3F3124] text-[10px] font-mono">
                            {new Date(item.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-[#1B130D] font-medium">{item.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={async () => {
                    await notificationApi.markAllAsRead();
                    setUnreadCount(0);
                  }}
                  className="w-full py-2 rounded-xl bg-[#70411A] hover:bg-[#542F11] text-white text-xs text-center font-semibold transition-colors"
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
        {/* First Tile: Styled Bank Debit Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#261D15] via-[#3B2A1C] to-[#593A22] border border-[#D9A86C]/60 text-[#F4ECE0] shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[172px]">
          {/* Subtle decorative card sheen */}
          <div className="pointer-events-none absolute -right-10 -top-10 w-36 h-36 rounded-full bg-[#D9A86C]/15 blur-xl" />
          <div className="pointer-events-none absolute -left-8 -bottom-10 w-32 h-32 rounded-full bg-[#D9A86C]/10 blur-xl" />

          {/* Card Header: Chip, Brand & Status */}
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Metallic EMV Chip */}
              <div className="w-9 h-6 rounded-md bg-gradient-to-br from-[#F3D299] via-[#D9A86C] to-[#9E6E35] border border-[#FFF3D6]/50 shadow-inner flex items-center justify-center">
                <div className="w-5 h-3.5 border border-[#542F11]/40 rounded-[2px] grid grid-cols-2 gap-px p-[1px]">
                  <span className="border-r border-[#542F11]/30" />
                  <span />
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-wider uppercase text-[#D9A86C]">Bank Debit</div>
                <div className="text-[10px] font-mono text-[#EFE4D2]/75">{selectedAccount.accountNumber}</div>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D9A86C]/20 text-[#F3D299] border border-[#D9A86C]/50">
              {selectedAccount.status}
            </span>
          </div>

          {/* Masked 16-Digit Card Number */}
          <div className="relative my-3 font-mono text-base sm:text-lg tracking-[0.18em] font-semibold text-white">
            4532 &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; {cardLastFour}
          </div>

          {/* Card Footer: Holder Name, Validity & Currency */}
          <div className="relative flex items-end justify-between gap-2 text-xs">
            <div>
              <div className="text-[9px] uppercase tracking-widest text-[#EFE4D2]/65">Card Holder</div>
              <div className="font-semibold tracking-wide text-white uppercase">{cardHolderName}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-widest text-[#EFE4D2]/65">Valid Thru</div>
                <div className="font-mono text-[11px] font-semibold text-[#F3D299]">11/30 &bull; {selectedAccount.currency}</div>
              </div>
              {perms.canEditCustomerDetails && (
                <button
                  type="button"
                  onClick={handleOpenEditCustomer}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#D9A86C]/20 hover:bg-[#D9A86C]/35 text-[#F3D299] border border-[#D9A86C]/50 text-[10px] font-semibold transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#E9D9C0] border border-[#CEB896] shadow-md relative">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-[#3F3124] uppercase tracking-wider">Available Balance</span>
            <ShieldCheck className="w-5 h-5 text-[#70411A]" />
          </div>
          <div className="text-3xl font-bold text-[#1B130D] mb-1">
            ₹{(selectedAccount.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-900 font-semibold">Real-time Row-Locked Balance</div>
        </div>

        <div className="p-6 rounded-2xl bg-[#E9D9C0] border border-[#CEB896] shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#3F3124] uppercase tracking-wider">Credit Underwriting</span>
              <span className="text-xs font-bold text-[#8E4322]">8.50% APR</span>
            </div>
            <div className="text-lg font-bold text-[#1B130D]">Personal & Business Loans</div>
            <p className="text-xs text-[#3F3124] mt-1 font-medium">Instant pre-qualification with automated DTI assessment.</p>
          </div>
          <button
            onClick={() => {
              setActiveTab('LOANS');
              setShowApplyModal(true);
            }}
            className="mt-4 w-full py-2 px-4 rounded-xl bg-[#8E4322] hover:bg-[#4E3424] text-white font-semibold text-xs shadow-md shadow-[#8E4322]/20 transition-all flex items-center justify-center gap-1.5"
          >
            <IndianRupee className="w-4 h-4" /> Apply for Loan
          </button>
        </div>
      </div>

      {/* Customer Specialized Banking Section OR Standard Main Operations Grid */}
      {activeSection !== 'transfers' ? (
        <div className="space-y-8">
          <CustomerBankingServices
            section={activeSection}
            onChangeSection={handleChangeSection}
            selectedAccount={selectedAccount}
            accountTransactions={accountTransactions}
            myLoans={myLoans}
            canPerformTransactions={perms.canPerformTransactions}
            onExecuteServiceDebit={handleExecuteServiceDebit}
            onSubmitLoan={submitSpecializedLoan}
            onPayLoanEmi={handlePayLoanEmi}
            onViewSchedule={handleViewSchedule}
          />
          {activeSection === 'rtgs' && renderTransactionLedgerCard()}
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Transaction Desk (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#EFE2CE] rounded-2xl border border-[#D9C7AB] shadow-md p-6 shadow-md">
            {/* Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-[#EBDEC8] p-1 rounded-xl mb-6 text-xs font-semibold">
              <button
                onClick={() => {
                  setActiveTab('TRANSFER');
                  setFeedback(null);
                }}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'TRANSFER'
                    ? 'bg-[#70411A] text-white shadow'
                    : 'text-[#3F3124] hover:text-[#1B130D]'
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
                    : 'text-[#3F3124] hover:text-[#1B130D]'
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
                    : 'text-[#3F3124] hover:text-[#1B130D]'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> Withdraw
              </button>
            </div>

            {/* Read-Only Banner for Non-Transacting Roles */}
            {!perms.canPerformTransactions && (
              <div className="p-3 rounded-xl mb-4 text-xs flex items-center gap-2 bg-amber-50 text-amber-900 border border-amber-200">
                <Lock className="w-4 h-4 shrink-0" />
                <span>
                  Read-only mode ({perms.designationTitle}): Transfers, deposits, and withdrawals require Customer, Teller, or Admin privileges.
                </span>
              </div>
            )}

            {/* Feedback Alert */}
            {feedback && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                    : 'bg-rose-100 text-rose-900 border border-rose-400'
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
                  <label className="block text-xs font-medium text-[#1B130D] mb-1">From Account</label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedAccount.accountNumber} (₹${selectedAccount.balance.toLocaleString()})`}
                    className="w-full bg-white border border-[#9A7C59] rounded-xl shadow-inner px-3 py-2 text-xs text-[#3F3124] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1B130D] mb-1">To Account</label>
                  <select
                    value={transferTarget}
                    onChange={(e) => setTransferTarget(e.target.value)}
                    className="w-full bg-white border border-[#9A7C59] rounded-xl shadow-inner px-3 py-2 text-xs text-[#1B130D] font-mono focus:ring-2 focus:ring-[#70411A] focus:outline-none"
                  >
                    {accounts
                      .filter((a) => a.accountNumber !== selectedAccount.accountNumber && a.status !== 'FROZEN')
                      .map((a) => (
                        <option key={a.accountNumber} value={a.accountNumber}>
                          {a.accountNumber} — {a.customerName || 'Customer'}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1B130D] mb-1">Transfer Amount (₹ INR)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#3F3124] text-xs">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={actionAmount}
                      onChange={(e) => setActionAmount(e.target.value)}
                      className="w-full bg-white border border-[#9A7C59] rounded-xl shadow-inner pl-7 pr-3 py-2 text-sm text-[#1B130D] font-semibold focus:ring-2 focus:ring-[#70411A] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#EBDEC8]/70 border border-[#D9C7AB] text-[11px] text-[#3F3124] space-y-1">
                  <div className="flex justify-between">
                    <span>Settlement Method:</span>
                    <span className="text-emerald-700 font-medium">Instant Electronic Transfer</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Time:</span>
                    <span className="text-[#1B130D] font-medium">Immediate (Real-Time)</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !perms.canPerformTransactions}
                  className="w-full py-2.5 rounded-xl bg-[#70411A] hover:bg-[#542F11] disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-[#70411A]/20 transition-all flex items-center justify-center gap-2"
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
                  <label className="block text-xs font-medium text-[#1B130D] mb-1">Target Account</label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedAccount.accountNumber} (₹${selectedAccount.balance.toLocaleString()})`}
                    className="w-full bg-white border border-[#9A7C59] rounded-xl shadow-inner px-3 py-2 text-xs text-[#3F3124] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1B130D] mb-1">Deposit Amount (₹ INR)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#3F3124] text-xs">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={actionAmount}
                      onChange={(e) => setActionAmount(e.target.value)}
                      className="w-full bg-white border border-[#9A7C59] rounded-xl shadow-inner pl-7 pr-3 py-2 text-sm text-[#1B130D] font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[100, 500, 2000].map((quick) => (
                    <button
                      type="button"
                      key={quick}
                      onClick={() => setActionAmount(quick.toString())}
                      className="py-1.5 rounded-lg bg-[#EBDEC8] hover:bg-[#EFE4D2] border border-[#D9C7AB] text-[#1B130D] text-xs font-mono"
                    >
                      +₹{quick}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !perms.canPerformTransactions}
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
                  <label className="block text-xs font-medium text-[#1B130D] mb-1">Source Account</label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedAccount.accountNumber} (Available: ₹${selectedAccount.balance.toLocaleString()})`}
                    className="w-full bg-white border border-[#9A7C59] rounded-xl shadow-inner px-3 py-2 text-xs text-[#3F3124] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1B130D] mb-1">Withdrawal Amount (₹ INR)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#3F3124] text-xs">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={actionAmount}
                      onChange={(e) => setActionAmount(e.target.value)}
                      className="w-full bg-white border border-[#9A7C59] rounded-xl shadow-inner pl-7 pr-3 py-2 text-sm text-[#1B130D] font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !perms.canPerformTransactions}
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
          <div className="bg-[#EFE2CE] rounded-2xl border border-[#D9C7AB] shadow-md p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#1B130D] text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#8E4322]" /> Interactive Loan Underwriting Preview
              </h3>
              <button
                onClick={handleSimulateEligibility}
                className="text-xs text-[#8E4322] hover:text-[#4E3424] font-medium"
              >
                Re-Calculate
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-[#3F3124] mb-1">
                  <span>Loan Amount:</span>
                  <span className="font-bold text-[#1B130D]">₹{loanAmount.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="500000"
                  step="5000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full accent-[#70411A]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#3F3124] mb-1">
                  <span>Tenure (Months):</span>
                  <span className="font-bold text-[#1B130D]">{loanTenure} Months</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="60"
                  step="6"
                  value={loanTenure}
                  onChange={(e) => setLoanTenure(Number(e.target.value))}
                  className="w-full accent-[#70411A]"
                />
              </div>

              {simulation && (
                <div className="p-3 rounded-xl bg-[#EBDEC8] border border-[#D9C7AB] space-y-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-[#3F3124]">Estimated EMI:</span>
                    <span className="font-bold text-[#1B130D] font-mono">₹{simulation.proposedEmi.toLocaleString()}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#3F3124]">DTI Ratio:</span>
                    <span
                      className={`font-bold font-mono ${
                        simulation.dtiRatio <= 40
                          ? 'text-emerald-700'
                          : simulation.dtiRatio <= 50
                          ? 'text-amber-800'
                          : 'text-rose-700'
                      }`}
                    >
                      {simulation.dtiRatio}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#3F3124]">Risk Assessment:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFE4D2] text-[#8E4322]">
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
          {renderTransactionLedgerCard()}

          {/* Active Loans Section */}
          <div className="bg-[#EFE2CE] rounded-2xl border border-[#D9C7AB] shadow-md p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#1B130D] tracking-tight flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#8E4322]" /> Active Loans & Applications
                </h2>
                <p className="text-xs text-[#3F3124]">Applications tied to account {selectedAccount.accountNumber}</p>
              </div>
              <button
                onClick={() => setShowApplyModal(true)}
                className="px-3 py-1.5 rounded-xl bg-[#8E4322] hover:bg-[#4E3424] text-white font-semibold text-xs transition-colors flex items-center gap-1"
              >
                + New Loan
              </button>
            </div>

            <div className="space-y-3">
              {myLoans.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-[#D9C7AB] rounded-xl text-[#3F3124] text-xs">
                  No active loans found for this account. Apply today with competitive 8.5% interest rate.
                </div>
              ) : (
                myLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="p-4 rounded-xl bg-[#EBDEC8] border border-[#D9C7AB] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#1B130D] text-sm">{loan.loanId}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            loan.status === 'DISBURSED'
                              ? 'bg-emerald-100 text-emerald-900'
                              : loan.status === 'APPROVED'
                              ? 'bg-[#EFE4D2] text-[#70411A]'
                              : loan.status === 'UNDER_REVIEW'
                              ? 'bg-amber-100 text-amber-950'
                              : loan.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-900'
                              : 'bg-[#EFE4D2] text-[#1B130D]'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#3F3124]">{loan.purpose}</p>
                      <div className="text-xs text-[#3F3124] font-mono">
                        Tenure: {loan.termMonths} Months &bull; EMI: ₹{loan.emiAmount?.toLocaleString()}/mo
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-sm font-bold text-[#1B130D] font-mono">₹{loan.amount.toLocaleString()}</div>
                      <button
                        onClick={() => handleViewSchedule(loan.loanId)}
                        className="text-xs text-[#8E4322] hover:text-[#4E3424] font-medium inline-flex items-center gap-1"
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
      )}

      {/* Modal: Apply for Loan */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B130D]/40 backdrop-blur-sm">
          <div className="bg-[#EBDEC8] border border-[#D9C7AB] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#D9C7AB] pb-3">
              <h3 className="font-bold text-lg text-[#1B130D] flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-[#8E4322]" /> Apply for Loan Underwriting
              </h3>
              <button onClick={() => setShowApplyModal(false)} className="text-[#3F3124] hover:text-[#1B130D]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLoan} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#1B130D] font-medium mb-1">Disbursement Account</label>
                <input
                  type="text"
                  disabled
                  value={selectedAccount.accountNumber}
                  className="w-full bg-[#EFE2CE] border border-[#D9C7AB] shadow-md rounded-xl px-3 py-2 text-[#3F3124] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#1B130D] font-medium mb-1">Requested Amount (₹)</label>
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D] font-mono focus:ring-2 focus:ring-[#70411A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#1B130D] font-medium mb-1">Tenure (Months)</label>
                  <select
                    value={loanTenure}
                    onChange={(e) => setLoanTenure(Number(e.target.value))}
                    className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D] font-mono focus:ring-2 focus:ring-[#70411A] focus:outline-none"
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
                <label className="block text-[#1B130D] font-medium mb-1">Loan Purpose</label>
                <input
                  type="text"
                  value={loanPurpose}
                  onChange={(e) => setLoanPurpose(e.target.value)}
                  placeholder="e.g., Home Renovation, Commercial Inventory"
                  className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D] focus:ring-2 focus:ring-[#70411A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#1B130D] font-medium mb-1">Monthly Income (₹)</label>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                    className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#1B130D] font-medium mb-1">Existing Debt (₹)</label>
                  <input
                    type="number"
                    value={monthlyDebt}
                    onChange={(e) => setMonthlyDebt(Number(e.target.value))}
                    className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#1B130D] font-medium mb-1">Credit Score</label>
                  <input
                    type="number"
                    value={creditScore}
                    onChange={(e) => setCreditScore(Number(e.target.value))}
                    className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D] font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB] shadow-md space-y-1 text-[#3F3124]">
                <div className="flex justify-between">
                  <span>Standard Interest Rate:</span>
                  <span className="text-[#1B130D] font-mono">8.50% p.a.</span>
                </div>
                <div className="flex justify-between">
                  <span>Underwriting Process:</span>
                  <span className="text-[#8E4322] font-medium">Assigned to Loan Officer</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#F3E7D4] hover:bg-[#EFE4D2] text-[#1B130D] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#8E4322] hover:bg-[#4E3424] text-white font-semibold shadow-md shadow-[#8E4322]/20"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Customer Details (Teller / Admin only) */}
      {showEditCustomerModal && perms.canEditCustomerDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B130D]/40 backdrop-blur-sm">
          <div className="bg-[#EBDEC8] border border-[#D9C7AB] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#D9C7AB] pb-3">
              <h3 className="font-bold text-lg text-[#1B130D] flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#70411A]" /> Edit Customer Details
              </h3>
              <button onClick={() => setShowEditCustomerModal(false)} className="text-[#3F3124] hover:text-[#1B130D]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerDetails} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1B130D] font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D] focus:ring-2 focus:ring-[#70411A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#1B130D] font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D] focus:ring-2 focus:ring-[#70411A] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#1B130D] font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D] font-mono focus:ring-2 focus:ring-[#70411A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#1B130D] font-medium mb-1">Residential Address</label>
                <input
                  type="text"
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D] focus:ring-2 focus:ring-[#70411A] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditCustomerModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#F3E7D4] hover:bg-[#EFE4D2] text-[#1B130D] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#70411A] hover:bg-[#542F11] text-white font-semibold shadow-md shadow-[#70411A]/20"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Repayment Schedule */}
      {loanSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B130D]/40 backdrop-blur-sm">
          <div className="bg-[#EBDEC8] border border-[#D9C7AB] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9C7AB] pb-3">
              <div>
                <h3 className="font-bold text-lg text-[#1B130D]">Repayment Schedule & EMI Ledger</h3>
                <p className="text-xs text-[#3F3124] font-mono">Loan ID: {loanSchedule.loanId}</p>
              </div>
              <button onClick={() => setLoanSchedule(null)} className="text-[#3F3124] hover:text-[#1B130D]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#D9C7AB] text-[#3F3124] uppercase text-[10px] tracking-wider">
                    <th className="pb-2">#</th>
                    <th className="pb-2">Due Date</th>
                    <th className="pb-2 text-right">Principal</th>
                    <th className="pb-2 text-right">Interest</th>
                    <th className="pb-2 text-right">Total EMI</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9C7AB]">
                  {loanSchedule.schedule.map((row) => (
                    <tr key={row.installmentNumber} className="hover:bg-[#F3E7D4]/40">
                      <td className="py-2.5 font-mono text-[#3F3124]">{row.installmentNumber}</td>
                      <td className="py-2.5 text-[#1B130D]">{row.dueDate}</td>
                      <td className="py-2.5 text-right font-mono text-[#1B130D]">₹{row.principalAmount.toFixed(2)}</td>
                      <td className="py-2.5 text-right font-mono text-[#3F3124]">₹{row.interestAmount.toFixed(2)}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-[#1B130D]">₹{row.totalInstallment.toFixed(2)}</td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            row.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-amber-100 text-amber-950'
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

      {/* Modal: Adaptive Transaction Verification (AMFA) */}
      {txMfaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B130D]/50 backdrop-blur-sm">
          <div className="bg-[#EBDEC8] border border-[#D9C7AB] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#D9C7AB] pb-3">
              <h3 className="font-bold text-base text-[#1B130D] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#70411A]" /> Transaction Verification Required
              </h3>
              <button onClick={() => setTxMfaModal(null)} className="text-[#3F3124] hover:text-[#1B130D]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#E9D9C0] border border-[#CEB896] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#3F3124]">Transfer Binding</span>
                <span className="font-mono font-bold text-[#1B130D]">
                  {txMfaModal.sourceAccountNumber} &rarr; {txMfaModal.destinationAccountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#3F3124]">Amount</span>
                <span className="font-mono font-extrabold text-[#70411A]">
                  ₹{txMfaModal.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#3F3124]">Risk Assessment</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-400">
                  {txMfaModal.challenge.riskLevel} ({txMfaModal.challenge.riskScore})
                </span>
              </div>
              {txMfaModal.challenge.riskReasons && txMfaModal.challenge.riskReasons.length > 0 && (
                <div className="text-[11px] text-[#3F3124] pt-1 border-t border-[#CEB896]">
                  {txMfaModal.challenge.riskReasons.join(' • ')}
                </div>
              )}
            </div>

            {txMfaModal.info && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900">
                {txMfaModal.info}
              </div>
            )}
            {txMfaModal.error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900">
                {txMfaModal.error}
              </div>
            )}

            {txMfaModal.challenge.requiredMethod === 'EMAIL_OTP_OR_TOTP' && (
              <div className="grid grid-cols-2 gap-2 font-semibold">
                <button
                  type="button"
                  onClick={() => setTxMfaModal((m) => (m ? { ...m, method: 'EMAIL_OTP' } : null))}
                  className={`py-2 rounded-xl border ${
                    txMfaModal.method === 'EMAIL_OTP'
                      ? 'bg-[#70411A] text-white border-[#70411A]'
                      : 'bg-white text-[#3F3124] border-[#D9C7AB]'
                  }`}
                >
                  Email OTP
                </button>
                <button
                  type="button"
                  onClick={() => setTxMfaModal((m) => (m ? { ...m, method: 'TOTP' } : null))}
                  className={`py-2 rounded-xl border ${
                    txMfaModal.method === 'TOTP'
                      ? 'bg-[#70411A] text-white border-[#70411A]'
                      : 'bg-white text-[#3F3124] border-[#D9C7AB]'
                  }`}
                >
                  Authenticator TOTP
                </button>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!txMfaModal) return;
                setTxMfaModal((m) => (m ? { ...m, verifying: true, error: undefined } : null));
                try {
                  if (txMfaModal.method === 'TOTP') {
                    await mfaApi.verifyTotp({
                      code: txMfaModal.code.trim(),
                      challengeId: txMfaModal.challenge.challengeId,
                    });
                  } else {
                    await mfaApi.verifyOtp({
                      otp: txMfaModal.code.trim(),
                      challengeId: txMfaModal.challenge.challengeId,
                      purpose: 'TRANSACTION_VERIFICATION',
                    });
                  }

                  const txn = await transactionApi.transfer(
                    txMfaModal.sourceAccountNumber,
                    txMfaModal.destinationAccountNumber,
                    txMfaModal.amount,
                    user?.username || 'CustomerPortal',
                    txMfaModal.challenge.challengeId
                  );

                  setFeedback({
                    type: 'success',
                    message: `Verified & Transferred ₹${txMfaModal.amount.toFixed(2)} to ${txMfaModal.destinationAccountNumber}! Txn ID: ${txn.transactionId}`,
                  });
                  setActionAmount('');
                  setTxMfaModal(null);
                  await fetchLiveAccounts();
                  fetchTransactions(selectedAccount.accountNumber);
                  fetchNotifications();
                } catch (err: any) {
                  setTxMfaModal((m) =>
                    m
                      ? {
                          ...m,
                          verifying: false,
                          error: err.response?.data?.message || 'Verification or transfer failed.',
                        }
                      : null
                  );
                }
              }}
              className="space-y-3"
            >
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-[#1B130D]">
                    {txMfaModal.method === 'TOTP' ? 'Authenticator 6-Digit Code' : 'Email 6-Digit OTP'}
                  </label>
                  {txMfaModal.method === 'EMAIL_OTP' && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const sent = await mfaApi.sendOtp(
                            txMfaModal.challenge.challengeId,
                            'TRANSACTION_VERIFICATION'
                          );
                          setTxMfaModal((m) =>
                            m ? { ...m, info: `Sent OTP to ${sent.maskedDestination}`, error: undefined } : null
                          );
                        } catch (err: any) {
                          setTxMfaModal((m) =>
                            m ? { ...m, error: err.response?.data?.message || 'Unable to send OTP.' } : null
                          );
                        }
                      }}
                      className="text-[#70411A] font-semibold underline"
                    >
                      Send / Resend OTP
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={txMfaModal.code}
                  onChange={(e) =>
                    setTxMfaModal((m) => (m ? { ...m, code: e.target.value.replace(/\D/g, '') } : null))
                  }
                  placeholder="Enter 6-digit code"
                  className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-center font-mono text-base tracking-[0.3em] text-[#1B130D]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setTxMfaModal(null)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#D9C7AB] text-[#3F3124] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={txMfaModal.verifying || txMfaModal.code.length < 6}
                  className="px-5 py-2 rounded-xl bg-[#70411A] hover:bg-[#542F11] disabled:opacity-50 text-white font-semibold"
                >
                  {txMfaModal.verifying ? 'Verifying...' : 'Verify & Execute Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPortal;
