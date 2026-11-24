import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRightLeft,
  AlertTriangle,
  UserCheck,
  FileCheck2,
  Lock,
  Zap
} from 'lucide-react';
import LoanOfficerDashboard from './pages/LoanOfficerDashboard';

const HomeLanding: React.FC = () => {
  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col justify-center">
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium uppercase tracking-wider">
          Final-Year B.Tech Capstone Project &bull; Banking Engine
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Multi-Threaded Banking <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
            Transaction Processing System
          </span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg">
          Engineered with Spring Boot 3, Java 17 LTS, PostgreSQL row-level locking, bounded multithreaded workers, strict idempotency enforcement, rule-based fraud detection, and role-based loan underwriting.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            to="/loans"
            className="inline-flex items-center px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all"
          >
            <UserCheck className="w-5 h-5 mr-2" />
            Loan Officer Workbench
          </Link>
          <a
            href="#architecture"
            className="inline-flex items-center px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition-colors"
          >
            <Zap className="w-4 h-4 mr-2 text-amber-400" />
            Engine Highlights
          </a>
        </div>

        <div id="architecture" className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 text-left">
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 shadow-sm">
            <ArrowRightLeft className="w-5 h-5 text-blue-400 mb-2" />
            <div className="text-xl font-bold text-white">50,000+</div>
            <div className="text-xs text-slate-400">Target Benchmark Load</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 shadow-sm">
            <Lock className="w-5 h-5 text-emerald-400 mb-2" />
            <div className="text-xl font-bold text-white">SELECT FOR UPDATE</div>
            <div className="text-xs text-slate-400">Pessimistic Row Locking</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-400 mb-2" />
            <div className="text-xl font-bold text-white">Rule-Based</div>
            <div className="text-xs text-slate-400">Fraud Detection Engine</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 shadow-sm">
            <FileCheck2 className="w-5 h-5 text-purple-400 mb-2" />
            <div className="text-xl font-bold text-white">Loan Officer</div>
            <div className="text-xs text-slate-400">Underwriting & RBAC</div>
          </div>
        </div>
      </div>
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-white flex flex-col">
        {/* Navigation Bar */}
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight">ApexBank</span>
                <span className="text-xs text-blue-400 block font-mono">CORE TRANSACTION ENGINE</span>
              </div>
            </Link>

            <nav className="flex items-center space-x-6 text-sm font-medium text-slate-300">
              <Link to="/" className="hover:text-blue-400 transition-colors">Overview</Link>
              <Link to="/loans" className="hover:text-indigo-400 text-indigo-300 font-semibold flex items-center gap-1.5 transition-colors">
                <UserCheck className="w-4 h-4" />
                Loan Officer
              </Link>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                System Active
              </span>
            </nav>
          </div>
        </header>

        {/* Dynamic Route View */}
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<HomeLanding />} />
            <Route path="/loans" element={<LoanOfficerDashboard />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
          Apex Banking Systems &bull; High-Concurrency Transaction Engine &bull; Java 17 LTS / Spring Boot 3 / Vite React TS / PostgreSQL
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
