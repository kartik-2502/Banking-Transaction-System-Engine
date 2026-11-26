import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  Smartphone,
  Mail,
  Laptop,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Lock,
  KeyRound,
  Activity,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { mfaApi } from '../services/api';
import {
  MfaStatus,
  SecurityEventItem,
  TotpSetupData,
  TrustedDeviceItem,
} from '../types';
import { useAuth } from '../context/AuthContext';

export const MfaSecurityCenter: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [devices, setDevices] = useState<TrustedDeviceItem[]>([]);
  const [events, setEvents] = useState<SecurityEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // TOTP Enrollment State
  const [totpSetup, setTotpSetup] = useState<TotpSetupData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [totpCode, setTotpCode] = useState('');

  // Email OTP Verification State
  const [otpCode, setOtpCode] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);

  // Disable MFA Modal State
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableFactorCode, setDisableFactorCode] = useState('');

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [pwdChallengeId, setPwdChallengeId] = useState<string | null>(null);
  const [pwdOtpCode, setPwdOtpCode] = useState('');

  useEffect(() => {
    loadSecurityData();
  }, []);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      const [st, devs, evts] = await Promise.all([
        mfaApi.getStatus(),
        mfaApi.getTrustedDevices(),
        mfaApi.getSecurityEvents(0, 20, false),
      ]);
      setStatus(st);
      setDevices(devs);
      setEvents(evts.content || []);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Unable to load MFA security data. Ensure you are signed in to the live backend.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartTotpSetup = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      const setup = await mfaApi.setupTotp();
      setTotpSetup(setup);
      const dataUrl = await QRCode.toDataURL(setup.otpAuthUri, {
        width: 192,
        margin: 2,
        color: { dark: '#1B130D', light: '#FFFDF9' },
      });
      setQrDataUrl(dataUrl);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to generate authenticator QR code.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyTotpEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const res = await mfaApi.verifyTotp({ code: totpCode.trim() });
      setFeedback({ type: 'success', message: res.message });
      setTotpSetup(null);
      setQrDataUrl('');
      setTotpCode('');
      await loadSecurityData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Authenticator verification failed.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSendEnrollmentOtp = async (purpose = 'MFA_ENROLLMENT') => {
    setBusy(true);
    setFeedback(null);
    try {
      const sent = await mfaApi.sendOtp(undefined, purpose);
      setOtpMessage(`Code sent to ${sent.maskedDestination}. Expires in ${Math.round(sent.expiresInSeconds / 60)} min.`);
      setOtpCooldown(sent.resendCooldownSeconds || 60);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Unable to dispatch verification code.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleEnableEmailMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const updated = await mfaApi.enableMfa({
        preferredMethod: 'EMAIL_OTP',
        emailOtpEnabled: true,
        otpCode: otpCode.trim() || undefined,
      });
      setStatus(updated);
      setOtpCode('');
      setOtpMessage(null);
      setFeedback({ type: 'success', message: 'Adaptive Email OTP MFA is now enabled on your account.' });
      await loadSecurityData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to enable MFA.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSwitchPreferredMethod = async (method: 'EMAIL_OTP' | 'TOTP') => {
    setBusy(true);
    setFeedback(null);
    try {
      const updated = await mfaApi.enableMfa({ preferredMethod: method, emailOtpEnabled: true });
      setStatus(updated);
      setFeedback({ type: 'success', message: `Preferred MFA method updated to ${method}.` });
      await loadSecurityData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Unable to update preferred MFA method.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const payload =
        status?.preferredMethod === 'TOTP' && status?.totpEnabled
          ? { password: disablePassword, totpCode: disableFactorCode.trim() }
          : { password: disablePassword, otpCode: disableFactorCode.trim() };
      const updated = await mfaApi.disableMfa(payload);
      setStatus(updated);
      setShowDisableModal(false);
      setDisablePassword('');
      setDisableFactorCode('');
      setFeedback({ type: 'success', message: 'Multi-factor authentication has been disabled.' });
      await loadSecurityData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to disable MFA. Verify password and code.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    setBusy(true);
    try {
      await mfaApi.revokeDevice(deviceId);
      setFeedback({ type: 'success', message: `Trusted device ${deviceId} has been revoked.` });
      await loadSecurityData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to revoke device.' });
    } finally {
      setBusy(false);
    }
  };

  const handleRevokeAllDevices = async () => {
    setBusy(true);
    try {
      const res = await mfaApi.revokeAllDevices();
      setFeedback({ type: 'success', message: `Revoked ${res.revokedCount} trusted device(s).` });
      await loadSecurityData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to revoke all devices.' });
    } finally {
      setBusy(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      if (pwdChallengeId && pwdOtpCode.trim()) {
        if (status?.totpEnabled && status?.preferredMethod === 'TOTP') {
          await mfaApi.verifyTotp({ code: pwdOtpCode.trim(), challengeId: pwdChallengeId });
        } else {
          await mfaApi.verifyOtp({ otp: pwdOtpCode.trim(), challengeId: pwdChallengeId, purpose: 'PASSWORD_CHANGE' });
        }
      }
      await mfaApi.changePassword({
        currentPassword,
        newPassword,
        challengeId: pwdChallengeId || undefined,
      });
      setFeedback({ type: 'success', message: 'Account password updated securely.' });
      setCurrentPassword('');
      setNewPassword('');
      setPwdChallengeId(null);
      setPwdOtpCode('');
      await loadSecurityData();
    } catch (err: any) {
      if (err.response?.status === 428 && err.response?.data?.data?.challengeId) {
        const chId = err.response.data.data.challengeId as string;
        setPwdChallengeId(chId);
        if (!(status?.totpEnabled && status?.preferredMethod === 'TOTP')) {
          await mfaApi.sendOtp(chId, 'PASSWORD_CHANGE').catch(() => {});
        }
        setFeedback({
          type: 'error',
          message: 'Password change requires verification. Enter the code sent to your registered channel and resubmit.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: err.response?.data?.message || 'Failed to update password.',
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const activeDevices = devices.filter((d) => !d.revoked);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#E9D9C0] p-6 rounded-2xl border border-[#CEB896] shadow-md">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#261D15] to-[#70411A] flex items-center justify-center text-[#D9A86C] shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1B130D] tracking-tight">
              Adaptive Security &amp; Multi-Factor Authentication
            </h1>
            <p className="text-sm text-[#3F3124]">
              Manage Email OTP, Google Authenticator (TOTP), trusted devices, and risk alerts for{' '}
              <span className="font-semibold text-[#70411A]">{user?.fullName || user?.username}</span>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadSecurityData}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-[#70411A] hover:bg-[#542F11] text-white text-xs font-semibold flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Security Profile
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-400'
              : 'bg-rose-100 text-rose-900 border border-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Upper Summary Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-[#E9D9C0] border border-[#CEB896] shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-[#3F3124]">
            <span>MFA Protection</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                status?.mfaEnabled
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                  : 'bg-amber-100 text-amber-950 border-amber-400'
              }`}
            >
              {status?.mfaEnabled ? 'ENABLED' : 'ADAPTIVE ONLY'}
            </span>
          </div>
          <div className="text-xl font-bold text-[#1B130D]">
            {status?.preferredMethod === 'TOTP' ? 'Authenticator App (TOTP)' : 'Email OTP'}
          </div>
          <p className="text-xs text-[#3F3124]">
            Risk-based step-up always protects unrecognized devices and high-value transfers.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#E9D9C0] border border-[#CEB896] shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-[#3F3124]">
            <span>Trusted Devices</span>
            <Laptop className="w-4 h-4 text-[#70411A]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#1B130D]">
            {status?.trustedDevicesCount ?? activeDevices.length}
          </div>
          <p className="text-xs text-[#3F3124]">
            Registered devices with active 30-day cryptographic fingerprint bindings.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#E9D9C0] border border-[#CEB896] shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-[#3F3124]">
            <span>Last Verified Sign-In</span>
            <Activity className="w-4 h-4 text-[#70411A]" />
          </div>
          <div className="text-sm font-mono font-bold text-[#1B130D]">
            {status?.lastLoginAt ? new Date(status.lastLoginAt).toLocaleString() : 'First Session'}
          </div>
          <p className="text-xs font-mono text-[#3F3124]">
            IP: {status?.lastLoginIp || '127.0.0.1'} &bull; Failed attempts: {status?.failedLoginAttempts ?? 0}
          </p>
        </div>
      </div>

      {/* Main Grid: Enrollment + TOTP Setup + Password */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: MFA Enrollment & Email OTP / TOTP Setup */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-[#EFE2CE] rounded-2xl border border-[#D9C7AB] shadow-md p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#D9C7AB] pb-3">
              <div>
                <h2 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#70411A]" /> Email OTP &amp; MFA Controls
                </h2>
                <p className="text-xs text-[#3F3124]">Enable mandatory MFA and choose your primary verification channel.</p>
              </div>
              {status?.mfaEnabled && (
                <button
                  type="button"
                  onClick={() => setShowDisableModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 text-xs font-semibold"
                >
                  Disable MFA
                </button>
              )}
            </div>

            {status?.mfaEnabled && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleSwitchPreferredMethod('EMAIL_OTP')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    status.preferredMethod === 'EMAIL_OTP'
                      ? 'bg-[#70411A] text-white border-[#70411A]'
                      : 'bg-[#EBDEC8] text-[#1B130D] border-[#D9C7AB]'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email OTP
                  </div>
                  <div className="text-[11px] opacity-85 mt-0.5">5-minute salted code</div>
                </button>
                <button
                  type="button"
                  disabled={busy || !status.totpEnabled}
                  onClick={() => handleSwitchPreferredMethod('TOTP')}
                  className={`p-3 rounded-xl border text-left transition-all disabled:opacity-50 ${
                    status.preferredMethod === 'TOTP'
                      ? 'bg-[#70411A] text-white border-[#70411A]'
                      : 'bg-[#EBDEC8] text-[#1B130D] border-[#D9C7AB]'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" /> Authenticator TOTP
                  </div>
                  <div className="text-[11px] opacity-85 mt-0.5">
                    {status.totpEnabled ? 'Active & verified' : 'Setup required below'}
                  </div>
                </button>
              </div>
            )}

            {!status?.mfaEnabled && (
              <form onSubmit={handleEnableEmailMfa} className="space-y-3 text-xs">
                {otpMessage && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900">
                    {otpMessage}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy || otpCooldown > 0}
                    onClick={() => handleSendEnrollmentOtp('MFA_ENROLLMENT')}
                    className="px-3.5 py-2 rounded-xl bg-[#EBDEC8] hover:bg-[#E9D9C0] border border-[#CEB896] text-[#1B130D] font-semibold disabled:opacity-50"
                  >
                    {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Send Enrollment OTP'}
                  </button>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit OTP (optional)"
                    className="flex-1 bg-white border border-[#9A7C59] rounded-xl px-3 py-2 font-mono text-[#1B130D]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-2.5 rounded-xl bg-[#70411A] hover:bg-[#542F11] text-white font-semibold"
                >
                  Enable Mandatory Email OTP MFA
                </button>
              </form>
            )}
          </div>

          {/* Authenticator App (TOTP) Setup */}
          <div className="bg-[#EFE2CE] rounded-2xl border border-[#D9C7AB] shadow-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9C7AB] pb-3">
              <div>
                <h2 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#70411A]" /> Google Authenticator / TOTP Setup
                </h2>
                <p className="text-xs text-[#3F3124]">
                  {status?.totpEnabled
                    ? 'Authenticator TOTP is currently active and encrypted at rest.'
                    : 'Pair any RFC 6238 authenticator app (Google Authenticator, Authy, 1Password).'}
                </p>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  status?.totpEnabled
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                    : 'bg-[#EBDEC8] text-[#3F3124] border-[#D9C7AB]'
                }`}
              >
                {status?.totpEnabled ? 'CONFIGURED' : 'NOT SET UP'}
              </span>
            </div>

            {!totpSetup ? (
              <button
                type="button"
                disabled={busy}
                onClick={handleStartTotpSetup}
                className="px-4 py-2.5 rounded-xl bg-[#70411A] hover:bg-[#542F11] text-white text-xs font-semibold inline-flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                {status?.totpEnabled ? 'Rotate Authenticator Key' : 'Generate Authenticator QR Code'}
              </button>
            ) : (
              <form onSubmit={handleVerifyTotpEnrollment} className="space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-[#FFFDF9] border border-[#CEB896]">
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="Authenticator QR Code"
                      className="w-40 h-40 rounded-lg border border-[#D9C7AB]"
                    />
                  )}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="font-bold text-[#1B130D]">Scan QR Code or Enter Setup Key</div>
                    <p className="text-[#3F3124]">
                      Scan with your authenticator app, then enter the 6-digit code below to activate.
                    </p>
                    <div className="p-2 rounded-lg bg-[#EBDEC8] border border-[#D9C7AB] font-mono text-[11px] break-all text-[#1B130D]">
                      {totpSetup.manualEntryKey}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit TOTP code"
                    className="flex-1 bg-white border border-[#9A7C59] rounded-xl px-3 py-2 font-mono text-sm tracking-widest text-[#1B130D]"
                  />
                  <button
                    type="submit"
                    disabled={busy || totpCode.length < 6}
                    className="px-4 py-2 rounded-xl bg-[#70411A] hover:bg-[#542F11] disabled:opacity-50 text-white font-semibold"
                  >
                    Verify &amp; Activate
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTotpSetup(null);
                      setQrDataUrl('');
                    }}
                    className="px-3 py-2 rounded-xl bg-[#EBDEC8] border border-[#D9C7AB] text-[#3F3124] font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Sensitive Password Change (AMFA Protected) */}
          <div className="bg-[#EFE2CE] rounded-2xl border border-[#D9C7AB] shadow-md p-6 space-y-4">
            <h2 className="text-base font-bold text-[#1B130D] flex items-center gap-2 border-b border-[#D9C7AB] pb-3">
              <Lock className="w-4 h-4 text-[#8E4322]" /> Change Password (AMFA Protected)
            </h2>
            <form onSubmit={handleChangePasswordSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1B130D] mb-1">Current Password</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1B130D] mb-1">New Password (min 8 chars)</label>
                  <div className="relative">
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 pr-8 text-[#1B130D]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((s) => !s)}
                      className="absolute right-2.5 top-2.5 text-[#3F3124]"
                    >
                      {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {pwdChallengeId && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 space-y-2">
                  <div className="font-semibold text-amber-950">
                    Challenge {pwdChallengeId}: Enter your verification code
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={pwdOtpCode}
                    onChange={(e) => setPwdOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit OTP or TOTP code"
                    className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 font-mono text-[#1B130D]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-xl bg-[#8E4322] hover:bg-[#4E3424] text-white font-semibold"
              >
                {pwdChallengeId ? 'Confirm Verification & Update Password' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Trusted Devices & Recent Security Events */}
        <div className="lg:col-span-6 space-y-6">
          {/* Trusted Devices */}
          <div className="bg-[#EFE2CE] rounded-2xl border border-[#D9C7AB] shadow-md p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9C7AB] pb-3">
              <div>
                <h2 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-[#70411A]" /> Trusted Devices Management
                </h2>
                <p className="text-xs text-[#3F3124]">Revoke unrecognized or lost devices immediately.</p>
              </div>
              {activeDevices.length > 0 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleRevokeAllDevices}
                  className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 text-xs font-semibold"
                >
                  Revoke All Devices
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 text-xs">
              {activeDevices.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-[#EBDEC8] border border-dashed border-[#D9C7AB] text-[#3F3124]">
                  No active trusted devices registered yet. Trust a device during MFA login verification.
                </div>
              ) : (
                activeDevices.map((dev) => (
                  <div
                    key={dev.deviceId}
                    className="p-3.5 rounded-xl bg-[#EBDEC8] border border-[#D9C7AB] flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-bold text-[#1B130D] flex items-center gap-2">
                        <span>{dev.deviceName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-400">
                          TRUSTED
                        </span>
                      </div>
                      <div className="text-[#3F3124]">
                        {dev.browser} &bull; {dev.operatingSystem} &bull; IP: {dev.ipAddress || 'Unknown'}
                      </div>
                      <div className="font-mono text-[10px] text-[#3F3124]">
                        Last login: {new Date(dev.lastLoginAt).toLocaleString()} &bull; ID: {dev.deviceId}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleRevokeDevice(dev.deviceId)}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-800 border border-rose-300 text-[11px] font-semibold inline-flex items-center gap-1 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Revoke
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Security Activity & Alerts */}
          <div className="bg-[#EFE2CE] rounded-2xl border border-[#D9C7AB] shadow-md p-6 space-y-4">
            <div className="border-b border-[#D9C7AB] pb-3">
              <h2 className="text-base font-bold text-[#1B130D] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#8E4322]" /> Recent Login Activity &amp; Security Alerts
              </h2>
              <p className="text-xs text-[#3F3124]">Real-time security audit events (secrets and OTPs are never stored).</p>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs">
              {events.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-[#EBDEC8] border border-dashed border-[#D9C7AB] text-[#3F3124]">
                  No security events recorded yet.
                </div>
              ) : (
                events.map((ev) => (
                  <div
                    key={ev.eventId}
                    className="p-3 rounded-xl bg-[#EBDEC8] border border-[#D9C7AB] space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-[#1B130D]">{ev.eventType}</span>
                      <div className="flex items-center gap-1.5">
                        {ev.riskLevel && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E9D9C0] border border-[#CEB896] text-[#70411A]">
                            {ev.riskLevel}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ev.outcome === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-900'
                              : ev.outcome === 'BLOCKED' || ev.outcome === 'FAILED'
                              ? 'bg-rose-100 text-rose-900'
                              : 'bg-amber-100 text-amber-950'
                          }`}
                        >
                          {ev.outcome}
                        </span>
                      </div>
                    </div>
                    {ev.details && <div className="text-[#3F3124]">{ev.details}</div>}
                    <div className="font-mono text-[10px] text-[#3F3124]">
                      {new Date(ev.createdAt).toLocaleString()} &bull; IP: {ev.ipAddress || 'N/A'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Disable MFA */}
      {showDisableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B130D]/40 backdrop-blur-sm">
          <div className="bg-[#EBDEC8] border border-[#D9C7AB] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#D9C7AB] pb-3">
              <h3 className="font-bold text-base text-[#1B130D]">Confirm Disable MFA</h3>
              <button onClick={() => setShowDisableModal(false)} className="text-[#3F3124]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[#3F3124]">
              Enter your current password and an active verification code to disable MFA.
            </p>
            <form onSubmit={handleDisableMfa} className="space-y-3">
              <div>
                <label className="block font-semibold text-[#1B130D] mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 text-[#1B130D]"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-[#1B130D]">
                    {status?.preferredMethod === 'TOTP' && status?.totpEnabled ? 'TOTP Code' : 'Email OTP Code'}
                  </label>
                  {!(status?.preferredMethod === 'TOTP' && status?.totpEnabled) && (
                    <button
                      type="button"
                      disabled={otpCooldown > 0}
                      onClick={() => handleSendEnrollmentOtp('SENSITIVE_OPERATION')}
                      className="text-[#70411A] font-semibold underline disabled:opacity-50"
                    >
                      {otpCooldown > 0 ? `Resend (${otpCooldown}s)` : 'Send OTP'}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={disableFactorCode}
                  onChange={(e) => setDisableFactorCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit code"
                  className="w-full bg-white border border-[#9A7C59] rounded-xl px-3 py-2 font-mono text-[#1B130D]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisableModal(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#D9C7AB] text-[#3F3124] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-semibold"
                >
                  Disable MFA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
