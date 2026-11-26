import React from 'react';
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
  Loader2
} from 'lucide-react';
import CustomerPortal from './pages/CustomerPortal';
import LoanOfficerDashboard from './pages/LoanOfficerDashboard';
import AdminComplianceDashboard from './pages/AdminComplianceDashboard';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';

const HomeLanding: React.FC = () => {
  const { user } = useAuth();

  const getFirstName = () => {
    if (user?.fullName) return user.fullName.split(' ')[0];
    if (user?.username) return user.username;
    return 'Customer';
  };

  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col justify-center">
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Secure Digital Banking Platform
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
          Welcome back, {getFirstName()}
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Manage your accounts, review credit applications, transfer funds securely, and monitor transactions in real time.
        </p>

        {/* Primary Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6 text-left">
          <Link
            to="/customer"
            className="group p-6 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition-all duration-200 shadow-lg hover:shadow-blue-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Wallet className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                Personal Banking
              </h2>
              <p className="text-sm text-slate-400 mt-2 leading-normal">
                Check balances, make instant deposits or transfers, and apply for personal loans.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-medium text-blue-400 group-hover:translate-x-1 transition-transform">
              Open portal <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          <Link
            to="/loans"
            className="group p-6 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 transition-all duration-200 shadow-lg hover:shadow-indigo-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">
                Loan Underwriting
              </h2>
              <p className="text-sm text-slate-400 mt-2 leading-normal">
                Assess applicant eligibility, evaluate creditworthiness, review debt ratios, and approve disbursements.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-medium text-indigo-400 group-hover:translate-x-1 transition-transform">
              Open workbench <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          <Link
            to="/admin"
            className="group p-6 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/50 transition-all duration-200 shadow-lg hover:shadow-purple-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                Compliance & Risk
              </h2>
              <p className="text-sm text-slate-400 mt-2 leading-normal">
                Real-time fraud surveillance, daily throughput trends, account controls, and audit trails.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-medium text-purple-400 group-hover:translate-x-1 transition-transform">
              Open compliance <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        </div>

        {/* Bank Feature Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 text-left">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 shadow-sm">
            <ArrowRightLeft className="w-5 h-5 text-blue-400 mb-2" />
            <div className="text-base font-semibold text-white">Instant Settlement</div>
            <div className="text-xs text-slate-400 mt-1">Real-time ledger updates across all accounts</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
            <div className="text-base font-semibold text-white">Bank-Grade Security</div>
            <div className="text-xs text-slate-400 mt-1">Token-based authentication & strict RBAC</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 shadow-sm">
            <CreditCard className="w-5 h-5 text-indigo-400 mb-2" />
            <div className="text-base font-semibold text-white">Credit Underwriting</div>
            <div className="text-xs text-slate-400 mt-1">Automated DTI calculation & repayment schedules</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 shadow-sm">
            <Building2 className="w-5 h-5 text-purple-400 mb-2" />
            <div className="text-base font-semibold text-white">Fraud Prevention</div>
            <div className="text-xs text-slate-400 mt-1">Automated velocity checks & suspicious alert triage</div>
          </div>
        </div>
      </div>
    </main>
  );
};

const NavigationBar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const getUserInitials = () => {
    if (user?.fullName) {
      const parts = user.fullName.split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (user?.username) return user.username.slice(0, 2).toUpperCase();
    return 'BK';
  };

  const getRoleDisplayName = () => {
    if (!user || !user.roles || user.roles.length === 0) return 'Member';
    const primary = user.roles[0];
    switch (primary) {
      case 'ADMIN':
        return 'Administrator';
      case 'LOAN_OFFICER':
        return 'Loan Officer';
      case 'CUSTOMER':
        return 'Customer';
      case 'TELLER':
        return 'Teller';
      case 'RISK_ANALYST':
        return 'Risk Analyst';
      default:
        return primary;
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-blue-600/20 group-hover:bg-blue-500 transition-colors">
            <Landmark className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Bank</span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center space-x-1 sm:space-x-3 text-sm font-medium">
          <Link
            to="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              isActive('/')
                ? 'bg-slate-800 text-blue-400 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </Link>
          <Link
            to="/customer"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              isActive('/customer')
                ? 'bg-slate-800 text-blue-400 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Personal Banking</span>
          </Link>
          <Link
            to="/loans"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              isActive('/loans')
                ? 'bg-slate-800 text-indigo-400 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Loan Desk</span>
          </Link>
          <Link
            to="/admin"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              isActive('/admin')
                ? 'bg-slate-800 text-purple-400 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="hidden sm:inline">Admin & Risk</span>
          </Link>
        </nav>

        {/* User Profile & Sign Out */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center">
              {getUserInitials()}
            </div>
            <div className="text-left text-xs">
              <div className="font-semibold text-white leading-tight">
                {user?.fullName || user?.username || 'User'}
              </div>
              <div className="text-slate-400 text-[10px] uppercase font-mono">
                {getRoleDisplayName()}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-rose-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/25">
            <Landmark className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
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
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
      <NavigationBar />

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomeLanding />} />
          <Route path="/customer" element={<CustomerPortal />} />
          <Route path="/loans" element={<LoanOfficerDashboard />} />
          <Route path="/admin" element={<AdminComplianceDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        Bank &bull; Secure Digital Banking Platform &bull; &copy; {new Date().getFullYear()} Bank Inc. All rights reserved.
      </footer>
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
