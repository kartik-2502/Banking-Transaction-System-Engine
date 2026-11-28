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
import { mfaApi, tellerApi } from '../../services/api';
import { DailyReportData, SecurityEventItem, TellerProfileInfo } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  extractErrorMessage,
  formatCurrency,
  formatDateTime,
  getStatusBadgeClass,
} from './tellerFormatters';

export const TellerDailyReportsTab: React.FC = () => {
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState<DailyReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadReport = async (targetDate = reportDate) => {
    setLoading(true);
    setError('');
    try {
      const data = await tellerApi.getDailyReport(targetDate);
      setReport(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load daily branch teller report.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExportCsv = async () => {
    try {
      const csv = await tellerApi.exportDailyReportCsv(reportDate);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `teller-daily-report-${reportDate}.csv`;
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
          <h2 className="text-2xl font-bold text-[#1B130D]">Daily Reports &amp; Audit Export</h2>
          <p className="text-sm text-[#3F3124]">
            Branch-scoped EOD cash drawer reconciliation summary, shortage/excess audit trail, and CSV/printable reporting.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB] text-xs"
          />
          <button
            type="button"
            onClick={() => loadReport(reportDate)}
            className="px-4 py-2 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Load Date
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2 rounded-xl bg-[#70411A] text-[#F4ECE0] text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB] text-[#1B130D] text-xs font-semibold flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-900/10 border border-rose-700/30 text-sm text-rose-900">{error}</div>
      )}

      {report && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB]">
              <p className="text-xs text-[#3F3124]">Cash Deposits ({report.depositCount})</p>
              <p className="text-xl font-bold font-mono text-emerald-900 mt-1">{formatCurrency(report.totalDepositsAmount)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB]">
              <p className="text-xs text-[#3F3124]">Cash Withdrawals ({report.withdrawalCount})</p>
              <p className="text-xl font-bold font-mono text-rose-900 mt-1">{formatCurrency(report.totalWithdrawalsAmount)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB]">
              <p className="text-xs text-[#3F3124]">Fund Transfers ({report.transferCount})</p>
              <p className="text-xl font-bold font-mono text-[#70411A] mt-1">{formatCurrency(report.totalTransfersAmount)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB]">
              <p className="text-xs text-[#3F3124]">Cheques &amp; Service Reqs</p>
              <p className="text-xl font-bold font-mono text-[#1B130D] mt-1">
                {report.chequeCount} Chq / {report.serviceRequestCount} Req
              </p>
            </div>
          </div>

          {/* Shortage & Excess Events */}
          <div className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
            <h3 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
              <FileBarChart2 className="w-4 h-4 text-[#8E4322]" />
              Cash Shortage &amp; Excess Discrepancy Audit
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#E9D9C0] text-[#3F3124]">
                  <tr>
                    <th className="py-2 px-3">Date / Time</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-3">Recorded By / Audit Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2D0B4]">
                  {report.shortagesAndExcesses.length === 0 ? (
                    <tr><td colSpan={4} className="py-4 text-center text-[#3F3124]">Zero drawer shortage or excess entries recorded.</td></tr>
                  ) : (
                    report.shortagesAndExcesses.map((s) => (
                      <tr key={s.id}>
                        <td className="py-2 px-3">{formatDateTime(s.createdAt)}</td>
                        <td className="py-2 px-3 font-bold">{s.operationType}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">{formatCurrency(s.amount)}</td>
                        <td className="py-2 px-3">{s.createdBy} &bull; {s.remarks}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Transactions Table */}
          <div className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
            <h3 className="text-base font-bold text-[#1B130D]">
              Transactions on {report.reportDate} ({report.branchCode} &bull; {report.branchName})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#E9D9C0] text-[#3F3124]">
                  <tr>
                    <th className="py-2 px-3">Txn ID</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Source / Dest</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2D0B4]">
                  {report.transactions.length === 0 ? (
                    <tr><td colSpan={5} className="py-5 text-center text-[#3F3124]">No transactions posted on this date.</td></tr>
                  ) : (
                    report.transactions.map((t) => (
                      <tr key={t.transactionId}>
                        <td className="py-2 px-3 font-mono font-bold">{t.transactionId}</td>
                        <td className="py-2 px-3">{t.type}</td>
                        <td className="py-2 px-3 font-mono">{t.sourceAccountNumber || 'CASH'} &rarr; {t.destinationAccountNumber || 'CASH'}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">{formatCurrency(t.amount)}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(t.status)}`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const TellerMyProfileTab: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<TellerProfileInfo | null>(null);
  const [events, setEvents] = useState<SecurityEventItem[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdUpdating, setPwdUpdating] = useState(false);

  const loadProfile = async () => {
    try {
      const [p, ev] = await Promise.all([tellerApi.getProfile(), mfaApi.getSecurityEvents(0, 10, false)]);
      setProfile(p);
      setEvents(ev.content || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load teller profile details.'));
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleShiftChange = async (shiftStatus: string) => {
    setError('');
    setMessage('');
    try {
      const updated = await tellerApi.updateShift(shiftStatus);
      setProfile(updated);
      setMessage(`Shift status updated to ${updated.shiftStatus}.`);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to change shift status.'));
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdUpdating(true);
    setError('');
    setMessage('');
    try {
      await mfaApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setMessage('Password updated securely.');
    } catch (err) {
      setError(extractErrorMessage(err, 'Password update failed.'));
    } finally {
      setPwdUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1B130D]">Teller Employee Profile &amp; Security</h2>
          <p className="text-sm text-[#3F3124]">
            Assigned branch credentials, drawer allocation, shift controls, MFA governance, and login audit trail.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/security')}
            className="px-4 py-2 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-[#D9A86C]" /> Manage MFA Settings
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="px-4 py-2 rounded-xl bg-rose-900 text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-900/10 border border-rose-700/30 text-sm text-rose-900">{error}</div>
      )}
      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-900/10 border border-emerald-700/30 text-sm text-emerald-900">{message}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Identity Card */}
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
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(profile?.shiftStatus)}`}>
              {profile?.shiftStatus || 'ON_DUTY'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <div className="text-[#3F3124]">Employee ID</div>
              <div className="font-mono font-bold text-[#1B130D] mt-0.5">{profile?.employeeId || user?.employeeId || '—'}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <div className="text-[#3F3124]">Teller ID</div>
              <div className="font-mono font-bold text-[#1B130D] mt-0.5">{profile?.tellerId || user?.tellerId || '—'}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <div className="text-[#3F3124]">Assigned Branch</div>
              <div className="font-bold text-[#1B130D] mt-0.5">
                {profile?.branchCode} &bull; {profile?.branchName}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB]">
              <div className="text-[#3F3124]">Counter Drawer &amp; Cash Limit</div>
              <div className="font-mono font-bold text-[#1B130D] mt-0.5">
                {profile?.drawerCode} &bull; {formatCurrency(profile?.maxCashLimit)}
              </div>
            </div>
          </div>

          {/* Shift Switcher */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#3F3124]">Update Counter Shift Status</div>
            <div className="flex flex-wrap gap-2">
              {['ON_DUTY', 'BREAK', 'OFF_DUTY'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleShiftChange(s)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border ${
                    profile?.shiftStatus === s
                      ? 'bg-[#261D15] text-[#F4ECE0] border-[#261D15]'
                      : 'bg-[#F3E7D4] text-[#1B130D] border-[#D9C7AB]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Granted Authorities */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#3F3124] flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4 text-[#70411A]" /> Granted Teller RBAC Permissions
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(profile?.permissions || user?.permissions || []).map((perm) => (
                <span
                  key={perm}
                  className="px-2 py-0.5 rounded-md bg-[#F3E7D4] border border-[#D9C7AB] font-mono text-[10px] text-[#1B130D]"
                >
                  {perm}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Password Update & Login Audit */}
        <div className="lg:col-span-6 space-y-5">
          <form onSubmit={handleChangePassword} className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
            <h3 className="text-base font-bold text-[#1B130D]">Change Account Password</h3>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
            />
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 chars)"
              className="w-full px-3 py-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs"
            />
            <button
              type="submit"
              disabled={pwdUpdating}
              className="px-4 py-2 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold"
            >
              {pwdUpdating ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          <div className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
            <h3 className="text-base font-bold text-[#1B130D]">Recent Security &amp; Login History</h3>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-xs text-[#3F3124]">No recent security events logged.</p>
              ) : (
                events.map((ev) => (
                  <div key={ev.eventId} className="p-2.5 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-xs flex justify-between gap-2">
                    <div>
                      <div className="font-bold text-[#1B130D]">{ev.eventType}</div>
                      <div className="text-[11px] text-[#3F3124]">{ev.details || ev.outcome}</div>
                    </div>
                    <div className="text-right text-[11px] text-[#3F3124] shrink-0">
                      <div>{formatDateTime(ev.createdAt)}</div>
                      <div className="font-mono">{ev.ipAddress || 'local'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
