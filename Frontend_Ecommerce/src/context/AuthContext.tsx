import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, ApiError } from '../services/api';
import { clearAccountOrders } from '../utils/accountStorage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRoleDemo: (role: UserRole) => void;
  updateUser: (updatedUser: Partial<User>) => void;
  refreshProfile: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<UserRole, User> = {
  buyer: {
    _id: 'buyer_demo_01',
    username: 'priya_sharma',
    email: 'priya@omizon.in',
    role: 'buyer',
  },
  seller: {
    _id: 'seller_demo_01',
    username: 'apex_tech_hub',
    email: 'merchant@apextech.com',
    role: 'seller',
  },
  admin: {
    _id: 'admin_demo_01',
    username: 'omizon_superadmin',
    email: 'operations@omizon.com',
    role: 'admin',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const demoParam = new URLSearchParams(window.location.search).get('demo');
      if (demoParam && DEMO_USERS[demoParam as UserRole]) {
        return DEMO_USERS[demoParam as UserRole];
      }
    }
    const saved = localStorage.getItem('omizon_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const demoParam = new URLSearchParams(window.location.search).get('demo');
      if (demoParam) return 'demo_token';
    }
    return localStorage.getItem('omizon_token');
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('omizon_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('omizon_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('omizon_token', token);
    } else {
      localStorage.removeItem('omizon_token');
    }
  }, [token]);

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const isEmail = identifier.includes('@');
      const payload = isEmail ? { email: identifier, password } : { username: identifier, password };
      const response = await api.auth.login(payload);
      setUser(response.user);
      setToken(response.token);
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      await api.auth.register({ username, email, password });
      // Automatically log in after registration
      await login(email, password);
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('omizon_user');
      localStorage.removeItem('omizon_token');
      clearAccountOrders();
    }
  };

  const switchRoleDemo = (role: UserRole) => {
    clearAccountOrders();
    const demoUser = DEMO_USERS[role];
    setUser(demoUser);
    setToken(`demo_token_${role}_${Date.now()}`);
  };

  const updateUser = (updatedUser: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updatedUser };
      try {
        localStorage.setItem('omizon_user', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const refreshProfile = async (): Promise<User | null> => {
    try {
      const res = await api.auth.getProfile();
      if (res && res.user) {
        setUser(res.user);
        try {
          localStorage.setItem('omizon_user', JSON.stringify(res.user));
        } catch {}
        return res.user;
      }
    } catch (e) {
      // Ignore network errors on background refresh
    }
    return user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        switchRoleDemo,
        updateUser,
        refreshProfile,
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

