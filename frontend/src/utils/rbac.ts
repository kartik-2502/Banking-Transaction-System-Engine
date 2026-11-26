import { User, UserRole } from '../types';

export interface RolePermissions {
  primaryRole: UserRole;
  designationTitle: string;
  tierLevel: number;
  tierLabel: string;
  // Route / Portal Access
  canAccessOverview: boolean;
  canAccessCustomerPortal: boolean;
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
  RISK_ANALYST: 4,
  ADMIN: 5,
};

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
  const isRiskAnalyst = hasRole('RISK_ANALYST');
  const isLoanOfficer = hasRole('LOAN_OFFICER');
  const isTeller = hasRole('TELLER');

  if (isAdmin) {
    return {
      primaryRole: 'ADMIN',
      designationTitle: 'System Administrator',
      tierLevel: 5,
      tierLabel: 'Tier 5 • Full Authority',
      canAccessOverview: true,
      canAccessCustomerPortal: true,
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
        'Full access to all portals & system analytics',
        'Edit customer profiles, account statuses & transaction limits',
        'Freeze / unfreeze accounts & resolve fraud alerts',
        'Edit loan terms, approve & disburse high-value loans (> ₹5,00,000)',
      ],
      restrictedCapabilities: [],
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

  if (isLoanOfficer) {
    return {
      primaryRole: 'LOAN_OFFICER',
      designationTitle: 'Loan Officer',
      tierLevel: 3,
      tierLabel: 'Tier 3 • Credit Underwriting',
      canAccessOverview: true,
      canAccessCustomerPortal: true,
      canAccessLoanWorkbench: true,
      canAccessAdminCompliance: true,
      canViewAllAccounts: true,
      canPerformTransactions: false,
      canEditCustomerDetails: false,
      canReviewLoans: true,
      canEditLoanTerms: true,
      canApproveStandardLoans: true,
      canApproveHighValueLoans: false,
      canDisburseLoans: true,
      canResolveFraudAlerts: false,
      canFreezeAccounts: false,
      canEditAccountLimits: false,
      canEditAccountStatus: false,
      grantedCapabilities: [
        'Review loan applications & edit underwriting notes/interest rates',
        'Approve & disburse standard loans (≤ ₹5,00,000)',
        'View customer accounts & compliance analytics (read-only)',
      ],
      restrictedCapabilities: [
        'Cannot grant final approval on high-value loans (> ₹5,00,000)',
        'Cannot freeze accounts, edit transaction limits, or resolve fraud alerts',
      ],
    };
  }

  if (isTeller) {
    return {
      primaryRole: 'TELLER',
      designationTitle: 'Branch Teller',
      tierLevel: 2,
      tierLabel: 'Tier 2 • Branch Operations',
      canAccessOverview: true,
      canAccessCustomerPortal: true,
      canAccessLoanWorkbench: false,
      canAccessAdminCompliance: true,
      canViewAllAccounts: true,
      canPerformTransactions: true,
      canEditCustomerDetails: true,
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
        'View all customer accounts & execute assisted deposits/withdrawals/transfers',
        'Edit customer profile & contact details',
        'View compliance analytics & risk profiles (read-only)',
      ],
      restrictedCapabilities: [
        'Cannot access Loan Underwriting workbench',
        'Cannot freeze accounts, edit transaction limits, or resolve fraud alerts',
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
      'Cannot access Loan Underwriting or Admin & Compliance portals',
    ],
  };
}
