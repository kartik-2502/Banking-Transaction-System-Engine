import React, { useEffect, useState } from 'react';
import { Eye, RefreshCw, Search, ShieldCheck, X } from 'lucide-react';
import { loanOfficerApi } from '../../services/api';
import { LoanOfficerCustomer } from '../../types';
import { extractErrorMessage, formatCurrency, formatDateTime, getLoanBadgeClass } from './loanFormatters';

export const LoanCustomersTab: React.FC = () => {
  const [query, setQuery] = useState('');
  const [kycFilter, setKycFilter] = useState('ALL');
  const [customers, setCustomers] = useState<LoanOfficerCustomer[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<LoanOfficerCustomer | null>(null);
  const [error, setError] = useState('');

  const load = async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await loanOfficerApi.searchCustomers(query.trim() || undefined, kycFilter, targetPage, 12);
      setCustomers(res.content || []);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to search branch loan customers.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kycFilter]);

  const openDetails = async (customerNumber: string) => {
    try {
      const full = await loanOfficerApi.getCustomerProfile(customerNumber);
      setSelected(full);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load customer credit & liability profile.'));
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalElements / 12));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[#1B130D]">Loan Customer Management</h2>
        <p className="text-sm text-[#3F3124]">
          Inspect branch customers&rsquo; KYC status, employment, monthly income, liabilities, existing loans, and credit assessment history. Balance edits and credential changes remain strictly blocked.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-900/10 border border-rose-700/30 text-sm text-rose-900">{error}</div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
          load(0);
        }}
        className="p-4 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] flex flex-wrap gap-3 items-center"
      >
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#3F3124] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Name, Customer ID, Account Number, or Registered Mobile..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
          />
        </div>
        <select
          value={kycFilter}
          onChange={(e) => {
            setKycFilter(e.target.value);
            setPage(0);
          }}
          className="px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
        >
          <option value="ALL">All KYC Statuses</option>
          <option value="VERIFIED">VERIFIED</option>
          <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
          <option value="REJECTED">REJECTED</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold flex items-center gap-1.5"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />} Search
        </button>
      </form>

      <div className="rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#E9D9C0] text-[#3F3124] uppercase border-b border-[#D9C7AB]">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact (Masked)</th>
                <th className="py-3 px-4">KYC Status</th>
                <th className="py-3 px-4">Income / Liabilities</th>
                <th className="py-3 px-4">Active Exposure</th>
                <th className="py-3 px-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2D0B4]">
              {customers.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-[#3F3124]">No authorized branch customers matched.</td></tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.customerNumber} className="hover:bg-[#E9D9C0]/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-sm text-[#1B130D]">{c.fullName}</div>
                      <div className="font-mono text-[11px] text-[#70411A]">{c.customerNumber} &bull; {c.branchCode}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono">{c.maskedPhone}</div>
                      <div className="text-[11px] text-[#3F3124]">{c.maskedEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getLoanBadgeClass(c.kycStatus)}`}>
                        {c.kycStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {c.latestMonthlyIncome ? `${formatCurrency(c.latestMonthlyIncome)}/mo` : '—'}
                      {c.existingLiabilities != null && <div className="text-[11px] text-[#3F3124]">Debt: {formatCurrency(c.existingLiabilities)}</div>}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      {formatCurrency(c.totalLoanExposure)} ({c.activeLoanCount} active)
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openDetails(c.customerNumber)}
                        className="px-3 py-1.5 rounded-lg bg-[#261D15] text-[#F4ECE0] font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-[#E9D9C0]/60 border-t border-[#D9C7AB] flex justify-between items-center text-xs">
          <span>{totalElements} customers (Page {page + 1} of {totalPages})</span>
          <div className="flex gap-2">
            <button disabled={page <= 0} onClick={() => { const n = page - 1; setPage(n); load(n); }} className="px-3 py-1 rounded-lg bg-[#EFE2CE] border border-[#D9C7AB] disabled:opacity-40">Prev</button>
            <button disabled={page + 1 >= totalPages} onClick={() => { const n = page + 1; setPage(n); load(n); }} className="px-3 py-1 rounded-lg bg-[#EFE2CE] border border-[#D9C7AB] disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F3E7D4] border border-[#CEB896] rounded-2xl max-w-4xl w-full max-h-[88vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#D9C7AB] pb-3">
              <div>
                <h3 className="text-xl font-bold text-[#1B130D] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#70411A]" />
                  {selected.fullName} ({selected.customerNumber})
                </h3>
                <p className="text-xs text-[#3F3124] mt-1 font-mono">
                  KYC: {selected.kycStatus} &bull; {selected.maskedPhone} &bull; {selected.maskedEmail} &bull; Accounts: {(selected.linkedAccounts || []).join(', ')}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-[#E9D9C0]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB]">
                <div className="text-[#3F3124]">Employment</div>
                <div className="font-bold mt-0.5">{selected.employmentType || 'N/A'}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB]">
                <div className="text-[#3F3124]">Monthly Income</div>
                <div className="font-mono font-bold mt-0.5">{formatCurrency(selected.latestMonthlyIncome)}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB]">
                <div className="text-[#3F3124]">Existing Liabilities</div>
                <div className="font-mono font-bold mt-0.5">{formatCurrency(selected.existingLiabilities)}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB]">
                <div className="text-[#3F3124]">Latest Credit Score</div>
                <div className="font-mono font-bold mt-0.5">{selected.latestCreditScore || 'N/A'}</div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#1B130D] mb-2">Previous &amp; Existing Loan Applications</h4>
              <div className="overflow-x-auto rounded-xl border border-[#D9C7AB] bg-[#EFE2CE]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#E9D9C0] text-[#3F3124]">
                    <tr>
                      <th className="py-2 px-3">Loan ID</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                      <th className="py-2 px-3 text-right">Outstanding</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2D0B4]">
                    {(selected.loanApplications || []).map((l) => (
                      <tr key={l.loanId}>
                        <td className="py-2 px-3 font-mono font-bold">{l.loanId}</td>
                        <td className="py-2 px-3">{l.loanCategory}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(l.amount)}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(l.outstandingBalance)}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getLoanBadgeClass(l.status)}`}>
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#1B130D] mb-2">Authorized Credit Assessments</h4>
              <div className="space-y-2">
                {(selected.creditAssessments || []).length === 0 ? (
                  <p className="text-xs text-[#3F3124]">No saved credit assessments yet.</p>
                ) : (
                  (selected.creditAssessments || []).map((ca) => (
                    <div key={ca.assessmentId} className="p-3 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB] text-xs flex justify-between">
                      <div>
                        <span className="font-mono font-bold">{ca.assessmentId}</span> ({ca.loanId}) &bull; Score: {ca.creditScore} &bull; DTI: {ca.dtiRatio}%
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getLoanBadgeClass(ca.riskCategory)}`}>
                        {ca.riskCategory} &bull; {ca.recommendation} &bull; {formatDateTime(ca.assessedAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
