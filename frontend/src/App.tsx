import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  Landmark,
  ArrowRightLeft,
  FileCheck2,
  Wallet,
  ShieldAlert,
  Home,
  LogOut,
  ShieldCheck,
  CreditCard,
  Building2,
  ChevronRight,
  Download,
  GraduationCap,
  Car,
  Calculator,
  ClipboardList,
  ReceiptIndianRupee,
  PiggyBank,
  Repeat,
  RefreshCw,
  Gauge,
  Loader2,
  Menu,
  X,
  Lock,
  CheckCircle2,
  XCircle,
  Bell,
  Banknote,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import CustomerPortal from './pages/CustomerPortal';
import TellerPortal, { TELLER_TABS } from './pages/TellerPortal';
import LoanOfficerDashboard, { LOAN_OFFICER_TABS } from './pages/LoanOfficerDashboard';
import AdminComplianceDashboard from './pages/AdminComplianceDashboard';
import LoginPage from './pages/LoginPage';
import { MfaSecurityCenter } from './components/MfaSecurityCenter';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getPermissions, hasPermission } from './utils/rbac';
import { notificationApi } from './services/api';
import { NotificationItem } from './types';

const HomeLanding: React.FC = () => {
  const { user } = useAuth();
  const perms = getPermissions(user);

  const getFirstName = () => {
    if (user?.fullName) return user.fullName.split(' ')[0];
    if (user?.username) return user.username;
    return 'Customer';
  };

  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col justify-center">
      <div className="text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFE4D2] border border-[#D9C7AB] text-[#70411A] text-xs font-semibold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          {perms.designationTitle} &bull; {perms.tierLabel}
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1B130D] leading-tight">
          Welcome back, {getFirstName()}
        </h1>

        <p className="text-[#3F3124] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Manage your accounts, review credit applications, transfer funds securely, and monitor transactions in real time.
        </p>

        {/* Primary Navigation Cards (Upper Tiles - Dark Beige) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 text-left">
          {perms.canAccessTellerPortal && (
            <Link
              to="/teller?tab=dashboard"
              className="group p-6 rounded-2xl bg-[#E9D9C0] hover:bg-[#E2CEAF] border border-[#CEB896] hover:border-[#70411A] transition-all duration-200 shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/85 border border-[#CEB896] text-[#70411A] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-sm">
                  <Banknote className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-[#1B130D] group-hover:text-[#542F11] transition-colors">
                  Teller Operations Workbench
                </h2>
                <p className="text-sm text-[#3F3124] mt-2 leading-normal font-medium">
                  Process branch cash deposits &amp; withdrawals, drawer reconciliation, cheques, transfers, complaints &amp; daily EOD reports.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-[#542F11] group-hover:translate-x-1 transition-transform">
                Open workbench <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          )}

          {perms.canAccessCustomerPortal && (
            <Link
              to="/customer"
              className="group p-6 rounded-2xl bg-[#E9D9C0] hover:bg-[#E2CEAF] border border-[#CEB896] hover:border-[#70411A] transition-all duration-200 shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/85 border border-[#CEB896] text-[#70411A] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-sm">
                  <Wallet className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-[#1B130D] group-hover:text-[#542F11] transition-colors">
                  Customer Portal
                </h2>
                <p className="text-sm text-[#3F3124] mt-2 leading-normal font-medium">
                  {perms.canViewAllAccounts
                    ? 'Inspect customer accounts, execute assisted branch transactions, and manage details.'
                    : 'Check your balance, make instant deposits or transfers, and apply for personal loans.'}
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-[#542F11] group-hover:translate-x-1 transition-transform">
                Open portal <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          )}

          {perms.canAccessLoanWorkbench ? (
            <Link
              to="/loans"
              className="group p-6 rounded-2xl bg-[#E9D9C0] hover:bg-[#E2CEAF] border border-[#CEB896] hover:border-[#8E4322] transition-all duration-200 shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/85 border border-[#CEB896] text-[#8E4322] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-sm">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-[#1B130D] group-hover:text-[#8E4322] transition-colors">
                  Loan Officer {perms.canReviewLoans ? '' : '(Read-Only)'}
                </h2>
                <p className="text-sm text-[#3F3124] mt-2 leading-normal font-medium">
                  {perms.canApproveHighValueLoans
                    ? 'Full underwriting authority including high-value (> ₹5,00,000) approvals & disbursements.'
                    : perms.canReviewLoans
                    ? 'Assess applicant eligibility, edit rates/notes, and approve standard loans (≤ ₹5,00,000).'
                    : 'Inspect loan portfolio underwriting notes, credit scores, and repayment schedules.'}
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-[#8E4322] group-hover:translate-x-1 transition-transform">
                Open workbench <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          ) : (
            <div className="p-6 rounded-2xl bg-[#E9D9C0]/60 border border-[#CEB896] flex flex-col justify-between opacity-80">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/70 border border-[#CEB896] text-[#3F3124] flex items-center justify-center mb-4">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-[#1B130D]/75">Loan Officer</h2>
                <p className="text-sm text-[#3F3124] mt-2 leading-normal">
                  Restricted to Loan Officer, Risk Analyst, and Administrator designations.
                </p>
              </div>
              <div className="mt-6 text-xs font-mono font-semibold text-[#3F3124]">Tier 3+ Required</div>
            </div>
          )}

          {perms.canAccessAdminCompliance ? (
            <Link
              to="/admin"
              className="group p-6 rounded-2xl bg-[#E9D9C0] hover:bg-[#E2CEAF] border border-[#CEB896] hover:border-[#4E3424] transition-all duration-200 shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/85 border border-[#CEB896] text-[#4E3424] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-sm">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-[#1B130D] group-hover:text-[#4E3424] transition-colors">
                  Admin & Compliance {perms.canFreezeAccounts || perms.canResolveFraudAlerts ? '' : '(Read-Only)'}
                </h2>
                <p className="text-sm text-[#3F3124] mt-2 leading-normal font-medium">
                  {perms.canFreezeAccounts
                    ? 'Fraud surveillance, account freeze/unfreeze controls, limit calibration, and audit trails.'
                    : 'View daily throughput trends, fraud queues, and account risk profiles.'}
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-[#4E3424] group-hover:translate-x-1 transition-transform">
                Open compliance <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          ) : (
            <div className="p-6 rounded-2xl bg-[#E9D9C0]/60 border border-[#CEB896] flex flex-col justify-between opacity-80">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/70 border border-[#CEB896] text-[#3F3124] flex items-center justify-center mb-4">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-[#1B130D]/75">Admin & Compliance</h2>
                <p className="text-sm text-[#3F3124] mt-2 leading-normal">
                  Restricted to Staff, Compliance, and Administrator designations.
                </p>
              </div>
              <div className="mt-6 text-xs font-mono font-semibold text-[#3F3124]">Tier 2+ Required</div>
            </div>
          )}
        </div>

        {/* Designation Privilege Summary */}
        <div className="p-5 rounded-2xl bg-[#EFE2CE] border border-[#D9C7AB] shadow-md text-left space-y-3 mt-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9C7AB] pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1B130D]">
              <ShieldCheck className="w-4 h-4 text-[#70411A]" />
              Active Role Privileges: <span className="text-[#70411A]">{perms.designationTitle}</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[#EFE4D2] border border-[#D9C7AB] text-[#1B130D] font-medium">
              {perms.tierLabel}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <div className="font-semibold text-emerald-700 uppercase tracking-wider text-[10px]">
                Permitted Actions & Edit Rights
              </div>
              {perms.grantedCapabilities.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[#1B130D]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <div className="font-semibold text-[#3F3124] uppercase tracking-wider text-[10px]">
                Restrictions at Current Designation
              </div>
              {perms.restrictedCapabilities.length === 0 ? (
                <div className="flex items-start gap-2 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>No restrictions — maximum administrative authority active.</span>
                </div>
              ) : (
                perms.restrictedCapabilities.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[#3F3124]">
                    <XCircle className="w-3.5 h-3.5 text-rose-700 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bank Feature Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-left">
          <div className="p-4 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB] shadow-md shadow-sm">
            <ArrowRightLeft className="w-5 h-5 text-[#70411A] mb-2" />
            <div className="text-base font-semibold text-[#1B130D]">Instant Settlement</div>
            <div className="text-xs text-[#3F3124] mt-1">Real-time ledger updates across all accounts</div>
          </div>
          <div className="p-4 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB] shadow-md shadow-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-700 mb-2" />
            <div className="text-base font-semibold text-[#1B130D]">Bank-Grade Security</div>
            <div className="text-xs text-[#3F3124] mt-1">Token-based authentication & strict RBAC</div>
          </div>
          <div className="p-4 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB] shadow-md shadow-sm">
            <CreditCard className="w-5 h-5 text-[#8E4322] mb-2" />
            <div className="text-base font-semibold text-[#1B130D]">Credit Underwriting</div>
            <div className="text-xs text-[#3F3124] mt-1">Automated DTI calculation & repayment schedules</div>
          </div>
          <div className="p-4 rounded-xl bg-[#EFE2CE] border border-[#D9C7AB] shadow-md shadow-sm">
            <Building2 className="w-5 h-5 text-[#4E3424] mb-2" />
            <div className="text-base font-semibold text-[#1B130D]">Fraud Prevention</div>
            <div className="text-xs text-[#3F3124] mt-1">Automated velocity checks & suspicious alert triage</div>
          </div>
        </div>
      </div>
    </main>
  );
};

interface SidebarNavigationProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const AccessRestricted: React.FC<{ requiredTier: string }> = ({ requiredTier }) => {
  const { user } = useAuth();
  const perms = getPermissions(user);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center mx-auto">
        <Lock className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-[#1B130D]">Access Restricted</h1>
      <p className="text-sm text-[#3F3124]">
        Your current designation (<span className="text-[#1B130D] font-semibold">{perms.designationTitle}</span> &bull;{' '}
        <span className="font-mono text-[#70411A]">{perms.tierLabel}</span>) does not have privilege to access this module.{' '}
        {requiredTier} is required.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#70411A] hover:bg-[#542F11] text-white text-xs font-semibold transition-colors"
      >
        <Home className="w-4 h-4" /> Return to Overview
      </Link>
    </div>
  );
};

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  mobileOpen,
  onCloseMobile,
  collapsed,
  onToggleCollapse,
}) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const perms = getPermissions(user);
  const [tellerGroupOpen, setTellerGroupOpen] = useState(true);
  const [loanGroupOpen, setLoanGroupOpen] = useState(true);

  const isActive = (path: string) => location.pathname === path;
  const searchParams = new URLSearchParams(location.search);
  const currentCustomerSection = searchParams.get('section') || 'transfers';
  const currentTellerTab = searchParams.get('tab') || 'dashboard';
  const currentLoanTab = searchParams.get('tab') || 'dashboard';

  const permittedTellerTabs = TELLER_TABS.filter(
    (t) =>
      hasPermission(user, t.permission) ||
      (t.id === 'service-requests' && hasPermission(user, 'APPROVAL_MANAGE')) ||
      (t.id === 'cash' && hasPermission(user, 'CASH_RECONCILIATION_VERIFY'))
  );

  const permittedLoanTabs = LOAN_OFFICER_TABS.filter(
    (t) =>
      hasPermission(user, t.permission) ||
      (t.id === 'processing' && hasPermission(user, 'LOAN_APPLICATION_REVIEW')) ||
      (t.id === 'approvals' && hasPermission(user, 'LOAN_FINAL_APPROVE')) ||
      (t.id === 'disbursement' && hasPermission(user, 'LOAN_DISBURSEMENT_APPROVE'))
  );

  const customerServiceGroups = [
    {
      title: 'Transfers & Receipts',
      items: [
        { section: 'rtgs', label: 'RTGS Transfer', icon: Landmark },
        { section: 'receipts', label: 'Download Receipt', icon: Download },
      ],
    },
    {
      title: 'Loans & Tools',
      items: [
        { section: 'home-loan', label: 'Home Loan', icon: Home },
        { section: 'education-loan', label: 'Education Loan', icon: GraduationCap },
        { section: 'vehicle-loan', label: 'Vehicle Loan', icon: Car },
        { section: 'loan-eligibility', label: 'Loan Eligibility', icon: CheckCircle2 },
        { section: 'cibil-score', label: 'CIBIL Score', icon: Gauge },
        { section: 'emi-calculator', label: 'EMI Calculator', icon: Calculator },
        { section: 'loan-tracking', label: 'Loan Tracking', icon: ClipboardList },
        { section: 'loan-repayment', label: 'Loan Repayment', icon: ReceiptIndianRupee },
      ],
    },
    {
      title: 'Deposits & Calculators',
      items: [
        { section: 'fd', label: 'Fixed Deposit (FD)', icon: PiggyBank },
        { section: 'rd', label: 'Recurring Deposit (RD)', icon: Repeat },
        { section: 'fd-calculator', label: 'FD Calculator', icon: Calculator },
        { section: 'rd-calculator', label: 'RD Calculator', icon: Calculator },
        { section: 'fd-renewal', label: 'FD Renewal', icon: RefreshCw },
      ],
    },
  ];

  const getUserInitials = () => {
    if (user?.fullName) {
      const parts = user.fullName.split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (user?.username) return user.username.slice(0, 2).toUpperCase();
    return 'BK';
  };

  const navItems = [
    {
      to: '/',
      label: 'Overview',
      icon: Home,
      allowed: perms.canAccessOverview,
      activeClass: 'bg-[#EFE2CE] text-[#1B130D] border border-[#D9A86C]/70 font-bold shadow-md',
    },
    {
      to: '/customer',
      label: 'Customer Portal',
      icon: Wallet,
      allowed: perms.canAccessCustomerPortal,
      activeClass: 'bg-[#EFE2CE] text-[#70411A] border border-[#D9A86C]/70 font-bold shadow-md',
    },
    {
      to: '/loans',
      label: 'Loan Officer',
      icon: FileCheck2,
      allowed: perms.canAccessLoanWorkbench,
      activeClass: 'bg-[#EFE2CE] text-[#8E4322] border border-[#D9A86C]/70 font-bold shadow-md',
    },
    {
      to: '/admin',
      label: 'Admin & Compliance',
      icon: ShieldAlert,
      allowed: perms.canAccessAdminCompliance,
      activeClass: 'bg-[#EFE2CE] text-[#4E3424] border border-[#D9A86C]/70 font-bold shadow-md',
    },
    {
      to: '/security',
      label: 'Security & MFA',
      icon: ShieldCheck,
      allowed: true,
      activeClass: 'bg-[#EFE2CE] text-[#70411A] border border-[#D9A86C]/70 font-bold shadow-md',
    },
  ].filter((item) => item.allowed);

  const renderSidebar = (isMobileDrawer: boolean) => {
    const isCollapsed = !isMobileDrawer && collapsed;
    return (
      <div
        className={`flex flex-col h-full bg-[#261D15] border-r border-[#4E3424] text-[#EFE4D2] shadow-xl transition-all duration-200 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Bank Brand Header */}
        <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <Link to="/" onClick={onCloseMobile} className="flex items-center space-x-3 group min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#D9A86C] flex items-center justify-center font-bold text-lg text-[#1B130D] shadow-md group-hover:bg-[#EFE2CE] transition-colors shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            {!isCollapsed && <span className="font-bold text-xl tracking-tight text-white truncate">Bank</span>}
          </Link>
          {isMobileDrawer ? (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-[#EFE4D2]/80 hover:text-white hover:bg-[#362A1F]"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onToggleCollapse}
              className="hidden md:inline-flex p-1.5 rounded-lg text-[#EFE4D2]/80 hover:text-white hover:bg-[#362A1F]"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Left Sidebar Navigation Options Under Bank (RBAC-filtered) */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-3 pb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#EFE4D2]/60">
              <span>Navigation</span>
              <span className="text-[10px] font-mono text-[#D9A86C] font-bold">Tier {perms.tierLevel}</span>
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === '/customer'
                ? location.pathname === '/customer' && currentCustomerSection === 'transfers'
                : isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                  isCollapsed ? 'justify-center' : ''
                } ${
                  active
                    ? item.activeClass
                    : 'text-[#EFE4D2]/85 hover:text-white hover:bg-[#362A1F] border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          {/* Dedicated Teller Operations Navigation Group */}
          {perms.canAccessTellerPortal && (
            <div className="pt-3 space-y-1">
              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={() => setTellerGroupOpen((o) => !o)}
                  className="w-full px-3 pb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[#D9A86C]/90 hover:text-[#D9A86C]"
                >
                  <span>Teller Operations</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${tellerGroupOpen ? '' : '-rotate-90'}`} />
                </button>
              ) : (
                <div className="border-t border-white/10 my-2" />
              )}

              {(isCollapsed || tellerGroupOpen) &&
                permittedTellerTabs.map((tab) => {
                  const TabIcon = tab.icon;
                  const tabActive = location.pathname === '/teller' && currentTellerTab === tab.id;
                  return (
                    <Link
                      key={tab.id}
                      to={`/teller?tab=${tab.id}`}
                      title={isCollapsed ? tab.label : undefined}
                      onClick={onCloseMobile}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                        isCollapsed ? 'justify-center' : ''
                      } ${
                        tabActive
                          ? 'bg-[#EFE2CE] text-[#1B130D] border border-[#D9A86C]/70 font-bold shadow-md'
                          : 'text-[#EFE4D2]/85 hover:text-white hover:bg-[#362A1F] border border-transparent'
                      }`}
                    >
                      <TabIcon className="w-4 h-4 shrink-0" />
                      {!isCollapsed && <span className="truncate">{tab.label}</span>}
                    </Link>
                  );
                })}
            </div>
          )}

          {/* Dedicated Loan Operations Navigation Group */}
          {perms.canAccessLoanWorkbench && (
            <div className="pt-3 space-y-1">
              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={() => setLoanGroupOpen((o) => !o)}
                  className="w-full px-3 pb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[#D9A86C]/90 hover:text-[#D9A86C]"
                >
                  <span>Loan Operations</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${loanGroupOpen ? '' : '-rotate-90'}`} />
                </button>
              ) : (
                <div className="border-t border-white/10 my-2" />
              )}

              {(isCollapsed || loanGroupOpen) &&
                permittedLoanTabs.map((tab) => {
                  const TabIcon = tab.icon;
                  const tabActive = location.pathname === '/loans' && currentLoanTab === tab.id;
                  return (
                    <Link
                      key={tab.id}
                      to={`/loans?tab=${tab.id}`}
                      title={isCollapsed ? tab.label : undefined}
                      onClick={onCloseMobile}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                        isCollapsed ? 'justify-center' : ''
                      } ${
                        tabActive
                          ? 'bg-[#EFE2CE] text-[#1B130D] border border-[#D9A86C]/70 font-bold shadow-md'
                          : 'text-[#EFE4D2]/85 hover:text-white hover:bg-[#362A1F] border border-transparent'
                      }`}
                    >
                      <TabIcon className="w-4 h-4 shrink-0" />
                      {!isCollapsed && <span className="truncate">{tab.label}</span>}
                    </Link>
                  );
                })}
            </div>
          )}

          {/* Customer Self-Service Groups (Hidden for Teller / Loan Officer / Bank Manager / Auditor) */}
          {perms.canAccessCustomerPortal &&
            !isCollapsed &&
            customerServiceGroups.map((group) => (
              <div key={group.title} className="pt-3 space-y-1">
                <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#D9A86C]/80">
                  {group.title}
                </div>
                {group.items.map((svc) => {
                  const SvcIcon = svc.icon;
                  const svcActive =
                    location.pathname === '/customer' && currentCustomerSection === svc.section;
                  return (
                    <Link
                      key={svc.section}
                      to={`/customer?section=${svc.section}`}
                      onClick={onCloseMobile}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                        svcActive
                          ? 'bg-[#EFE2CE] text-[#1B130D] border border-[#D9A86C]/70 font-bold shadow-md'
                          : 'text-[#EFE4D2]/85 hover:text-white hover:bg-[#362A1F] border border-transparent'
                      }`}
                    >
                      <SvcIcon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{svc.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
        </nav>

        {/* User Profile & Sign Out */}
        <div className="p-3 border-t border-white/10 space-y-2.5 shrink-0">
          <div className={`flex items-center bg-[#362A1F] border border-white/10 px-3 py-2 rounded-xl ${isCollapsed ? 'justify-center' : 'space-x-2.5'}`}>
            <div className="w-8 h-8 rounded-lg bg-[#D9A86C] text-[#1B130D] font-bold text-xs flex items-center justify-center shrink-0">
              {getUserInitials()}
            </div>
            {!isCollapsed && (
              <div className="text-left text-xs min-w-0">
                <div className="font-semibold text-white leading-tight truncate">
                  {user?.fullName || user?.username || 'User'}
                </div>
                <div className="text-[#EFE4D2]/75 text-[10px] uppercase font-mono truncate">
                  {perms.designationTitle}
                </div>
                <div className="text-[#D9A86C] text-[9px] font-mono truncate font-semibold">
                  {user?.branchCode ? `${user.branchCode} • ${user.drawerCode || perms.tierLabel}` : perms.tierLabel}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#EFE4D2] hover:text-white bg-white/10 hover:bg-rose-700 border border-white/15 hover:border-rose-500 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <aside className="hidden md:block shrink-0 sticky top-0 h-screen z-40">
        {renderSidebar(false)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-[#1B130D]/40 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 h-full">{renderSidebar(true)}</aside>
        </div>
      )}
    </>
  );
};

const TopHeaderBar: React.FC<{ onOpenMobile: () => void }> = ({ onOpenMobile }) => {
  const { user } = useAuth();
  const perms = getPermissions(user);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [openPopover, setOpenPopover] = useState(false);

  const loadNotifications = async () => {
    try {
      const [count, listRes] = await Promise.all([
        notificationApi.getUnreadCount(),
        notificationApi.getMyNotifications(0, 8),
      ]);
      setUnreadCount(count || 0);
      setNotifications(listRes.content || []);
    } catch {
      // ignore background notification errors
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user?.username]);

  const handleMarkRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      await loadNotifications();
    } catch {
      /* ignore */
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationApi.markAllAsRead();
      await loadNotifications();
    } catch {
      /* ignore */
    }
  };

  return (
    <header className="border-b border-[#D9C7AB] bg-[#EFE2CE]/90 backdrop-blur sticky top-0 z-30 px-4 sm:px-6 h-14 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="md:hidden p-2 rounded-lg text-[#1B130D] hover:bg-[#E9D9C0]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="text-xs sm:text-sm font-semibold text-[#1B130D] flex items-center gap-2">
          <span>{user?.fullName || user?.username}</span>
          <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-[#261D15] text-[#D9A86C] font-mono text-[11px]">
            {perms.designationTitle}
          </span>
          {user?.branchCode && (
            <span className="hidden md:inline px-2 py-0.5 rounded-full bg-[#E9D9C0] border border-[#CEB896] text-[#3F3124] font-mono text-[11px]">
              {user.branchCode}{user.drawerCode ? ` • ${user.drawerCode}` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Header Notifications Bell */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setOpenPopover((o) => !o);
            if (!openPopover) loadNotifications();
          }}
          className="relative p-2 rounded-xl bg-[#F3E7D4] border border-[#D9C7AB] text-[#1B130D] hover:bg-[#E9D9C0]"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#8E4322] text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {openPopover && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#F3E7D4] border border-[#CEB896] shadow-2xl p-4 space-y-3 z-50">
            <div className="flex items-center justify-between border-b border-[#D9C7AB] pb-2">
              <span className="text-sm font-bold text-[#1B130D]">Branch &amp; Security Alerts</span>
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-xs font-semibold text-[#8E4322] hover:underline"
              >
                Mark all read
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-2">
              {notifications.length === 0 ? (
                <p className="text-xs text-[#3F3124] py-4 text-center">No notifications yet.</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl border text-xs ${
                      n.status === 'READ'
                        ? 'bg-[#EFE2CE]/50 border-[#D9C7AB]/60 text-[#3F3124]'
                        : 'bg-[#EFE2CE] border-[#70411A]/40 text-[#1B130D]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold">{n.title}</span>
                      {n.status !== 'READ' && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(n.id)}
                          className="text-[10px] font-semibold text-[#70411A] hover:underline shrink-0"
                        >
                          Read
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] mt-0.5">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

const AuthenticatedApp: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const perms = getPermissions(user);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F3E7D4] flex items-center justify-center text-[#1B130D]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#70411A] flex items-center justify-center text-white shadow-xl shadow-[#70411A]/25">
            <Landmark className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex items-center space-x-2 text-sm text-[#3F3124]">
            <Loader2 className="w-4 h-4 animate-spin text-[#70411A]" />
            <span>Connecting to Bank...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#F3E7D4] text-[#1B130D] flex font-sans">
      <SidebarNavigation
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopHeaderBar onOpenMobile={() => setMobileMenuOpen(true)} />

        <div className="flex-1">
          <Routes>
            <Route path="/" element={<HomeLanding />} />
            <Route path="/customer" element={<CustomerPortal />} />
            <Route
              path="/teller"
              element={
                perms.canAccessTellerPortal ? (
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <TellerPortal />
                  </div>
                ) : (
                  <AccessRestricted requiredTier="Branch Teller, Bank Manager, Auditor, or Admin" />
                )
              }
            />
            <Route path="/security" element={<MfaSecurityCenter />} />
            <Route
              path="/loans"
              element={
                perms.canAccessLoanWorkbench ? (
                  <LoanOfficerDashboard />
                ) : (
                  <AccessRestricted requiredTier="Loan Officer (Tier 3+)" />
                )
              }
            />
            <Route
              path="/admin"
              element={
                perms.canAccessAdminCompliance ? (
                  <AdminComplianceDashboard />
                ) : (
                  <AccessRestricted requiredTier="Branch Staff / Compliance (Tier 2+)" />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        <footer className="border-t border-[#D9C7AB] py-6 text-center text-xs text-[#3F3124]">
          Bank &bull; Secure Digital Banking Platform &bull; &copy; {new Date().getFullYear()} Bank Inc. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
