import React, { useEffect, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  Download,
  FileBarChart2,
  LogOut,
  Printer,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loanOfficerApi, mfaApi } from '../../services/api';
import { LoanApplicationSummary, LoanOfficerProfileData, SecurityEventItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { extractErrorMessage, formatCurrency, formatDateTime, getLoanBadgeClass } from './loanFormatters';

const REPORT_TYPES = [
  'LOAN_APPLICATION_REPORT',
  'LOAN_APPROVAL_REPORT',
  'LOAN_REJECTION_REPORT',
  'LOAN_DISBURSEMENT_REPORT',
  'EMI_REPAYMENT_REPORT',
  'OVERDUE_LOAN_REPORT',
  'LOAN_PORTFOLIO_REPORT',
  'CREDIT_ASSESSMENT_REPORT',
  'DOCUMENT_VERIFICATION_REPORT',
  'LOAN_OFFICER_PERFORMANCE_REPORT',
];

export const LoanReportsTab: React.FC = () => {
  const [reportType, setReportType] = useState('LOAN_APPLICATION_REPORT');
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [rows, setRows] = useState<LoanApplicationSummary[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await loanOfficerApi.getReport({
        reportType,
        category,
        status,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setRows(res.rows || []);
      setTotalRecords(res.totalRecords || 0);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load loan report.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, category, status]);

  const handleExportCsv = async () => {
    try {
      const csv = await loanOfficerApi.exportReportCsv({ reportType, category, status });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType.toLowerCase()}.csv`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 3000);
    } catch (err) {
      setError(extractErrorMessage(err, 'CSV export failed.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1B130D]">Loan Management Reports</h2>
          <p className="text-sm text-[#3F3124]">
            Branch-scoped credit lifecycle, approval, disbursement, delinquency, and performance reports with CSV &amp; printable PDF export.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleExportCsv} className="px-4 py-2 rounded-xl bg-[#70411A] text-white text-xs font-semibold flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button type="button" onClick={() => window.print()} className="px-4 py-2 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB] text-xs font-semibold flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5" /> Print / PDF
          </button>
        </div>
      </div>

      {error && <div className="p-3.5 rounded-xl bg-rose-900/10 border border-rose-700/30 text-sm text-rose-900">{error}</div>}

      <div className="p-4 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] flex flex-wrap gap-3 items-center text-xs">
        <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] font-semibold">
          {REPORT_TYPES.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
          <option value="ALL">All Categories</option>
          <option value="PERSONAL">PERSONAL</option>
          <option value="HOME">HOME</option>
          <option value="EDUCATION">EDUCATION</option>
          <option value="VEHICLE">VEHICLE</option>
          <option value="BUSINESS">BUSINESS</option>
          <option value="GOLD">GOLD</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
          <option value="ALL">All Statuses</option>
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="UNDER_REVIEW">UNDER_REVIEW</option>
          <option value="APPROVED">APPROVED</option>
          <option value="DISBURSED">DISBURSED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]" />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]" />
        <button type="button" onClick={load} className="px-4 py-2 rounded-xl bg-[#261D15] text-[#F4ECE0] font-semibold flex items-center gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Run
        </button>
      </div>

      <div className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
        <div className="flex justify-between items-center text-xs">
          <h3 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
            <FileBarChart2 className="w-4 h-4 text-[#70411A]" /> {reportType}
          </h3>
          <span>{totalRecords} records in authorized branch scope</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#E9D9C0] text-[#3F3124]">
              <tr>
                <th className="py-2 px-3">Loan ID</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Customer</th>
                <th className="py-2 px-3 text-right">Amount</th>
                <th className="py-2 px-3 text-right">EMI / DTI</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Officer / Approver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2D0B4]">
              {rows.map((r) => (
                <tr key={r.loanId}>
                  <td className="py-2 px-3 font-mono font-bold">{r.loanId}</td>
                  <td className="py-2 px-3">{r.loanCategory}</td>
                  <td className="py-2 px-3">{r.customerName} ({r.customerNumber})</td>
                  <td className="py-2 px-3 text-right font-mono font-bold">{formatCurrency(r.amount)}</td>
                  <td className="py-2 px-3 text-right font-mono">{formatCurrency(r.emiAmount)} ({r.dtiRatio}%)</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getLoanBadgeClass(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="py-2 px-3 font-mono">{r.assignedOfficer || '—'} / {r.finalApprovedBy || 'Pending'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const LoanMyProfileTab: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<LoanOfficerProfileData | null>(null);
  const [events, setEvents] = useState<SecurityEventItem[]>([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([loanOfficerApi.getProfile(), mfaApi.getSecurityEvents(0, 10, false)])
      .then(([p, ev]) => {
        setProfile(p);
        setEvents(ev.content || []);
      })
      .catch((err) => setError(extractErrorMessage(err, 'Unable to load Loan Officer profile.')));
  }, []);

  const updateShift = async (shiftStatus: string) => {
    try {
      const updated = await loanOfficerApi.updateShift(shiftStatus);
      setProfile(updated);
      setMessage(`Shift status changed to ${updated.shiftStatus}.`);
    } catch (err) {
      setError(extractErrorMessage(err, 'Shift update failed.'));
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await mfaApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setMessage('Password updated successfully.');
    } catch (err) {
      setError(extractErrorMessage(err, 'Password update failed.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1B130D]">Loan Officer Profile &amp; Security</h2>
          <p className="text-sm text-[#3F3124]">
            Employee assignment, Officer ID, branch scope, assigned applications, MFA controls, and session login history. Roles/permissions are read-only.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate('/security')} className="px-4 py-2 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#D9A86C]" /> Manage MFA
          </button>
          <button type="button" onClick={() => { logout(); navigate('/login'); }} className="px-4 py-2 rounded-xl bg-rose-900 text-white text-xs font-semibold flex items-center gap-1.5">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      {error && <div className="p-3.5 rounded-xl bg-rose-900/10 border border-rose-700/30 text-sm text-rose-900">{error}</div>}
      {message && <div className="p-3.5 rounded-xl bg-emerald-900/10 border border-emerald-700/30 text-sm text-emerald-900">{message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 p-6 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#261D15] text-[#D9A86C] flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1B130D]">{profile?.username || user?.username}</h3>
                <p className="text-xs text-[#3F3124]">{profile?.email || user?.email}</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getLoanBadgeClass('APPROVED')}`}>
              {profile?.employmentStatus || 'ACTIVE'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <div className="text-[#3F3124]">Employee ID / Officer ID</div>
              <div className="font-mono font-bold mt-0.5">{profile?.employeeId} &bull; {profile?.officerId}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <div className="text-[#3F3124]">Assigned Branch</div>
              <div className="font-bold mt-0.5">{profile?.branchCode} &bull; {profile?.branchName}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <div className="text-[#3F3124]">Department</div>
              <div className="font-bold mt-0.5">{profile?.department}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <div className="text-[#3F3124]">Assigned Applications</div>
              <div className="font-mono font-bold mt-0.5">{profile?.assignedApplicationsCount ?? 0}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {['ON_SHIFT', 'IN_MEETING', 'OFF_DUTY'].map((s) => (
              <button key={s} type="button" onClick={() => updateShift(s)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${profile?.shiftStatus === s ? 'bg-[#261D15] text-[#F4ECE0] border-[#261D15]' : 'bg-[#F3E7D4] border-[#D9C7AB]'}`}>
                {s}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-[#3F3124] flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4 text-[#70411A]" /> Assigned RBAC Permissions (Read-Only)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(profile?.permissions || user?.permissions || []).map((p) => (
                <span key={p} className="px-2 py-0.5 rounded-md bg-[#F3E7D4] border border-[#D9C7AB] font-mono text-[10px]">{p}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-5">
          <form onSubmit={handlePasswordChange} className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3 text-xs">
            <h3 className="text-base font-bold text-[#1B130D]">Change Password</h3>
            <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current Password" className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]" />
            <input type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]" />
            <button type="submit" className="px-4 py-2 rounded-xl bg-[#261D15] text-[#F4ECE0] font-semibold">Update Password</button>
          </form>

          <div className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-2.5 text-xs">
            <h3 className="text-base font-bold text-[#1B130D]">Recent Login &amp; Security Events</h3>
            <div className="max-h-56 overflow-y-auto space-y-2">
              {events.map((ev) => (
                <div key={ev.eventId} className="p-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] flex justify-between gap-2">
                  <div>
                    <div className="font-bold">{ev.eventType}</div>
                    <div className="text-[11px] text-[#3F3124]">{ev.details || ev.outcome}</div>
                  </div>
                  <div className="text-right text-[11px] font-mono">{formatDateTime(ev.createdAt)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
