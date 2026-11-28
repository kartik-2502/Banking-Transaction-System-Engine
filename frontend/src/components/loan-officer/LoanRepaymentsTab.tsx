import React, { useEffect, useState } from 'react';
import { CalendarCheck, Search } from 'lucide-react';
import { loanOfficerApi } from '../../services/api';
import { extractErrorMessage, formatCurrency, formatDateTime, getLoanBadgeClass } from './loanFormatters';

export const LoanRepaymentsTab: React.FC<{ initialLoanId?: string }> = ({ initialLoanId }) => {
  const [loanIdInput, setLoanIdInput] = useState(initialLoanId || 'LN_SEED_BR1_02');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadSchedule = async (id = loanIdInput) => {
    const clean = id.trim();
    if (!clean) return;
    setLoading(true);
    setError('');
    try {
      const res = await loanOfficerApi.getRepayments(clean);
      setData(res);
    } catch (err) {
      setData(null);
      setError(extractErrorMessage(err, 'Unable to load EMI schedule for loan.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule(initialLoanId || loanIdInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoanId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1B130D]">EMI &amp; Repayment Tracking</h2>
        <p className="text-sm text-[#3F3124]">
          Inspect installment amortization schedules, principal/interest components, remaining tenure, and payment statuses. Loan Officers monitor schedules without altering due records or waiving fees.
        </p>
      </div>

      {error && <div className="p-3.5 rounded-xl bg-rose-900/10 border border-rose-700/30 text-sm text-rose-900">{error}</div>}

      <div className="p-4 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] flex flex-wrap gap-3 items-center">
        <input
          value={loanIdInput}
          onChange={(e) => setLoanIdInput(e.target.value)}
          placeholder="Loan ID (e.g. LN_SEED_BR1_02)"
          className="flex-1 min-w-[220px] px-3.5 py-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono text-sm"
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => loadSchedule(loanIdInput)}
          className="px-5 py-2.5 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold flex items-center gap-1.5"
        >
          <Search className="w-4 h-4" /> Load Schedule
        </button>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB]">
              <div className="text-[#3F3124]">Total Paid</div>
              <div className="text-xl font-bold font-mono text-emerald-900 mt-1">{formatCurrency(data.totalPaid)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB]">
              <div className="text-[#3F3124]">Outstanding Principal</div>
              <div className="text-xl font-bold font-mono text-[#1B130D] mt-1">{formatCurrency(data.outstandingPrincipal)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB]">
              <div className="text-[#3F3124]">Outstanding Interest</div>
              <div className="text-xl font-bold font-mono text-[#70411A] mt-1">{formatCurrency(data.outstandingInterest)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB]">
              <div className="text-[#3F3124]">Remaining Installments</div>
              <div className="text-xl font-bold font-mono text-[#8E4322] mt-1">{data.remainingInstallments} EMIs</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
            <h3 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-[#70411A]" /> Installment Schedule — {data.loan.loanId} ({data.loan.customerName})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#E9D9C0] text-[#3F3124]">
                  <tr>
                    <th className="py-2.5 px-3">Inst #</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-right">Principal</th>
                    <th className="py-2.5 px-3 text-right">Interest</th>
                    <th className="py-2.5 px-3 text-right">Total EMI</th>
                    <th className="py-2.5 px-3 text-right">Paid</th>
                    <th className="py-2.5 px-3">Paid Date</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2D0B4]">
                  {(data.installments || []).map((inst: any) => (
                    <tr key={inst.id}>
                      <td className="py-2 px-3 font-mono font-bold">#{inst.installmentNumber}</td>
                      <td className="py-2 px-3">{inst.dueDate}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatCurrency(inst.principalAmount)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatCurrency(inst.interestAmount)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{formatCurrency(inst.totalInstallment)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatCurrency(inst.paidAmount)}</td>
                      <td className="py-2 px-3">{formatDateTime(inst.paidDate)}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getLoanBadgeClass(inst.status)}`}>
                          {inst.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
