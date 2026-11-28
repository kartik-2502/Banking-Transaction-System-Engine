import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileCheck2,
  FileText,
  IndianRupee,
  PlusCircle,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { loanOfficerApi } from '../../services/api';
import { LoanOfficerDashboardData } from '../../types';
import { extractErrorMessage, formatCurrency, formatDateTime, getLoanBadgeClass } from './loanFormatters';

export type LoanTabId =
  | 'dashboard'
  | 'customers'
  | 'applications'
  | 'documents'
  | 'credit-assessment'
  | 'processing'
  | 'approvals'
  | 'disbursement'
  | 'repayments'
  | 'overdue'
  | 'portfolio'
  | 'communications'
  | 'reports'
  | 'profile';

interface Props {
  onNavigateTab: (tab: LoanTabId, loanId?: string) => void;
}

export const LoanDashboardTab: React.FC<Props> = ({ onNavigateTab }) => {
  const [data, setData] = useState<LoanOfficerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await loanOfficerApi.getDashboard();
      setData(res);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load Loan Officer operational dashboard.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading && !data) {
    return (
      <div className="p-8 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] text-[#3F3124] flex items-center gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-[#70411A]" />
        <span>Loading real-time credit underwriting &amp; portfolio telemetry...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-900/10 border border-rose-700/30 text-rose-900 flex items-center justify-between gap-4">
        <span>{error}</span>
        <button onClick={load} className="px-4 py-2 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const summaryCards = [
    { label: 'Total Loan Applications', value: data.totalApplications, icon: ClipboardList, accent: 'text-[#1B130D] bg-[#D9A86C]/25 border-[#D9A86C]/40' },
    { label: 'New Applications', value: data.newApplications, icon: PlusCircle, accent: 'text-[#70411A] bg-[#70411A]/10 border-[#70411A]/20' },
    { label: 'Applications Under Review', value: data.underReviewCount, icon: Clock, accent: 'text-amber-900 bg-amber-900/10 border-amber-700/20' },
    { label: 'Pending Doc Verification', value: data.pendingDocumentVerification, icon: FileText, accent: 'text-[#8E4322] bg-[#8E4322]/10 border-[#8E4322]/20' },
    { label: 'Pending Credit Assessment', value: data.pendingCreditAssessment, icon: Calculator, accent: 'text-amber-900 bg-amber-900/10 border-amber-700/20' },
    { label: 'Approved Loans', value: data.approvedLoans, icon: CheckCircle2, accent: 'text-emerald-900 bg-emerald-900/10 border-emerald-700/20' },
    { label: 'Rejected Applications', value: data.rejectedApplications, icon: XCircle, accent: 'text-rose-900 bg-rose-900/10 border-rose-700/20' },
    { label: 'Awaiting Disbursement', value: data.awaitingDisbursement, icon: IndianRupee, accent: 'text-[#70411A] bg-[#70411A]/10 border-[#70411A]/20' },
    { label: 'Overdue Loans', value: data.overdueLoans, icon: AlertTriangle, accent: 'text-rose-900 bg-rose-900/10 border-rose-700/20' },
  ];

  const quickActions: { tab: LoanTabId; label: string; desc: string; icon: React.ElementType }[] = [
    { tab: 'applications', label: 'Create Loan Application', desc: 'Register assisted customer loan', icon: PlusCircle },
    { tab: 'processing', label: 'Review Applications', desc: 'Inspect completeness & timelines', icon: ClipboardList },
    { tab: 'documents', label: 'Verify Documents', desc: 'Inspect, verify or reject KYC docs', icon: FileCheck2 },
    { tab: 'credit-assessment', label: 'Perform Credit Assessment', desc: 'DTI, EMI, LTV & eligibility', icon: Calculator },
    { tab: 'repayments', label: 'Track EMIs & Schedules', desc: 'Installments & repayments', icon: IndianRupee },
    { tab: 'overdue', label: 'View Overdue Loans', desc: 'DPD aging & recovery follow-ups', icon: ShieldAlert },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1B130D] tracking-tight">Loan Officer Operations Dashboard</h2>
          <p className="text-sm text-[#3F3124]">
            {data.officerProfile?.branchName} ({data.officerProfile?.branchCode}) &bull; Officer ID {data.officerProfile?.officerId} &bull; {data.officerProfile?.department}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* 9 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="p-4 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] flex items-center justify-between gap-3 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#3F3124]">{c.label}</p>
                <p className="text-2xl font-bold font-mono text-[#1B130D] mt-1">{c.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${c.accent}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* A. Application Statistics + C. Pending Tasks + F. Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
          <h3 className="text-base font-bold text-[#1B130D]">A. Application Statistics</h3>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <div className="text-[#3F3124]">Received This Month</div>
              <div className="text-lg font-bold font-mono mt-0.5">{data.receivedThisMonth}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <div className="text-[#3F3124]">Processed Total</div>
              <div className="text-lg font-bold font-mono mt-0.5">{data.processedCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <div className="text-[#3F3124]">Approved / Rejected</div>
              <div className="text-lg font-bold font-mono mt-0.5">{data.approvedLoans} / {data.rejectedApplications}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <div className="text-[#3F3124]">Avg Processing Time</div>
              <div className="text-lg font-bold font-mono mt-0.5">{data.avgProcessingDays} days</div>
            </div>
          </div>

          <h3 className="text-base font-bold text-[#1B130D] pt-2">C. Pending Underwriting Tasks</h3>
          <div className="space-y-1.5 text-xs">
            {[
              { label: 'Document Verifications', count: data.pendingDocVerificationsCount, tab: 'documents' as LoanTabId },
              { label: 'Credit Assessments Needed', count: data.pendingAssessmentsCount, tab: 'credit-assessment' as LoanTabId },
              { label: 'Applications in Review', count: data.pendingReviewsCount, tab: 'processing' as LoanTabId },
              { label: 'Additional Doc Requests', count: data.additionalDocsRequestedCount, tab: 'documents' as LoanTabId },
              { label: 'Pending Maker-Checker Approvals', count: data.pendingApprovalRecommendationsCount, tab: 'approvals' as LoanTabId },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onNavigateTab(item.tab)}
                className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] hover:bg-[#E9D9C0] border border-[#D9C7AB] flex items-center justify-between"
              >
                <span className="font-medium text-[#1B130D]">{item.label}</span>
                <span className="px-2 py-0.5 rounded-full bg-[#261D15] text-[#D9A86C] font-mono font-bold">{item.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* E. Portfolio Overview */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-[#261D15] text-[#F4ECE0] border border-[#3F3124] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#D9A86C] uppercase tracking-wider">E. Loan Portfolio Overview</h3>
            <TrendingUp className="w-4 h-4 text-[#D9A86C]" />
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[#CEB896]">Total Disbursed Volume</div>
              <div className="text-xl font-bold font-mono text-[#D9A86C] mt-0.5">{formatCurrency(data.totalDisbursedAmount)}</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[#CEB896]">Outstanding Principal + Interest</div>
              <div className="text-xl font-bold font-mono mt-0.5">{formatCurrency(data.totalOutstandingAmount)}</div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-700/40 text-center">
                <div className="text-lg font-bold font-mono text-emerald-300">{data.performingLoansCount}</div>
                <div className="text-[11px] text-emerald-200">Performing Loans</div>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-700/40 text-center">
                <div className="text-lg font-bold font-mono text-rose-300">{data.overdueLoans}</div>
                <div className="text-[11px] text-rose-200">Overdue Loans</div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#CEB896] mb-1.5">Category Distribution</div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(data.categoryDistribution || {}).map(([cat, cnt]) => (
                <span key={cat} className="px-2 py-0.5 rounded-md bg-white/10 font-mono text-[10px] text-[#D9A86C]">
                  {cat}: {cnt}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* F. Quick Actions */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
          <h3 className="text-base font-bold text-[#1B130D]">F. Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map((qa) => {
              const Icon = qa.icon;
              return (
                <button
                  key={qa.label}
                  type="button"
                  onClick={() => onNavigateTab(qa.tab)}
                  className="p-3 rounded-xl bg-[#F3E7D4] hover:bg-[#E9D9C0] border border-[#D9C7AB] text-left transition-all group"
                >
                  <Icon className="w-4 h-4 text-[#8E4322] group-hover:scale-110 transition-transform mb-1.5" />
                  <div className="text-xs font-bold text-[#1B130D]">{qa.label}</div>
                  <div className="text-[11px] text-[#3F3124] truncate">{qa.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* B. Recent Applications + D. Upcoming EMIs */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1B130D]">B. Recent Loan Applications</h3>
            <button onClick={() => onNavigateTab('applications')} className="text-xs font-semibold text-[#8E4322] hover:underline">
              View All &rarr;
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[#D9C7AB] text-[#3F3124] uppercase">
                <tr>
                  <th className="py-2 pr-3">Application ID</th>
                  <th className="py-2 pr-3">Customer</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3 text-right">Amount</th>
                  <th className="py-2 pr-3">Officer</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D0B4]">
                {data.recentApplications.length === 0 ? (
                  <tr><td colSpan={6} className="py-6 text-center text-[#3F3124]">No loan applications found in assigned scope.</td></tr>
                ) : (
                  data.recentApplications.map((app) => (
                    <tr key={app.loanId} className="hover:bg-[#E9D9C0]/60 cursor-pointer" onClick={() => onNavigateTab('processing', app.loanId)}>
                      <td className="py-2.5 pr-3 font-mono font-bold text-[#70411A]">{app.loanId}</td>
                      <td className="py-2.5 pr-3 font-semibold">{app.customerName}</td>
                      <td className="py-2.5 pr-3">{app.loanCategory}</td>
                      <td className="py-2.5 pr-3 text-right font-mono font-bold">{formatCurrency(app.amount)}</td>
                      <td className="py-2.5 pr-3 font-mono">{app.assignedOfficer || 'Unassigned'}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getLoanBadgeClass(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-4 p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1B130D]">D. Upcoming &amp; Due EMIs</h3>
            <button onClick={() => onNavigateTab('repayments')} className="text-xs font-semibold text-[#8E4322] hover:underline">
              Schedule &rarr;
            </button>
          </div>
          <div className="space-y-2">
            {data.upcomingEmis.length === 0 ? (
              <p className="text-xs text-[#3F3124] py-4 text-center">No scheduled EMI installments pending.</p>
            ) : (
              data.upcomingEmis.map((emi) => (
                <div key={emi.installmentId} className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-[#1B130D]">{emi.customerName}</div>
                    <div className="font-mono text-[11px] text-[#70411A]">
                      {emi.loanId} &bull; #{emi.installmentNumber} &bull; Due {formatDateTime(emi.dueDate)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-[#1B130D]">{formatCurrency(emi.emiAmount)}</div>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getLoanBadgeClass(emi.repaymentStatus)}`}>
                      {emi.repaymentStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
