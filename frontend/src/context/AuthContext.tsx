import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import api from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('vegas_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('vegas_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        // Verify with server
        api.get('/auth/me')
          .then((res) => {
            if (res.data.success) {
              setUser(res.data.user);
              localStorage.setItem('vegas_user', JSON.stringify(res.data.user));
            }
          })
          .catch(() => {
            logout();
          })
          .finally(() => {
            setIsLoading(false);
          });
      } catch (e) {
        logout();
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.data.success) {
      const newToken = res.data.token;
      const newUser = res.data.user;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('vegas_token', newToken);
      localStorage.setItem('vegas_user', JSON.stringify(newUser));
    } else {
      throw new Error(res.data.message || 'Kirishda xatolik');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('vegas_token');
    localStorage.removeItem('vegas_user');
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'ADMINISTRATOR') return true; // Admin has full access
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, hasRole }}>
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
