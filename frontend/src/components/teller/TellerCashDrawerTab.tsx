import React, { useEffect, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Printer,
  RefreshCw,
  Scale,
  Search,
  Wallet,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { tellerApi } from '../../services/api';
import { Account, CashReconciliationItem, TellerDrawerData, Transaction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { downloadTransactionReceipt, printTransactionReceipt } from '../../utils/receipt';
import {
  extractErrorMessage,
  formatCurrency,
  formatDateTime,
  getStatusBadgeClass,
} from './tellerFormatters';

export const TellerCashDrawerTab: React.FC = () => {
  const { user } = useAuth();
  const [subTab, setSubTab] = useState<'DEPOSIT' | 'WITHDRAWAL' | 'DRAWER'>('DEPOSIT');

  // Account Search & Verification
  const [accountNumber, setAccountNumber] = useState('ACC1001');
  const [verifiedAccount, setVerifiedAccount] = useState<Account | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Deposit Form
  const [depositAmount, setDepositAmount] = useState('');
  const [depositType, setDepositType] = useState('CASH_COUNTER');
  const [depositorName, setDepositorName] = useState('');
  const [depositorIdRef, setDepositorIdRef] = useState('');
  const [depositRemarks, setDepositRemarks] = useState('');

  // Withdrawal Form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [customerVerified, setCustomerVerified] = useState(false);
  const [withdrawIdRef, setWithdrawIdRef] = useState('');
  const [withdrawRemarks, setWithdrawRemarks] = useState('');

  // Confirmation & Receipt
  const [confirmPending, setConfirmPending] = useState<'DEPOSIT' | 'WITHDRAWAL' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [lastTx, setLastTx] = useState<{ tx: Transaction; holder: string; acct: string } | null>(null);

  // Drawer & Reconciliation
  const [drawer, setDrawer] = useState<TellerDrawerData | null>(null);
  const [reconciliations, setReconciliations] = useState<CashReconciliationItem[]>([]);
  const [openingBalance, setOpeningBalance] = useState('150000');
  const [adjType, setAdjType] = useState('REPLENISHMENT');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjRemarks, setAdjRemarks] = useState('');
  const [declaredPhysicalCash, setDeclaredPhysicalCash] = useState('');
  const [eodRemarks, setEodRemarks] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const canVerifyReconciliation = Boolean(
    user?.roles?.some((r) => r === 'BANK_MANAGER' || r === 'ADMIN') ||
      user?.permissions?.includes('CASH_RECONCILIATION_VERIFY')
  );

  const loadDrawerAndRecons = async () => {
    try {
      const [d, recons] = await Promise.all([tellerApi.getDrawer(), tellerApi.listReconciliations()]);
      setDrawer(d);
      setReconciliations(recons || []);
      if (d && !declaredPhysicalCash) {
        setDeclaredPhysicalCash(String(d.currentBalance));
      }
    } catch {
      // Bank Managers / Auditors without a physical counter drawer can still view reconciliations
      try {
        const recons = await tellerApi.listReconciliations();
        setReconciliations(recons || []);
      } catch {
        /* ignore */
      }
    }
  };

  useEffect(() => {
    loadDrawerAndRecons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lookupAccount = async () => {
    const clean = accountNumber.trim().toUpperCase();
    if (!clean) return;
    setLookupLoading(true);
    setError('');
    try {
      const acc = await tellerApi.getAccountDetails(clean);
      setVerifiedAccount(acc);
      if (!depositorName && acc.customerName) {
        setDepositorName(acc.customerName);
      }
    } catch (err) {
      setVerifiedAccount(null);
      setError(extractErrorMessage(err, 'Unable to verify customer account.'));
    } finally {
      setLookupLoading(false);
    }
  };

  const executeConfirmedCashTx = async () => {
    if (!confirmPending) return;
    setProcessing(true);
    setError('');
    setMessage('');
    try {
      if (confirmPending === 'DEPOSIT') {
        const tx = await tellerApi.cashDeposit({
          accountNumber: accountNumber.trim().toUpperCase(),
          amount: Number(depositAmount),
          depositType,
          depositorName: depositorName.trim() || verifiedAccount?.customerName,
          depositorIdRef: depositorIdRef.trim() || undefined,
          remarks: depositRemarks.trim() || undefined,
        });
        setLastTx({
          tx,
          acct: tx.destinationAccountNumber || accountNumber.trim().toUpperCase(),
          holder: verifiedAccount?.customerName || depositorName || 'Account Holder',
        });
        setMessage(`Cash deposit ${tx.transactionId} completed successfully. Account and drawer ledger updated.`);
        setDepositAmount('');
        setDepositRemarks('');
      } else {
        const tx = await tellerApi.cashWithdrawal({
          accountNumber: accountNumber.trim().toUpperCase(),
          amount: Number(withdrawAmount),
          depositorName: verifiedAccount?.customerName,
          depositorIdRef: withdrawIdRef.trim() || undefined,
          customerVerified,
          remarks: withdrawRemarks.trim() || undefined,
        });
        setLastTx({
          tx,
          acct: tx.sourceAccountNumber || accountNumber.trim().toUpperCase(),
          holder: verifiedAccount?.customerName || 'Account Holder',
        });
        setMessage(`Cash withdrawal ${tx.transactionId} disbursed successfully. Account and drawer balance updated.`);
        setWithdrawAmount('');
        setWithdrawRemarks('');
        setCustomerVerified(false);
      }
      setConfirmPending(null);
      await Promise.all([lookupAccount(), loadDrawerAndRecons()]);
    } catch (err) {
      setError(extractErrorMessage(err, 'Cash operation failed.'));
      setConfirmPending(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenDrawer = async () => {
    setError('');
    setMessage('');
    try {
      const d = await tellerApi.openDrawer(Number(openingBalance));
      setDrawer(d);
      setMessage(`Drawer ${d.drawerCode} opened with ${formatCurrency(d.openingBalance)}.`);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not open teller drawer.'));
    }
  };

  const handleAdjustDrawer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const d = await tellerApi.adjustDrawer({
        operationType: adjType,
        amount: Number(adjAmount),
        remarks: adjRemarks.trim(),
      });
      setDrawer(d);
      setAdjAmount('');
      setAdjRemarks('');
      setMessage(`Auditable ${adjType} recorded against cash drawer.`);
    } catch (err) {
      setError(extractErrorMessage(err, 'Drawer adjustment failed.'));
    }
  };

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const item = await tellerApi.reconcileDrawer({
        declaredPhysicalCash: Number(declaredPhysicalCash),
        remarks: eodRemarks.trim() || undefined,
      });
      setEodRemarks('');
      setMessage(
        `End-of-day reconciliation ${item.reconciliationId} submitted (${item.varianceType}: ${formatCurrency(item.varianceAmount)}).`
      );
      await loadDrawerAndRecons();
    } catch (err) {
      setError(extractErrorMessage(err, 'Reconciliation submission failed.'));
    }
  };

  const handleVerifyRecon = async (reconciliationId: string, approved: boolean) => {
    setError('');
    setMessage('');
    try {
      const updated = await tellerApi.verifyReconciliation(
        reconciliationId,
        approved,
        approved ? 'Verified physical counter count' : 'Rejected: Recount required'
      );
      setMessage(`Reconciliation ${updated.reconciliationId} marked ${updated.status}.`);
      await loadDrawerAndRecons();
    } catch (err) {
      setError(extractErrorMessage(err, 'Verification failed (check segregation-of-duties rule).'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1B130D]">Cash Transactions &amp; Teller Cash Drawer</h2>
          <p className="text-sm text-[#3F3124]">
            Process branch counter cash deposits, verified cash withdrawals, shortage/excess adjustments, and end-of-day drawer reconciliation.
          </p>
        </div>
        {drawer && (
          <div className="px-4 py-2.5 rounded-2xl bg-[#261D15] text-[#F4ECE0] flex items-center gap-4 text-xs">
            <div>
              <div className="text-[#CEB896]">Drawer ({drawer.drawerCode})</div>
              <div className="text-base font-bold font-mono text-[#D9A86C]">{formatCurrency(drawer.currentBalance)}</div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(drawer.status)}`}>
              {drawer.status}
            </span>
          </div>
        )}
      </div>

      {/* Mode Switcher */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSubTab('DEPOSIT')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border ${
            subTab === 'DEPOSIT'
              ? 'bg-[#261D15] text-[#F4ECE0] border-[#261D15]'
              : 'bg-[#EFE2CE] text-[#1B130D] border-[#D9C7AB]'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" /> Cash Deposit
        </button>
        <button
          type="button"
          onClick={() => setSubTab('WITHDRAWAL')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border ${
            subTab === 'WITHDRAWAL'
              ? 'bg-[#261D15] text-[#F4ECE0] border-[#261D15]'
              : 'bg-[#EFE2CE] text-[#1B130D] border-[#D9C7AB]'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4" /> Cash Withdrawal
        </button>
        <button
          type="button"
          onClick={() => setSubTab('DRAWER')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border ${
            subTab === 'DRAWER'
              ? 'bg-[#261D15] text-[#F4ECE0] border-[#261D15]'
              : 'bg-[#EFE2CE] text-[#1B130D] border-[#D9C7AB]'
          }`}
        >
          <Wallet className="w-4 h-4" /> Drawer &amp; EOD Reconciliation
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-900/10 border border-rose-700/30 text-sm text-rose-900">{error}</div>
      )}
      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-900/10 border border-emerald-700/30 text-sm text-emerald-900 flex flex-wrap items-center justify-between gap-3">
          <span>{message}</span>
          {lastTx && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => printTransactionReceipt(lastTx.tx, lastTx.acct, lastTx.holder)}
                className="px-3 py-1 rounded-lg bg-[#261D15] text-[#F4ECE0] text-xs font-semibold inline-flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
              <button
                type="button"
                onClick={() => downloadTransactionReceipt(lastTx.tx, lastTx.acct, lastTx.holder)}
                className="px-3 py-1 rounded-lg bg-[#EFE2CE] border border-[#D9C7AB] text-[#1B130D] text-xs font-semibold inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          )}
        </div>
      )}

      {(subTab === 'DEPOSIT' || subTab === 'WITHDRAWAL') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Step 1: Account Verification Card */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-4">
            <h3 className="text-base font-bold text-[#1B130D]">1. Verify Customer Account</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="ACC1001"
                className="flex-1 px-3 py-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono text-sm text-[#1B130D]"
              />
              <button
                type="button"
                onClick={lookupAccount}
                disabled={lookupLoading}
                className="px-4 py-2.5 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold flex items-center gap-1.5"
              >
                {lookupLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Verify
              </button>
            </div>

            {verifiedAccount ? (
              <div className="p-4 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#3F3124]">Customer Name</span>
                  <span className="font-bold text-[#1B130D]">{verifiedAccount.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3F3124]">Account Number</span>
                  <span className="font-mono font-semibold">{verifiedAccount.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3F3124]">Available Balance</span>
                  <span className="font-mono font-bold text-sm text-[#1B130D]">
                    {formatCurrency(verifiedAccount.balance, verifiedAccount.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#3F3124]">Account Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(verifiedAccount.status)}`}>
                    {verifiedAccount.status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#F3E7D4]/70 border border-dashed border-[#D9C7AB] text-xs text-[#3F3124]">
                Click Verify to load customer identity, account status, and live ledger balance before posting cash.
              </div>
            )}

            {drawer && (
              <div className="p-4 rounded-xl bg-[#E9D9C0] border border-[#D9C7AB] text-xs space-y-1.5">
                <div className="font-bold text-[#1B130D]">Teller Drawer Status ({drawer.drawerCode})</div>
                <div className="flex justify-between">
                  <span>Opening Cash</span>
                  <span className="font-mono">{formatCurrency(drawer.openingBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash In / Out</span>
                  <span className="font-mono">
                    +{formatCurrency(drawer.cashReceived)} / -{formatCurrency(drawer.cashPaidOut)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-[#1B130D] pt-1 border-t border-[#D9C7AB]">
                  <span>Current Counter Cash</span>
                  <span className="font-mono">{formatCurrency(drawer.currentBalance)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Deposit or Withdrawal Form */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB]">
            {subTab === 'DEPOSIT' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setConfirmPending('DEPOSIT');
                }}
                className="space-y-4"
              >
                <h3 className="text-base font-bold text-[#1B130D]">2. Cash Deposit Entry</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#3F3124] mb-1">Deposit Amount (INR)</label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      required
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="5000.00"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3F3124] mb-1">Deposit Type</label>
                    <select
                      value={depositType}
                      onChange={(e) => setDepositType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-sm"
                    >
                      <option value="CASH_COUNTER">Standard Cash Counter Deposit</option>
                      <option value="THIRD_PARTY_CASH">Third-Party Depositor Cash</option>
                      <option value="HIGH_VALUE_CASH">High-Value Cash Deposit (&ge; ₹50,000 ID Req)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#3F3124] mb-1">Depositor Name</label>
                    <input
                      type="text"
                      required
                      value={depositorName}
                      onChange={(e) => setDepositorName(e.target.value)}
                      placeholder="Full name of depositor"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3F3124] mb-1">
                      Depositor PAN / ID Ref {Number(depositAmount || 0) >= 50000 ? '(Required >= ₹50,000)' : '(Optional)'}
                    </label>
                    <input
                      type="text"
                      required={Number(depositAmount || 0) >= 50000}
                      value={depositorIdRef}
                      onChange={(e) => setDepositorIdRef(e.target.value)}
                      placeholder="PAN / Aadhaar / Voter ID ref"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3F3124] mb-1">Narration / Remarks</label>
                  <input
                    type="text"
                    value={depositRemarks}
                    onChange={(e) => setDepositRemarks(e.target.value)}
                    placeholder="Cash slip reference or branch remarks"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#261D15] text-[#F4ECE0] font-semibold text-sm hover:bg-[#3A2D21]"
                >
                  Review &amp; Confirm Cash Deposit
                </button>
              </form>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setConfirmPending('WITHDRAWAL');
                }}
                className="space-y-4"
              >
                <h3 className="text-base font-bold text-[#1B130D]">2. Cash Withdrawal Payout</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#3F3124] mb-1">Withdrawal Amount (INR)</label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      required
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="2500.00"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3F3124] mb-1">Customer ID Verification Ref</label>
                    <input
                      type="text"
                      value={withdrawIdRef}
                      onChange={(e) => setWithdrawIdRef(e.target.value)}
                      placeholder="Passport / PAN / Biometric Ref"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono text-sm"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customerVerified}
                    onChange={(e) => setCustomerVerified(e.target.checked)}
                    className="mt-0.5 rounded border-[#70411A] text-[#261D15]"
                  />
                  <span className="text-xs text-[#1B130D]">
                    <strong>Policy Verification Attestation:</strong> I confirm I have physically verified the customer&rsquo;s photo ID, signature specimen, and passbook/withdrawal slip before paying cash from the drawer.
                  </span>
                </label>

                <div>
                  <label className="block text-xs font-semibold text-[#3F3124] mb-1">Remarks</label>
                  <input
                    type="text"
                    value={withdrawRemarks}
                    onChange={(e) => setWithdrawRemarks(e.target.value)}
                    placeholder="Withdrawal voucher reference"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!customerVerified}
                  className="w-full py-3 rounded-xl bg-[#8E4322] text-[#F4ECE0] font-semibold text-sm hover:opacity-95 disabled:opacity-40"
                >
                  Review &amp; Disburse Cash Withdrawal
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {subTab === 'DRAWER' && (
        <div className="space-y-6">
          {/* Open / Summary + Adjustments + EOD Reconciliation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Drawer Control */}
            <div className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
              <h3 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#70411A]" />
                Counter Drawer Summary
              </h3>
              {drawer ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span>Code / Date</span><span className="font-mono font-bold">{drawer.drawerCode} • {drawer.businessDate}</span></div>
                  <div className="flex justify-between"><span>Opening Balance</span><span className="font-mono">{formatCurrency(drawer.openingBalance)}</span></div>
                  <div className="flex justify-between text-emerald-900"><span>Cash Received (+)</span><span className="font-mono">{formatCurrency(drawer.cashReceived)}</span></div>
                  <div className="flex justify-between text-rose-900"><span>Cash Paid Out (-)</span><span className="font-mono">{formatCurrency(drawer.cashPaidOut)}</span></div>
                  <div className="flex justify-between pt-2 border-t border-[#D9C7AB] text-sm font-bold text-[#1B130D]">
                    <span>Current Balance</span>
                    <span className="font-mono">{formatCurrency(drawer.currentBalance)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#3F3124]">No drawer loaded for this account (Managers inspect reconciliations below).</p>
              )}

              {drawer && drawer.status !== 'OPEN' && (
                <div className="pt-2 space-y-2">
                  <label className="block text-xs font-semibold text-[#3F3124]">Re-open Day Opening Float (INR)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleOpenDrawer}
                      className="px-3 py-2 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold"
                    >
                      Open Drawer
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Shortage / Excess / Replenishment Adjustment */}
            <form onSubmit={handleAdjustDrawer} className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
              <h3 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#8E4322]" />
                Auditable Cash Adjustment
              </h3>
              <select
                value={adjType}
                onChange={(e) => setAdjType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs font-semibold"
              >
                <option value="REPLENISHMENT">Vault Replenishment (+ Cash In)</option>
                <option value="VAULT_DROP">Vault Cash Drop (- Cash Out)</option>
                <option value="EXCESS">Record Cash Excess (+ Auditable)</option>
                <option value="SHORTAGE">Record Cash Shortage (- Auditable)</option>
              </select>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={adjAmount}
                onChange={(e) => setAdjAmount(e.target.value)}
                placeholder="Adjustment amount (INR)"
                className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono text-xs"
              />
              <input
                type="text"
                required
                value={adjRemarks}
                onChange={(e) => setAdjRemarks(e.target.value)}
                placeholder="Mandatory audit reason / vault voucher #"
                className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-[#70411A] text-[#F4ECE0] text-xs font-semibold hover:opacity-95"
              >
                Post Auditable Drawer Entry
              </button>
            </form>

            {/* EOD Reconciliation Submit */}
            <form onSubmit={handleReconcile} className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
              <h3 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#70411A]" />
                End-of-Day Reconciliation
              </h3>
              <div>
                <label className="block text-xs font-semibold text-[#3F3124] mb-1">Declared Physical Cash Count (INR)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={declaredPhysicalCash}
                  onChange={(e) => setDeclaredPhysicalCash(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono text-xs"
                />
              </div>
              <input
                type="text"
                value={eodRemarks}
                onChange={(e) => setEodRemarks(e.target.value)}
                placeholder="Denomination count notes / variance explanation"
                className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold hover:bg-[#3A2D21]"
              >
                Submit EOD Reconciliation &amp; Close
              </button>
            </form>
          </div>

          {/* Drawer Ledger */}
          {drawer && (
            <div className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
              <h3 className="text-base font-bold text-[#1B130D]">Cash Drawer Ledger History</h3>
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#E9D9C0] sticky top-0 text-[#3F3124]">
                    <tr>
                      <th className="py-2 px-3">Timestamp</th>
                      <th className="py-2 px-3">Operation</th>
                      <th className="py-2 px-3">Txn Ref</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                      <th className="py-2 px-3 text-right">After Balance</th>
                      <th className="py-2 px-3">By / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2D0B4]">
                    {(drawer.ledger || []).map((entry) => (
                      <tr key={entry.id}>
                        <td className="py-2 px-3">{formatDateTime(entry.createdAt)}</td>
                        <td className="py-2 px-3 font-semibold">{entry.operationType}</td>
                        <td className="py-2 px-3 font-mono">{entry.transactionId || '—'}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">{formatCurrency(entry.amount)}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(entry.balanceAfter)}</td>
                        <td className="py-2 px-3">{entry.createdBy} {entry.remarks ? `• ${entry.remarks}` : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reconciliation Records Table */}
          <div className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
            <h3 className="text-base font-bold text-[#1B130D]">Branch EOD Reconciliations &amp; Supervisor Verification</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#E9D9C0] text-[#3F3124]">
                  <tr>
                    <th className="py-2 px-3">Recon ID</th>
                    <th className="py-2 px-3">Drawer / Submitted By</th>
                    <th className="py-2 px-3 text-right">Expected</th>
                    <th className="py-2 px-3 text-right">Physical</th>
                    <th className="py-2 px-3 text-right">Variance</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Supervisor Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2D0B4]">
                  {reconciliations.length === 0 ? (
                    <tr><td colSpan={7} className="py-5 text-center text-[#3F3124]">No reconciliations submitted yet.</td></tr>
                  ) : (
                    reconciliations.map((rec) => (
                      <tr key={rec.reconciliationId}>
                        <td className="py-2 px-3 font-mono font-bold">{rec.reconciliationId}</td>
                        <td className="py-2 px-3">{rec.drawerCode} • {rec.submittedBy}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(rec.systemExpectedBalance)}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(rec.declaredPhysicalCash)}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold">
                          {rec.varianceType} ({formatCurrency(rec.varianceAmount)})
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(rec.status)}`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          {rec.status === 'PENDING' && canVerifyReconciliation ? (
                            <div className="inline-flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleVerifyRecon(rec.reconciliationId, true)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white font-semibold"
                              >
                                Verify
                              </button>
                              <button
                                type="button"
                                onClick={() => handleVerifyRecon(rec.reconciliationId, false)}
                                className="px-2.5 py-1 rounded-lg bg-rose-800 text-white font-semibold"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[#3F3124]">{rec.verifiedBy ? `By ${rec.verifiedBy}` : 'Awaiting Manager'}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmPending && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F3E7D4] border border-[#CEB896] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-[#1B130D]">
              <CheckCircle2 className="w-5 h-5 text-[#70411A]" />
              <h3 className="text-lg font-bold">
                Confirm {confirmPending === 'DEPOSIT' ? 'Cash Deposit' : 'Cash Withdrawal'}
              </h3>
            </div>
            <div className="p-4 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB] text-xs space-y-2">
              <div className="flex justify-between">
                <span>Account</span>
                <span className="font-mono font-bold">{accountNumber.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer</span>
                <span className="font-semibold">{verifiedAccount?.customerName || 'Verified Account'}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#1B130D] pt-1 border-t border-[#D9C7AB]">
                <span>Amount</span>
                <span className="font-mono">
                  {formatCurrency(Number(confirmPending === 'DEPOSIT' ? depositAmount : withdrawAmount))}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={processing}
                onClick={() => setConfirmPending(null)}
                className="px-4 py-2 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={executeConfirmedCashTx}
                className="px-5 py-2 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold"
              >
                {processing ? 'Posting...' : 'Confirm & Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
