export type UserRole =
  | 'ADMIN'
  | 'CUSTOMER'
  | 'TELLER'
  | 'RISK_ANALYST'
  | 'LOAN_OFFICER'
  | 'BANK_MANAGER'
  | 'AUDITOR';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  roles: UserRole[];
  permissions?: string[];
  accountNumber?: string;
  employeeId?: string;
  tellerId?: string;
  officerId?: string;
  department?: string;
  branchCode?: string;
  branchName?: string;
  drawerCode?: string;
  shiftStatus?: string;
}

export interface AuthResponseData {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresInMs?: number;
  userId: number;
  username: string;
  email: string;
  roles: string[];
  permissions?: string[];
  employeeId?: string;
  tellerId?: string;
  officerId?: string;
  department?: string;
  branchCode?: string;
  branchName?: string;
  drawerCode?: string;
  shiftStatus?: string;
  mfaRequired?: boolean;
  mfaPendingToken?: string;
  challengeId?: string;
  requiredMethod?: string;
  riskLevel?: RiskLevel | string;
  riskScore?: number;
  riskReasons?: string[];
  deviceId?: string;
  trustedDevice?: boolean;
}

export interface MfaStatus {
  mfaEnabled: boolean;
  preferredMethod: 'EMAIL_OTP' | 'TOTP';
  emailOtpEnabled: boolean;
  totpEnabled: boolean;
  trustedDevicesCount: number;
  lastLoginAt?: string;
  lastLoginIp?: string;
  failedLoginAttempts: number;
  lockedUntil?: string;
}

export interface TotpSetupData {
  otpAuthUri: string;
  manualEntryKey: string;
  issuer: string;
  accountLabel: string;
}

export interface TrustedDeviceItem {
  deviceId: string;
  deviceName: string;
  browser?: string;
  operatingSystem?: string;
  ipAddress?: string;
  locationHint?: string;
  trusted: boolean;
  revoked: boolean;
  lastLoginAt: string;
  expiresAt: string;
  createdAt: string;
}

export interface SecurityEventItem {
  eventId: string;
  userId?: number;
  username?: string;
  eventType: string;
  severity: string;
  riskScore?: number;
  riskLevel?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  outcome: string;
  details?: string;
  createdAt: string;
}

export interface OtpSendResult {
  otpId: string;
  challengeId?: string;
  purpose: string;
  maskedDestination: string;
  expiresInSeconds: number;
  resendCooldownSeconds: number;
  expiresAt: string;
}

export interface ChallengeVerifyResult {
  verified: boolean;
  challengeId?: string;
  challengeType?: string;
  status: string;
  message: string;
  auth?: AuthResponseData;
}

export interface MfaChallengeDetails {
  challengeId: string;
  challengeType?: string;
  requiredMethod: string;
  riskScore: number;
  riskLevel: string;
  riskReasons?: string[];
  targetReference?: string;
  expiresAt?: string;
}

export type AccountStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED';
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
export type TransactionStatus = 'SUCCESS' | 'FAILED' | 'REJECTED' | 'PENDING' | 'UNDER_REVIEW' | 'REVERSED';

export interface TellerProfileInfo {
  username: string;
  email: string;
  employeeId: string;
  tellerId: string;
  branchCode: string;
  branchName: string;
  branchCity: string;
  ifscCode: string;
  drawerCode: string;
  employmentStatus: string;
  shiftStatus: string;
  maxCashLimit: number;
  roles: string[];
  permissions: string[];
}

export interface TellerDashboardData {
  todayCashDeposits: number;
  todayCashWithdrawals: number;
  todayTransfers: number;
  totalTransactionsProcessed: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  pendingServiceRequests: number;
  pendingCheques: number;
  openComplaints: number;
  pendingApprovals: number;
  drawerBalance: number;
  openingBalance: number;
  cashReceived: number;
  cashPaidOut: number;
  drawerStatus: string;
  tellerProfile: TellerProfileInfo;
  recentTransactions: Transaction[];
}

export interface CashDrawerLedgerItem {
  id: number;
  transactionId?: string;
  operationType: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  depositorName?: string;
  depositorIdRef?: string;
  remarks?: string;
  createdBy: string;
  createdAt: string;
}

export interface TellerDrawerData {
  id: number;
  drawerCode: string;
  branchCode: string;
  businessDate: string;
  openingBalance: number;
  cashReceived: number;
  cashPaidOut: number;
  currentBalance: number;
  status: string;
  openedAt: string;
  closedAt?: string;
  ledger: CashDrawerLedgerItem[];
}

export interface CashReconciliationItem {
  reconciliationId: string;
  drawerCode: string;
  branchCode: string;
  businessDate: string;
  systemExpectedBalance: number;
  declaredPhysicalCash: number;
  varianceAmount: number;
  varianceType: string;
  remarks?: string;
  status: string;
  submittedBy: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface TellerCustomerSummary {
  id: number;
  customerNumber: string;
  fullName: string;
  firstName: string;
  lastName: string;
  maskedEmail: string;
  maskedPhone: string;
  address?: string;
  branchCode?: string;
  branchName?: string;
  kycStatus: string;
  accounts: Account[];
}

export interface ChequeItem {
  chequeRef: string;
  chequeNumber: string;
  accountNumber: string;
  customerNumber: string;
  customerName: string;
  branchCode: string;
  drawerAccountNumber?: string;
  issuingBankName: string;
  issuingBranch?: string;
  chequeDate: string;
  amount: number;
  requestType: string;
  status: string;
  attachmentRef?: string;
  remarks?: string;
  submittedBy: string;
  processedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequestItem {
  requestId: string;
  customerNumber: string;
  customerName: string;
  accountNumber?: string;
  branchCode: string;
  requestType: string;
  description: string;
  payloadJson?: string;
  status: string;
  approvalStatus: string;
  submittedBy: string;
  assignedTo?: string;
  approvedBy?: string;
  resolutionRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintItem {
  complaintId: string;
  customerNumber: string;
  customerName: string;
  accountNumber?: string;
  branchCode: string;
  transactionId?: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  submittedBy: string;
  assignedTo?: string;
  internalRemarks?: string;
  escalated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReversalItem {
  reversalId: string;
  transactionId: string;
  accountNumber?: string;
  branchCode: string;
  amount: number;
  reason: string;
  status: string;
  requestedBy: string;
  reviewedBy?: string;
  reviewNotes?: string;
  reversalTransactionId?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface ApprovalItem {
  approvalId: string;
  branchCode: string;
  entityType: string;
  entityRef: string;
  actionType: string;
  amount?: number;
  requestedBy: string;
  status: string;
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface DailyReportData {
  reportDate: string;
  branchCode: string;
  branchName: string;
  depositCount: number;
  totalDepositsAmount: number;
  withdrawalCount: number;
  totalWithdrawalsAmount: number;
  transferCount: number;
  totalTransfersAmount: number;
  failedCount: number;
  pendingCount: number;
  chequeCount: number;
  serviceRequestCount: number;
  drawerSummary: TellerDrawerData;
  reconciliations: CashReconciliationItem[];
  shortagesAndExcesses: CashDrawerLedgerItem[];
  transactions: Transaction[];
}
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

// Loan Officer Module Types
export interface LoanOfficerProfileData {
  username: string;
  email: string;
  employeeId: string;
  officerId: string;
  branchCode: string;
  branchName: string;
  department: string;
  employmentStatus: string;
  shiftStatus: string;
  delegatedApprovalLimit: number;
  assignedApplicationsCount: number;
  roles: string[];
  permissions: string[];
}

export interface LoanApplicationSummary {
  id: number;
  loanId: string;
  customerNumber: string;
  customerName: string;
  accountNumber: string;
  branchCode?: string;
  loanCategory: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  status: string;
  purpose: string;
  employmentType: string;
  monthlyIncome: number;
  existingMonthlyDebt: number;
  creditScore: number;
  dtiRatio: number;
  emiAmount: number;
  totalPayable: number;
  outstandingBalance: number;
  collateralType?: string;
  collateralValue?: number;
  ltvRatio?: number;
  assignedOfficer?: string;
  requiresAdminApproval: boolean;
  reviewedBy?: string;
  finalApprovedBy?: string;
  assessmentNotes?: string;
  rejectionReason?: string;
  disbursedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanOfficerDashboardData {
  totalApplications: number;
  newApplications: number;
  underReviewCount: number;
  pendingDocumentVerification: number;
  pendingCreditAssessment: number;
  approvedLoans: number;
  rejectedApplications: number;
  awaitingDisbursement: number;
  overdueLoans: number;
  receivedThisMonth: number;
  processedCount: number;
  pendingCount: number;
  avgProcessingDays: number;
  pendingDocVerificationsCount: number;
  pendingAssessmentsCount: number;
  pendingReviewsCount: number;
  additionalDocsRequestedCount: number;
  pendingApprovalRecommendationsCount: number;
  totalDisbursedAmount: number;
  totalOutstandingAmount: number;
  performingLoansCount: number;
  categoryDistribution: Record<string, number>;
  recentApplications: LoanApplicationSummary[];
  upcomingEmis: {
    installmentId: number;
    loanId: string;
    customerName: string;
    installmentNumber: number;
    emiAmount: number;
    dueDate: string;
    repaymentStatus: string;
  }[];
  officerProfile: LoanOfficerProfileData;
}

export interface LoanOfficerCustomer {
  id: number;
  customerNumber: string;
  fullName: string;
  maskedEmail: string;
  maskedPhone: string;
  branchCode?: string;
  branchName?: string;
  kycStatus: string;
  employmentType?: string;
  latestMonthlyIncome?: number;
  existingLiabilities?: number;
  totalLoanExposure: number;
  activeLoanCount: number;
  latestCreditScore?: number;
  linkedAccounts?: string[];
  loanApplications?: LoanApplicationSummary[];
  creditAssessments?: LoanCreditAssessmentItem[];
}

export interface LoanDocumentItem {
  documentId: string;
  loanId: string;
  customerNumber: string;
  customerName: string;
  documentType: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  verificationStatus: string;
  expiryDate?: string;
  expired: boolean;
  remarks?: string;
  rejectionReason?: string;
  uploadedBy: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  history?: {
    verificationId: string;
    previousStatus?: string;
    newStatus: string;
    verifiedBy: string;
    remarks?: string;
    rejectionReason?: string;
    verifiedAt: string;
  }[];
}

export interface LoanCreditAssessmentItem {
  assessmentId?: string;
  loanId?: string;
  customerNumber?: string;
  customerName?: string;
  monthlyIncome: number;
  existingDebt: number;
  requestedAmount: number;
  eligibleAmount: number;
  proposedInterestRate: number;
  proposedTenureMonths: number;
  estimatedEmi: number;
  totalRepayment: number;
  totalInterest: number;
  remainingMonthlyIncome: number;
  dtiRatio: number;
  ltvRatio?: number;
  creditScore: number;
  creditSource: string;
  employmentStability: string;
  collateralValue?: number;
  riskCategory: string;
  recommendation: string;
  officerRemarks?: string;
  assessedBy?: string;
  assessedAt?: string;
  disclaimer?: string;
}

export interface LoanApprovalItem {
  approvalId: string;
  loanId: string;
  customerNumber: string;
  customerName: string;
  branchCode?: string;
  loanCategory: string;
  recommendedAction: string;
  recommendedAmount: number;
  recommendedInterestRate: number;
  recommendedTermMonths: number;
  officerRemarks?: string;
  submittedBy: string;
  status: string;
  decisionBy?: string;
  decisionRemarks?: string;
  decidedAt?: string;
  createdAt: string;
}

export interface LoanDisbursementItem {
  disbursementId: string;
  loanId: string;
  customerNumber: string;
  customerName: string;
  accountNumber: string;
  branchCode?: string;
  amount: number;
  disbursementMode: string;
  transactionRef?: string;
  conditionsVerified: boolean;
  beneficiaryVerified: boolean;
  status: string;
  initiatedBy: string;
  approvedBy?: string;
  remarks?: string;
  disbursedAt?: string;
  createdAt: string;
}

export interface LoanOverdueItem {
  loanId: string;
  customerNumber: string;
  customerName: string;
  maskedPhone: string;
  loanCategory: string;
  branchCode?: string;
  daysPastDue: number;
  delinquencyBucket: string;
  overdueAmount: number;
  outstandingBalance: number;
  overdueInstallmentCount: number;
  oldestDueDate: string;
}

export interface LoanFollowUpItem {
  followupId: string;
  loanId: string;
  followupType: string;
  dpdAtFollowup: number;
  overdueAmount: number;
  commitmentAmount?: number;
  commitmentDate?: string;
  outcome: string;
  recoveryStatus: string;
  notes?: string;
  escalated: boolean;
  createdBy: string;
  createdAt: string;
}

export interface LoanCommunicationItem {
  communicationId: string;
  loanId?: string;
  customerNumber: string;
  customerName: string;
  channel: string;
  communicationType: string;
  subject: string;
  message: string;
  recipient?: string;
  deliveryStatus: string;
  sentBy: string;
  createdAt: string;
}

export interface LoanPortfolioData {
  totalLoansManaged: number;
  totalApplications: number;
  totalApprovedLoans: number;
  totalRejectedLoans: number;
  approvalRatioPercent: number;
  totalDisbursedAmount: number;
  totalOutstandingPrincipal: number;
  totalOutstandingInterest: number;
  performingLoanCount: number;
  overdueLoanCount: number;
  onTimeRepaymentRatePercent: number;
  categoryCounts: Record<string, number>;
  categoryAmounts: Record<string, number>;
  monthlyTrends: {
    month: string;
    applicationCount: number;
    disbursedAmount: number;
    collectedAmount: number;
  }[];
}
