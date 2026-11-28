import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Banknote,
  BellRing,
  Calculator,
  CalendarCheck,
  ClipboardCheck,
  FileBarChart2,
  FileCheck2,
  FileText,
  LayoutDashboard,
  PieChart,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/rbac';
import { LoanDashboardTab, LoanTabId } from '../components/loan-officer/LoanDashboardTab';
import { LoanCustomersTab } from '../components/loan-officer/LoanCustomersTab';
import { LoanApplicationsTab } from '../components/loan-officer/LoanApplicationsTab';
import { LoanDocumentsTab } from '../components/loan-officer/LoanDocumentsTab';
import { LoanCreditAssessmentTab } from '../components/loan-officer/LoanCreditAssessmentTab';
import { LoanProcessingTab } from '../components/loan-officer/LoanProcessingTab';
import { LoanApprovalsTab } from '../components/loan-officer/LoanApprovalsTab';
import { LoanDisbursementTab } from '../components/loan-officer/LoanDisbursementTab';
import { LoanRepaymentsTab } from '../components/loan-officer/LoanRepaymentsTab';
import { LoanOverdueTab } from '../components/loan-officer/LoanOverdueTab';
import { LoanPortfolioTab } from '../components/loan-officer/LoanPortfolioTab';
import { LoanCommunicationTab } from '../components/loan-officer/LoanCommunicationTab';
import { LoanMyProfileTab, LoanReportsTab } from '../components/loan-officer/LoanReportsProfileTab';

export const LOAN_OFFICER_TABS: {
  id: LoanTabId;
  label: string;
  permission: string;
  icon: React.ElementType;
}[] = [
  { id: 'dashboard', label: 'Dashboard', permission: 'LOAN_DASHBOARD_VIEW', icon: LayoutDashboard },
  { id: 'customers', label: 'Customer Management', permission: 'LOAN_CUSTOMER_VIEW', icon: Users },
  { id: 'applications', label: 'Loan Applications', permission: 'LOAN_APPLICATION_VIEW', icon: FileText },
  { id: 'documents', label: 'Document Verification', permission: 'LOAN_DOCUMENT_VIEW', icon: FileCheck2 },
  { id: 'credit-assessment', label: 'Credit Assessment', permission: 'LOAN_CREDIT_ASSESS', icon: Calculator },
  { id: 'processing', label: 'Loan Processing', permission: 'LOAN_PROCESSING_MANAGE', icon: ClipboardCheck },
  { id: 'approvals', label: 'Approval Management', permission: 'LOAN_APPROVAL_VIEW', icon: ShieldCheck },
  { id: 'disbursement', label: 'Loan Disbursement', permission: 'LOAN_DISBURSEMENT_VIEW', icon: Banknote },
  { id: 'repayments', label: 'EMI & Repayments', permission: 'LOAN_REPAYMENT_VIEW', icon: CalendarCheck },
  { id: 'overdue', label: 'Overdue & Defaults', permission: 'LOAN_OVERDUE_MANAGE', icon: AlertTriangle },
  { id: 'portfolio', label: 'Loan Portfolio', permission: 'LOAN_PORTFOLIO_VIEW', icon: PieChart },
  { id: 'communications', label: 'Customer Communication', permission: 'LOAN_CUSTOMER_COMMUNICATE', icon: BellRing },
  { id: 'reports', label: 'Reports', permission: 'LOAN_REPORT_VIEW', icon: FileBarChart2 },
  { id: 'profile', label: 'My Profile', permission: 'LOAN_PROFILE_VIEW', icon: UserCheck },
];

export const LoanOfficerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedLoanId, setSelectedLoanId] = useState<string | undefined>(undefined);

  const permittedTabs = LOAN_OFFICER_TABS.filter(
    (t) =>
      hasPermission(user, t.permission) ||
      (t.id === 'processing' && hasPermission(user, 'LOAN_APPLICATION_REVIEW')) ||
      (t.id === 'approvals' && hasPermission(user, 'LOAN_FINAL_APPROVE')) ||
      (t.id === 'disbursement' && hasPermission(user, 'LOAN_DISBURSEMENT_APPROVE'))
  );

  const requestedTab = (searchParams.get('tab') as LoanTabId) || 'dashboard';
  const activeTab = permittedTabs.some((t) => t.id === requestedTab)
    ? requestedTab
    : permittedTabs[0]?.id || 'dashboard';

  const switchTab = (tab: LoanTabId, loanId?: string) => {
    if (loanId) setSelectedLoanId(loanId);
    navigate(`/loans?tab=${tab}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {permittedTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5 border transition-colors ${
                active
                  ? 'bg-[#261D15] text-[#F4ECE0] border-[#261D15]'
                  : 'bg-[#EFE2CE] text-[#3F3124] border-[#D9C7AB] hover:bg-[#E9D9C0]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#D9A86C]' : ''}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'dashboard' && <LoanDashboardTab onNavigateTab={switchTab} />}
      {activeTab === 'customers' && <LoanCustomersTab />}
      {activeTab === 'applications' && <LoanApplicationsTab onOpenLoanTab={switchTab} />}
      {activeTab === 'documents' && <LoanDocumentsTab initialLoanId={selectedLoanId} />}
      {activeTab === 'credit-assessment' && <LoanCreditAssessmentTab initialLoanId={selectedLoanId} />}
      {activeTab === 'processing' && <LoanProcessingTab initialLoanId={selectedLoanId} />}
      {activeTab === 'approvals' && <LoanApprovalsTab initialLoanId={selectedLoanId} />}
      {activeTab === 'disbursement' && <LoanDisbursementTab initialLoanId={selectedLoanId} />}
      {activeTab === 'repayments' && <LoanRepaymentsTab initialLoanId={selectedLoanId} />}
      {activeTab === 'overdue' && <LoanOverdueTab />}
      {activeTab === 'portfolio' && <LoanPortfolioTab />}
      {activeTab === 'communications' && <LoanCommunicationTab initialLoanId={selectedLoanId} />}
      {activeTab === 'reports' && <LoanReportsTab />}
      {activeTab === 'profile' && <LoanMyProfileTab />}
    </div>
  );
};

export default LoanOfficerDashboard;
