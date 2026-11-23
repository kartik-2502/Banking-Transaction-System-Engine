export type UserRole = 'ADMIN' | 'CUSTOMER' | 'TELLER' | 'RISK_ANALYST';

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

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
