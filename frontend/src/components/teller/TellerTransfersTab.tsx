import React, { useState } from 'react';
import { ArrowLeftRight, CheckCircle2, Printer, ShieldAlert, Search, Download } from 'lucide-react';
import { mfaApi, tellerApi } from '../../services/api';
import { Account, Transaction } from '../../types';
import { downloadTransactionReceipt, printTransactionReceipt } from '../../utils/receipt';
import { extractErrorMessage, formatCurrency, getStatusBadgeClass } from './tellerFormatters';

const CHANNELS = [
  { value: 'INTERNAL', label: 'Internal Account Transfer' },
  { value: 'SAME_BRANCH', label: 'Same-Branch Assisted Transfer' },
  { value: 'INTER_BRANCH', label: 'Inter-Branch Transfer Request' },
  { value: 'NEFT_SIMULATED', label: 'NEFT Request (Simulated Clearing)' },
  { value: 'RTGS_SIMULATED', label: 'RTGS Request (Simulated >= ₹2,00,000)' },
  { value: 'IMPS_SIMULATED', label: 'IMPS Instant Request (Simulated)' },
];

export const TellerTransfersTab: React.FC = () => {
  const [sourceAccountNumber, setSourceAccountNumber] = useState('ACC1001');
  const [destinationAccountNumber, setDestinationAccountNumber] = useState('ACC2004');
  const [channel, setChannel] = useState('INTERNAL');
  const [amount, setAmount] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryIfsc, setBeneficiaryIfsc] = useState('');
  const [beneficiaryBank, setBeneficiaryBank] = useState('');
  const [remarks, setRemarks] = useState('');

  const [sourceInfo, setSourceInfo] = useState<Account | null>(null);
  const [destInfo, setDestInfo] = useState<Account | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultTx, setResultTx] = useState<Transaction | null>(null);

  // Adaptive MFA Modal State
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [mfaMethod, setMfaMethod] = useState<'EMAIL_OTP' | 'TOTP'>('EMAIL_OTP');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaInfo, setMfaInfo] = useState('');

  const isExternalSim = channel.endsWith('_SIMULATED');

  const verifyAccounts = async () => {
    setError('');
    try {
      const src = await tellerApi.getAccountDetails(sourceAccountNumber.trim().toUpperCase());
      setSourceInfo(src);
      if (!isExternalSim && destinationAccountNumber.trim()) {
        try {
          const dst = await tellerApi.getAccountDetails(destinationAccountNumber.trim().toUpperCase());
          setDestInfo(dst);
          if (!beneficiaryName && dst.customerName) setBeneficiaryName(dst.customerName);
        } catch {
          setDestInfo(null);
        }
      }
    } catch (err) {
      setSourceInfo(null);
      setError(extractErrorMessage(err, 'Source account lookup failed.'));
    }
  };

  const submitTransfer = async (verifiedChallengeId?: string) => {
    setLoading(true);
    setError('');
    try {
      const tx = await tellerApi.fundTransfer({
        sourceAccountNumber: sourceAccountNumber.trim().toUpperCase(),
        destinationAccountNumber: destinationAccountNumber.trim().toUpperCase(),
        amount: Number(amount),
        transferChannel: channel,
        beneficiaryName: beneficiaryName.trim() || undefined,
        beneficiaryIfsc: beneficiaryIfsc.trim() || undefined,
        beneficiaryBank: beneficiaryBank.trim() || undefined,
        remarks: remarks.trim() || undefined,
        challengeId: verifiedChallengeId,
      });
      setResultTx(tx);
      setMfaChallengeId(null);
      setMfaCode('');
      await verifyAccounts();
    } catch (err: any) {
      const status = err?.response?.status;
      const body = err?.response?.data;
      const chalId = body?.data?.challengeId || body?.challengeId;
      if (status === 428 && chalId) {
        setMfaChallengeId(chalId);
        const reqMethod = body?.data?.requiredMethod || 'EMAIL_OTP';
        setMfaMethod(reqMethod === 'TOTP' ? 'TOTP' : 'EMAIL_OTP');
        setMfaInfo(body?.message || 'Adaptive MFA step-up challenge required for this teller transfer.');
      } else {
        setError(extractErrorMessage(err, 'Fund transfer could not be completed.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!mfaChallengeId) return;
    try {
      const otp = await mfaApi.sendOtp(mfaChallengeId, 'TRANSACTION_STEP_UP');
      setMfaInfo(`OTP dispatched to ${otp.maskedDestination}.`);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not send verification OTP.'));
    }
  };

  const handleVerifyMfa = async () => {
    if (!mfaChallengeId || !mfaCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      if (mfaMethod === 'TOTP') {
        await mfaApi.verifyTotp({ code: mfaCode.trim(), challengeId: mfaChallengeId });
      } else {
        await mfaApi.verifyOtp({ otp: mfaCode.trim(), challengeId: mfaChallengeId, purpose: 'TRANSACTION_STEP_UP' });
      }
      await submitTransfer(mfaChallengeId);
    } catch (err) {
      setError(extractErrorMessage(err, 'MFA verification failed.'));
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1B130D]">Teller-Initiated Fund Transfers</h2>
        <p className="text-sm text-[#3F3124]">
          Execute internal, same-branch, inter-branch, or simulated NEFT/RTGS/IMPS transfers with account validation, limit checks, and Adaptive MFA enforcement.
        </p>
      </div>

      {isExternalSim && (
        <div className="p-3.5 rounded-xl bg-amber-900/10 border border-amber-700/30 text-xs text-amber-950 flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-900" />
          <span>
            <strong>Simulated External Clearing Notice:</strong> {channel.replace('_SIMULATED', '')} uses a simulated local clearing rail for academic demonstration — no live NPCI/RBI network gateway is invoked.
          </span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-900/10 border border-rose-700/30 text-sm text-rose-900">{error}</div>
      )}

      {resultTx && (
        <div className="p-4 rounded-2xl bg-emerald-900/10 border border-emerald-700/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-900" />
            <div className="text-xs text-emerald-950">
              <div className="font-bold text-sm">
                Transfer {resultTx.transactionId} &bull;{' '}
                <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getStatusBadgeClass(resultTx.status)}`}>
                  {resultTx.status}
                </span>
              </div>
              <div>
                {resultTx.sourceAccountNumber} &rarr; {resultTx.destinationAccountNumber || beneficiaryAccountLabel(beneficiaryName, beneficiaryIfsc)} &bull;{' '}
                <strong>{formatCurrency(resultTx.amount)}</strong>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => printTransactionReceipt(resultTx, resultTx.sourceAccountNumber || sourceAccountNumber, sourceInfo?.customerName || 'Account Holder')}
              className="px-3 py-1.5 rounded-lg bg-[#261D15] text-[#F4ECE0] text-xs font-semibold flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print Receipt
            </button>
            <button
              type="button"
              onClick={() => downloadTransactionReceipt(resultTx, resultTx.sourceAccountNumber || sourceAccountNumber, sourceInfo?.customerName || 'Account Holder')}
              className="px-3 py-1.5 rounded-lg bg-[#EFE2CE] border border-[#D9C7AB] text-xs font-semibold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Save HTML
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitTransfer();
          }}
          className="lg:col-span-8 p-6 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#3F3124] mb-1">Transfer Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-sm"
              >
                {CHANNELS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3F3124] mb-1">Transfer Amount (INR)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000.00"
                className="w-full px-3 py-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#3F3124] mb-1">Source Account Number</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={sourceAccountNumber}
                  onChange={(e) => setSourceAccountNumber(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={verifyAccounts}
                  className="px-3 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold"
                  title="Verify Account"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3F3124] mb-1">
                {isExternalSim ? 'Beneficiary Account Number' : 'Destination Account Number'}
              </label>
              <input
                type="text"
                required={!isExternalSim}
                value={destinationAccountNumber}
                onChange={(e) => setDestinationAccountNumber(e.target.value)}
                placeholder="ACC2004"
                className="w-full px-3 py-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono text-sm"
              />
            </div>
          </div>

          {isExternalSim && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <div>
                <label className="block text-xs font-semibold text-[#3F3124] mb-1">Beneficiary Name</label>
                <input
                  type="text"
                  required
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#EFE2CE] border border-[#D9C7AB] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3F3124] mb-1">IFSC Code</label>
                <input
                  type="text"
                  required
                  value={beneficiaryIfsc}
                  onChange={(e) => setBeneficiaryIfsc(e.target.value)}
                  placeholder="HDFC0001234"
                  className="w-full px-3 py-2 rounded-lg bg-[#EFE2CE] border border-[#D9C7AB] font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3F3124] mb-1">Beneficiary Bank</label>
                <input
                  type="text"
                  value={beneficiaryBank}
                  onChange={(e) => setBeneficiaryBank(e.target.value)}
                  placeholder="HDFC Bank"
                  className="w-full px-3 py-2 rounded-lg bg-[#EFE2CE] border border-[#D9C7AB] text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#3F3124] mb-1">Transfer Remarks / Voucher Reference</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Customer signed RTGS/NEFT/Internal instruction form"
              className="w-full px-3 py-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#261D15] text-[#F4ECE0] text-sm font-semibold hover:bg-[#3A2D21] flex items-center justify-center gap-2"
          >
            <ArrowLeftRight className="w-4 h-4" />
            {loading ? 'Processing Transfer...' : 'Validate & Initiate Transfer'}
          </button>
        </form>

        {/* Verification Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3 text-xs">
            <h3 className="text-sm font-bold text-[#1B130D]">Source Account Status</h3>
            {sourceInfo ? (
              <div className="space-y-1.5">
                <div className="flex justify-between"><span>Holder</span><span className="font-bold">{sourceInfo.customerName}</span></div>
                <div className="flex justify-between"><span>Account</span><span className="font-mono">{sourceInfo.accountNumber}</span></div>
                <div className="flex justify-between"><span>Balance</span><span className="font-mono font-bold">{formatCurrency(sourceInfo.balance)}</span></div>
                <div className="flex justify-between"><span>Status</span><span className="font-bold">{sourceInfo.status}</span></div>
              </div>
            ) : (
              <p className="text-[#3F3124]">Click the verify button next to Source Account to inspect live balance and account freeze/closure status.</p>
            )}
          </div>

          {destInfo && !isExternalSim && (
            <div className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-1.5 text-xs">
              <h3 className="text-sm font-bold text-[#1B130D]">Destination Beneficiary</h3>
              <div className="flex justify-between"><span>Holder</span><span className="font-bold">{destInfo.customerName}</span></div>
              <div className="flex justify-between"><span>Account</span><span className="font-mono">{destInfo.accountNumber}</span></div>
              <div className="flex justify-between"><span>Status</span><span className="font-bold">{destInfo.status}</span></div>
            </div>
          )}
        </div>
      </div>

      {/* AMFA Modal */}
      {mfaChallengeId && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F3E7D4] border border-[#CEB896] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-[#1B130D]">Adaptive MFA Step-Up Verification</h3>
            <p className="text-xs text-[#3F3124]">{mfaInfo}</p>
            {mfaMethod === 'EMAIL_OTP' && (
              <button
                type="button"
                onClick={handleSendOtp}
                className="px-3 py-1.5 rounded-lg bg-[#EFE2CE] border border-[#D9C7AB] text-xs font-semibold"
              >
                Send Verification OTP
              </button>
            )}
            <input
              type="text"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              placeholder="Enter 6-digit OTP / TOTP code"
              className="w-full px-3 py-2.5 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB] font-mono text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMfaChallengeId(null)}
                className="px-4 py-2 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyMfa}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold"
              >
                Verify &amp; Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function beneficiaryAccountLabel(name?: string, ifsc?: string) {
  return `${name || 'External Beneficiary'}${ifsc ? ` (${ifsc})` : ''}`;
}
