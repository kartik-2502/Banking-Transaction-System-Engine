import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { loanOfficerApi } from '../../services/api';
import { LoanPortfolioData } from '../../types';
import { extractErrorMessage, formatCurrency } from './loanFormatters';

const COLORS = ['#70411A', '#8E4322', '#B57C47', '#3F3124', '#10B981', '#D9A86C'];

export const LoanPortfolioTab: React.FC = () => {
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [data, setData] = useState<LoanPortfolioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await loanOfficerApi.getPortfolio(categoryFilter);
      setData(res);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load loan portfolio analytics.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter]);

  const categoryChartData = data
    ? Object.entries(data.categoryCounts || {}).map(([name, count]) => ({
        name,
        count,
        amount: Number(data.categoryAmounts?.[name] ?? 0),
      }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1B130D]">Loan Portfolio &amp; Analytics</h2>
          <p className="text-sm text-[#3F3124]">
            Live database portfolio metrics, disbursement volume, outstanding principal/interest, performing vs. overdue mix, and monthly trends.
          </p>
        </div>
        <div className="flex gap-2">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB] text-xs">
            <option value="ALL">All Categories</option>
            <option value="PERSONAL">PERSONAL</option>
            <option value="HOME">HOME</option>
            <option value="EDUCATION">EDUCATION</option>
            <option value="VEHICLE">VEHICLE</option>
            <option value="BUSINESS">BUSINESS</option>
            <option value="GOLD">GOLD</option>
          </select>
          <button type="button" onClick={load} className="px-4 py-2 rounded-xl bg-[#261D15] text-[#F4ECE0] text-xs font-semibold flex items-center gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="p-3.5 rounded-xl bg-rose-900/10 border border-rose-700/30 text-sm text-rose-900">{error}</div>}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB]">
              <div className="text-[#3F3124]">Disbursed Volume ({data.totalLoansManaged} loans)</div>
              <div className="text-xl font-bold font-mono mt-1">{formatCurrency(data.totalDisbursedAmount)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB]">
              <div className="text-[#3F3124]">Outstanding Principal / Interest</div>
              <div className="text-lg font-bold font-mono mt-1">{formatCurrency(data.totalOutstandingPrincipal)}</div>
              <div className="text-[11px] font-mono text-[#70411A]">Int: {formatCurrency(data.totalOutstandingInterest)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB]">
              <div className="text-[#3F3124]">Approval Ratio</div>
              <div className="text-xl font-bold font-mono text-emerald-900 mt-1">{data.approvalRatioPercent}%</div>
              <div className="text-[11px]">{data.totalApprovedLoans} approved / {data.totalRejectedLoans} rejected</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB]">
              <div className="text-[#3F3124]">Repayment Health</div>
              <div className="text-xl font-bold font-mono text-[#70411A] mt-1">{data.onTimeRepaymentRatePercent}%</div>
              <div className="text-[11px]">{data.performingLoanCount} performing &bull; {data.overdueLoanCount} overdue</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
              <h3 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#70411A]" /> Loan Category Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryChartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={85} label>
                      {categoryChartData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] space-y-3">
              <h3 className="text-base font-bold text-[#1B130D]">Monthly Application &amp; Disbursement Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D9C7AB" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#3F3124' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#3F3124' }} />
                    <Tooltip />
                    <Bar dataKey="disbursedAmount" name="Disbursed (INR)" fill="#70411A" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
