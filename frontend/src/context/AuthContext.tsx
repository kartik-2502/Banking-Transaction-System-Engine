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
  },
  kavya_nair: {
    id: 6,
    username: 'kavya_nair',
    email: 'kavya.nair@apexbank.com',
    fullName: 'Kavya Nair',
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
      accountNumber: DEMO_ACCOUNTS[cleanUsername]?.accountNumber || 'ACC1001',
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
