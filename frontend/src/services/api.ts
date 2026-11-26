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
  NotificationItem,
  SystemOverviewAnalytics,
  TopAccountVolume,
  Transaction,
} from '../types';

const API_BASE_URL = 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('bank_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  login: async (username: string, password: string): Promise<AuthResponseData> => {
    const res = await apiClient.post<ApiResponse<AuthResponseData>>('/api/auth/login', {
      username,
      password,
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
  getRiskProfile: async (accountNumber: string) => {
    const res = await apiClient.get<ApiResponse<AccountRiskProfile>>(`/api/accounts/${accountNumber}/risk-profile`);
    return res.data.data;
  },
  freezeAccount: async (accountNumber: string, reason: string, changedBy: string) => {
    const res = await apiClient.put<ApiResponse<Account>>(`/api/accounts/${accountNumber}/freeze`, {
      reason,
      changedBy,
    });
    return res.data.data;
  },
  unfreezeAccount: async (accountNumber: string, reason: string, changedBy: string) => {
    const res = await apiClient.put<ApiResponse<Account>>(`/api/accounts/${accountNumber}/unfreeze`, {
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
    const res = await apiClient.post<ApiResponse<Transaction>>('/api/transactions/withdraw', {
      transactionId: txnId,
      accountNumber,
      amount,
      initiatedBy,
    });
    return res.data.data;
  },
  transfer: async (sourceAccountNumber: string, destinationAccountNumber: string, amount: number, initiatedBy: string) => {
    const txnId = `TXN_TRF_${Date.now()}`;
    const res = await apiClient.post<ApiResponse<Transaction>>('/api/transactions/transfer', {
      transactionId: txnId,
      sourceAccountNumber,
      destinationAccountNumber,
      amount,
      initiatedBy,
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
    const res = await apiClient.get<ApiResponse<LoanOfficerDashboardStats>>('/api/loans/stats');
    return res.data.data;
  },
  simulateEligibility: async (monthlyIncome: number, existingMonthlyDebt: number, requestedAmount: number, tenureMonths: number, interestRate: number, creditScore: number) => {
    const res = await apiClient.post<ApiResponse<LoanEligibilityAssessment>>('/api/loans/simulate-eligibility', {
      monthlyIncome,
      existingMonthlyDebt,
      requestedAmount,
      tenureMonths,
      interestRate,
      creditScore,
    });
    return res.data.data;
  },
  getRepaymentSchedule: async (loanId: string) => {
    const res = await apiClient.get<ApiResponse<LoanRepaymentSchedule[]>>(`/api/loans/${loanId}/repayment-schedule`);
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
