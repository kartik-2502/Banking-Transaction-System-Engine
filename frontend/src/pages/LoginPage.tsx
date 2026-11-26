import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Landmark,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  UserCheck,
  ShieldAlert,
  Briefcase,
  Activity,
  Mail,
  Smartphone,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthResponseData } from '../types';
import { mfaApi } from '../services/api';

export const LoginPage: React.FC = () => {
  const { login, completeMfaLogin } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Adaptive MFA Challenge State
  const [mfaChallenge, setMfaChallenge] = useState<AuthResponseData | null>(null);
  const [mfaMethod, setMfaMethod] = useState<'EMAIL_OTP' | 'TOTP'>('EMAIL_OTP');
  const [mfaCode, setMfaCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(true);
  const [otpInfo, setOtpInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [pendingRoute, setPendingRoute] = useState('/customer');

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const routeForUser = (userStr: string) => {
    const lowerUser = userStr.trim().toLowerCase();
    if (lowerUser.includes('loan') || lowerUser === 'ananya_verma') return '/loans';
    if (lowerUser.includes('admin') || lowerUser.includes('analyst') || lowerUser === 'kavya_nair') return '/admin';
    return '/customer';
  };

  const handleTriggerOtp = async (challengeData: AuthResponseData) => {
    if (!challengeData.mfaPendingToken || !challengeData.challengeId) return;
    try {
      const sent = await mfaApi.sendOtp(challengeData.challengeId, 'LOGIN_MFA', challengeData.mfaPendingToken);
      setOtpInfo(`Verification code sent to ${sent.maskedDestination} (valid ${Math.round(sent.expiresInSeconds / 60)} min).`);
      setCooldown(sent.resendCooldownSeconds || 60);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to send OTP right now.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setError(null);
    setOtpInfo(null);
    setIsSubmitting(true);

    try {
      const result = await login(username, password);
      const targetRoute = routeForUser(username);
      if (result.success) {
        navigate(targetRoute);
      } else if (result.mfaRequired && result.mfaData) {
        setPendingRoute(targetRoute);
        setMfaChallenge(result.mfaData);
        const preferred = result.mfaData.requiredMethod === 'TOTP' ? 'TOTP' : 'EMAIL_OTP';
        setMfaMethod(preferred);
        if (preferred === 'EMAIL_OTP') {
          await handleTriggerOtp(result.mfaData);
        }
      } else {
        setError(result.error || 'Invalid credentials. Please try again.');
      }
    } catch (err: any) {
      setError('An unexpected error occurred while connecting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (userChoice: string, roleRoute: string) => {
    setUsername(userChoice);
    setPassword('password');
    setError(null);
    setOtpInfo(null);
    setIsSubmitting(true);

    try {
      const result = await login(userChoice, 'password');
      if (result.success) {
        navigate(roleRoute);
      } else if (result.mfaRequired && result.mfaData) {
        setPendingRoute(roleRoute);
        setMfaChallenge(result.mfaData);
        const preferred = result.mfaData.requiredMethod === 'TOTP' ? 'TOTP' : 'EMAIL_OTP';
        setMfaMethod(preferred);
        if (preferred === 'EMAIL_OTP') {
          await handleTriggerOtp(result.mfaData);
        }
      } else {
        setError(result.error || 'Quick login failed.');
      }
    } catch (err: any) {
      setError('Connection error during quick sign-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaChallenge?.mfaPendingToken || !mfaChallenge.challengeId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const res =
        mfaMethod === 'TOTP'
          ? await mfaApi.verifyTotp(
              { code: mfaCode.trim(), challengeId: mfaChallenge.challengeId, trustDevice },
              mfaChallenge.mfaPendingToken
            )
          : await mfaApi.verifyOtp(
              { otp: mfaCode.trim(), challengeId: mfaChallenge.challengeId, purpose: 'LOGIN_MFA', trustDevice },
              mfaChallenge.mfaPendingToken
            );

      if (res.verified && res.auth) {
        completeMfaLogin(res.auth);
        navigate(pendingRoute);
      } else {
        setError(res.message || 'Verification failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Check your code and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3E7D4] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#9A7C59]/20 to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#70411A] text-white shadow-lg shadow-[#70411A]/25 mb-4">
            <Landmark className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B130D]">Bank</h1>
          <p className="mt-2 text-sm text-[#3F3124]">
            Sign in to access your accounts and banking services
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#EFE2CE] border border-[#D9C7AB] shadow-md rounded-2xl p-6 sm:p-8 shadow-xl shadow-[#1B130D]/5">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mfaChallenge ? (
            <form onSubmit={handleVerifyMfa} className="space-y-5">
              <div className="p-4 rounded-xl bg-[#E9D9C0] border border-[#CEB896] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#70411A] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Adaptive Verification
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-400">
                    {mfaChallenge.riskLevel} RISK ({mfaChallenge.riskScore || 0})
                  </span>
                </div>
                {mfaChallenge.riskReasons && mfaChallenge.riskReasons.length > 0 && (
                  <ul className="text-xs text-[#3F3124] list-disc list-inside space-y-0.5">
                    {mfaChallenge.riskReasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                )}
              </div>

              {otpInfo && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{otpInfo}</span>
                </div>
              )}

              {mfaChallenge.requiredMethod === 'EMAIL_OTP_OR_TOTP' && (
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setMfaMethod('EMAIL_OTP')}
                    className={`py-2 rounded-xl border flex items-center justify-center gap-1.5 ${
                      mfaMethod === 'EMAIL_OTP'
                        ? 'bg-[#70411A] text-white border-[#70411A]'
                        : 'bg-[#EBDEC8] text-[#3F3124] border-[#D9C7AB]'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" /> Email OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => setMfaMethod('TOTP')}
                    className={`py-2 rounded-xl border flex items-center justify-center gap-1.5 ${
                      mfaMethod === 'TOTP'
                        ? 'bg-[#70411A] text-white border-[#70411A]'
                        : 'bg-[#EBDEC8] text-[#3F3124] border-[#D9C7AB]'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Authenticator
                  </button>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#3F3124] uppercase tracking-wider">
                    {mfaMethod === 'TOTP' ? '6-Digit Authenticator Code' : '6-Digit Email Verification Code'}
                  </label>
                  {mfaMethod === 'EMAIL_OTP' && (
                    <button
                      type="button"
                      disabled={cooldown > 0}
                      onClick={() => handleTriggerOtp(mfaChallenge)}
                      className="text-xs font-semibold text-[#70411A] hover:underline disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> {cooldown > 0 ? `Resend (${cooldown}s)` : 'Send / Resend OTP'}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit code"
                  className="w-full bg-white border border-[#9A7C59] rounded-xl px-4 py-2.5 text-center font-mono text-lg tracking-[0.35em] text-[#1B130D] focus:outline-none focus:ring-2 focus:ring-[#70411A]"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-[#3F3124] cursor-pointer">
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="rounded accent-[#70411A]"
                />
                <span>Trust this device for 30 days</span>
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMfaChallenge(null);
                    setMfaCode('');
                    setOtpInfo(null);
                    setError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#EBDEC8] border border-[#D9C7AB] text-xs font-semibold text-[#3F3124]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || mfaCode.length < 6}
                  className="flex-1 py-2.5 rounded-xl bg-[#70411A] hover:bg-[#542F11] disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Verify &amp; Continue</span>
                </button>
              </div>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#3F3124] uppercase tracking-wider mb-2">
                Username or Customer ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#3F3124]/70">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. aarav_sharma"
                  disabled={isSubmitting}
                  className="w-full bg-white border border-[#9A7C59] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#1B130D] placeholder-[#3F3124]/50 focus:outline-none focus:ring-2 focus:ring-[#70411A] focus:border-transparent transition-all"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-[#3F3124] uppercase tracking-wider">
                  Password
                </label>
                <span className="text-xs text-[#70411A] font-medium">
                  Default: password
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#3F3124]/70">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="w-full bg-white border border-[#9A7C59] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#1B130D] placeholder-[#3F3124]/50 focus:outline-none focus:ring-2 focus:ring-[#70411A] focus:border-transparent transition-all"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#3F3124] hover:text-[#1B130D] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-[#70411A] hover:bg-[#542F11] text-white font-semibold text-sm transition-all shadow-md shadow-[#70411A]/20 disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
          )}

          {/* Quick Sign-In Pills */}
          <div className="mt-8 pt-6 border-t border-[#D9C7AB]">
            <p className="text-xs font-semibold text-[#3F3124] uppercase tracking-wider text-center mb-3">
              Quick Sign-In (Demo Access)
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('aarav_sharma', '/customer')}
                disabled={isSubmitting}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#EBDEC8]/70 hover:bg-[#EFE4D2] border border-[#D9C7AB] hover:border-[#9A7C59] text-left transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EFE2CE] border border-[#D9C7AB] shadow-md text-[#70411A] flex items-center justify-center">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1B130D] group-hover:text-[#70411A] transition-colors">
                      Aarav Sharma
                    </div>
                    <div className="text-xs text-[#3F3124]">Tier 1: Customer &bull; ACC1001</div>
                  </div>
                </div>
                <span className="text-xs text-[#3F3124] group-hover:text-[#1B130D] transition-colors flex items-center gap-1 font-mono">
                  Sign in &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('rohan_kulkarni', '/customer')}
                disabled={isSubmitting}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#EBDEC8]/70 hover:bg-[#EFE4D2] border border-[#D9C7AB] hover:border-[#9A7C59] text-left transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EFE2CE] border border-[#D9C7AB] shadow-md text-[#8E4322] flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1B130D] group-hover:text-[#8E4322] transition-colors">
                      Rohan Kulkarni
                    </div>
                    <div className="text-xs text-[#3F3124]">Tier 2: Branch Teller &bull; Operations</div>
                  </div>
                </div>
                <span className="text-xs text-[#3F3124] group-hover:text-[#1B130D] transition-colors flex items-center gap-1 font-mono">
                  Sign in &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ananya_verma', '/loans')}
                disabled={isSubmitting}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#EBDEC8]/70 hover:bg-[#EFE4D2] border border-[#D9C7AB] hover:border-[#9A7C59] text-left transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EFE2CE] border border-[#D9C7AB] shadow-md text-amber-800 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1B130D] group-hover:text-amber-900 transition-colors">
                      Ananya Verma
                    </div>
                    <div className="text-xs text-[#3F3124]">Tier 3: Loan Officer &bull; Underwriting</div>
                  </div>
                </div>
                <span className="text-xs text-[#3F3124] group-hover:text-[#1B130D] transition-colors flex items-center gap-1 font-mono">
                  Sign in &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('kavya_nair', '/admin')}
                disabled={isSubmitting}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#EBDEC8]/70 hover:bg-[#EFE4D2] border border-[#D9C7AB] hover:border-[#9A7C59] text-left transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EFE2CE] border border-[#D9C7AB] shadow-md text-[#4E3424] flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1B130D] group-hover:text-[#4E3424] transition-colors">
                      Kavya Nair
                    </div>
                    <div className="text-xs text-[#3F3124]">Tier 4: Risk Analyst &bull; Governance</div>
                  </div>
                </div>
                <span className="text-xs text-[#3F3124] group-hover:text-[#1B130D] transition-colors flex items-center gap-1 font-mono">
                  Sign in &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('system_administrator', '/admin')}
                disabled={isSubmitting}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#EBDEC8]/70 hover:bg-[#EFE4D2] border border-[#D9C7AB] hover:border-[#9A7C59] text-left transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-[#70411A] text-white flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1B130D] group-hover:text-[#70411A] transition-colors">
                      System Administrator
                    </div>
                    <div className="text-xs text-[#3F3124]">Tier 5: System Admin &bull; Full Authority</div>
                  </div>
                </div>
                <span className="text-xs text-[#3F3124] group-hover:text-[#1B130D] transition-colors flex items-center gap-1 font-mono">
                  Sign in &rarr;
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Assurance */}
        <div className="mt-8 text-center flex items-center justify-center gap-2 text-xs text-[#3F3124]">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>256-bit SSL encrypted &bull; Role-based access control</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
