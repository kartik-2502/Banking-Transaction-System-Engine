import axios from 'axios';
import {
  Account,
  AccountRiskProfile,
  ApiResponse,
  AuthResponseData,
  DailyTransactionTrend,
  FailedTransactionSummary,
  FraudAlert,
  Loan,
  LoanEligibilityAssessment,
  LoanOfficerDashboardStats,
  LoanPortfolioAnalytics,
  LoanRepaymentSchedule,
  MfaStatus,
  NotificationItem,
  OtpSendResult,
  SecurityEventItem,
  SystemOverviewAnalytics,
  TopAccountVolume,
  TotpSetupData,
  Transaction,
  TrustedDeviceItem,
  ChallengeVerifyResult,
} from '../types';
import { getDeviceMetadata } from '../utils/deviceFingerprint';

const API_BASE_URL = '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token and device metadata headers if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('bank_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const meta = getDeviceMetadata();
  config.headers['X-Device-Fingerprint'] = meta.deviceFingerprint;
  config.headers['X-Device-Name'] = meta.deviceName;
  config.headers['X-Browser-Name'] = meta.browser;
  config.headers['X-OS-Name'] = meta.operatingSystem;
  return config;
});

// Auth API
export const authApi = {
  login: async (username: string, password: string): Promise<AuthResponseData> => {
    const meta = getDeviceMetadata();
    const res = await apiClient.post<ApiResponse<AuthResponseData>>('/api/auth/login', {
      username,
      password,
      ...meta,
    });
    return res.data.data;
  },
  getCurrentUser: async () => {
    const res = await apiClient.get<ApiResponse<any>>('/api/auth/me');
    return res.data.data;
  },
};

// Accounts API
export const accountApi = {
  getAccounts: async (page = 0, size = 20) => {
    const res = await apiClient.get<ApiResponse<{ content: Account[]; totalElements: number }>>(
      `/api/accounts?page=${page}&size=${size}`
    );
    return res.data.data;
  },
  getAccountByNumber: async (accountNumber: string) => {
    const res = await apiClient.get<ApiResponse<Account>>(`/api/accounts/${accountNumber}`);
    return res.data.data;
  },
  getTransferTargets: async () => {
    const res = await apiClient.get<ApiResponse<Account[]>>('/api/accounts/transfer-targets');
    return res.data.data;
  },
  getRiskProfile: async (accountNumber: string) => {
    const res = await apiClient.get<ApiResponse<AccountRiskProfile>>(`/api/accounts/${accountNumber}/risk`);
    return res.data.data;
  },
  freezeAccount: async (accountNumber: string, reason: string, changedBy: string) => {
    const res = await apiClient.post<ApiResponse<Account>>(`/api/accounts/${accountNumber}/freeze`, {
      reason,
      changedBy,
    });
    return res.data.data;
  },
  unfreezeAccount: async (accountNumber: string, reason: string, changedBy: string) => {
    const res = await apiClient.post<ApiResponse<Account>>(`/api/accounts/${accountNumber}/unfreeze`, {
      reason,
      changedBy,
    });
    return res.data.data;
  },
  updateLimits: async (accountNumber: string, dailyLimit: number, perTransactionLimit: number, updatedBy: string) => {
    const res = await apiClient.put<ApiResponse<any>>(`/api/accounts/${accountNumber}/limits`, {
      dailyLimit,
      perTransactionLimit,
      updatedBy,
    });
    return res.data.data;
  },
  updateStatus: async (accountNumber: string, status: string, reason: string, changedBy: string) => {
    const res = await apiClient.put<ApiResponse<Account>>(`/api/accounts/${accountNumber}/status`, {
      status,
      reason,
      changedBy,
    });
    return res.data.data;
  },
};

// Transactions API
export const transactionApi = {
  deposit: async (accountNumber: string, amount: number, initiatedBy: string) => {
    const txnId = `TXN_DEP_${Date.now()}`;
    const res = await apiClient.post<ApiResponse<Transaction>>('/api/transactions/deposit', {
      transactionId: txnId,
      accountNumber,
      amount,
      initiatedBy,
    });
    return res.data.data;
  },
  withdraw: async (accountNumber: string, amount: number, initiatedBy: string) => {
    const txnId = `TXN_WTH_${Date.now()}`;
    const res = await apiClient.post<ApiResponse<Transaction>>('/api/transactions/withdrawal', {
      transactionId: txnId,
      accountNumber,
      amount,
      initiatedBy,
    });
    return res.data.data;
  },
  transfer: async (
    sourceAccountNumber: string,
    destinationAccountNumber: string,
    amount: number,
    initiatedBy: string,
    challengeId?: string
  ) => {
    const txnId = `TXN_TRF_${Date.now()}`;
    const meta = getDeviceMetadata();
    const res = await apiClient.post<ApiResponse<Transaction>>('/api/transactions/transfer', {
      transactionId: txnId,
      sourceAccountNumber,
      destinationAccountNumber,
      amount,
      initiatedBy,
      challengeId,
      deviceFingerprint: meta.deviceFingerprint,
    });
    return res.data.data;
  },
  getAccountTransactions: async (accountNumber: string, page = 0, size = 15) => {
    const res = await apiClient.get<ApiResponse<{ content: Transaction[]; totalElements: number }>>(
      `/api/transactions/account/${accountNumber}?page=${page}&size=${size}`
    );
    return res.data.data;
  },
};

// Loans API
export const loanApi = {
  apply: async (data: {
    accountNumber: string;
    amount: number;
    interestRate: number;
    termMonths: number;
    purpose: string;
    monthlyIncome: number;
    existingMonthlyDebt: number;
    creditScore: number;
    documentUrls?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<Loan>>('/api/loans/apply', data);
    return res.data.data;
  },
  getLoans: async (status?: string, search?: string, page = 0, size = 20) => {
    const params: any = { page, size };
    if (status) params.status = status;
    if (search) params.search = search;
    const res = await apiClient.get<ApiResponse<{ content: Loan[]; totalElements: number }>>('/api/loans', { params });
    return res.data.data;
  },
  getDashboardStats: async () => {
    const res = await apiClient.get<ApiResponse<LoanOfficerDashboardStats>>('/api/loans/dashboard/stats');
    return res.data.data;
  },
  simulateEligibility: async (monthlyIncome: number, existingMonthlyDebt: number, requestedAmount: number, _tenureMonths: number, _interestRate: number, creditScore: number) => {
    const res = await apiClient.post<ApiResponse<LoanEligibilityAssessment>>('/api/loans/eligibility-check', null, {
      params: {
        monthlyIncome,
        existingMonthlyDebt,
        amount: requestedAmount,
        termMonths: _tenureMonths,
        creditScore,
      },
    });
    return res.data.data;
  },
  getRepaymentSchedule: async (loanId: string) => {
    const res = await apiClient.get<ApiResponse<LoanRepaymentSchedule[]>>(`/api/loans/${loanId}/schedule`);
    return res.data.data;
  },
  reviewLoan: async (loanId: string, status: string, notes?: string, rejectionReason?: string) => {
    const res = await apiClient.put<ApiResponse<Loan>>(`/api/loans/${loanId}/review`, {
      targetStatus: status,
      assessmentNotes: notes,
      rejectionReason,
    });
    return res.data.data;
  },
  disburseLoan: async (loanId: string) => {
    const res = await apiClient.post<ApiResponse<Loan>>(`/api/loans/${loanId}/disburse`);
    return res.data.data;
  },
  getCustomerLoans: async (customerId: number) => {
    const res = await apiClient.get<ApiResponse<Loan[]>>(`/api/loans/customer/${customerId}`);
    return res.data.data;
  },
  repay: async (loanId: string, amount: number, sourceAccountNumber?: string) => {
    const res = await apiClient.post<ApiResponse<Loan>>(`/api/loans/${loanId}/repay`, {
      amount,
      sourceAccountNumber,
    });
    return res.data.data;
  },
};

// Notifications API
export const notificationApi = {
  getMyNotifications: async (page = 0, size = 20) => {
    const res = await apiClient.get<ApiResponse<{ content: NotificationItem[]; totalElements: number }>>(
      `/api/notifications?page=${page}&size=${size}`
    );
    return res.data.data;
  },
  getUnreadCount: async () => {
    const res = await apiClient.get<ApiResponse<{ unreadCount: number }>>('/api/notifications/unread-count');
    return res.data.data.unreadCount;
  },
  markAsRead: async (id: number) => {
    const res = await apiClient.put<ApiResponse<NotificationItem>>(`/api/notifications/${id}/read`);
    return res.data.data;
  },
  markAllAsRead: async () => {
    const res = await apiClient.put<ApiResponse<string>>('/api/notifications/read-all');
    return res.data.data;
  },
};

// Analytics API
export const analyticsApi = {
  getOverview: async () => {
    const res = await apiClient.get<ApiResponse<SystemOverviewAnalytics>>('/api/analytics/overview');
    return res.data.data;
  },
  getTopAccounts: async (limit = 10) => {
    const res = await apiClient.get<ApiResponse<TopAccountVolume[]>>(`/api/analytics/top-accounts?limit=${limit}`);
    return res.data.data;
  },
  getTrends: async (days = 30) => {
    const res = await apiClient.get<ApiResponse<DailyTransactionTrend[]>>(`/api/analytics/trends?days=${days}`);
    return res.data.data;
  },
  getFailures: async () => {
    const res = await apiClient.get<ApiResponse<FailedTransactionSummary[]>>('/api/analytics/failures');
    return res.data.data;
  },
  getLoanPortfolio: async () => {
    const res = await apiClient.get<ApiResponse<LoanPortfolioAnalytics[]>>('/api/analytics/loan-portfolio');
    return res.data.data;
  },
};

// Fraud Alerts API
export const fraudApi = {
  getAlerts: async (status = 'NEW', page = 0, size = 20) => {
    const res = await apiClient.get<ApiResponse<{ content: FraudAlert[]; totalElements: number }>>(
      `/api/fraud/alerts?status=${status}&page=${page}&size=${size}`
    );
    return res.data.data;
  },
  reviewAlert: async (alertId: number, status: string, notes: string) => {
    const res = await apiClient.put<ApiResponse<FraudAlert>>(`/api/fraud/alerts/${alertId}/review`, {
      status,
      notes,
    });
    return res.data.data;
  },
};

// Customers API
export const customerApi = {
  getCustomers: async (page = 0, size = 20) => {
    const res = await apiClient.get<ApiResponse<{ content: any[]; totalElements: number }>>(
      `/api/customers?page=${page}&size=${size}`
    );
    return res.data.data;
  },
  updateCustomer: async (
    customerNumber: string,
    data: { firstName: string; lastName: string; phone: string; address: string }
  ) => {
    const res = await apiClient.put<ApiResponse<any>>(`/api/customers/${customerNumber}`, data);
    return res.data.data;
  },
  getCustomerAccounts: async (customerNumber: string) => {
    const res = await apiClient.get<ApiResponse<Account[]>>(`/api/customers/${customerNumber}/accounts`);
    return res.data.data;
  },
};

// Adaptive Multi-Factor Authentication (AMFA) API
export const mfaApi = {
  getStatus: async () => {
    const res = await apiClient.get<ApiResponse<MfaStatus>>('/api/auth/mfa/status');
    return res.data.data;
  },
  sendOtp: async (challengeId?: string, purpose = 'LOGIN_MFA', pendingToken?: string) => {
    const res = await apiClient.post<ApiResponse<OtpSendResult>>(
      '/api/auth/mfa/send-otp',
      { challengeId, purpose },
      pendingToken ? { headers: { Authorization: `Bearer ${pendingToken}` } } : undefined
    );
    return res.data.data;
  },
  verifyOtp: async (
    payload: {
      otp: string;
      challengeId?: string;
      purpose?: string;
      trustDevice?: boolean;
    },
    pendingToken?: string
  ) => {
    const meta = getDeviceMetadata();
    const res = await apiClient.post<ApiResponse<ChallengeVerifyResult>>(
      '/api/auth/mfa/verify-otp',
      { ...payload, ...meta },
      pendingToken ? { headers: { Authorization: `Bearer ${pendingToken}` } } : undefined
    );
    return res.data.data;
  },
  setupTotp: async () => {
    const res = await apiClient.post<ApiResponse<TotpSetupData>>('/api/auth/mfa/totp/setup');
    return res.data.data;
  },
  verifyTotp: async (
    payload: {
      code: string;
      challengeId?: string;
      trustDevice?: boolean;
    },
    pendingToken?: string
  ) => {
    const meta = getDeviceMetadata();
    const res = await apiClient.post<ApiResponse<ChallengeVerifyResult>>(
      '/api/auth/mfa/totp/verify',
      { ...payload, ...meta },
      pendingToken ? { headers: { Authorization: `Bearer ${pendingToken}` } } : undefined
    );
    return res.data.data;
  },
  enableMfa: async (payload: {
    preferredMethod: 'EMAIL_OTP' | 'TOTP';
    emailOtpEnabled?: boolean;
    otpCode?: string;
    totpCode?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<MfaStatus>>('/api/auth/mfa/enable', payload);
    return res.data.data;
  },
  disableMfa: async (payload: { password: string; otpCode?: string; totpCode?: string }) => {
    const res = await apiClient.post<ApiResponse<MfaStatus>>('/api/auth/mfa/disable', payload);
    return res.data.data;
  },
  getTrustedDevices: async () => {
    const res = await apiClient.get<ApiResponse<TrustedDeviceItem[]>>('/api/auth/mfa/devices');
    return res.data.data;
  },
  revokeDevice: async (deviceId: string) => {
    await apiClient.delete(`/api/auth/mfa/devices/${deviceId}`);
  },
  revokeAllDevices: async () => {
    const res = await apiClient.delete<ApiResponse<{ revokedCount: number }>>('/api/auth/mfa/devices');
    return res.data.data;
  },
  getSecurityEvents: async (page = 0, size = 20, all = false) => {
    const res = await apiClient.get<ApiResponse<{ content: SecurityEventItem[]; totalElements: number }>>(
      `/api/auth/security-events?page=${page}&size=${size}&all=${all}`
    );
    return res.data.data;
  },
  createTransactionChallenge: async (payload: {
    operationType: string;
    sourceAccountNumber?: string;
    destinationAccountNumber?: string;
    amount?: number;
  }) => {
    const meta = getDeviceMetadata();
    const res = await apiClient.post<ApiResponse<any>>('/api/auth/mfa/transaction-challenge', {
      ...payload,
      deviceFingerprint: meta.deviceFingerprint,
    });
    return res.data.data;
  },
  changePassword: async (payload: { currentPassword: string; newPassword: string; challengeId?: string }) => {
    const res = await apiClient.post<ApiResponse<void>>('/api/auth/change-password', payload);
    return res.data;
  },
};
