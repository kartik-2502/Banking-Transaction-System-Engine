import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthResponseData, User, UserRole } from '../types';
import { authApi } from '../services/api';

export interface LoginResult {
  success: boolean;
  error?: string;
  mfaRequired?: boolean;
  mfaData?: AuthResponseData;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  completeMfaLogin: (data: AuthResponseData) => void;
  logout: () => void;
  switchUser: (role: UserRole) => void;
}

export const DEMO_ACCOUNTS: Record<string, User> = {
  aarav_sharma: {
    id: 1,
    username: 'aarav_sharma',
    email: 'aarav.sharma@apexbank.com',
    fullName: 'Aarav Sharma',
    roles: ['CUSTOMER'],
    accountNumber: 'ACC1001',
  },
  priya_patel: {
    id: 2,
    username: 'priya_patel',
    email: 'priya.patel@apexbank.com',
    fullName: 'Priya Patel',
    roles: ['CUSTOMER'],
    accountNumber: 'ACC2004',
  },
  ananya_verma: {
    id: 3,
    username: 'ananya_verma',
    email: 'ananya.verma@apexbank.com',
    fullName: 'Ananya Verma',
    roles: ['LOAN_OFFICER'],
    employeeId: 'EMP3041',
    officerId: 'LO301',
    department: 'Retail & MSME Underwriting',
    branchCode: 'BR001',
    branchName: 'Apex Financial District Main Branch',
    shiftStatus: 'ON_SHIFT',
    permissions: [
      'LOAN_DASHBOARD_VIEW', 'LOAN_CUSTOMER_VIEW', 'LOAN_APPLICATION_VIEW',
      'LOAN_APPLICATION_CREATE', 'LOAN_APPLICATION_REVIEW', 'LOAN_APPLICATION_UPDATE',
      'LOAN_DOCUMENT_VIEW', 'LOAN_DOCUMENT_VERIFY', 'LOAN_DOCUMENT_REJECT',
      'LOAN_CREDIT_ASSESS', 'LOAN_PROCESSING_MANAGE', 'LOAN_APPROVAL_RECOMMEND',
      'LOAN_APPROVAL_VIEW', 'LOAN_DISBURSEMENT_INITIATE', 'LOAN_DISBURSEMENT_VIEW',
      'LOAN_REPAYMENT_VIEW', 'LOAN_OVERDUE_MANAGE', 'LOAN_PORTFOLIO_VIEW',
      'LOAN_CUSTOMER_COMMUNICATE', 'LOAN_REPORT_VIEW', 'LOAN_PROFILE_VIEW',
      'LOAN_MFA_MANAGE',
    ],
  },
  system_administrator: {
    id: 4,
    username: 'system_administrator',
    email: 'system.administrator@apexbank.com',
    fullName: 'System Administrator',
    roles: ['ADMIN'],
  },
  rohan_kulkarni: {
    id: 5,
    username: 'rohan_kulkarni',
    email: 'rohan.kulkarni@apexbank.com',
    fullName: 'Rohan Kulkarni',
    roles: ['TELLER'],
    employeeId: 'EMP2041',
    tellerId: 'TLR101',
    branchCode: 'BR001',
    branchName: 'Apex Financial District Main Branch',
    drawerCode: 'DRW-BR001-01',
    shiftStatus: 'ON_SHIFT',
    permissions: [
      'CUSTOMER_VIEW', 'ACCOUNT_VIEW', 'ACCOUNT_BALANCE_VIEW', 'ACCOUNT_STATEMENT_VIEW',
      'CASH_DEPOSIT', 'CASH_WITHDRAWAL', 'FUND_TRANSFER_INITIATE', 'TRANSACTION_VIEW',
      'TRANSACTION_RECEIPT_GENERATE', 'CHEQUE_DEPOSIT', 'CHEQUE_VIEW',
      'SERVICE_REQUEST_CREATE', 'COMPLAINT_CREATE', 'DAILY_REPORT_VIEW',
      'CASH_RECONCILIATION', 'PROFILE_VIEW', 'MFA_MANAGE',
    ],
  },
  vikram_mehta: {
    id: 7,
    username: 'vikram_mehta',
    email: 'vikram.mehta@apexbank.com',
    fullName: 'Vikram Mehta',
    roles: ['BANK_MANAGER'],
    employeeId: 'EMP1010',
    tellerId: 'MGR101',
    branchCode: 'BR001',
    branchName: 'Apex Financial District Main Branch',
    drawerCode: 'VAULT-BR001',
    shiftStatus: 'ON_SHIFT',
  },
  kavya_nair: {
    id: 6,
    username: 'kavya_nair',
    email: 'kavya.nair@apexbank.com',
    fullName: 'Kavya Nair',
    roles: ['RISK_ANALYST'],
  },
  elena_rostova: {
    id: 8,
    username: 'elena_rostova',
    email: 'elena.rostova@apexbank.com',
    fullName: 'Elena Rostova',
    roles: ['AUDITOR'],
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session from localStorage on initial load
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken = localStorage.getItem('bank_token');
        const savedUser = localStorage.getItem('bank_user');
        if (savedToken && savedUser) {
          const parsedUser: User = JSON.parse(savedUser);
          setToken(savedToken);
          setUser(parsedUser);

          // If previous login happened while backend was offline, silently upgrade to a real JWT
          if (savedToken.startsWith('bank_token_') && parsedUser.username) {
            try {
              const data = await authApi.login(parsedUser.username, 'password');
              if (data && data.accessToken) {
                const roles: UserRole[] = (data.roles || []).map((r: string) =>
                  r.replace('ROLE_', '') as UserRole
                );
                const upgradedUser: User = {
                  ...parsedUser,
                  id: data.userId || parsedUser.id,
                  roles: roles.length > 0 ? roles : parsedUser.roles,
                };
                setToken(data.accessToken);
                setUser(upgradedUser);
                localStorage.setItem('bank_token', data.accessToken);
                localStorage.setItem('bank_user', JSON.stringify(upgradedUser));
              }
            } catch {
              // Keep demo session if backend is still unreachable
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse stored user profile', e);
        localStorage.removeItem('bank_token');
        localStorage.removeItem('bank_user');
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const completeMfaLogin = (data: AuthResponseData) => {
    const cleanUsername = (data.username || '').trim().toLowerCase();
    const roles: UserRole[] = (data.roles || []).map((r: string) =>
      r.replace('ROLE_', '') as UserRole
    );
    const loggedUser: User = {
      id: data.userId,
      username: data.username,
      email: data.email,
      fullName: DEMO_ACCOUNTS[cleanUsername]?.fullName || data.username,
      roles: roles.length > 0 ? roles : ['CUSTOMER'],
      permissions: data.permissions || DEMO_ACCOUNTS[cleanUsername]?.permissions || [],
      accountNumber: DEMO_ACCOUNTS[cleanUsername]?.accountNumber,
      employeeId: data.employeeId || DEMO_ACCOUNTS[cleanUsername]?.employeeId,
      tellerId: data.tellerId || DEMO_ACCOUNTS[cleanUsername]?.tellerId,
      officerId: data.officerId || DEMO_ACCOUNTS[cleanUsername]?.officerId,
      department: data.department || DEMO_ACCOUNTS[cleanUsername]?.department,
      branchCode: data.branchCode || DEMO_ACCOUNTS[cleanUsername]?.branchCode,
      branchName: data.branchName || DEMO_ACCOUNTS[cleanUsername]?.branchName,
      drawerCode: data.drawerCode || DEMO_ACCOUNTS[cleanUsername]?.drawerCode,
      shiftStatus: data.shiftStatus || DEMO_ACCOUNTS[cleanUsername]?.shiftStatus,
    };

    setToken(data.accessToken);
    setUser(loggedUser);
    localStorage.setItem('bank_token', data.accessToken);
    localStorage.setItem('bank_user', JSON.stringify(loggedUser));
  };

  const login = async (username: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    const cleanUsername = username.trim().toLowerCase();

    try {
      // 1. Attempt live backend authentication
      const data = await authApi.login(cleanUsername, password);
      if (data && data.mfaRequired) {
        return {
          success: false,
          mfaRequired: true,
          mfaData: data,
        };
      }
      if (data && data.accessToken) {
        completeMfaLogin(data);
        return { success: true };
      }
    } catch (err: any) {
      // Only fall back to local demo when backend is unreachable (network error / 502)
      if (!err.response || err.response.status >= 502) {
        console.warn('Backend unreachable; evaluating local demo fallback credentials.', err);
        if (DEMO_ACCOUNTS[cleanUsername] && password === 'password') {
          const demoUser = DEMO_ACCOUNTS[cleanUsername];
          const dummyToken = `bank_token_${cleanUsername}_${Date.now()}`;
          setToken(dummyToken);
          setUser(demoUser);
          localStorage.setItem('bank_token', dummyToken);
          localStorage.setItem('bank_user', JSON.stringify(demoUser));
          return { success: true };
        }
      }

      return {
        success: false,
        error: err.response?.data?.message || 'Invalid username or password. Please verify your credentials.',
      };
    } finally {
      setIsLoading(false);
    }

    return { success: false, error: 'Authentication could not be completed.' };
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bank_token');
    localStorage.removeItem('bank_user');
  };

  const switchUser = (role: UserRole) => {
    let target = DEMO_ACCOUNTS.aarav_sharma;
    if (role === 'LOAN_OFFICER') target = DEMO_ACCOUNTS.ananya_verma;
    if (role === 'ADMIN') target = DEMO_ACCOUNTS.system_administrator;
    const dummyToken = `bank_token_${target.username}_${Date.now()}`;
    setToken(dummyToken);
    setUser(target);
    localStorage.setItem('bank_token', dummyToken);
    localStorage.setItem('bank_user', JSON.stringify(target));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        completeMfaLogin,
        logout,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
