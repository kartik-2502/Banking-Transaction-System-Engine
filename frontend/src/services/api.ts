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
  reviewLoan: async (
    loanId: string,
    status: string,
    notes?: string,
    rejectionReason?: string,
    interestRate?: number
  ) => {
    const res = await apiClient.put<ApiResponse<Loan>>(`/api/loans/${loanId}/review`, {
      status,
      assessmentNotes: notes,
      rejectionReason,
      interestRate,
    });
    return res.data.data;
  },
  disburseLoan: async (loanId: string) => {
    const res = await apiClient.post<ApiResponse<Loan>>(`/api/loans/${loanId}/disburse`);
    return res.data.data;
  },
  getMyLoans: async () => {
    const res = await apiClient.get<ApiResponse<Loan[]>>('/api/loans/my');
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

// Bank Teller Operations API
export const tellerApi = {
  getDashboard: async () => {
    const res = await apiClient.get<ApiResponse<import('../types').TellerDashboardData>>('/api/teller/dashboard');
    return res.data.data;
  },
  getProfile: async () => {
    const res = await apiClient.get<ApiResponse<import('../types').TellerProfileInfo>>('/api/teller/profile');
    return res.data.data;
  },
  updateShift: async (shiftStatus: string) => {
    const res = await apiClient.post<ApiResponse<import('../types').TellerProfileInfo>>('/api/teller/profile/shift', { shiftStatus });
    return res.data.data;
  },
  searchCustomers: async (q?: string, kycStatus?: string, page = 0, size = 20) => {
    const params: any = { page, size };
    if (q) params.q = q;
    if (kycStatus && kycStatus !== 'ALL') params.kycStatus = kycStatus;
    const res = await apiClient.get<ApiResponse<{ content: import('../types').TellerCustomerSummary[]; totalElements: number }>>('/api/teller/customers', { params });
    return res.data.data;
  },
  getCustomerHistory: async (customerNumber: string) => {
    const res = await apiClient.get<ApiResponse<{ customer: import('../types').TellerCustomerSummary; transactions: import('../types').Transaction[]; serviceRequests: import('../types').ServiceRequestItem[] }>>(`/api/teller/customers/${customerNumber}/history`);
    return res.data.data;
  },
  updateCustomerKyc: async (customerNumber: string, kycStatus: string) => {
    const res = await apiClient.put<ApiResponse<import('../types').TellerCustomerSummary>>(`/api/teller/customers/${customerNumber}/kyc`, { kycStatus });
    return res.data.data;
  },
  getAccountDetails: async (accountNumber: string) => {
    const res = await apiClient.get<ApiResponse<import('../types').Account>>(`/api/teller/accounts/${accountNumber}`);
    return res.data.data;
  },
  getAccountStatement: async (accountNumber: string, fromDate?: string, toDate?: string, page = 0, size = 25) => {
    const params: any = { page, size };
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    const res = await apiClient.get<ApiResponse<{ content: import('../types').Transaction[]; totalElements: number }>>(`/api/teller/accounts/${accountNumber}/statement`, { params });
    return res.data.data;
  },
  getDrawer: async () => {
    const res = await apiClient.get<ApiResponse<import('../types').TellerDrawerData>>('/api/teller/drawer');
    return res.data.data;
  },
  openDrawer: async (openingBalance: number) => {
    const res = await apiClient.post<ApiResponse<import('../types').TellerDrawerData>>('/api/teller/drawer/open', { openingBalance });
    return res.data.data;
  },
  adjustDrawer: async (payload: { operationType: string; amount: number; remarks: string }) => {
    const res = await apiClient.post<ApiResponse<import('../types').TellerDrawerData>>('/api/teller/drawer/adjust', payload);
    return res.data.data;
  },
  reconcileDrawer: async (payload: { declaredPhysicalCash: number; remarks?: string }) => {
    const res = await apiClient.post<ApiResponse<import('../types').CashReconciliationItem>>('/api/teller/drawer/reconcile', payload);
    return res.data.data;
  },
  listReconciliations: async () => {
    const res = await apiClient.get<ApiResponse<import('../types').CashReconciliationItem[]>>('/api/teller/drawer/reconciliations');
    return res.data.data;
  },
  verifyReconciliation: async (reconciliationId: string, approved: boolean, remarks?: string) => {
    const res = await apiClient.post<ApiResponse<import('../types').CashReconciliationItem>>(`/api/teller/drawer/reconciliations/${reconciliationId}/verify`, { approved, remarks });
    return res.data.data;
  },
  cashDeposit: async (payload: { transactionId?: string; accountNumber: string; amount: number; depositType?: string; depositorName?: string; depositorIdRef?: string; remarks?: string }) => {
    const res = await apiClient.post<ApiResponse<import('../types').Transaction>>('/api/teller/cash/deposit', payload);
    return res.data.data;
  },
  cashWithdrawal: async (payload: { transactionId?: string; accountNumber: string; amount: number; depositorName?: string; depositorIdRef?: string; customerVerified: boolean; remarks?: string }) => {
    const res = await apiClient.post<ApiResponse<import('../types').Transaction>>('/api/teller/cash/withdrawal', payload);
    return res.data.data;
  },
  fundTransfer: async (payload: { transactionId?: string; sourceAccountNumber: string; destinationAccountNumber?: string; amount: number; transferChannel: string; beneficiaryName?: string; beneficiaryIfsc?: string; beneficiaryBank?: string; remarks?: string; challengeId?: string }) => {
    const meta = getDeviceMetadata();
    const res = await apiClient.post<ApiResponse<import('../types').Transaction>>('/api/teller/transfers', { ...payload, deviceFingerprint: meta.deviceFingerprint });
    return res.data.data;
  },
  searchTransactions: async (params: { q?: string; type?: string; status?: string; fromDate?: string; toDate?: string; page?: number; size?: number }) => {
    const res = await apiClient.get<ApiResponse<{ content: import('../types').Transaction[]; totalElements: number }>>('/api/teller/transactions', { params });
    return res.data.data;
  },
  requestReversal: async (transactionId: string, reason: string) => {
    const res = await apiClient.post<ApiResponse<import('../types').ReversalItem>>(`/api/teller/transactions/${transactionId}/reversal-request`, { reason });
    return res.data.data;
  },
  listReversals: async (page = 0, size = 20) => {
    const res = await apiClient.get<ApiResponse<{ content: import('../types').ReversalItem[]; totalElements: number }>>('/api/teller/reversals', { params: { page, size } });
    return res.data.data;
  },
  decideReversal: async (reversalId: string, approved: boolean, remarks?: string) => {
    const res = await apiClient.post<ApiResponse<import('../types').ReversalItem>>(`/api/teller/reversals/${reversalId}/decision`, { approved, remarks });
    return res.data.data;
  },
  listCheques: async (status?: string, page = 0, size = 20) => {
    const params: any = { page, size };
    if (status && status !== 'ALL') params.status = status;
    const res = await apiClient.get<ApiResponse<{ content: import('../types').ChequeItem[]; totalElements: number }>>('/api/teller/cheques', { params });
    return res.data.data;
  },
  registerCheque: async (payload: { chequeNumber: string; accountNumber: string; drawerAccountNumber?: string; issuingBankName: string; issuingBranch?: string; chequeDate: string; amount: number; requestType: string; attachmentRef?: string; remarks?: string }) => {
    const res = await apiClient.post<ApiResponse<import('../types').ChequeItem>>('/api/teller/cheques', payload);
    return res.data.data;
  },
  updateChequeStatus: async (chequeRef: string, status: string, remarks?: string) => {
    const res = await apiClient.post<ApiResponse<import('../types').ChequeItem>>(`/api/teller/cheques/${chequeRef}/status`, { status, remarks });
    return res.data.data;
  },
  listServiceRequests: async (status?: string, page = 0, size = 20) => {
    const params: any = { page, size };
    if (status && status !== 'ALL') params.status = status;
    const res = await apiClient.get<ApiResponse<{ content: import('../types').ServiceRequestItem[]; totalElements: number }>>('/api/teller/service-requests', { params });
    return res.data.data;
  },
  createServiceRequest: async (payload: { customerNumber: string; accountNumber?: string; requestType: string; description: string; payloadJson?: string }) => {
    const res = await apiClient.post<ApiResponse<import('../types').ServiceRequestItem>>('/api/teller/service-requests', payload);
    return res.data.data;
  },
  decideServiceRequest: async (requestId: string, approved: boolean, remarks?: string) => {
    const res = await apiClient.post<ApiResponse<import('../types').ServiceRequestItem>>(`/api/teller/service-requests/${requestId}/decision`, { approved, remarks });
    return res.data.data;
  },
  listComplaints: async (status?: string, page = 0, size = 20) => {
    const params: any = { page, size };
    if (status && status !== 'ALL') params.status = status;
    const res = await apiClient.get<ApiResponse<{ content: import('../types').ComplaintItem[]; totalElements: number }>>('/api/teller/complaints', { params });
    return res.data.data;
  },
  createComplaint: async (payload: { customerNumber: string; accountNumber?: string; transactionId?: string; category: string; subject: string; description: string; priority?: string }) => {
    const res = await apiClient.post<ApiResponse<import('../types').ComplaintItem>>('/api/teller/complaints', payload);
    return res.data.data;
  },
  updateComplaint: async (complaintId: string, payload: { status?: string; assignedTo?: string; internalRemarks?: string; escalated?: boolean }) => {
    const res = await apiClient.patch<ApiResponse<import('../types').ComplaintItem>>(`/api/teller/complaints/${complaintId}`, payload);
    return res.data.data;
  },
  listApprovals: async (page = 0, size = 20) => {
    const res = await apiClient.get<ApiResponse<{ content: import('../types').ApprovalItem[]; totalElements: number }>>('/api/teller/approvals', { params: { page, size } });
    return res.data.data;
  },
  getDailyReport: async (date?: string) => {
    const params: any = {};
    if (date) params.date = date;
    const res = await apiClient.get<ApiResponse<import('../types').DailyReportData>>('/api/teller/reports/daily', { params });
    return res.data.data;
  },
  exportDailyReportCsv: async (date?: string) => {
    const params: any = {};
    if (date) params.date = date;
    const res = await apiClient.get<string>('/api/teller/reports/export/csv', { params, responseType: 'text' as any });
    return res.data;
  },
};

// Enterprise Loan Officer Portal API
export const loanOfficerApi = {
  getDashboard: async () => {
    const res = await apiClient.get<ApiResponse<import('../types').LoanOfficerDashboardData>>('/api/loan-officer/dashboard');
    return res.data.data;
  },
  getProfile: async () => {
    const res = await apiClient.get<ApiResponse<import('../types').LoanOfficerProfileData>>('/api/loan-officer/profile');
    return res.data.data;
  },
  updateShift: async (shiftStatus: string) => {
    const res = await apiClient.post<ApiResponse<import('../types').LoanOfficerProfileData>>('/api/loan-officer/profile/shift', { shiftStatus });
    return res.data.data;
  },
  searchCustomers: async (q?: string, kycStatus?: string, page = 0, size = 15) => {
    const params: any = { page, size };
    if (q) params.q = q;
    if (kycStatus && kycStatus !== 'ALL') params.kycStatus = kycStatus;
    const res = await apiClient.get<ApiResponse<{ content: import('../types').LoanOfficerCustomer[]; totalElements: number }>>('/api/loan-officer/customers', { params });
    return res.data.data;
  },
  getCustomerProfile: async (customerNumber: string) => {
    const res = await apiClient.get<ApiResponse<import('../types').LoanOfficerCustomer>>(`/api/loan-officer/customers/${customerNumber}`);
    return res.data.data;
  },
  searchApplications: async (params: { status?: string; category?: string; q?: string; minAmount?: number; maxAmount?: number; fromDate?: string; toDate?: string; assignedOnly?: boolean; page?: number; size?: number }) => {
    const query: any = { page: params.page ?? 0, size: params.size ?? 15, assignedOnly: Boolean(params.assignedOnly) };
    if (params.status && params.status !== 'ALL') query.status = params.status;
    if (params.category && params.category !== 'ALL') query.category = params.category;
    if (params.q) query.q = params.q;
    if (params.minAmount) query.minAmount = params.minAmount;
    if (params.maxAmount) query.maxAmount = params.maxAmount;
    if (params.fromDate) query.fromDate = params.fromDate;
    if (params.toDate) query.toDate = params.toDate;
    const res = await apiClient.get<ApiResponse<{ content: import('../types').LoanApplicationSummary[]; totalElements: number }>>('/api/loan-officer/applications', { params: query });
    return res.data.data;
  },
  createApplication: async (payload: {
    customerNumber: string; accountNumber: string; loanCategory: string; requestedAmount: number;
    tenureMonths: number; interestRate?: number; employmentType: string; monthlyIncome: number;
    existingLiabilities?: number; creditScore?: number; loanPurpose: string;
    collateralType?: string; collateralValue?: number; remarks?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<import('../types').LoanApplicationSummary>>('/api/loan-officer/applications', payload);
    return res.data.data;
  },
  getWorkspace: async (loanId: string) => {
    const res = await apiClient.get<ApiResponse<{
      application: import('../types').LoanApplicationSummary;
      timeline: { previousStatus?: string; newStatus: string; changedBy: string; remarks: string; createdAt: string }[];
      latestAssessment?: import('../types').LoanCreditAssessmentItem;
      approvals: import('../types').LoanApprovalItem[];
      auditLogs: any[];
      documentCount: number;
      verifiedDocumentCount: number;
    }>>(`/api/loan-officer/applications/${loanId}/workspace`);
    return res.data.data;
  },
  updateApplication: async (loanId: string, payload: any) => {
    const res = await apiClient.put<ApiResponse<import('../types').LoanApplicationSummary>>(`/api/loan-officer/applications/${loanId}`, payload);
    return res.data.data;
  },
  assignApplication: async (loanId: string, officerUsername: string) => {
    const res = await apiClient.post<ApiResponse<import('../types').LoanApplicationSummary>>(`/api/loan-officer/applications/${loanId}/assign`, { officerUsername });
    return res.data.data;
  },
  transitionStage: async (loanId: string, status: string, remarks?: string) => {
    const res = await apiClient.post<ApiResponse<import('../types').LoanApplicationSummary>>(`/api/loan-officer/applications/${loanId}/stage`, { status, remarks });
    return res.data.data;
  },
  listDocuments: async (status?: string, page = 0, size = 20) => {
    const params: any = { page, size };
    if (status && status !== 'ALL') params.status = status;
    const res = await apiClient.get<ApiResponse<{ content: import('../types').LoanDocumentItem[]; totalElements: number }>>('/api/loan-officer/documents', { params });
    return res.data.data;
  },
  listLoanDocuments: async (loanId: string) => {
    const res = await apiClient.get<ApiResponse<import('../types').LoanDocumentItem[]>>(`/api/loan-officer/applications/${loanId}/documents`);
    return res.data.data;
  },
  uploadDocument: async (loanId: string, documentType: string, file: File, expiryDate?: string, remarks?: string) => {
    const form = new FormData();
    form.append('documentType', documentType);
    form.append('file', file);
    if (expiryDate) form.append('expiryDate', expiryDate);
    if (remarks) form.append('remarks', remarks);
    const res = await apiClient.post<ApiResponse<import('../types').LoanDocumentItem>>(`/api/loan-officer/applications/${loanId}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
  verifyDocument: async (documentId: string, payload: { status: string; remarks?: string; rejectionReason?: string }) => {
    const res = await apiClient.post<ApiResponse<import('../types').LoanDocumentItem>>(`/api/loan-officer/documents/${documentId}/verify`, payload);
    return res.data.data;
  },
  downloadDocumentBlob: async (documentId: string) => {
    const res = await apiClient.get<Blob>(`/api/loan-officer/documents/${documentId}/download`, { responseType: 'blob' as any });
    return res.data;
  },
  simulateAssessment: async (payload: any) => {
    const res = await apiClient.post<ApiResponse<import('../types').LoanCreditAssessmentItem>>('/api/loan-officer/assessments/simulate', payload);
    return res.data.data;
  },
  saveCreditAssessment: async (loanId: string, payload: any) => {
    const res = await apiClient.post<ApiResponse<import('../types').LoanCreditAssessmentItem>>(`/api/loan-officer/applications/${loanId}/credit-assessment`, payload);
    return res.data.data;
  },
  submitRecommendation: async (loanId: string, payload: { recommendedAction: string; recommendedAmount: number; recommendedInterestRate: number; recommendedTermMonths: number; officerRemarks: string }) => {
    const res = await apiClient.post<ApiResponse<import('../types').LoanApprovalItem>>(`/api/loan-officer/applications/${loanId}/recommend`, payload);
    return res.data.data;
  },
  listApprovals: async (status?: string, page = 0, size = 20) => {
    const params: any = { page, size };
    if (status && status !== 'ALL') params.status = status;
    const res = await apiClient.get<ApiResponse<{ content: import('../types').LoanApprovalItem[]; totalElements: number }>>('/api/loan-officer/approvals', { params });
    return res.data.data;
  },
  decideApproval: async (approvalId: string, decision: string, decisionRemarks: string) => {
    const res = await apiClient.post<ApiResponse<import('../types').LoanApprovalItem>>(`/api/loan-officer/approvals/${approvalId}/decision`, { decision, decisionRemarks });
    return res.data.data;
  },
  listDisbursements: async (status?: string, page = 0, size = 20) => {
    const params: any = { page, size };
    if (status && status !== 'ALL') params.status = status;
    const res = await apiClient.get<ApiResponse<{ content: import('../types').LoanDisbursementItem[]; totalElements: number }>>('/api/loan-officer/disbursements', { params });
    return res.data.data;
  },
  initiateDisbursement: async (loanId: string, payload: { conditionsVerified: boolean; beneficiaryVerified: boolean; disbursementMode?: string; remarks?: string }) => {
    const res = await apiClient.post<ApiResponse<import('../types').LoanDisbursementItem>>(`/api/loan-officer/applications/${loanId}/disbursement-initiate`, payload);
    return res.data.data;
  },
  authorizeDisbursement: async (disbursementId: string, approved: boolean, remarks?: string) => {
    const res = await apiClient.post<ApiResponse<import('../types').LoanDisbursementItem>>(`/api/loan-officer/disbursements/${disbursementId}/authorize`, { approved, remarks });
    return res.data.data;
  },
  getRepayments: async (loanId: string) => {
    const res = await apiClient.get<ApiResponse<{ loan: import('../types').LoanApplicationSummary; totalPaid: number; outstandingPrincipal: number; outstandingInterest: number; remainingInstallments: number; installments: import('../types').LoanRepaymentSchedule[] }>>(`/api/loan-officer/repayments/${loanId}`);
    return res.data.data;
  },
  listOverdue: async () => {
    const res = await apiClient.get<ApiResponse<import('../types').LoanOverdueItem[]>>('/api/loan-officer/overdue');
    return res.data.data;
  },
  logFollowUp: async (loanId: string, payload: { followupType: string; commitmentAmount?: number; commitmentDate?: string; outcome: string; recoveryStatus?: string; notes?: string; escalated?: boolean }) => {
    const res = await apiClient.post<ApiResponse<import('../types').LoanFollowUpItem>>(`/api/loan-officer/overdue/${loanId}/follow-up`, payload);
    return res.data.data;
  },
  listFollowUps: async (page = 0, size = 20) => {
    const res = await apiClient.get<ApiResponse<{ content: import('../types').LoanFollowUpItem[]; totalElements: number }>>('/api/loan-officer/overdue/follow-ups', { params: { page, size } });
    return res.data.data;
  },
  getPortfolio: async (category?: string) => {
    const params: any = {};
    if (category && category !== 'ALL') params.category = category;
    const res = await apiClient.get<ApiResponse<import('../types').LoanPortfolioData>>('/api/loan-officer/portfolio', { params });
    return res.data.data;
  },
  listCommunications: async (page = 0, size = 20) => {
    const res = await apiClient.get<ApiResponse<{ content: import('../types').LoanCommunicationItem[]; totalElements: number }>>('/api/loan-officer/communications', { params: { page, size } });
    return res.data.data;
  },
  sendCommunication: async (payload: { loanId?: string; customerNumber: string; channel?: string; communicationType: string; subject: string; message: string }) => {
    const res = await apiClient.post<ApiResponse<import('../types').LoanCommunicationItem>>('/api/loan-officer/communications', payload);
    return res.data.data;
  },
  getReport: async (params: { reportType?: string; category?: string; status?: string; fromDate?: string; toDate?: string; page?: number; size?: number }) => {
    const query: any = { page: params.page ?? 0, size: params.size ?? 25 };
    if (params.reportType) query.reportType = params.reportType;
    if (params.category && params.category !== 'ALL') query.category = params.category;
    if (params.status && params.status !== 'ALL') query.status = params.status;
    if (params.fromDate) query.fromDate = params.fromDate;
    if (params.toDate) query.toDate = params.toDate;
    const res = await apiClient.get<ApiResponse<{ reportType: string; generatedAt: string; totalRecords: number; portfolioSummary: import('../types').LoanPortfolioData; rows: import('../types').LoanApplicationSummary[] }>>('/api/loan-officer/reports', { params: query });
    return res.data.data;
  },
  exportReportCsv: async (params: { reportType?: string; category?: string; status?: string }) => {
    const query: any = {};
    if (params.reportType) query.reportType = params.reportType;
    if (params.category && params.category !== 'ALL') query.category = params.category;
    if (params.status && params.status !== 'ALL') query.status = params.status;
    const res = await apiClient.get<string>('/api/loan-officer/reports/export/csv', { params: query, responseType: 'text' as any });
    return res.data;
  },
};
