import React, { useEffect, useState } from 'react';
import { Eye, PlusCircle, RefreshCw, Search, UserPlus } from 'lucide-react';
import { loanOfficerApi } from '../../services/api';
import { LoanApplicationSummary } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { extractErrorMessage, formatCurrency, formatDateTime, getLoanBadgeClass } from './loanFormatters';
import { LoanTabId } from './LoanDashboardTab';

const LOAN_CATEGORIES = ['PERSONAL', 'HOME', 'EDUCATION', 'VEHICLE', 'BUSINESS', 'GOLD'];
const APPLICATION_STATUSES = [
  'ALL', 'PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'DOCUMENT_VERIFICATION',
  'CREDIT_ASSESSMENT', 'ADDITIONAL_INFORMATION_REQUIRED', 'APPROVAL_PENDING',
  'APPROVED', 'REJECTED', 'DISBURSEMENT_PENDING', 'DISBURSED', 'PAID', 'CANCELLED',
];

interface Props {
  onOpenLoanTab: (tab: LoanTabId, loanId: string) => void;
}

export const LoanApplicationsTab: React.FC<Props> = ({ onOpenLoanTab }) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<LoanApplicationSummary[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [assignedOnly, setAssignedOnly] = useState(false);

  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const [customerNumber, setCustomerNumber] = useState('CUST1001');
  const [accountNumber, setAccountNumber] = useState('ACC1001');
  const [loanCategory, setLoanCategory] = useState('PERSONAL');
  const [requestedAmount, setRequestedAmount] = useState('250000');
  const [tenureMonths, setTenureMonths] = useState('24');
  const [interestRate, setInterestRate] = useState('9.50');
  const [employmentType, setEmploymentType] = useState('SALARIED');
  const [monthlyIncome, setMonthlyIncome] = useState('85000');
  const [existingLiabilities, setExistingLiabilities] = useState('10000');
  const [creditScore, setCreditScore] = useState('750');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [collateralType, setCollateralType] = useState('');
  const [collateralValue, setCollateralValue] = useState('');
  const [remarks, setRemarks] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await loanOfficerApi.searchApplications({
        q: q.trim() || undefined,
        status: statusFilter,
        category: categoryFilter,
        assignedOnly,
        page: targetPage,
        size: 12,
      });
      setApplications(res.content || []);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load loan applications.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter, assignedOnly]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const created = await loanOfficerApi.createApplication({
        customerNumber: customerNumber.trim().toUpperCase(),
        accountNumber: accountNumber.trim().toUpperCase(),
        loanCategory,
        requestedAmount: Number(requestedAmount),
        tenureMonths: Number(tenureMonths),
        interestRate: interestRate ? Number(interestRate) : undefined,
        employmentType,
        monthlyIncome: Number(monthlyIncome),
        existingLiabilities: Number(existingLiabilities || 0),
        creditScore: Number(creditScore || 700),
        loanPurpose: loanPurpose.trim(),
        collateralType: collateralType.trim() || undefined,
        collateralValue: collateralValue ? Number(collateralValue) : undefined,
        remarks: remarks.trim() || undefined,
      });
      setMessage(`Loan application ${created.loanId} (${created.loanCategory}) created & assigned to ${created.assignedOfficer}.`);
      setShowCreate(false);
      setLoanPurpose('');
      setRemarks('');
      await load(0);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not register loan application.'));
    }
  };

  const assignToSelf = async (loanId: string) => {
    if (!user?.username) return;
    setError('');
    setMessage('');
    try {
      const updated = await loanOfficerApi.assignApplication(loanId, user.username);
      setMessage(`Assigned ${updated.loanId} to ${updated.assignedOfficer}.`);
      await load(page);
    } catch (err) {
      setError(extractErrorMessage(err, 'Application assignment rejected.'));
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalElements / 12));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1B130D]">Loan Application Management</h2>
          <p className="text-sm text-[#3F3124]">
            Register customer loan applications (Personal, Home, Education, Vehicle, Business, Gold), filter queues, assign officers, and advance processing stages.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((s) => !s)}
          className="px-4 py-2.5 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4 text-[#D9A86C]" /> {showCreate ? 'Close Form' : 'Create Loan Application'}
        </button>
      </div>

      {error && <div className="p-3.5 rounded-xl bg-rose-900/10 border border-rose-700/30 text-sm text-rose-900">{error}</div>}
      {message && <div className="p-3.5 rounded-xl bg-emerald-900/10 border border-emerald-700/30 text-sm text-emerald-900">{message}</div>}

      {showCreate && (
        <form onSubmit={handleCreate} className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#CEB896] space-y-4">
          <h3 className="text-base font-bold text-[#1B130D]">Register Assisted Customer Loan Application</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Customer ID</label>
              <input required value={customerNumber} onChange={(e) => setCustomerNumber(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Repayment Account</label>
              <input required value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Loan Category</label>
              <select value={loanCategory} onChange={(e) => setLoanCategory(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
                {LOAN_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Employment Type</label>
              <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
                <option value="SALARIED">SALARIED</option>
                <option value="SELF_EMPLOYED">SELF_EMPLOYED</option>
                <option value="BUSINESS_OWNER">BUSINESS_OWNER</option>
                <option value="STUDENT_COAPPLICANT">STUDENT_COAPPLICANT</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Requested Amount (INR)</label>
              <input type="number" min="1000" required value={requestedAmount} onChange={(e) => setRequestedAmount(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Tenure (Months)</label>
              <input type="number" min="3" max="360" required value={tenureMonths} onChange={(e) => setTenureMonths(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Interest Rate (% p.a.)</label>
              <input type="number" step="0.05" min="1" max="40" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Monthly Income (INR)</label>
              <input type="number" min="1000" required value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Existing Liabilities / mo</label>
              <input type="number" min="0" value={existingLiabilities} onChange={(e) => setExistingLiabilities(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Credit Score (Simulated/Supplied)</label>
              <input type="number" min="300" max="900" value={creditScore} onChange={(e) => setCreditScore(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Collateral Type (Optional)</label>
              <input value={collateralType} onChange={(e) => setCollateralType(e.target.value)} placeholder="PROPERTY / GOLD / VEHICLE" className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Collateral Value (INR)</label>
              <input type="number" min="0" value={collateralValue} onChange={(e) => setCollateralValue(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <input required value={loanPurpose} onChange={(e) => setLoanPurpose(e.target.value)} placeholder="Loan Purpose (e.g. Home purchase, Tuition, Working Capital)" className="px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]" />
            <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Officer onboarding remarks" className="px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]" />
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold">
            Submit Loan Application
          </button>
        </form>
      )}

      {/* Search & Filters */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
          load(0);
        }}
        className="p-4 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] flex flex-wrap gap-3 items-center text-xs"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Loan ID, Customer Name/ID, Purpose..."
          className="flex-1 min-w-[200px] px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]"
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
          <option value="ALL">All Categories</option>
          {LOAN_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
          {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="flex items-center gap-1.5 font-semibold">
          <input type="checkbox" checked={assignedOnly} onChange={(e) => setAssignedOnly(e.target.checked)} />
          Assigned to Me
        </label>
        <button type="submit" disabled={loading} className="px-4 py-2 rounded-xl bg-[#261D15] text-[#F4ECE0] font-semibold flex items-center gap-1.5">
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />} Filter
        </button>
      </form>

      {/* Applications Table */}
      <div className="rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#E9D9C0] text-[#3F3124] uppercase border-b border-[#D9C7AB]">
              <tr>
                <th className="py-3 px-4">Application ID</th>
                <th className="py-3 px-4">Customer &amp; Acct</th>
                <th className="py-3 px-4">Category &amp; Purpose</th>
                <th className="py-3 px-4 text-right">Amount / Tenure</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2D0B4]">
              {applications.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-[#3F3124]">No applications match filter criteria.</td></tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.loanId} className="hover:bg-[#E9D9C0]/50">
                    <td className="py-2.5 px-4">
                      <div className="font-mono font-bold text-[#70411A]">{app.loanId}</div>
                      <div className="text-[11px] text-[#3F3124]">{formatDateTime(app.createdAt)}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-[#1B130D]">{app.customerName}</div>
                      <div className="font-mono text-[11px] text-[#3F3124]">{app.customerNumber} &bull; {app.accountNumber}</div>
                    </td>
                    <td className="py-2.5 px-4 max-w-xs">
                      <div className="font-semibold">{app.loanCategory}</div>
                      <div className="text-[11px] text-[#3F3124] truncate">{app.purpose}</div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      <div className="font-bold">{formatCurrency(app.amount)}</div>
                      <div className="text-[11px] text-[#3F3124]">{app.termMonths}m @ {app.interestRate}%</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getLoanBadgeClass(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono">{app.assignedOfficer || 'Unassigned'}</td>
                    <td className="py-2.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {!app.assignedOfficer && (
                        <button type="button" onClick={() => assignToSelf(app.loanId)} className="px-2 py-1 rounded-lg bg-[#70411A] text-white font-semibold inline-flex items-center gap-1">
                          <UserPlus className="w-3 h-3" /> Claim
                        </button>
                      )}
                      <button type="button" onClick={() => onOpenLoanTab('processing', app.loanId)} className="px-2.5 py-1 rounded-lg bg-[#261D15] text-[#F4ECE0] font-semibold inline-flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Open
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-[#E9D9C0]/60 border-t border-[#D9C7AB] flex justify-between items-center text-xs">
          <span>{totalElements} applications (Page {page + 1} of {totalPages})</span>
          <div className="flex gap-2">
            <button disabled={page <= 0} onClick={() => { const n = page - 1; setPage(n); load(n); }} className="px-3 py-1 rounded-lg bg-[#EFE2CE] border border-[#D9C7AB] disabled:opacity-40">Prev</button>
            <button disabled={page + 1 >= totalPages} onClick={() => { const n = page + 1; setPage(n); load(n); }} className="px-3 py-1 rounded-lg bg-[#EFE2CE] border border-[#D9C7AB] disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};
