import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  DollarSign,
  Search,
  Filter,
  ShieldAlert,
  Calculator,
  UserCheck,
  TrendingUp,
  RefreshCw,
  CalendarCheck
} from 'lucide-react';
import {
  Loan,
  LoanStatus,
  LoanOfficerDashboardStats,
  LoanEligibilityAssessment
} from '../types';

export const LoanOfficerDashboard: React.FC = () => {
  const [stats] = useState<LoanOfficerDashboardStats>({
    totalApplications: 12,
    pendingCount: 4,
    underReviewCount: 3,
    approvedCount: 3,
    rejectedCount: 1,
    additionalInfoRequiredCount: 1,
    disbursedCount: 2,
    paidCount: 0,
    highValuePendingCount: 2,
    totalDisbursedVolume: 350000.00
  });

  const [loans, setLoans] = useState<Loan[]>([
    {
      id: 1,
      loanId: 'LN1732456012',
      customerId: 1,
      customerNumber: 'CUST1001',
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      accountNumber: 'ACC1001',
      amount: 150000.00,
      interestRate: 8.50,
      termMonths: 24,
      status: 'UNDER_REVIEW',
      purpose: 'Home Improvement & Solar Installation',
      monthlyIncome: 85000.00,
      existingMonthlyDebt: 12000.00,
      creditScore: 780,
      dtiRatio: 22.14,
      emiAmount: 6818.52,
      totalPayable: 163644.48,
      outstandingBalance: 163644.48,
      assessmentNotes: 'Excellent credit score and strong debt service coverage ratio.',
      requiresAdminApproval: false,
      reviewedBy: 'loan_officer1',
      createdAt: '2026-11-24T10:15:00Z',
      updatedAt: '2026-11-24T10:30:00Z'
    },
    {
      id: 2,
      loanId: 'LN1732456013',
      customerId: 2,
      customerNumber: 'CUST1002',
      customerName: 'Jane Smith',
      customerEmail: 'jane.smith@example.com',
      accountNumber: 'ACC1002',
      amount: 750000.00,
      interestRate: 8.50,
      termMonths: 36,
      status: 'PENDING',
      purpose: 'Commercial Equipment & Warehouse Lease',
      monthlyIncome: 180000.00,
      existingMonthlyDebt: 25000.00,
      creditScore: 740,
      dtiRatio: 27.05,
      emiAmount: 23678.10,
      totalPayable: 852411.60,
      outstandingBalance: 852411.60,
      requiresAdminApproval: true,
      createdAt: '2026-11-24T11:00:00Z',
      updatedAt: '2026-11-24T11:00:00Z'
    },
    {
      id: 3,
      loanId: 'LN1732456014',
      customerId: 3,
      customerNumber: 'CUST1003',
      customerName: 'Robert Johnson',
      customerEmail: 'robert.j@example.com',
      accountNumber: 'ACC1003',
      amount: 50000.00,
      interestRate: 8.50,
      termMonths: 12,
      status: 'APPROVED',
      purpose: 'Education Tuition Financing',
      monthlyIncome: 45000.00,
      existingMonthlyDebt: 3000.00,
      creditScore: 690,
      dtiRatio: 16.36,
      emiAmount: 4361.02,
      totalPayable: 52332.24,
      outstandingBalance: 52332.24,
      assessmentNotes: 'Approved. Applicant qualifies for standard retail education rate.',
      requiresAdminApproval: false,
      reviewedBy: 'loan_officer1',
      createdAt: '2026-11-23T14:20:00Z',
      updatedAt: '2026-11-24T09:15:00Z'
    },
    {
      id: 4,
      loanId: 'LN1732456015',
      customerId: 4,
      customerNumber: 'CUST1004',
      customerName: 'Emily Davis',
      customerEmail: 'emily.d@example.com',
      accountNumber: 'ACC1004',
      amount: 300000.00,
      interestRate: 8.50,
      termMonths: 24,
      status: 'ADDITIONAL_INFORMATION_REQUIRED',
      purpose: 'Medical Emergency & Healthcare Expenses',
      monthlyIncome: 60000.00,
      existingMonthlyDebt: 18000.00,
      creditScore: 635,
      dtiRatio: 52.73,
      emiAmount: 13637.04,
      totalPayable: 327288.96,
      outstandingBalance: 327288.96,
      assessmentNotes: 'DTI ratio is borderline at 52.7%. Requested 6-month bank statements and proof of secondary income.',
      requiresAdminApproval: false,
      reviewedBy: 'loan_officer1',
      createdAt: '2026-11-22T16:45:00Z',
      updatedAt: '2026-11-23T11:20:00Z'
    }
  ]);

  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [isCalcModalOpen, setIsCalcModalOpen] = useState<boolean>(false);

  // Review Form State
  const [reviewStatus, setReviewStatus] = useState<LoanStatus>('UNDER_REVIEW');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [reviewRate, setReviewRate] = useState<number>(8.50);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Eligibility Calculator State
  const [calcIncome, setCalcIncome] = useState<number>(75000);
  const [calcDebt, setCalcDebt] = useState<number>(10000);
  const [calcAmount, setCalcAmount] = useState<number>(200000);
  const [calcTerm, setCalcTerm] = useState<number>(24);
  const [calcScore, setCalcScore] = useState<number>(720);
  const [calcResult, setCalcResult] = useState<LoanEligibilityAssessment | null>(null);

  // Filter loans
  const filteredLoans = loans.filter((loan) => {
    const matchesStatus = selectedStatus === 'ALL' || loan.status === selectedStatus;
    const matchesSearch =
      loan.loanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.customerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.accountNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleOpenReview = (loan: Loan) => {
    setSelectedLoan(loan);
    setReviewStatus(loan.status === 'PENDING' ? 'UNDER_REVIEW' : loan.status);
    setReviewNotes(loan.assessmentNotes || '');
    setReviewRate(loan.interestRate || 8.50);
    setRejectionReason(loan.rejectionReason || '');
    setIsReviewModalOpen(true);
  };

  const handleOpenSchedule = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsScheduleModalOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedLoan) return;

    if (reviewStatus === 'APPROVED' && selectedLoan.requiresAdminApproval) {
      alert('Approval Authority Restriction: This loan exceeds ₹500,000.00 and requires ADMIN approval authority. You can recommend approval via UNDER_REVIEW notes.');
      return;
    }

    setLoans((prev) =>
      prev.map((l) =>
        l.id === selectedLoan.id
          ? {
              ...l,
              status: reviewStatus,
              assessmentNotes: reviewNotes,
              interestRate: reviewRate,
              rejectionReason: reviewStatus === 'REJECTED' ? rejectionReason : undefined,
              reviewedBy: 'loan_officer1',
              updatedAt: new Date().toISOString()
            }
          : l
      )
    );

    setIsReviewModalOpen(false);
  };

  const handleDisburse = (loan: Loan) => {
    if (loan.status !== 'APPROVED') {
      alert('Only APPROVED applications can be disbursed.');
      return;
    }

    setLoans((prev) =>
      prev.map((l) =>
        l.id === loan.id
          ? {
              ...l,
              status: 'DISBURSED',
              disbursedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          : l
      )
    );
    alert(`Loan ${loan.loanId} disbursed successfully! ₹${loan.amount.toLocaleString()} credited to account ${loan.accountNumber}.`);
  };

  const runEligibilityCalculator = () => {
    const r = (8.50 / 1200);
    const pow = Math.pow(1 + r, calcTerm);
    const emi = (calcAmount * r * pow) / (pow - 1);
    const totalDebt = calcDebt + emi;
    const dti = (totalDebt / calcIncome) * 100;
    const maxAllowableEmi = Math.max(0, calcIncome * 0.5 - calcDebt);

    let grade: 'PRIME' | 'NEAR_PRIME' | 'SUBPRIME' = 'SUBPRIME';
    if (calcScore >= 750 && dti <= 40) grade = 'PRIME';
    else if (calcScore >= 650 && dti <= 50) grade = 'NEAR_PRIME';

    const eligible = calcScore >= 620 && dti <= 50 && emi <= maxAllowableEmi;

    setCalcResult({
      eligible,
      creditScore: calcScore,
      monthlyIncome: calcIncome,
      existingMonthlyDebt: calcDebt,
      proposedEmi: Math.round(emi * 100) / 100,
      maxAllowableEmi: Math.round(maxAllowableEmi * 100) / 100,
      dtiRatio: Math.round(dti * 100) / 100,
      riskGrade: grade,
      recommendation: eligible
        ? `Applicant qualifies under ${grade} tier. Debt service capacity verified.`
        : `Applicant does not satisfy underwriting threshold. DTI (${Math.round(dti)}%) exceeds limit or score too low.`
    });
  };

  const getStatusBadge = (status: LoanStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
      case 'UNDER_REVIEW':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20"><RefreshCw className="w-3 h-3 mr-1" /> Under Review</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
      case 'ADDITIONAL_INFORMATION_REQUIRED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20"><HelpCircle className="w-3 h-3 mr-1" /> More Info Needed</span>;
      case 'DISBURSED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20"><DollarSign className="w-3 h-3 mr-1" /> Disbursed</span>;
      case 'PAID':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-300 border border-slate-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Paid in Full</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Loan Officer Underwriting Workbench</h1>
              <p className="text-sm text-slate-400">Assess creditworthiness, manage approval workflows, enforce risk controls, and disburse credit.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => { setIsCalcModalOpen(true); runEligibilityCalculator(); }}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors shadow-sm"
          >
            <Calculator className="w-4 h-4 mr-2 text-indigo-400" />
            Eligibility Calculator
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 shadow-sm">
          <div className="text-xs font-medium text-slate-400">Total Applications</div>
          <div className="text-2xl font-bold text-white mt-1">{stats.totalApplications}</div>
          <div className="text-xs text-indigo-400 mt-1 flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> Active Queue</div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 shadow-sm">
          <div className="text-xs font-medium text-amber-400">Pending Review</div>
          <div className="text-2xl font-bold text-amber-300 mt-1">{stats.pendingCount}</div>
          <div className="text-xs text-amber-400/80 mt-1">Awaiting triage</div>
        </div>

        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 shadow-sm">
          <div className="text-xs font-medium text-blue-400">Under Review</div>
          <div className="text-2xl font-bold text-blue-300 mt-1">{stats.underReviewCount}</div>
          <div className="text-xs text-blue-400/80 mt-1">Assessment ongoing</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 shadow-sm">
          <div className="text-xs font-medium text-emerald-400">Approved</div>
          <div className="text-2xl font-bold text-emerald-300 mt-1">{stats.approvedCount}</div>
          <div className="text-xs text-emerald-400/80 mt-1">Ready for disbursement</div>
        </div>

        <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 shadow-sm">
          <div className="text-xs font-medium text-purple-400">Needs Info</div>
          <div className="text-2xl font-bold text-purple-300 mt-1">{stats.additionalInfoRequiredCount}</div>
          <div className="text-xs text-purple-400/80 mt-1">Applicant action required</div>
        </div>

        <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 shadow-sm">
          <div className="text-xs font-medium text-rose-400">High-Value Flags</div>
          <div className="text-2xl font-bold text-rose-300 mt-1">{stats.highValuePendingCount}</div>
          <div className="text-xs text-rose-400/80 mt-1">&gt; ₹500K Admin req.</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by loan ID, customer name, account..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-500 ml-1 mr-2 hidden sm:block" />
          {['ALL', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ADDITIONAL_INFORMATION_REQUIRED', 'DISBURSED'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedStatus === st
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {st === 'ALL' ? 'All Applications' : st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Loan ID & Date</th>
                <th className="py-3 px-4">Applicant & Account</th>
                <th className="py-3 px-4">Requested Amount</th>
                <th className="py-3 px-4">Tenure & EMI</th>
                <th className="py-3 px-4">Credit & DTI</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-mono font-medium text-indigo-400">{loan.loanId}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {new Date(loan.createdAt).toLocaleDateString()}
                    </div>
                    {loan.requiresAdminApproval && (
                      <span className="inline-flex items-center text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded mt-1 border border-rose-500/20">
                        <ShieldAlert className="w-2.5 h-2.5 mr-1" /> High-Value
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-4">
                    <div className="font-medium text-white">{loan.customerName}</div>
                    <div className="text-xs text-slate-400 font-mono">{loan.accountNumber}</div>
                    <div className="text-xs text-slate-500">{loan.purpose}</div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="font-bold text-white text-base">₹{loan.amount.toLocaleString()}</div>
                    <div className="text-xs text-slate-400">@ {loan.interestRate}% p.a.</div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="text-white font-medium">{loan.termMonths} Months</div>
                    <div className="text-xs text-emerald-400 font-mono">EMI: ₹{loan.emiAmount?.toLocaleString()}</div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-block px-1.5 py-0.5 text-xs font-bold rounded ${
                        loan.creditScore >= 750 ? 'bg-emerald-500/20 text-emerald-400' :
                        loan.creditScore >= 650 ? 'bg-blue-500/20 text-blue-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        Score: {loan.creditScore}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      DTI: <span className={loan.dtiRatio <= 40 ? 'text-emerald-400' : loan.dtiRatio <= 50 ? 'text-amber-400' : 'text-rose-400 font-semibold'}>{loan.dtiRatio}%</span>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    {getStatusBadge(loan.status)}
                  </td>

                  <td className="py-4 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenReview(loan)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition-colors"
                    >
                      Review
                    </button>

                    <button
                      onClick={() => handleOpenSchedule(loan)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                    >
                      Schedule
                    </button>

                    {loan.status === 'APPROVED' && (
                      <button
                        onClick={() => handleDisburse(loan)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        Disburse
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredLoans.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No loan applications match your current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Underwriting Review Modal */}
      {isReviewModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center">
                  <UserCheck className="w-5 h-5 mr-2 text-indigo-400" />
                  Loan Underwriting Assessment
                </h2>
                <div className="text-xs text-slate-400 font-mono mt-0.5">Application: {selectedLoan.loanId} &bull; Customer: {selectedLoan.customerName}</div>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                &times;
              </button>
            </div>

            {/* High Value Warning */}
            {selectedLoan.requiresAdminApproval && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3 text-amber-300 text-xs">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-400" />
                <div>
                  <div className="font-semibold">High-Value Policy Enforcement (&gt; ₹500,000.00)</div>
                  <div>Final approval on this loan requires ADMIN role authority. As Loan Officer, you may assess the application and mark it UNDER_REVIEW with your underwriting notes and recommendation.</div>
                </div>
              </div>
            )}

            {/* Financial Profile Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">Monthly Income</span>
                <span className="text-white font-bold text-sm">₹{selectedLoan.monthlyIncome.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Existing Debt</span>
                <span className="text-white font-bold text-sm">₹{selectedLoan.existingMonthlyDebt.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Credit Score</span>
                <span className={`font-bold text-sm ${selectedLoan.creditScore >= 750 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {selectedLoan.creditScore} ({selectedLoan.creditScore >= 750 ? 'Prime' : 'Near-Prime'})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Projected DTI</span>
                <span className={`font-bold text-sm ${selectedLoan.dtiRatio <= 40 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {selectedLoan.dtiRatio}%
                </span>
              </div>
            </div>

            {/* Workflow Review Form */}
            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Underwriting Decision / Review Status</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as LoanStatus)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="UNDER_REVIEW">UNDER REVIEW (In Progress)</option>
                  <option value="APPROVED">APPROVED (Authorize Loan)</option>
                  <option value="REJECTED">REJECTED (Decline Application)</option>
                  <option value="ADDITIONAL_INFORMATION_REQUIRED">ADDITIONAL INFORMATION REQUIRED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Approved Annual Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.05"
                  value={reviewRate}
                  onChange={(e) => setReviewRate(parseFloat(e.target.value) || 8.50)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Underwriting Assessment Notes & Remarks</label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Record assessment notes regarding applicant repayment capacity, collateral, or conditions..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              {reviewStatus === 'REJECTED' && (
                <div>
                  <label className="block text-xs font-semibold text-rose-300 mb-1">Rejection Reason</label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="E.g. DTI exceeds regulatory limits, unsatisfactory credit score..."
                    className="w-full bg-slate-800 border border-rose-500/50 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 text-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                Save Decision & Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Amortization Schedule Modal */}
      {isScheduleModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center">
                <CalendarCheck className="w-5 h-5 mr-2 text-indigo-400" />
                Amortization & Repayment Details
              </h2>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Loan ID</span>
                <span className="font-mono text-white">{selectedLoan.loanId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Sanctioned Principal</span>
                <span className="font-bold text-white">₹{selectedLoan.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Monthly EMI</span>
                <span className="font-bold text-emerald-400 font-mono">₹{selectedLoan.emiAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Payable (Principal + Interest)</span>
                <span className="font-bold text-white font-mono">₹{selectedLoan.totalPayable.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Outstanding Balance</span>
                <span className="font-bold text-indigo-400 font-mono">₹{selectedLoan.outstandingBalance.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Qualification / Eligibility Calculator Modal */}
      {isCalcModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-indigo-400" />
                Pre-Underwriting Eligibility Simulator
              </h2>
              <button onClick={() => setIsCalcModalOpen(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Monthly Gross Income (₹)</label>
                  <input
                    type="number"
                    value={calcIncome}
                    onChange={(e) => setCalcIncome(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Existing Monthly Debt (₹)</label>
                  <input
                    type="number"
                    value={calcDebt}
                    onChange={(e) => setCalcDebt(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Loan Amount (₹)</label>
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Tenure (Months)</label>
                  <input
                    type="number"
                    value={calcTerm}
                    onChange={(e) => setCalcTerm(parseInt(e.target.value) || 12)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Credit Score</label>
                  <input
                    type="number"
                    value={calcScore}
                    onChange={(e) => setCalcScore(parseInt(e.target.value) || 700)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <button
                onClick={runEligibilityCalculator}
                className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs transition-colors"
              >
                Compute Underwriting Metrics
              </button>
            </div>

            {calcResult && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Underwriting Verdict</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    calcResult.eligible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {calcResult.eligible ? 'QUALIFIED' : 'UNQUALIFIED'} &bull; {calcResult.riskGrade}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 font-mono text-center">
                  <div className="p-2 bg-slate-900 rounded">
                    <span className="text-slate-500 block text-[10px]">Projected EMI</span>
                    <span className="text-white font-bold">₹{calcResult.proposedEmi.toLocaleString()}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded">
                    <span className="text-slate-500 block text-[10px]">Projected DTI</span>
                    <span className={`font-bold ${calcResult.dtiRatio <= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {calcResult.dtiRatio}%
                    </span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded">
                    <span className="text-slate-500 block text-[10px]">Max EMI Cap</span>
                    <span className="text-indigo-400 font-bold">₹{calcResult.maxAllowableEmi.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded border border-slate-800">
                  {calcResult.recommendation}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanOfficerDashboard;
