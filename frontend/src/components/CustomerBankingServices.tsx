import React, { useState, useEffect } from 'react';
import {
  Download,
  Send,
  Home,
  GraduationCap,
  Car,
  CheckCircle2,
  Calculator,
  Clock,
  CreditCard,
  PiggyBank,
  Repeat,
  RefreshCw,
  AlertCircle,
  Lock,
  IndianRupee,
  Printer,
  ChevronRight,
  Gauge,
  ShieldCheck,
} from 'lucide-react';
import { Account, Loan, Transaction } from '../types';
import { downloadTransactionReceipt, printTransactionReceipt } from '../utils/receipt';

export type CustomerSection =
  | 'transfers'
  | 'receipts'
  | 'rtgs'
  | 'home-loan'
  | 'education-loan'
  | 'vehicle-loan'
  | 'loan-eligibility'
  | 'cibil-score'
  | 'emi-calculator'
  | 'loan-tracking'
  | 'loan-repayment'
  | 'fd'
  | 'rd'
  | 'fd-calculator'
  | 'rd-calculator'
  | 'fd-renewal';

interface FixedDepositItem {
  id: string;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  maturityAmount: number;
  maturityDate: string;
  status: 'ACTIVE' | 'MATURING_SOON' | 'RENEWED';
  payoutType: 'CUMULATIVE' | 'QUARTERLY';
}

interface RecurringDepositItem {
  id: string;
  monthlyInstallment: number;
  interestRate: number;
  tenureMonths: number;
  installmentsPaid: number;
  maturityAmount: number;
  nextDueDate: string;
  status: 'ACTIVE';
}

interface CustomerBankingServicesProps {
  section: CustomerSection;
  onChangeSection: (s: CustomerSection) => void;
  selectedAccount: Account;
  accountTransactions: Transaction[];
  myLoans: Loan[];
  canPerformTransactions: boolean;
  onExecuteServiceDebit: (
    type: 'WITHDRAWAL' | 'TRANSFER',
    amount: number,
    dstAcc?: string,
    customId?: string
  ) => Promise<{ ok: boolean; txnId?: string; message?: string }>;
  onSubmitLoan: (loanData: {
    amount: number;
    interestRate: number;
    termMonths: number;
    purpose: string;
    monthlyIncome: number;
    existingMonthlyDebt: number;
    creditScore: number;
  }) => Promise<boolean>;
  onPayLoanEmi: (loanId: string, emiAmount: number) => Promise<boolean>;
  onViewSchedule: (loanId: string) => void;
}

export const CustomerBankingServices: React.FC<CustomerBankingServicesProps> = ({
  section,
  onChangeSection,
  selectedAccount,
  accountTransactions,
  myLoans,
  canPerformTransactions,
  onExecuteServiceDebit,
  onSubmitLoan,
  onPayLoanEmi,
  onViewSchedule,
}) => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // RTGS State
  const [rtgsBeneficiary, setRtgsBeneficiary] = useState('Priya Patel');
  const [rtgsAccount, setRtgsAccount] = useState('ACC2004');
  const [rtgsIfsc, setRtgsIfsc] = useState('BANK0001024');
  const [rtgsAmount, setRtgsAmount] = useState('');
  const [rtgsRemarks, setRtgsRemarks] = useState('High-value RTGS settlement');

  // Specialized Loan Application State
  const [loanAmt, setLoanAmt] = useState<number>(
    section === 'home-loan' ? 2500000 : section === 'education-loan' ? 800000 : 600000
  );
  const [loanTerm, setLoanTerm] = useState<number>(
    section === 'home-loan' ? 180 : section === 'education-loan' ? 60 : 48
  );
  const [loanIncome, setLoanIncome] = useState<number>(110000);
  const [loanDebt, setLoanDebt] = useState<number>(15000);
  const [loanScore, setLoanScore] = useState<number>(760);
  const [loanDetailNote, setLoanDetailNote] = useState<string>('');
  const [vehicleCategory, setVehicleCategory] = useState<'Car Financing' | 'Two-Wheeler Financing'>('Car Financing');

  // Loan Eligibility State
  const [eligIncome, setEligIncome] = useState(90000);
  const [eligDebt, setEligDebt] = useState(12000);
  const [eligScore, setEligScore] = useState(750);
  const [eligTenure, setEligTenure] = useState(60);
  const [eligRate, setEligRate] = useState(8.5);

  // EMI Calculator State
  const [emiPrincipal, setEmiPrincipal] = useState(500000);
  const [emiRate, setEmiRate] = useState(8.5);
  const [emiMonths, setEmiMonths] = useState(36);

  // CIBIL Score Simulator State
  const [cibilOnTimePct, setCibilOnTimePct] = useState(98);
  const [cibilUtilizationPct, setCibilUtilizationPct] = useState(22);
  const [cibilHardInquiries, setCibilHardInquiries] = useState(1);
  const [cibilCreditAgeYears, setCibilCreditAgeYears] = useState(5);
  const [cibilRefreshedAt, setCibilRefreshedAt] = useState<string>(() =>
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  );

  const DEFAULT_FDS: FixedDepositItem[] = [
    {
      id: 'FD-2026-101',
      principal: 50000,
      interestRate: 7.1,
      tenureMonths: 12,
      maturityAmount: 53645,
      maturityDate: '2026-12-10',
      status: 'MATURING_SOON',
      payoutType: 'CUMULATIVE',
    },
    {
      id: 'FD-2026-102',
      principal: 100000,
      interestRate: 7.35,
      tenureMonths: 24,
      maturityAmount: 115698,
      maturityDate: '2027-08-18',
      status: 'ACTIVE',
      payoutType: 'CUMULATIVE',
    },
  ];

  const DEFAULT_RDS: RecurringDepositItem[] = [
    {
      id: 'RD-2026-201',
      monthlyInstallment: 2000,
      interestRate: 6.8,
      tenureMonths: 12,
      installmentsPaid: 4,
      maturityAmount: 24903,
      nextDueDate: '2026-12-05',
      status: 'ACTIVE',
    },
  ];

  const fdStorageKey = `bank_fds_${selectedAccount.accountNumber}`;
  const rdStorageKey = `bank_rds_${selectedAccount.accountNumber}`;

  // Fixed Deposits & Recurring Deposits State (persisted per account)
  const [fixedDeposits, setFixedDeposits] = useState<FixedDepositItem[]>(() => {
    try {
      const saved = localStorage.getItem(fdStorageKey);
      return saved ? JSON.parse(saved) : DEFAULT_FDS;
    } catch {
      return DEFAULT_FDS;
    }
  });
  const [fdAmount, setFdAmount] = useState('5000');
  const [fdTenure, setFdTenure] = useState(12);
  const [fdPayout, setFdPayout] = useState<'CUMULATIVE' | 'QUARTERLY'>('CUMULATIVE');

  const [recurringDeposits, setRecurringDeposits] = useState<RecurringDepositItem[]>(() => {
    try {
      const saved = localStorage.getItem(rdStorageKey);
      return saved ? JSON.parse(saved) : DEFAULT_RDS;
    } catch {
      return DEFAULT_RDS;
    }
  });
  const [rdMonthly, setRdMonthly] = useState('1000');
  const [rdTenure, setRdTenure] = useState(12);

  useEffect(() => {
    try {
      const savedFds = localStorage.getItem(fdStorageKey);
      setFixedDeposits(savedFds ? JSON.parse(savedFds) : DEFAULT_FDS);
      const savedRds = localStorage.getItem(rdStorageKey);
      setRecurringDeposits(savedRds ? JSON.parse(savedRds) : DEFAULT_RDS);
    } catch {
      // ignore storage errors
    }
  }, [fdStorageKey, rdStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(fdStorageKey, JSON.stringify(fixedDeposits));
    } catch {
      // ignore
    }
  }, [fdStorageKey, fixedDeposits]);

  useEffect(() => {
    try {
      localStorage.setItem(rdStorageKey, JSON.stringify(recurringDeposits));
    } catch {
      // ignore
    }
  }, [rdStorageKey, recurringDeposits]);

  // FD & RD Calculators
  const [fdCalcPrincipal, setFdCalcPrincipal] = useState(100000);
  const [fdCalcRate, setFdCalcRate] = useState(7.1);
  const [fdCalcMonths, setFdCalcMonths] = useState(24);

  const [rdCalcMonthly, setRdCalcMonthly] = useState(5000);
  const [rdCalcRate, setRdCalcRate] = useState(6.8);
  const [rdCalcMonths, setRdCalcMonths] = useState(24);

  // FD Renewal State
  const [selectedFdId, setSelectedFdId] = useState('FD-2026-101');
  const [renewTenure, setRenewTenure] = useState(12);
  const [renewMode, setRenewMode] = useState<'PRINCIPAL_PLUS_INTEREST' | 'PRINCIPAL_ONLY'>('PRINCIPAL_PLUS_INTEREST');

  // Receipt Preview State
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(
    accountTransactions[0] || null
  );

  useEffect(() => {
    if (accountTransactions.length > 0 && !selectedReceiptTx) {
      setSelectedReceiptTx(accountTransactions[0]);
    } else if (
      selectedReceiptTx &&
      !accountTransactions.some((t) => t.transactionId === selectedReceiptTx.transactionId)
    ) {
      setSelectedReceiptTx(accountTransactions[0] || null);
    }
  }, [accountTransactions, selectedReceiptTx]);

  // Formulas
  const calcFdMaturity = (p: number, annualRate: number, months: number) => {
    const t = months / 12;
    const r = annualRate / 100;
    const n = 4; // quarterly compounding
    return Math.round(p * Math.pow(1 + r / n, n * t));
  };

  const calcRdMaturity = (monthly: number, annualRate: number, months: number) => {
    const r = annualRate / 100 / 4; // quarterly rate
    let total = 0;
    for (let k = 0; k < months; k++) {
      const remQuarters = (months - k) / 3;
      total += monthly * Math.pow(1 + r, remQuarters);
    }
    return Math.round(total);
  };

  const calcEmi = (p: number, annualRate: number, months: number) => {
    const r = annualRate / 12 / 100;
    if (r === 0) return p / Math.max(1, months);
    const pow = Math.pow(1 + r, months);
    return (p * r * pow) / (pow - 1);
  };

  // Sample fallback loan for tracking/repayment if user hasn't created one yet
  const trackedLoans: Loan[] =
    myLoans.length > 0
      ? myLoans
      : [
          {
            id: 901,
            loanId: 'LN1732456012',
            customerId: selectedAccount.customerId,
            customerNumber: `CUST100${selectedAccount.customerId || 1}`,
            customerName: selectedAccount.customerName || 'Aarav Sharma',
            customerEmail: 'aarav.sharma@apexbank.com',
            accountNumber: selectedAccount.accountNumber,
            amount: 150000,
            interestRate: 8.5,
            termMonths: 24,
            status: 'DISBURSED',
            purpose: 'Home Improvement & Solar Installation',
            monthlyIncome: 85000,
            existingMonthlyDebt: 12000,
            creditScore: 780,
            dtiRatio: 22.14,
            emiAmount: 6818.52,
            totalPayable: 163644.48,
            outstandingBalance: 136370.4,
            requiresAdminApproval: false,
            createdAt: '2026-11-24T10:15:00Z',
            updatedAt: '2026-11-24T10:30:00Z',
          },
        ];

  const handleRtgsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformTransactions) return;
    if (selectedAccount.status === 'FROZEN') {
      setFeedback({ type: 'error', message: 'Account is FROZEN. RTGS transfers are disabled.' });
      return;
    }
    const amt = parseFloat(rtgsAmount);
    if (!amt || amt <= 0) {
      setFeedback({ type: 'error', message: 'Enter a valid RTGS transfer amount.' });
      return;
    }
    if (amt > selectedAccount.balance) {
      setFeedback({ type: 'error', message: 'Insufficient account balance for RTGS transfer.' });
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(rtgsIfsc.trim())) {
      setFeedback({ type: 'error', message: 'Enter a valid 11-character IFSC code (e.g., BANK0001024).' });
      return;
    }

    const utr = `RTGS_UTR_${Date.now()}`;
    const targetTrimmed = rtgsAccount.trim();
    const isInternal = /^ACC\d+$/i.test(targetTrimmed);
    const result = await onExecuteServiceDebit(
      isInternal ? 'TRANSFER' : 'WITHDRAWAL',
      amt,
      isInternal ? targetTrimmed.toUpperCase() : `${targetTrimmed} (${rtgsIfsc.toUpperCase()})`,
      utr
    );
    if (result.ok) {
      setFeedback({
        type: 'success',
        message: `RTGS transfer of ₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })} to ${rtgsBeneficiary} settled! UTR: ${result.txnId || utr}`,
      });
      setRtgsAmount('');
    } else {
      setFeedback({ type: 'error', message: result.message || 'RTGS transfer failed.' });
    }
  };

  const handleSpecializedLoanSubmit = async (
    e: React.FormEvent,
    typeLabel: string,
    rate: number
  ) => {
    e.preventDefault();
    const purpose =
      section === 'vehicle-loan'
        ? `${typeLabel} (${vehicleCategory})${loanDetailNote ? ` - ${loanDetailNote}` : ''}`
        : `${typeLabel}${loanDetailNote ? ` - ${loanDetailNote}` : ''}`;

    const ok = await onSubmitLoan({
      amount: loanAmt,
      interestRate: rate,
      termMonths: loanTerm,
      purpose,
      monthlyIncome: loanIncome,
      existingMonthlyDebt: loanDebt,
      creditScore: loanScore,
    });
    if (ok) {
      setFeedback({
        type: 'success',
        message: `${typeLabel} application for ₹${loanAmt.toLocaleString('en-IN')} submitted! Track it in Loan Tracking.`,
      });
      setLoanDetailNote('');
    }
  };

  const handleOpenFd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformTransactions) return;
    const amt = parseFloat(fdAmount);
    if (!amt || amt < 1000) {
      setFeedback({ type: 'error', message: 'Minimum Fixed Deposit amount is ₹1,000.' });
      return;
    }
    if (amt > selectedAccount.balance) {
      setFeedback({ type: 'error', message: 'Insufficient account balance to fund Fixed Deposit.' });
      return;
    }
    const rate = fdTenure >= 24 ? 7.35 : fdTenure >= 12 ? 7.1 : 6.75;
    const matAmt = calcFdMaturity(amt, rate, fdTenure);
    const matDate = new Date();
    matDate.setMonth(matDate.getMonth() + fdTenure);
    const fdId = `FD-${Date.now().toString().slice(-6)}`;

    const result = await onExecuteServiceDebit('WITHDRAWAL', amt, fdId, `FD_OPEN_${Date.now()}`);
    if (!result.ok) {
      setFeedback({ type: 'error', message: result.message || 'Failed to debit account for Fixed Deposit.' });
      return;
    }

    setFixedDeposits((prev) => [
      {
        id: fdId,
        principal: amt,
        interestRate: rate,
        tenureMonths: fdTenure,
        maturityAmount: matAmt,
        maturityDate: matDate.toISOString().split('T')[0],
        status: 'ACTIVE',
        payoutType: fdPayout,
      },
      ...prev,
    ]);
    setFeedback({
      type: 'success',
      message: `Fixed Deposit ${fdId} opened for ₹${amt.toLocaleString('en-IN')} @ ${rate}% p.a. Maturity Value: ₹${matAmt.toLocaleString('en-IN')}.`,
    });
    setFdAmount('');
  };

  const handleOpenRd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformTransactions) return;
    const monthly = parseFloat(rdMonthly);
    if (!monthly || monthly < 500) {
      setFeedback({ type: 'error', message: 'Minimum Recurring Deposit installment is ₹500/month.' });
      return;
    }
    if (monthly > selectedAccount.balance) {
      setFeedback({ type: 'error', message: 'Insufficient balance for first RD installment.' });
      return;
    }
    const rate = rdTenure >= 24 ? 7.0 : 6.8;
    const matAmt = calcRdMaturity(monthly, rate, rdTenure);
    const nextDue = new Date();
    nextDue.setMonth(nextDue.getMonth() + 1);
    const rdId = `RD-${Date.now().toString().slice(-6)}`;

    const result = await onExecuteServiceDebit('WITHDRAWAL', monthly, rdId, `RD_INST_${Date.now()}`);
    if (!result.ok) {
      setFeedback({ type: 'error', message: result.message || 'Failed to debit account for Recurring Deposit.' });
      return;
    }

    setRecurringDeposits((prev) => [
      {
        id: rdId,
        monthlyInstallment: monthly,
        interestRate: rate,
        tenureMonths: rdTenure,
        installmentsPaid: 1,
        maturityAmount: matAmt,
        nextDueDate: nextDue.toISOString().split('T')[0],
        status: 'ACTIVE',
      },
      ...prev,
    ]);
    setFeedback({
      type: 'success',
      message: `Recurring Deposit ${rdId} activated (₹${monthly.toLocaleString('en-IN')}/mo for ${rdTenure} months). Estimated Maturity: ₹${matAmt.toLocaleString('en-IN')}.`,
    });
    setRdMonthly('');
  };

  const handleRenewFd = (e: React.FormEvent) => {
    e.preventDefault();
    const target = fixedDeposits.find((f) => f.id === selectedFdId);
    if (!target) return;
    const newPrincipal =
      renewMode === 'PRINCIPAL_PLUS_INTEREST' ? target.maturityAmount : target.principal;
    const newRate = renewTenure >= 24 ? 7.35 : 7.1;
    const newMaturity = calcFdMaturity(newPrincipal, newRate, renewTenure);
    const matDate = new Date();
    matDate.setMonth(matDate.getMonth() + renewTenure);

    setFixedDeposits((prev) =>
      prev.map((fd) =>
        fd.id === target.id
          ? {
              ...fd,
              principal: newPrincipal,
              interestRate: newRate,
              tenureMonths: renewTenure,
              maturityAmount: newMaturity,
              maturityDate: matDate.toISOString().split('T')[0],
              status: 'RENEWED',
            }
          : fd
      )
    );
    setFeedback({
      type: 'success',
      message: `FD ${target.id} renewed for ${renewTenure} months @ ${newRate}% p.a. New Maturity: ₹${newMaturity.toLocaleString('en-IN')} on ${matDate.toISOString().split('T')[0]}.`,
    });
  };

  const feedbackBanner = feedback && (
    <div
      className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 ${
        feedback.type === 'success'
          ? 'bg-emerald-100 text-emerald-900 border border-emerald-400'
          : 'bg-rose-100 text-rose-900 border border-rose-400'
      }`}
    >
      <div className="flex items-center gap-2">
        {feedback.type === 'success' ? (
          <CheckCircle2 className="w-4 h-4 shrink-0" />
        ) : (
          <AlertCircle className="w-4 h-4 shrink-0" />
        )}
        <span>{feedback.message}</span>
      </div>
      <button onClick={() => setFeedback(null)} className="text-xs underline font-semibold">
        Dismiss
      </button>
    </div>
  );

  // 1. DOWNLOAD RECEIPT
  if (section === 'receipts') {
    const activeTx = selectedReceiptTx || accountTransactions[0] || null;
    return (
      <div className="bg-[#EFE2CE] rounded-2xl border border-[#D9C7AB] shadow-md p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D9C7AB] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#1B130D] flex items-center gap-2">
              <Download className="w-5 h-5 text-[#70411A]" /> Download Transaction Receipt
            </h2>
            <p className="text-xs text-[#3F3124]">
              Select any transaction from {selectedAccount.accountNumber} to preview or download an official receipt.
            </p>
          </div>
          <button
            onClick={() => onChangeSection('transfers')}
            className="text-xs font-semibold text-[#70411A] hover:underline"
          >
            &larr; Back to Transfers
          </button>
        </div>

        {feedbackBanner}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-2 max-h-80 overflow-y-auto pr-1">
            {accountTransactions.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#3F3124] bg-[#EBDEC8] rounded-xl border border-[#D9C7AB]">
                No transactions available yet.
              </div>
            ) : (
              accountTransactions.map((tx) => (
                <div
                  key={tx.transactionId}
                  onClick={() => setSelectedReceiptTx(tx)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    activeTx?.transactionId === tx.transactionId
                      ? 'bg-[#E9D9C0] border-[#70411A] shadow-sm'
                      : 'bg-[#EBDEC8] border-[#D9C7AB] hover:bg-[#EFE4D2]'
                  }`}
                >
                  <div>
                    <div className="font-mono font-bold text-xs text-[#1B130D]">{tx.transactionId}</div>
                    <div className="text-[11px] text-[#3F3124]">
                      {tx.type} &bull; {new Date(tx.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs text-[#1B130D]">
                      ₹{Number(tx.amount).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadTransactionReceipt(
                          tx,
                          selectedAccount.accountNumber,
                          selectedAccount.customerName || 'Account Holder'
                        );
                        setFeedback({
                          type: 'success',
                          message: `Receipt_${tx.transactionId}.html downloaded.`,
                        });
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#70411A] hover:bg-[#542F11] text-white text-[11px] font-semibold inline-flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Save
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="lg:col-span-6 bg-[#FFFDF9] border border-[#CEB896] rounded-2xl p-5 shadow-sm space-y-4">
            {activeTx ? (
              <>
                <div className="flex items-center justify-between border-b border-[#D9C7AB] pb-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#70411A]">Official Receipt Preview</div>
                    <div className="font-mono text-xs text-[#3F3124]">{activeTx.transactionId}</div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-400">
                    {activeTx.status}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#E9D9C0] border border-[#CEB896] text-center">
                  <div className="text-[11px] uppercase font-semibold text-[#3F3124]">{activeTx.type} AMOUNT</div>
                  <div className="text-2xl font-extrabold text-[#1B130D] font-mono">
                    ₹{Number(activeTx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#EBDEC8]">
                    <span className="text-[#3F3124]">Account Number</span>
                    <span className="font-mono font-bold text-[#1B130D]">{selectedAccount.accountNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#EBDEC8]">
                    <span className="text-[#3F3124]">Account Holder</span>
                    <span className="font-semibold text-[#1B130D]">{selectedAccount.customerName}</span>
                  </div>
                  {activeTx.destinationAccountNumber && (
                    <div className="flex justify-between py-1 border-b border-[#EBDEC8]">
                      <span className="text-[#3F3124]">Destination</span>
                      <span className="font-mono text-[#1B130D]">{activeTx.destinationAccountNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span className="text-[#3F3124]">Timestamp</span>
                    <span className="font-mono text-[#1B130D]">{new Date(activeTx.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      downloadTransactionReceipt(
                        activeTx,
                        selectedAccount.accountNumber,
                        selectedAccount.customerName || 'Account Holder'
                      );
                      setFeedback({
                        type: 'success',
                        message: `Receipt_${activeTx.transactionId}.html downloaded.`,
                      });
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-[#70411A] hover:bg-[#542F11] text-white font-semibold text-xs flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      printTransactionReceipt(
                        activeTx,
                        selectedAccount.accountNumber,
                        selectedAccount.customerName || 'Account Holder'
                      )
                    }
                    className="px-4 py-2.5 rounded-xl bg-[#EBDEC8] hover:bg-[#E9D9C0] border border-[#CEB896] text-[#1B130D] font-semibold text-xs flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" /> Print / Save PDF
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-[#3F3124] text-center py-10">Select a transaction to preview its receipt.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. RTGS TRANSFER
  if (section === 'rtgs') {
    return (
      <div className="bg-[#EFE2CE] rounded-2xl border border-[#D9C7AB] shadow-md p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D9C7AB] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#1B130D] flex items-center gap-2">
              <Send className="w-5 h-5 text-[#70411A]" /> RTGS Real-Time Gross Settlement
            </h2>
            <p className="text-xs text-[#3F3124]">
              Immediate inter-bank gross settlement with UTR tracking &amp; IFSC validation.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#EFE4D2] border border-[#9A7C59]/60 text-[11px] font-mono font-semibold text-[#70411A]">
            24x7 RTGS Active
          </span>
        </div>

        {feedbackBanner}

        {!canPerformTransactions && (
          <div className="p-3 rounded-xl text-xs flex items-center gap-2 bg-amber-100 text-amber-950 border border-amber-400">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Read-only designation: RTGS execution requires Customer, Teller, or Admin privileges.</span>
          </div>
        )}

        <form onSubmit={handleRtgsSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-[#1B130D] mb-1">Source Account</label>
            <input
              type="text"
              disabled
              value={`${selectedAccount.accountNumber} (Avail: ₹${selectedAccount.balance.toLocaleString('en-IN')})`}
              className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#3F3124] font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#1B130D] mb-1">Beneficiary Name</label>
            <input
              type="text"
              required
              value={rtgsBeneficiary}
              onChange={(e) => setRtgsBeneficiary(e.target.value)}
              className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#1B130D] mb-1">Beneficiary Account Number</label>
            <input
              type="text"
              required
              value={rtgsAccount}
              onChange={(e) => setRtgsAccount(e.target.value)}
              className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D] font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#1B130D] mb-1">Beneficiary Bank IFSC Code</label>
            <input
              type="text"
              required
              value={rtgsIfsc}
              onChange={(e) => setRtgsIfsc(e.target.value.toUpperCase())}
              placeholder="e.g. BANK0001024"
              className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D] font-mono uppercase"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#1B130D] mb-1">RTGS Amount (₹ INR)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#3F3124]">₹</span>
              <input
                type="number"
                step="0.01"
                required
                value={rtgsAmount}
                onChange={(e) => setRtgsAmount(e.target.value)}
                placeholder="Enter amount (e.g. 200000)"
                className="w-full bg-white border border-[#9A7C59] rounded-xl pl-7 pr-3 py-2 text-sm font-bold text-[#1B130D]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#1B130D] mb-1">Remittance Remarks</label>
            <input
              type="text"
              value={rtgsRemarks}
              onChange={(e) => setRtgsRemarks(e.target.value)}
              className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D]"
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onChangeSection('receipts')}
              className="px-4 py-2.5 rounded-xl bg-[#EBDEC8] hover:bg-[#E9D9C0] border border-[#D9C7AB] text-[#1B130D] font-semibold"
            >
              View Receipts
            </button>
            <button
              type="submit"
              disabled={!canPerformTransactions}
              className="px-6 py-2.5 rounded-xl bg-[#70411A] hover:bg-[#542F11] disabled:opacity-50 text-white font-semibold flex items-center gap-2 shadow-md"
            >
              <Send className="w-4 h-4" /> Initiate RTGS Transfer
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 3. SPECIALIZED LOANS: HOME LOAN / EDUCATION LOAN / VEHICLE LOAN
  if (section === 'home-loan' || section === 'education-loan' || section === 'vehicle-loan') {
    const config =
      section === 'home-loan'
        ? {
            title: 'Home Loan — Housing Finance',
            subtitle: 'Apply for residential purchase, construction, or home extension financing.',
            rate: 8.4,
            icon: Home,
            placeholder: 'e.g., 3BHK Apartment Purchase in Hyderabad / Property Value ₹60L',
            detailLabel: 'Property Location & Purpose',
          }
        : section === 'education-loan'
        ? {
            title: 'Education Loan — Higher Studies',
            subtitle: 'Apply for domestic or international tuition, hostel, and academic expenses.',
            rate: 8.15,
            icon: GraduationCap,
            placeholder: 'e.g., B.Tech / M.S. Tuition at IIT / University',
            detailLabel: 'Institution & Course Name',
          }
        : {
            title: 'Vehicle Loan — Car & Two-Wheeler Financing',
            subtitle: 'Apply for new/used car or two-wheeler financing with fast underwriting.',
            rate: 9.1,
            icon: Car,
            placeholder: 'e.g., Dealer Name & Vehicle Model',
            detailLabel: 'Vehicle Model & Dealer',
          };
    const Icon = config.icon;
    const estEmi = calcEmi(loanAmt, config.rate, loanTerm);

    return (
      <div className="bg-[#EFE2CE] rounded-2xl border border-[#D9C7AB] shadow-md p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D9C7AB] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#1B130D] flex items-center gap-2">
              <Icon className="w-5 h-5 text-[#8E4322]" /> {config.title}
            </h2>
            <p className="text-xs text-[#3F3124]">{config.subtitle}</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#EFE4D2] border border-[#9A7C59]/60 text-xs font-mono font-bold text-[#8E4322]">
            {config.rate.toFixed(2)}% p.a.
          </span>
        </div>

        {feedbackBanner}

        <form onSubmit={(e) => handleSpecializedLoanSubmit(e, config.title.split(' — ')[0], config.rate)} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {section === 'vehicle-loan' && (
            <div className="md:col-span-2">
              <label className="block font-semibold text-[#1B130D] mb-1">Vehicle Category</label>
              <div className="grid grid-cols-2 gap-3">
                {(['Car Financing', 'Two-Wheeler Financing'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setVehicleCategory(cat)}
                    className={`py-2 px-3 rounded-xl border font-semibold ${
                      vehicleCategory === cat
                        ? 'bg-[#8E4322] text-white border-[#8E4322]'
                        : 'bg-white text-[#1B130D] border-[#9A7C59]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#1B130D] mb-1">Loan Amount (₹)</label>
            <input
              type="number"
              min={10000}
              required
              value={loanAmt}
              onChange={(e) => setLoanAmt(Number(e.target.value))}
              className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D] font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#1B130D] mb-1">Tenure (Months)</label>
            <input
              type="number"
              min={6}
              max={360}
              required
              value={loanTerm}
              onChange={(e) => setLoanTerm(Number(e.target.value))}
              className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D] font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-[#1B130D] mb-1">{config.detailLabel}</label>
            <input
              type="text"
              required
              value={loanDetailNote}
              onChange={(e) => setLoanDetailNote(e.target.value)}
              placeholder={config.placeholder}
              className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#1B130D] mb-1">Monthly Income (₹)</label>
            <input
              type="number"
              required
              value={loanIncome}
              onChange={(e) => setLoanIncome(Number(e.target.value))}
              className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D] font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#1B130D] mb-1">Existing Debt (₹)</label>
              <input
                type="number"
                value={loanDebt}
                onChange={(e) => setLoanDebt(Number(e.target.value))}
                className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D] font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#1B130D] mb-1">Credit Score</label>
              <input
                type="number"
                min={300}
                max={900}
                value={loanScore}
                onChange={(e) => setLoanScore(Number(e.target.value))}
                className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D] font-mono"
              />
            </div>
          </div>

          <div className="md:col-span-2 p-4 rounded-xl bg-[#E9D9C0] border border-[#CEB896] flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase font-semibold text-[#3F3124]">Estimated Monthly EMI</div>
              <div className="text-xl font-extrabold text-[#1B130D] font-mono">
                ₹{Math.round(estEmi).toLocaleString('en-IN')}/mo
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onChangeSection('loan-tracking')}
                className="px-4 py-2 rounded-xl bg-[#EBDEC8] hover:bg-white border border-[#CEB896] text-[#1B130D] font-semibold"
              >
                Track Applications
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#8E4322] hover:bg-[#4E3424] text-white font-semibold shadow-md"
              >
                Submit {config.title.split(' — ')[0]} Application
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // 4. LOAN ELIGIBILITY CALCULATOR
  if (section === 'loan-eligibility') {
    const maxAllowableEmi = Math.max(0, eligIncome * 0.45 - eligDebt);
    const r = eligRate / 12 / 100;
    const pow = Math.pow(1 + r, eligTenure);
    const maxLoan = r > 0 ? maxAllowableEmi * ((pow - 1) / (r * pow)) : maxAllowableEmi * eligTenure;
    const scoreQualified = eligScore >= 650 && maxAllowableEmi > 0;
    const grade = eligScore >= 750 ? 'PRIME' : eligScore >= 680 ? 'NEAR_PRIME' : 'SUBPRIME';

    return (
      <div className="bg-[#EFE2CE] rounded-2xl border border-[#D9C7AB] shadow-md p-6 space-y-5">
        <div className="border-b border-[#D9C7AB] pb-4">
          <h2 className="text-lg font-bold text-[#1B130D] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#70411A]" /> Loan Eligibility Calculator
          </h2>
          <p className="text-xs text-[#3F3124]">Calculate maximum borrowing power using income, existing obligations, and credit score.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-[#1B130D] mb-1">Net Monthly Income (₹)</label>
              <input type="number" value={eligIncome} onChange={(e) => setEligIncome(Number(e.target.value))} className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 font-mono text-[#1B130D]" />
            </div>
            <div>
              <label className="block font-semibold text-[#1B130D] mb-1">Existing Monthly EMIs / Debt (₹)</label>
              <input type="number" value={eligDebt} onChange={(e) => setEligDebt(Number(e.target.value))} className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 font-mono text-[#1B130D]" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-[#1B130D] mb-1">Credit Score</label>
                <input type="number" min={300} max={900} value={eligScore} onChange={(e) => setEligScore(Number(e.target.value))} className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 font-mono text-[#1B130D]" />
              </div>
              <div>
                <label className="block font-semibold text-[#1B130D] mb-1">Tenure (Mo)</label>
                <input type="number" min={6} max={360} value={eligTenure} onChange={(e) => setEligTenure(Number(e.target.value))} className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 font-mono text-[#1B130D]" />
              </div>
              <div>
                <label className="block font-semibold text-[#1B130D] mb-1">Rate (%)</label>
                <input type="number" step="0.1" value={eligRate} onChange={(e) => setEligRate(Number(e.target.value))} className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 font-mono text-[#1B130D]" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#E9D9C0] border border-[#CEB896] flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1B130D] uppercase tracking-wider text-[11px]">Eligibility Verdict</span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${scoreQualified ? 'bg-emerald-100 text-emerald-900 border border-emerald-400' : 'bg-rose-100 text-rose-900 border border-rose-400'}`}>
                {scoreQualified ? `ELIGIBLE (${grade})` : 'NOT ELIGIBLE'}
              </span>
            </div>
            <div>
              <div className="text-[11px] text-[#3F3124]">Maximum Eligible Loan Amount</div>
              <div className="text-3xl font-extrabold text-[#1B130D] font-mono">
                ₹{Math.round(maxLoan).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#CEB896]">
              <div>
                <div className="text-[11px] text-[#3F3124]">Max Allowable EMI (45% FOIR)</div>
                <div className="font-bold font-mono text-[#70411A]">₹{Math.round(maxAllowableEmi).toLocaleString('en-IN')}/mo</div>
              </div>
              <div>
                <div className="text-[11px] text-[#3F3124]">Credit Profile</div>
                <div className="font-bold font-mono text-[#1B130D]">{eligScore} / 900</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. EMI CALCULATOR
  if (section === 'emi-calculator') {
    const monthlyEmi = calcEmi(emiPrincipal, emiRate, emiMonths);
    const totalPayable = monthlyEmi * emiMonths;
    const totalInterest = totalPayable - emiPrincipal;

    return (
      <div className="bg-[#EFE2CE] rounded-2xl border border-[#D9C7AB] shadow-md p-6 space-y-5">
        <div className="border-b border-[#D9C7AB] pb-4">
          <h2 className="text-lg font-bold text-[#1B130D] flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#8E4322]" /> EMI Calculator
          </h2>
          <p className="text-xs text-[#3F3124]">Calculate exact monthly installments, total interest, and total loan cost.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between font-semibold text-[#1B130D] mb-1">
                <span>Principal Amount</span>
                <span className="font-mono">₹{emiPrincipal.toLocaleString('en-IN')}</span>
              </div>
              <input type="range" min={10000} max={5000000} step={10000} value={emiPrincipal} onChange={(e) => setEmiPrincipal(Number(e.target.value))} className="w-full accent-[#70411A]" />
            </div>
            <div>
              <div className="flex justify-between font-semibold text-[#1B130D] mb-1">
                <span>Annual Interest Rate</span>
                <span className="font-mono">{emiRate.toFixed(2)}% p.a.</span>
              </div>
              <input type="range" min={5} max={18} step={0.1} value={emiRate} onChange={(e) => setEmiRate(Number(e.target.value))} className="w-full accent-[#70411A]" />
            </div>
            <div>
              <div className="flex justify-between font-semibold text-[#1B130D] mb-1">
                <span>Loan Tenure</span>
                <span className="font-mono">{emiMonths} Months ({(emiMonths / 12).toFixed(1)} Yrs)</span>
              </div>
              <input type="range" min={6} max={240} step={6} value={emiMonths} onChange={(e) => setEmiMonths(Number(e.target.value))} className="w-full accent-[#70411A]" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#E9D9C0] border border-[#CEB896] space-y-4">
            <div>
              <div className="text-[11px] uppercase font-semibold text-[#3F3124]">Monthly Installment (EMI)</div>
              <div className="text-3xl font-extrabold text-[#1B130D] font-mono">
                ₹{Math.round(monthlyEmi).toLocaleString('en-IN')}/mo
              </div>
            </div>
            <div className="space-y-2 pt-3 border-t border-[#CEB896]">
              <div className="flex justify-between">
                <span className="text-[#3F3124]">Principal Amount</span>
                <span className="font-mono font-bold text-[#1B130D]">₹{emiPrincipal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#3F3124]">Total Interest Payable</span>
                <span className="font-mono font-bold text-[#8E4322]">₹{Math.round(totalInterest).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#3F3124]">Total Amount Payable</span>
                <span className="font-mono font-extrabold text-[#1B130D]">₹{Math.round(totalPayable).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. LOAN TRACKING
  if (section === 'loan-tracking') {
    const stages = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED'];
    const stageIndex = (status: string) => {
      if (status === 'PAID') return 3;
      const idx = stages.indexOf(status);
      return idx >= 0 ? idx : 0;
    };

    return (
      <div className="bg-[#EFE2CE] rounded-2xl border border-[#D9C7AB] shadow-md p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#D9C7AB] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#1B130D] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#8E4322]" /> Loan Application Tracking
            </h2>
            <p className="text-xs text-[#3F3124]">Real-time underwriting stage &amp; disbursement progress.</p>
          </div>
          <button onClick={() => onChangeSection('home-loan')} className="px-3 py-1.5 rounded-xl bg-[#8E4322] text-white text-xs font-semibold">
            + Apply New Loan
          </button>
        </div>

        <div className="space-y-4">
          {trackedLoans.map((loan) => {
            const currentIdx = stageIndex(loan.status);
            return (
              <div key={loan.loanId} className="p-4 rounded-xl bg-[#EBDEC8] border border-[#D9C7AB] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-mono font-bold text-sm text-[#1B130D]">{loan.loanId}</div>
                    <div className="text-xs text-[#3F3124]">{loan.purpose}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-sm text-[#1B130D]">₹{loan.amount.toLocaleString('en-IN')}</div>
                    <div className="text-[11px] font-semibold text-[#70411A]">Status: {loan.status}</div>
                  </div>
                </div>

                {/* Progress Stepper */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {stages.map((st, idx) => (
                    <div key={st} className="space-y-1">
                      <div className={`h-2 rounded-full ${loan.status === 'REJECTED' ? 'bg-rose-400' : idx <= currentIdx ? 'bg-[#70411A]' : 'bg-[#D5BD98]'}`} />
                      <div className={`text-[10px] font-mono ${idx <= currentIdx ? 'font-bold text-[#1B130D]' : 'text-[#3F3124]/70'}`}>
                        {st.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-1 text-xs">
                  <span className="text-[#3F3124] font-mono">
                    Rate: {loan.interestRate}% p.a. &bull; EMI: ₹{loan.emiAmount?.toLocaleString('en-IN')}/mo
                  </span>
                  <button
                    onClick={() => onViewSchedule(loan.loanId)}
                    className="text-[#8E4322] font-semibold inline-flex items-center gap-1 hover:underline"
                  >
                    Schedule <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 7. LOAN REPAYMENT
  if (section === 'loan-repayment') {
    return (
      <div className="bg-[#EFE2CE] rounded-2xl border border-[#D9C7AB] shadow-md p-6 space-y-5">
        <div className="border-b border-[#D9C7AB] pb-4">
          <h2 className="text-lg font-bold text-[#1B130D] flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#70411A]" /> Loan EMI Repayment
          </h2>
          <p className="text-xs text-[#3F3124]">Pay outstanding loan installments directly from {selectedAccount.accountNumber}.</p>
        </div>

        {feedbackBanner}

        <div className="space-y-3">
          {trackedLoans.map((loan) => {
            const emi = loan.emiAmount || Math.round(calcEmi(loan.amount, loan.interestRate, loan.termMonths));
            const outstanding = loan.outstandingBalance ?? loan.amount;
            const canPay = canPerformTransactions && outstanding > 0 && selectedAccount.balance >= emi;
            return (
              <div key={loan.loanId} className="p-4 rounded-xl bg-[#EBDEC8] border border-[#D9C7AB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-mono font-bold text-sm text-[#1B130D]">{loan.loanId}</div>
                  <div className="text-xs text-[#3F3124]">{loan.purpose}</div>
                  <div className="text-xs font-mono text-[#3F3124]">
                    Outstanding: <strong className="text-[#1B130D]">₹{outstanding.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong> &bull; Next EMI: <strong className="text-[#8E4322]">₹{emi.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!canPay || selectedAccount.status === 'FROZEN'}
                    onClick={async () => {
                      const ok = await onPayLoanEmi(loan.loanId, emi);
                      if (ok) {
                        setFeedback({
                          type: 'success',
                          message: `Paid EMI of ₹${emi.toLocaleString('en-IN')} for ${loan.loanId}. Balance updated in database.`,
                        });
                      } else {
                        setFeedback({
                          type: 'error',
                          message: `Unable to process EMI payment for ${loan.loanId}. Ensure loan is DISBURSED and balance is sufficient.`,
                        });
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-[#70411A] hover:bg-[#542F11] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <IndianRupee className="w-3.5 h-3.5" /> Pay EMI (₹{Math.round(emi).toLocaleString('en-IN')})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 8. FIXED DEPOSIT (FD)
  if (section === 'fd') {
    return (
      <div className="bg-[#EFE2CE] rounded-2xl border border-[#D9C7AB] shadow-md p-6 space-y-5">
        <div className="border-b border-[#D9C7AB] pb-4">
          <h2 className="text-lg font-bold text-[#1B130D] flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-[#70411A]" /> Fixed Deposit (FD) Management
          </h2>
          <p className="text-xs text-[#3F3124]">Open fixed deposits funded from {selectedAccount.accountNumber} and monitor active certificates.</p>
        </div>

        {feedbackBanner}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          <form onSubmit={handleOpenFd} className="lg:col-span-5 p-4 rounded-xl bg-[#E9D9C0] border border-[#CEB896] space-y-3">
            <div className="font-bold text-sm text-[#1B130D]">Open New Fixed Deposit</div>
            <div>
              <label className="block font-semibold text-[#1B130D] mb-1">Deposit Principal (₹)</label>
              <input type="number" min={1000} required value={fdAmount} onChange={(e) => setFdAmount(e.target.value)} className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 font-mono text-[#1B130D]" />
            </div>
            <div>
              <label className="block font-semibold text-[#1B130D] mb-1">Tenure</label>
              <select value={fdTenure} onChange={(e) => setFdTenure(Number(e.target.value))} className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 font-mono text-[#1B130D]">
                <option value={6}>6 Months (6.75% p.a.)</option>
                <option value={12}>12 Months (7.10% p.a.)</option>
                <option value={24}>24 Months (7.35% p.a.)</option>
                <option value={36}>36 Months (7.35% p.a.)</option>
                <option value={60}>60 Months (7.35% p.a.)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#1B130D] mb-1">Interest Payout</label>
              <select value={fdPayout} onChange={(e) => setFdPayout(e.target.value as 'CUMULATIVE' | 'QUARTERLY')} className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D]">
                <option value="CUMULATIVE">Cumulative (Reinvested Quarterly)</option>
                <option value="QUARTERLY">Quarterly Payout</option>
              </select>
            </div>
            <button type="submit" disabled={!canPerformTransactions} className="w-full py-2.5 rounded-xl bg-[#70411A] hover:bg-[#542F11] disabled:opacity-50 text-white font-semibold">
              Open Fixed Deposit
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            <div className="font-bold text-sm text-[#1B130D]">Your Fixed Deposits</div>
            {fixedDeposits.map((fd) => (
              <div key={fd.id} className="p-4 rounded-xl bg-[#EBDEC8] border border-[#D9C7AB] flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono font-bold text-[#1B130D]">{fd.id}</div>
                  <div className="text-[#3F3124]">
                    Principal: ₹{fd.principal.toLocaleString('en-IN')} @ {fd.interestRate}% ({fd.tenureMonths}m)
                  </div>
                  <div className="text-[11px] font-mono text-[#3F3124]">Maturity Date: {fd.maturityDate}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-800">₹{fd.maturityAmount.toLocaleString('en-IN')}</div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFE4D2] border border-[#CEB896] text-[#70411A]">
                    {fd.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 9. RECURRING DEPOSIT (RD)
  if (section === 'rd') {
    return (
      <div className="bg-[#EFE2CE] rounded-2xl border border-[#D9C7AB] shadow-md p-6 space-y-5">
        <div className="border-b border-[#D9C7AB] pb-4">
          <h2 className="text-lg font-bold text-[#1B130D] flex items-center gap-2">
            <Repeat className="w-5 h-5 text-[#70411A]" /> Recurring Deposit (RD)
          </h2>
          <p className="text-xs text-[#3F3124]">Save a fixed monthly amount systematically and earn quarterly compounded returns.</p>
        </div>

        {feedbackBanner}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          <form onSubmit={handleOpenRd} className="lg:col-span-5 p-4 rounded-xl bg-[#E9D9C0] border border-[#CEB896] space-y-3">
            <div className="font-bold text-sm text-[#1B130D]">Start New Recurring Deposit</div>
            <div>
              <label className="block font-semibold text-[#1B130D] mb-1">Monthly Installment (₹)</label>
              <input type="number" min={500} required value={rdMonthly} onChange={(e) => setRdMonthly(e.target.value)} className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 font-mono text-[#1B130D]" />
            </div>
            <div>
              <label className="block font-semibold text-[#1B130D] mb-1">Duration</label>
              <select value={rdTenure} onChange={(e) => setRdTenure(Number(e.target.value))} className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 font-mono text-[#1B130D]">
                <option value={6}>6 Months (6.80% p.a.)</option>
                <option value={12}>12 Months (6.80% p.a.)</option>
                <option value={24}>24 Months (7.00% p.a.)</option>
                <option value={36}>36 Months (7.00% p.a.)</option>
              </select>
            </div>
            <button type="submit" disabled={!canPerformTransactions} className="w-full py-2.5 rounded-xl bg-[#70411A] hover:bg-[#542F11] disabled:opacity-50 text-white font-semibold">
              Activate Recurring Deposit
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            <div className="font-bold text-sm text-[#1B130D]">Active Recurring Deposits</div>
            {recurringDeposits.map((rd) => (
              <div key={rd.id} className="p-4 rounded-xl bg-[#EBDEC8] border border-[#D9C7AB] flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono font-bold text-[#1B130D]">{rd.id}</div>
                  <div className="text-[#3F3124]">
                    ₹{rd.monthlyInstallment.toLocaleString('en-IN')}/mo @ {rd.interestRate}% &bull; Paid {rd.installmentsPaid}/{rd.tenureMonths}
                  </div>
                  <div className="text-[11px] font-mono text-[#3F3124]">Next Due: {rd.nextDueDate}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[#3F3124]">Maturity Value</div>
                  <div className="font-mono font-bold text-emerald-800">₹{rd.maturityAmount.toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 10. FD CALCULATOR
  if (section === 'fd-calculator') {
    const maturity = calcFdMaturity(fdCalcPrincipal, fdCalcRate, fdCalcMonths);
    const interest = maturity - fdCalcPrincipal;
    return (
      <div className="bg-[#EFE2CE] rounded-2xl border border-[#D9C7AB] shadow-md p-6 space-y-5">
        <div className="border-b border-[#D9C7AB] pb-4">
          <h2 className="text-lg font-bold text-[#1B130D] flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#70411A]" /> FD Maturity Calculator
          </h2>
          <p className="text-xs text-[#3F3124]">Estimate Fixed Deposit maturity amount and quarterly compounded interest earned.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between font-semibold mb-1"><span>Principal Deposit</span><span className="font-mono">₹{fdCalcPrincipal.toLocaleString('en-IN')}</span></div>
              <input type="range" min={5000} max={2500000} step={5000} value={fdCalcPrincipal} onChange={(e) => setFdCalcPrincipal(Number(e.target.value))} className="w-full accent-[#70411A]" />
            </div>
            <div>
              <div className="flex justify-between font-semibold mb-1"><span>Interest Rate</span><span className="font-mono">{fdCalcRate.toFixed(2)}% p.a.</span></div>
              <input type="range" min={4} max={10} step={0.1} value={fdCalcRate} onChange={(e) => setFdCalcRate(Number(e.target.value))} className="w-full accent-[#70411A]" />
            </div>
            <div>
              <div className="flex justify-between font-semibold mb-1"><span>Tenure</span><span className="font-mono">{fdCalcMonths} Months</span></div>
              <input type="range" min={6} max={120} step={6} value={fdCalcMonths} onChange={(e) => setFdCalcMonths(Number(e.target.value))} className="w-full accent-[#70411A]" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#E9D9C0] border border-[#CEB896] space-y-3">
            <div className="text-[11px] uppercase font-semibold text-[#3F3124]">Estimated Maturity Amount</div>
            <div className="text-3xl font-extrabold text-[#1B130D] font-mono">₹{maturity.toLocaleString('en-IN')}</div>
            <div className="pt-3 border-t border-[#CEB896] space-y-1.5">
              <div className="flex justify-between"><span className="text-[#3F3124]">Invested Principal</span><span className="font-mono font-bold">₹{fdCalcPrincipal.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-[#3F3124]">Total Interest Earned</span><span className="font-mono font-bold text-emerald-800">+₹{interest.toLocaleString('en-IN')}</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 11. RD CALCULATOR
  if (section === 'rd-calculator') {
    const deposited = rdCalcMonthly * rdCalcMonths;
    const maturity = calcRdMaturity(rdCalcMonthly, rdCalcRate, rdCalcMonths);
    const interest = maturity - deposited;
    return (
      <div className="bg-[#EFE2CE] rounded-2xl border border-[#D9C7AB] shadow-md p-6 space-y-5">
        <div className="border-b border-[#D9C7AB] pb-4">
          <h2 className="text-lg font-bold text-[#1B130D] flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#70411A]" /> RD Returns Calculator
          </h2>
          <p className="text-xs text-[#3F3124]">Calculate total recurring deposit returns for monthly investments.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between font-semibold mb-1"><span>Monthly Deposit</span><span className="font-mono">₹{rdCalcMonthly.toLocaleString('en-IN')}</span></div>
              <input type="range" min={500} max={100000} step={500} value={rdCalcMonthly} onChange={(e) => setRdCalcMonthly(Number(e.target.value))} className="w-full accent-[#70411A]" />
            </div>
            <div>
              <div className="flex justify-between font-semibold mb-1"><span>Interest Rate</span><span className="font-mono">{rdCalcRate.toFixed(2)}% p.a.</span></div>
              <input type="range" min={4} max={10} step={0.1} value={rdCalcRate} onChange={(e) => setRdCalcRate(Number(e.target.value))} className="w-full accent-[#70411A]" />
            </div>
            <div>
              <div className="flex justify-between font-semibold mb-1"><span>Tenure</span><span className="font-mono">{rdCalcMonths} Months</span></div>
              <input type="range" min={6} max={60} step={6} value={rdCalcMonths} onChange={(e) => setRdCalcMonths(Number(e.target.value))} className="w-full accent-[#70411A]" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#E9D9C0] border border-[#CEB896] space-y-3">
            <div className="text-[11px] uppercase font-semibold text-[#3F3124]">Estimated RD Maturity Value</div>
            <div className="text-3xl font-extrabold text-[#1B130D] font-mono">₹{maturity.toLocaleString('en-IN')}</div>
            <div className="pt-3 border-t border-[#CEB896] space-y-1.5">
              <div className="flex justify-between"><span className="text-[#3F3124]">Total Amount Deposited</span><span className="font-mono font-bold">₹{deposited.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-[#3F3124]">Interest Gained</span><span className="font-mono font-bold text-emerald-800">+₹{interest.toLocaleString('en-IN')}</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 12. FD RENEWAL
  if (section === 'fd-renewal') {
    return (
      <div className="bg-[#EFE2CE] rounded-2xl border border-[#D9C7AB] shadow-md p-6 space-y-5">
        <div className="border-b border-[#D9C7AB] pb-4">
          <h2 className="text-lg font-bold text-[#1B130D] flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-[#70411A]" /> FD Renewal at Maturity
          </h2>
          <p className="text-xs text-[#3F3124]">Renew existing or maturing fixed deposits for a fresh tenure at current interest rates.</p>
        </div>

        {feedbackBanner}

        <form onSubmit={handleRenewFd} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-[#1B130D] mb-1">Select Fixed Deposit</label>
            <select value={selectedFdId} onChange={(e) => setSelectedFdId(e.target.value)} className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 font-mono text-[#1B130D]">
              {fixedDeposits.map((fd) => (
                <option key={fd.id} value={fd.id}>
                  {fd.id} (₹{fd.principal.toLocaleString('en-IN')} • {fd.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#1B130D] mb-1">Renewal Mode</label>
            <select value={renewMode} onChange={(e) => setRenewMode(e.target.value as any)} className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D]">
              <option value="PRINCIPAL_PLUS_INTEREST">Principal + Interest (Auto-Compound)</option>
              <option value="PRINCIPAL_ONLY">Principal Only (Credit Interest to Savings)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#1B130D] mb-1">New Tenure</label>
            <select value={renewTenure} onChange={(e) => setRenewTenure(Number(e.target.value))} className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 font-mono text-[#1B130D]">
              <option value={12}>12 Months (7.10% p.a.)</option>
              <option value={24}>24 Months (7.35% p.a.)</option>
              <option value={36}>36 Months (7.35% p.a.)</option>
              <option value={60}>60 Months (7.35% p.a.)</option>
            </select>
          </div>

          <div className="md:col-span-3 flex justify-end pt-2">
            <button type="submit" className="px-6 py-2.5 rounded-xl bg-[#70411A] hover:bg-[#542F11] text-white font-semibold flex items-center gap-2 shadow-md">
              <RefreshCw className="w-4 h-4" /> Renew Fixed Deposit Now
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 13. CIBIL SCORE
  if (section === 'cibil-score') {
    const rawScore = Math.round(
      520 +
        (cibilOnTimePct / 100) * 210 +
        Math.max(0, 100 - cibilUtilizationPct) * 1.15 +
        Math.min(10, cibilCreditAgeYears) * 6.5 -
        cibilHardInquiries * 14 +
        (selectedAccount.balance >= 50000 ? 15 : 0)
    );
    const cibilScore = Math.max(300, Math.min(900, rawScore));
    const scoreBand =
      cibilScore >= 780
        ? { label: 'EXCELLENT', badge: 'bg-emerald-100 text-emerald-900 border-emerald-400', bar: 'bg-emerald-600' }
        : cibilScore >= 720
        ? { label: 'VERY GOOD', badge: 'bg-emerald-100 text-emerald-900 border-emerald-400', bar: 'bg-emerald-600' }
        : cibilScore >= 650
        ? { label: 'FAIR', badge: 'bg-amber-100 text-amber-950 border-amber-400', bar: 'bg-amber-600' }
        : { label: 'NEEDS IMPROVEMENT', badge: 'bg-rose-100 text-rose-900 border-rose-400', bar: 'bg-rose-600' };
    const gaugePercent = Math.round(((cibilScore - 300) / 600) * 100);

    return (
      <div className="bg-[#EFE2CE] rounded-2xl border border-[#D9C7AB] shadow-md p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D9C7AB] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#1B130D] flex items-center gap-2">
              <Gauge className="w-5 h-5 text-[#70411A]" /> CIBIL Credit Score & Health Report
            </h2>
            <p className="text-xs text-[#3F3124]">
              Bureau assessment for {selectedAccount.customerName || 'Account Holder'} ({selectedAccount.accountNumber}) &bull; Updated {cibilRefreshedAt}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCibilRefreshedAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
              setFeedback({
                type: 'success',
                message: `CIBIL bureau report refreshed. Current score: ${cibilScore}/900 (${scoreBand.label}).`,
              });
            }}
            className="px-4 py-2 rounded-xl bg-[#70411A] hover:bg-[#542F11] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh CIBIL Report
          </button>
        </div>

        {feedbackBanner}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          {/* Left: CIBIL Score Meter & Bureau Factors */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-[#E9D9C0] border border-[#CEB896] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider text-[#3F3124]">TransUnion CIBIL Score</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${scoreBand.badge}`}>
                {scoreBand.label}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold font-mono text-[#1B130D]">{cibilScore}</span>
              <span className="text-sm font-mono text-[#3F3124]">/ 900</span>
            </div>

            <div className="space-y-1.5">
              <div className="w-full h-3 rounded-full bg-[#DFCEB2] overflow-hidden border border-[#CEB896]">
                <div className={`h-full ${scoreBand.bar} transition-all duration-300`} style={{ width: `${gaugePercent}%` }} />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[#3F3124]">
                <span>300 (Poor)</span>
                <span>650 (Fair)</span>
                <span>750 (Prime)</span>
                <span>900</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#CEB896] space-y-2">
              <div className="flex justify-between">
                <span className="text-[#3F3124]">Pre-Approved Home Loan APR:</span>
                <span className="font-mono font-bold text-[#1B130D]">{cibilScore >= 750 ? '8.35%' : cibilScore >= 700 ? '8.75%' : '9.60%'} p.a.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#3F3124]">Active Loans on Profile:</span>
                <span className="font-mono font-bold text-[#1B130D]">{trackedLoans.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#3F3124]">Credit Standing:</span>
                <span className="font-semibold text-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> {cibilScore >= 720 ? 'Eligible for Instant Disbursal' : 'Standard Underwriting'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Interactive CIBIL Score Simulator */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-[#EBDEC8] border border-[#D9C7AB] space-y-4">
            <div className="font-bold text-sm text-[#1B130D]">Interactive CIBIL Score Simulator</div>
            <p className="text-[#3F3124]">
              Adjust payment behavior and credit usage below to preview how changes impact your CIBIL score.
            </p>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between font-semibold text-[#1B130D] mb-1">
                  <span>On-Time EMI & Card Payments (High Impact)</span>
                  <span className="font-mono">{cibilOnTimePct}%</span>
                </div>
                <input type="range" min={60} max={100} step={1} value={cibilOnTimePct} onChange={(e) => setCibilOnTimePct(Number(e.target.value))} className="w-full accent-[#70411A]" />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-[#1B130D] mb-1">
                  <span>Credit Limit Utilization (Recommended &lt; 30%)</span>
                  <span className="font-mono">{cibilUtilizationPct}%</span>
                </div>
                <input type="range" min={5} max={95} step={1} value={cibilUtilizationPct} onChange={(e) => setCibilUtilizationPct(Number(e.target.value))} className="w-full accent-[#70411A]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between font-semibold text-[#1B130D] mb-1">
                    <span>Credit History Age</span>
                    <span className="font-mono">{cibilCreditAgeYears} Years</span>
                  </div>
                  <input type="range" min={1} max={15} step={1} value={cibilCreditAgeYears} onChange={(e) => setCibilCreditAgeYears(Number(e.target.value))} className="w-full accent-[#70411A]" />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-[#1B130D] mb-1">
                    <span>Recent Hard Inquiries (6m)</span>
                    <span className="font-mono">{cibilHardInquiries}</span>
                  </div>
                  <input type="range" min={0} max={8} step={1} value={cibilHardInquiries} onChange={(e) => setCibilHardInquiries(Number(e.target.value))} className="w-full accent-[#70411A]" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => onChangeSection('loan-eligibility')}
                className="px-3.5 py-2 rounded-xl bg-[#70411A] hover:bg-[#542F11] text-white font-semibold"
              >
                Check Loan Eligibility
              </button>
              <button
                type="button"
                onClick={() => onChangeSection('home-loan')}
                className="px-3.5 py-2 rounded-xl bg-[#E9D9C0] hover:bg-[#DFCEB2] border border-[#CEB896] text-[#1B130D] font-semibold"
              >
                Apply for Home Loan
              </button>
              <button
                type="button"
                onClick={() => onChangeSection('loan-repayment')}
                className="px-3.5 py-2 rounded-xl bg-[#E9D9C0] hover:bg-[#DFCEB2] border border-[#CEB896] text-[#1B130D] font-semibold"
              >
                Pay Outstanding EMI
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
