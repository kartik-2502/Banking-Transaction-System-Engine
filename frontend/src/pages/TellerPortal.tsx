import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftRight,
  Banknote,
  ClipboardCheck,
  FileBarChart2,
  FileCheck2,
  Landmark,
  LayoutDashboard,
  MessageSquareWarning,
  ReceiptText,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/rbac';
import { TellerDashboardTab, TellerTabId } from '../components/teller/TellerDashboardTab';
import { TellerCustomersTab } from '../components/teller/TellerCustomersTab';
import { TellerAccountsTab } from '../components/teller/TellerAccountsTab';
import { TellerCashDrawerTab } from '../components/teller/TellerCashDrawerTab';
import { TellerTransfersTab } from '../components/teller/TellerTransfersTab';
import { TellerTransactionsTab } from '../components/teller/TellerTransactionsTab';
import { TellerChequesTab } from '../components/teller/TellerChequesTab';
import { TellerServiceRequestsTab } from '../components/teller/TellerServiceRequestsTab';
import { TellerComplaintsTab } from '../components/teller/TellerComplaintsTab';
import { TellerDailyReportsTab, TellerMyProfileTab } from '../components/teller/TellerReportsProfileTab';

export const TELLER_TABS: {
  id: TellerTabId;
  label: string;
  permission: string;
  icon: React.ElementType;
}[] = [
  { id: 'dashboard', label: 'Dashboard', permission: 'TRANSACTION_VIEW', icon: LayoutDashboard },
  { id: 'customers', label: 'Customer Management', permission: 'CUSTOMER_VIEW', icon: Users },
  { id: 'accounts', label: 'Account Services', permission: 'ACCOUNT_VIEW', icon: Landmark },
  { id: 'cash', label: 'Cash Transactions', permission: 'CASH_DEPOSIT', icon: Banknote },
  { id: 'transfers', label: 'Fund Transfers', permission: 'FUND_TRANSFER_INITIATE', icon: ArrowLeftRight },
  { id: 'transactions', label: 'Transaction Management', permission: 'TRANSACTION_VIEW', icon: ReceiptText },
  { id: 'cheques', label: 'Cheque Services', permission: 'CHEQUE_VIEW', icon: FileCheck2 },
  { id: 'service-requests', label: 'Service Requests', permission: 'SERVICE_REQUEST_CREATE', icon: ClipboardCheck },
  { id: 'complaints', label: 'Disputes & Complaints', permission: 'COMPLAINT_CREATE', icon: MessageSquareWarning },
  { id: 'reports', label: 'Daily Reports', permission: 'DAILY_REPORT_VIEW', icon: FileBarChart2 },
  { id: 'profile', label: 'My Profile', permission: 'PROFILE_VIEW', icon: UserCheck },
];

export const TellerPortal: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const permittedTabs = TELLER_TABS.filter(
    (t) =>
      hasPermission(user, t.permission) ||
      (t.id === 'service-requests' && hasPermission(user, 'APPROVAL_MANAGE')) ||
      (t.id === 'cash' && hasPermission(user, 'CASH_RECONCILIATION_VERIFY'))
  );

  const requestedTab = (searchParams.get('tab') as TellerTabId) || 'dashboard';
  const activeTab = permittedTabs.some((t) => t.id === requestedTab)
    ? requestedTab
    : permittedTabs[0]?.id || 'dashboard';

  const switchTab = (tab: TellerTabId) => {
    navigate(`/teller?tab=${tab}`);
  };

  return (
    <div className="space-y-6">
      {/* Compact quick strip for mobile/tablet or direct tab switching */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {permittedTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5 border transition-colors ${
                isActive
                  ? 'bg-[#261D15] text-[#F4ECE0] border-[#261D15]'
                  : 'bg-[#EFE2CE] text-[#3F3124] border-[#D9C7AB] hover:bg-[#E9D9C0]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D9A86C]' : ''}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'dashboard' && <TellerDashboardTab onNavigateTab={switchTab} />}
      {activeTab === 'customers' && <TellerCustomersTab />}
      {activeTab === 'accounts' && <TellerAccountsTab />}
      {activeTab === 'cash' && <TellerCashDrawerTab />}
      {activeTab === 'transfers' && <TellerTransfersTab />}
      {activeTab === 'transactions' && <TellerTransactionsTab />}
      {activeTab === 'cheques' && <TellerChequesTab />}
      {activeTab === 'service-requests' && <TellerServiceRequestsTab />}
      {activeTab === 'complaints' && <TellerComplaintsTab />}
      {activeTab === 'reports' && <TellerDailyReportsTab />}
      {activeTab === 'profile' && <TellerMyProfileTab />}
    </div>
  );
};

export default TellerPortal;
