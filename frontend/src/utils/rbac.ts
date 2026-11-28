import { User, UserRole } from '../types';

export interface RolePermissions {
  primaryRole: UserRole;
  designationTitle: string;
  tierLevel: number;
  tierLabel: string;
  // Route / Portal Access
  canAccessOverview: boolean;
  canAccessCustomerPortal: boolean;
  canAccessTellerPortal: boolean;
  canAccessLoanWorkbench: boolean;
  canAccessAdminCompliance: boolean;
  // Customer Portal Privileges
  canViewAllAccounts: boolean;
  canPerformTransactions: boolean;
  canEditCustomerDetails: boolean;
  // Loan Underwriting Privileges
  canReviewLoans: boolean;
  canEditLoanTerms: boolean;
  canApproveStandardLoans: boolean;
  canApproveHighValueLoans: boolean;
  canDisburseLoans: boolean;
  // Admin & Compliance Privileges
  canResolveFraudAlerts: boolean;
  canFreezeAccounts: boolean;
  canEditAccountLimits: boolean;
  canEditAccountStatus: boolean;
  // Summary bullets for UI display
  grantedCapabilities: string[];
  restrictedCapabilities: string[];
}

const ROLE_PRIORITY: Record<UserRole, number> = {
  CUSTOMER: 1,
  TELLER: 2,
  LOAN_OFFICER: 3,
  AUDITOR: 3,
  RISK_ANALYST: 4,
  BANK_MANAGER: 4,
  ADMIN: 5,
};

export const TELLER_DEFAULT_PERMISSIONS = [
  'CUSTOMER_VIEW',
  'ACCOUNT_VIEW',
  'ACCOUNT_BALANCE_VIEW',
  'ACCOUNT_STATEMENT_VIEW',
  'CASH_DEPOSIT',
  'CASH_WITHDRAWAL',
  'FUND_TRANSFER_INITIATE',
  'TRANSACTION_VIEW',
  'TRANSACTION_RECEIPT_GENERATE',
  'CHEQUE_DEPOSIT',
  'CHEQUE_VIEW',
  'SERVICE_REQUEST_CREATE',
  'COMPLAINT_CREATE',
  'DAILY_REPORT_VIEW',
  'CASH_RECONCILIATION',
  'PROFILE_VIEW',
  'MFA_MANAGE',
] as const;

export const LOAN_DEFAULT_PERMISSIONS = [
  'LOAN_DASHBOARD_VIEW',
  'LOAN_CUSTOMER_VIEW',
  'LOAN_APPLICATION_VIEW',
  'LOAN_APPLICATION_CREATE',
  'LOAN_APPLICATION_REVIEW',
  'LOAN_APPLICATION_UPDATE',
  'LOAN_DOCUMENT_VIEW',
  'LOAN_DOCUMENT_VERIFY',
  'LOAN_DOCUMENT_REJECT',
  'LOAN_CREDIT_ASSESS',
  'LOAN_PROCESSING_MANAGE',
  'LOAN_APPROVAL_RECOMMEND',
  'LOAN_APPROVAL_VIEW',
  'LOAN_DISBURSEMENT_INITIATE',
  'LOAN_DISBURSEMENT_VIEW',
  'LOAN_REPAYMENT_VIEW',
  'LOAN_OVERDUE_MANAGE',
  'LOAN_PORTFOLIO_VIEW',
  'LOAN_CUSTOMER_COMMUNICATE',
  'LOAN_REPORT_VIEW',
  'LOAN_PROFILE_VIEW',
  'LOAN_MFA_MANAGE',
] as const;

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  const roles = user.roles ?? [];
  if (roles.includes('ADMIN')) return true;
  const perms = user.permissions ?? [];
  if (perms.includes(permission)) return true;
  if (roles.includes('TELLER') && (TELLER_DEFAULT_PERMISSIONS as readonly string[]).includes(permission)) {
    return perms.length === 0;
  }
  if (roles.includes('LOAN_OFFICER') && (LOAN_DEFAULT_PERMISSIONS as readonly string[]).includes(permission)) {
    return perms.length === 0;
  }
  return false;
}

export function getHighestRole(roles?: UserRole[]): UserRole {
  if (!roles || roles.length === 0) return 'CUSTOMER';
  return roles.reduce<UserRole>((highest, current) => {
    const currentRank = ROLE_PRIORITY[current] ?? 0;
    const highestRank = ROLE_PRIORITY[highest] ?? 0;
    return currentRank > highestRank ? current : highest;
  }, roles[0]);
}

export function getPermissions(user: User | null): RolePermissions {
  const roles = user?.roles ?? [];
  const hasRole = (role: UserRole) => roles.includes(role);

  const isAdmin = hasRole('ADMIN');
  const isBankManager = hasRole('BANK_MANAGER');
  const isRiskAnalyst = hasRole('RISK_ANALYST');
  const isLoanOfficer = hasRole('LOAN_OFFICER');
  const isAuditor = hasRole('AUDITOR');
  const isTeller = hasRole('TELLER');

  if (isAdmin) {
    return {
      primaryRole: 'ADMIN',
      designationTitle: 'System Administrator',
      tierLevel: 5,
      tierLabel: 'Tier 5 • Full Authority',
      canAccessOverview: true,
      canAccessCustomerPortal: true,
      canAccessTellerPortal: true,
      canAccessLoanWorkbench: true,
      canAccessAdminCompliance: true,
      canViewAllAccounts: true,
      canPerformTransactions: true,
      canEditCustomerDetails: true,
      canReviewLoans: true,
      canEditLoanTerms: true,
      canApproveStandardLoans: true,
      canApproveHighValueLoans: true,
      canDisburseLoans: true,
      canResolveFraudAlerts: true,
      canFreezeAccounts: true,
      canEditAccountLimits: true,
      canEditAccountStatus: true,
      grantedCapabilities: [
        'Full access to all portals, Teller Workbench & system analytics',
        'Approve high-value operations, KYC verification, cheques & reversals',
        'Freeze / unfreeze accounts & resolve fraud alerts',
        'Edit loan terms, approve & disburse high-value loans (> ₹5,00,000)',
      ],
      restrictedCapabilities: [],
    };
  }

  if (isBankManager) {
    return {
      primaryRole: 'BANK_MANAGER',
      designationTitle: 'Branch Bank Manager',
      tierLevel: 4,
      tierLabel: 'Tier 4 • Branch Supervisor',
      canAccessOverview: true,
      canAccessCustomerPortal: false,
      canAccessTellerPortal: true,
      canAccessLoanWorkbench: true,
      canAccessAdminCompliance: true,
      canViewAllAccounts: true,
      canPerformTransactions: true,
      canEditCustomerDetails: true,
      canReviewLoans: true,
      canEditLoanTerms: true,
      canApproveStandardLoans: true,
      canApproveHighValueLoans: false,
      canDisburseLoans: true,
      canResolveFraudAlerts: true,
      canFreezeAccounts: true,
      canEditAccountLimits: true,
      canEditAccountStatus: true,
      grantedCapabilities: [
        'Approve/reject teller service requests, cheques, reversals & EOD drawer reconciliations',
        'Verify customer KYC profiles & resolve escalated branch complaints',
        'Inspect assigned branch accounts, audit reports & fraud compliance analytics',
      ],
      restrictedCapabilities: [
        'Segregation of duties: cannot self-approve requests or reconciliations they submitted',
        'Branch isolation: restricted to assigned branch operations',
      ],
    };
  }

  if (isRiskAnalyst) {
    return {
      primaryRole: 'RISK_ANALYST',
      designationTitle: 'Risk & Compliance Analyst',
      tierLevel: 4,
      tierLabel: 'Tier 4 • Governance & Risk Edit',
      canAccessOverview: true,
      canAccessCustomerPortal: true,
      canAccessTellerPortal: false,
      canAccessLoanWorkbench: true,
      canAccessAdminCompliance: true,
      canViewAllAccounts: true,
      canPerformTransactions: false,
      canEditCustomerDetails: false,
      canReviewLoans: false,
      canEditLoanTerms: false,
      canApproveStandardLoans: false,
      canApproveHighValueLoans: false,
      canDisburseLoans: false,
      canResolveFraudAlerts: true,
      canFreezeAccounts: true,
      canEditAccountLimits: true,
      canEditAccountStatus: false,
      grantedCapabilities: [
        'Triage & resolve fraud surveillance alerts',
        'Freeze / unfreeze accounts & edit daily/per-txn limits',
        'Inspect all customer accounts & loan portfolios (read-only)',
      ],
      restrictedCapabilities: [
        'Cannot approve or disburse loans',
        'Cannot edit customer profile details or initiate transfers',
      ],
    };
  }

  if (isAuditor) {
    return {
      primaryRole: 'AUDITOR',
      designationTitle: 'Internal Compliance Auditor',
      tierLevel: 3,
      tierLabel: 'Tier 3 • Read-Only Audit',
      canAccessOverview: true,
      canAccessCustomerPortal: false,
      canAccessTellerPortal: true,
      canAccessLoanWorkbench: true,
      canAccessAdminCompliance: true,
      canViewAllAccounts: true,
      canPerformTransactions: false,
      canEditCustomerDetails: false,
      canReviewLoans: false,
      canEditLoanTerms: false,
      canApproveStandardLoans: false,
      canApproveHighValueLoans: false,
      canDisburseLoans: false,
      canResolveFraudAlerts: false,
      canFreezeAccounts: false,
      canEditAccountLimits: false,
      canEditAccountStatus: false,
      grantedCapabilities: [
        'Read-only inspection of branch accounts, transactions & daily teller reports',
        'View admin compliance ledgers, reconciliations & audit trail exports',
      ],
      restrictedCapabilities: [
        'Strictly read-only: cannot initiate cash transactions, transfers or approvals',
      ],
    };
  }

  if (isLoanOfficer) {
    return {
      primaryRole: 'LOAN_OFFICER',
      designationTitle: 'Loan Officer',
      tierLevel: 3,
      tierLabel: 'Tier 3 • Credit Underwriting',
      canAccessOverview: true,
      canAccessCustomerPortal: false,
      canAccessTellerPortal: false,
      canAccessLoanWorkbench: true,
      canAccessAdminCompliance: true,
      canViewAllAccounts: true,
      canPerformTransactions: false,
      canEditCustomerDetails: false,
      canReviewLoans: true,
      canEditLoanTerms: true,
      canApproveStandardLoans: false,
      canApproveHighValueLoans: false,
      canDisburseLoans: false,
      canResolveFraudAlerts: false,
      canFreezeAccounts: false,
      canEditAccountLimits: false,
      canEditAccountStatus: false,
      grantedCapabilities: [
        'Register assisted loan applications, verify documents & compute DTI/EMI/LTV credit assessments',
        'Submit maker recommendations, coordinate approved disbursements & manage overdue DPD follow-ups',
        'View branch loan portfolio analytics, reports, compliance & MFA governance',
      ],
      restrictedCapabilities: [
        'Maker-checker enforcement: final loan approval & disbursement authorization require Bank Manager or Admin',
        'Cannot self-approve applications, waive overdue dues, or alter customer balances/credentials',
      ],
    };
  }

  if (isTeller) {
    return {
      primaryRole: 'TELLER',
      designationTitle: 'Branch Bank Teller',
      tierLevel: 2,
      tierLabel: 'Tier 2 • Branch Operations',
      canAccessOverview: true,
      canAccessCustomerPortal: false,
      canAccessTellerPortal: true,
      canAccessLoanWorkbench: true,
      canAccessAdminCompliance: true,
      canViewAllAccounts: true,
      canPerformTransactions: true,
      canEditCustomerDetails: false,
      canReviewLoans: false,
      canEditLoanTerms: false,
      canApproveStandardLoans: false,
      canApproveHighValueLoans: false,
      canDisburseLoans: false,
      canResolveFraudAlerts: false,
      canFreezeAccounts: false,
      canEditAccountLimits: false,
      canEditAccountStatus: false,
      grantedCapabilities: [
        'Process branch cash deposits, withdrawals & drawer reconciliation',
        'Initiate assisted fund transfers, register cheques & log complaints/service requests',
        'View assigned branch customer profiles, statements, daily reports & compliance overview',
      ],
      restrictedCapabilities: [
        'Cannot approve KYC verification, clear cheques, reverse transactions or approve own requests',
        'Restricted strictly to assigned branch customers and accounts',
      ],
    };
  }

  // Default: Tier 1 CUSTOMER (lowest privileges)
  return {
    primaryRole: 'CUSTOMER',
    designationTitle: 'Customer',
    tierLevel: 1,
    tierLabel: 'Tier 1 • Standard User',
    canAccessOverview: true,
    canAccessCustomerPortal: true,
    canAccessTellerPortal: false,
    canAccessLoanWorkbench: false,
    canAccessAdminCompliance: false,
    canViewAllAccounts: false,
    canPerformTransactions: true,
    canEditCustomerDetails: false,
    canReviewLoans: false,
    canEditLoanTerms: false,
    canApproveStandardLoans: false,
    canApproveHighValueLoans: false,
    canDisburseLoans: false,
    canResolveFraudAlerts: false,
    canFreezeAccounts: false,
    canEditAccountLimits: false,
    canEditAccountStatus: false,
    grantedCapabilities: [
      'View own account balance & transaction ledger',
      'Make personal transfers, deposits, withdrawals & apply for loans',
    ],
    restrictedCapabilities: [
      'Cannot view other customers’ accounts or edit profile/account details',
      'Cannot access Teller Operations, Loan Underwriting or Admin & Compliance portals',
    ],
  };
}
