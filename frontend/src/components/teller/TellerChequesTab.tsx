import React, { useEffect, useState } from 'react';
import { FileCheck2, Plus, RefreshCw } from 'lucide-react';
import { tellerApi } from '../../services/api';
import { ChequeItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { extractErrorMessage, formatCurrency, formatDateTime, getStatusBadgeClass } from './tellerFormatters';

export const TellerChequesTab: React.FC = () => {
  const { user } = useAuth();
  const [cheques, setCheques] = useState<ChequeItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Form
  const [requestType, setRequestType] = useState('DEPOSIT');
  const [chequeNumber, setChequeNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('ACC1001');
  const [drawerAccountNumber, setDrawerAccountNumber] = useState('');
  const [issuingBankName, setIssuingBankName] = useState('State Bank of India');
  const [issuingBranch, setIssuingBranch] = useState('MG Road');
  const [chequeDate, setChequeDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState('');
  const [attachmentRef, setAttachmentRef] = useState('');
  const [remarks, setRemarks] = useState('');

  const canClearOrBounce = Boolean(
    user?.roles?.some((r) => r === 'BANK_MANAGER' || r === 'ADMIN') ||
      user?.permissions?.includes('CHEQUE_CLEAR')
  );

  const loadCheques = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await tellerApi.listCheques(statusFilter, 0, 25);
      setCheques(res.content || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load cheque clearing register.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCheques();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleRegisterCheque = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const created = await tellerApi.registerCheque({
        chequeNumber: chequeNumber.trim(),
        accountNumber: accountNumber.trim().toUpperCase(),
        drawerAccountNumber: drawerAccountNumber.trim() || undefined,
        issuingBankName: issuingBankName.trim(),
        issuingBranch: issuingBranch.trim() || undefined,
        chequeDate,
        amount: requestType === 'CHEQUE_BOOK' ? 0 : Number(amount),
        requestType,
        attachmentRef: attachmentRef.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });
      setMessage(`Cheque entry ${created.chequeRef} logged with status ${created.status}.`);
      setChequeNumber('');
      setAmount('');
      setRemarks('');
      await loadCheques();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to register cheque request.'));
    }
  };

  const updateStatus = async (chequeRef: string, status: string) => {
    setError('');
    setMessage('');
    try {
      const updated = await tellerApi.updateChequeStatus(
        chequeRef,
        status,
        `Updated to ${status} via Teller Cheque Workbench`
      );
      setMessage(`Cheque ${updated.chequeRef} status updated to ${updated.status}.`);
      await loadCheques();
    } catch (err) {
      setError(extractErrorMessage(err, 'Cheque status update rejected.'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1B130D]">Cheque Services &amp; Clearing Register</h2>
        <p className="text-sm text-[#3F3124]">
          Register cheque deposits, stop-payment orders, and cheque-book requests. Clearing/bouncing cheques requires Bank Manager or Admin authorization (teller cannot unilaterally clear).
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-900/10 border border-rose-700/30 text-sm text-rose-900">{error}</div>
      )}
      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-900/10 border border-emerald-700/30 text-sm text-emerald-900">{message}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <form onSubmit={handleRegisterCheque} className="xl:col-span-4 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
          <h3 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#70411A]" />
            Register Cheque Entry
          </h3>
          <div>
            <label className="block text-xs font-semibold text-[#3F3124] mb-1">Service Type</label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs font-semibold"
            >
              <option value="DEPOSIT">Cheque Deposit</option>
              <option value="STOP_PAYMENT">Stop Payment Request</option>
              <option value="CHEQUE_BOOK">Cheque Book Issue Request</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#3F3124] mb-1">Beneficiary Account</label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3F3124] mb-1">Cheque Number</label>
              <input
                type="text"
                required
                value={chequeNumber}
                onChange={(e) => setChequeNumber(e.target.value)}
                placeholder="847291"
                className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#3F3124] mb-1">Issuing Bank</label>
              <input
                type="text"
                required
                value={issuingBankName}
                onChange={(e) => setIssuingBankName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3F3124] mb-1">Issuing Branch</label>
              <input
                type="text"
                value={issuingBranch}
                onChange={(e) => setIssuingBranch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#3F3124] mb-1">Cheque Date</label>
              <input
                type="date"
                required
                value={chequeDate}
                onChange={(e) => setChequeDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3F3124] mb-1">Amount (INR)</label>
              <input
                type="number"
                min={requestType === 'CHEQUE_BOOK' ? '0' : '1'}
                step="0.01"
                required={requestType !== 'CHEQUE_BOOK'}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono text-xs"
              />
            </div>
          </div>
          <input
            type="text"
            value={drawerAccountNumber}
            onChange={(e) => setDrawerAccountNumber(e.target.value)}
            placeholder="Drawer Account # (optional)"
            className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono text-xs"
          />
          <input
            type="text"
            value={attachmentRef}
            onChange={(e) => setAttachmentRef(e.target.value)}
            placeholder="CTS Scan / Slip Ref (optional)"
            className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
          />
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Counter verification notes"
            className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold hover:bg-[#3A2D21]"
          >
            Submit Cheque Entry
          </button>
        </form>

        <div className="xl:col-span-8 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#70411A]" />
              Branch Cheque Register
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="DEPOSITED">DEPOSITED</option>
                <option value="UNDER_PROCESSING">UNDER_PROCESSING</option>
                <option value="SENT_FOR_CLEARING">SENT_FOR_CLEARING</option>
                <option value="CLEARED">CLEARED</option>
                <option value="BOUNCED">BOUNCED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
              <button
                type="button"
                onClick={loadCheques}
                className="p-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#E9D9C0] text-[#3F3124]">
                <tr>
                  <th className="py-2.5 px-3">Ref / Cheque #</th>
                  <th className="py-2.5 px-3">Customer &amp; Acct</th>
                  <th className="py-2.5 px-3">Bank / Type</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D0B4]">
                {cheques.length === 0 ? (
                  <tr><td colSpan={6} className="py-6 text-center text-[#3F3124]">No cheques found for filter.</td></tr>
                ) : (
                  cheques.map((chq) => (
                    <tr key={chq.chequeRef}>
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold">{chq.chequeRef}</div>
                        <div className="font-mono text-[11px] text-[#70411A]">No. {chq.chequeNumber}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold">{chq.customerName}</div>
                        <div className="font-mono text-[11px] text-[#3F3124]">{chq.accountNumber}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div>{chq.issuingBankName}</div>
                        <div className="text-[11px] text-[#3F3124]">{chq.requestType} &bull; {formatDateTime(chq.createdAt)}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">{formatCurrency(chq.amount)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(chq.status)}`}>
                          {chq.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                        {chq.status === 'DEPOSITED' && (
                          <button
                            type="button"
                            onClick={() => updateStatus(chq.chequeRef, 'SENT_FOR_CLEARING')}
                            className="px-2 py-1 rounded-lg bg-[#261D15] text-[#F4ECE0] font-semibold"
                          >
                            Send Clearing
                          </button>
                        )}
                        {(chq.status === 'DEPOSITED' || chq.status === 'SENT_FOR_CLEARING' || chq.status === 'UNDER_PROCESSING') &&
                          canClearOrBounce && (
                            <>
                              <button
                                type="button"
                                onClick={() => updateStatus(chq.chequeRef, 'CLEARED')}
                                className="px-2 py-1 rounded-lg bg-emerald-800 text-white font-semibold"
                              >
                                Clear
                              </button>
                              <button
                                type="button"
                                onClick={() => updateStatus(chq.chequeRef, 'BOUNCED')}
                                className="px-2 py-1 rounded-lg bg-rose-800 text-white font-semibold"
                              >
                                Bounce
                              </button>
                            </>
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
    </div>
  );
};
