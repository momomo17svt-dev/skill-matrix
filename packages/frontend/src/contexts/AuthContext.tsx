import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthSessionUser } from '@skillmatrix/shared';
import { api, ApiError } from '../services/api.js';

interface AuthContextType {
  user: AuthSessionUser | null;
  loading: boolean;
  isInitialPassword: boolean;
  login: (loginId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setIsInitialPassword: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isInitialPassword, setIsInitialPassword] = useState<boolean>(false);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<{ user: AuthSessionUser }>('/api/v1/auth/me');
      setUser(res.user);
      setIsInitialPassword(Boolean(res.user.isInitialPassword));
    } catch (err: any) {
      setUser(null);
      setIsInitialPassword(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (loginId: string, password: string) => {
    const res = await api.post<{ user: AuthSessionUser; isInitialPassword: boolean }>('/api/v1/auth/login', {
      loginId,
      password
    });
    setUser(res.user);
    setIsInitialPassword(Boolean(res.isInitialPassword));
  };

  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsInitialPassword(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isInitialPassword,
        login,
        logout,
        refreshUser,
        setIsInitialPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
