export type UserRole = 'ADMIN' | 'CUSTOMER' | 'TELLER' | 'RISK_ANALYST' | 'LOAN_OFFICER';

export interface User {
  id: number;
  username: string;
  email: string;
  roles: UserRole[];
}

export type AccountStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED';
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
export type TransactionStatus = 'SUCCESS' | 'FAILED' | 'REJECTED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Customer {
  id: number;
  customerNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface Account {
  id: number;
  accountNumber: string;
  customerId: number;
  customerName?: string;
  balance: number;
  status: AccountStatus;
  currency: string;
  createdAt: string;
}

export interface AccountTransactionLimit {
  id?: number;
  accountId: number;
  dailyLimit: number;
  perTransactionLimit: number;
}

export interface AccountRiskProfile {
  accountNumber: string;
  status: AccountStatus;
  currentBalance: number;
  dailyLimit: number;
  perTransactionLimit: number;
  riskSummary: string;
}

export interface Transaction {
  id: number;
  transactionId: string;
  type: TransactionType;
  sourceAccountNumber?: string;
  destinationAccountNumber?: string;
  amount: number;
  status: TransactionStatus;
  failureReason?: string;
  createdAt: string;
}

export type LoanStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ADDITIONAL_INFORMATION_REQUIRED'
  | 'DISBURSED'
  | 'PAID';

export interface Loan {
  id: number;
  loanId: string;
  customerId: number;
  customerNumber: string;
  customerName: string;
  customerEmail: string;
  accountNumber: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  status: LoanStatus;
  purpose: string;
  monthlyIncome: number;
  existingMonthlyDebt: number;
  creditScore: number;
  dtiRatio: number;
  emiAmount: number;
  totalPayable: number;
  outstandingBalance: number;
  assessmentNotes?: string;
  documentUrls?: string;
  requiresAdminApproval: boolean;
  reviewedBy?: string;
  finalApprovedBy?: string;
  rejectionReason?: string;
  disbursedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanRepaymentSchedule {
  id: number;
  loanId: number;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalInstallment: number;
  paidAmount: number;
  paidDate?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
}

export interface LoanStatusHistory {
  id: number;
  loanId: number;
  previousStatus?: LoanStatus;
  newStatus: LoanStatus;
  changedBy: string;
  remarks: string;
  createdAt: string;
}

export interface LoanOfficerDashboardStats {
  totalApplications: number;
  pendingCount: number;
  underReviewCount: number;
  approvedCount: number;
  rejectedCount: number;
  additionalInfoRequiredCount: number;
  disbursedCount: number;
  paidCount: number;
  highValuePendingCount: number;
  totalDisbursedVolume: number;
}

export interface LoanEligibilityAssessment {
  eligible: boolean;
  creditScore: number;
  monthlyIncome: number;
  existingMonthlyDebt: number;
  proposedEmi: number;
  maxAllowableEmi: number;
  dtiRatio: number;
  riskGrade: 'PRIME' | 'NEAR_PRIME' | 'SUBPRIME';
  recommendation: string;
}

export interface NotificationItem {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'READ';
  createdAt: string;
  readAt?: string;
}

export interface NotificationEvent {
  eventType: string;
  transactionId?: string;
  accountNumber?: string;
  userId?: number;
  username?: string;
  amount?: number;
  title?: string;
  message?: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  timestamp: string;
}

export interface FraudAlert {
  id: number;
  transactionId: string;
  accountId?: number;
  accountNumber?: string;
  riskScore: number;
  riskLevel: RiskLevel;
  triggeredRules?: string;
  status: 'NEW' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
  reason?: string;
  reviewedBy?: string;
  createdAt: string;
}

export interface SystemOverviewAnalytics {
  totalAccounts: number;
  activeAccounts: number;
  frozenAccounts: number;
  totalDepositBalance: number;
  totalTransactions: number;
  totalTransactionVolume: number;
  todayTransactions: number;
  todayTransactionVolume: number;
  totalLoans: number;
  activeLoans: number;
  totalLoanDisbursed: number;
  totalLoanOutstanding: number;
  totalFraudAlerts: number;
  pendingFraudAlerts: number;
  systemHealthStatus: string;
  generatedAt: string;
}

export interface TopAccountVolume {
  rank: number;
  accountNumber: string;
  customerNumber: string;
  customerName: string;
  customerEmail: string;
  currentBalance: number;
  currency: string;
  accountStatus: string;
  totalTransactions: number;
  totalTurnoverVolume: number;
}

export interface DailyTransactionTrend {
  transactionDate: string;
  operationType: string;
  totalAttempts: number;
  successfulCount: number;
  failedCount: number;
  successRatePercentage: number;
  totalSettledVolume: number;
  avgSettledAmount: number;
}

export interface FailedTransactionSummary {
  errorCategory: string;
  failureReason: string;
  failureCount: number;
  percentageOfTotal: number;
  distinctAccountsImpacted: number;
  firstSeenAt?: string;
  lastSeenAt?: string;
}

export interface LoanPortfolioAnalytics {
  status: string;
  loanCount: number;
  totalPrincipal: number;
  totalOutstanding: number;
  avgInterestRate: number;
  avgTenureMonths: number;
  avgDtiRatio: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
