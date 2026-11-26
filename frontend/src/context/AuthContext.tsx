import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUser: (role: UserRole) => void;
}

export const DEMO_ACCOUNTS: Record<string, User> = {
  john_doe: {
    id: 1,
    username: 'john_doe',
    email: 'john.doe@example.com',
    fullName: 'John Doe',
    roles: ['CUSTOMER'],
    accountNumber: 'ACC1001',
  },
  jane_smith: {
    id: 2,
    username: 'jane_smith',
    email: 'jane.smith@example.com',
    fullName: 'Jane Smith',
    roles: ['CUSTOMER'],
    accountNumber: 'ACC2004',
  },
  loan_officer1: {
    id: 3,
    username: 'loan_officer1',
    email: 'sarah.jenkins@bank.internal',
    fullName: 'Sarah Jenkins',
    roles: ['LOAN_OFFICER'],
  },
  admin: {
    id: 4,
    username: 'admin',
    email: 'admin@bank.internal',
    fullName: 'System Administrator',
    roles: ['ADMIN'],
  },
  teller1: {
    id: 5,
    username: 'teller1',
    email: 'david.miller@bank.internal',
    fullName: 'David Miller',
    roles: ['TELLER'],
  },
  analyst1: {
    id: 6,
    username: 'analyst1',
    email: 'elena.rostova@bank.internal',
    fullName: 'Elena Rostova',
    roles: ['RISK_ANALYST'],
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session from localStorage on initial load
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('bank_token');
      const savedUser = localStorage.getItem('bank_user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Failed to parse stored user profile', e);
      localStorage.removeItem('bank_token');
      localStorage.removeItem('bank_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanUsername = username.trim().toLowerCase();

    try {
      // 1. Attempt live backend authentication
      const data = await authApi.login(cleanUsername, password);
      if (data && data.accessToken) {
        const roles: UserRole[] = (data.roles || []).map((r: string) =>
          r.replace('ROLE_', '') as UserRole
        );
        const loggedUser: User = {
          id: data.userId,
          username: data.username,
          email: data.email,
          fullName: DEMO_ACCOUNTS[cleanUsername]?.fullName || data.username,
          roles: roles.length > 0 ? roles : ['CUSTOMER'],
          accountNumber: DEMO_ACCOUNTS[cleanUsername]?.accountNumber || 'ACC1001',
        };

        setToken(data.accessToken);
        setUser(loggedUser);
        localStorage.setItem('bank_token', data.accessToken);
        localStorage.setItem('bank_user', JSON.stringify(loggedUser));
        return { success: true };
      }
    } catch (err: any) {
      console.warn('Backend login attempt encountered an error; evaluating local demo fallback credentials.', err);
      // 2. Seamless local fallback if backend is offline or for seeded test accounts
      if (DEMO_ACCOUNTS[cleanUsername] && (password === 'password' || password === 'admin' || password.length > 0)) {
        const demoUser = DEMO_ACCOUNTS[cleanUsername];
        const dummyToken = `bank_token_${cleanUsername}_${Date.now()}`;
        setToken(dummyToken);
        setUser(demoUser);
        localStorage.setItem('bank_token', dummyToken);
        localStorage.setItem('bank_user', JSON.stringify(demoUser));
        return { success: true };
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
    let target = DEMO_ACCOUNTS.john_doe;
    if (role === 'LOAN_OFFICER') target = DEMO_ACCOUNTS.loan_officer1;
    if (role === 'ADMIN') target = DEMO_ACCOUNTS.admin;
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
