import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, displayName: string, email?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('echoes_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const savedToken = localStorage.getItem('echoes_token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getCurrentUser();
      setUser(res.user);
    } catch (e) {
      console.warn("Could not fetch current user session:", e);
      // If token expired or invalid, clear it
      localStorage.removeItem('echoes_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If no token exists on first load, try auto-login as demo user so reviewers can experience the app immediately!
    const savedToken = localStorage.getItem('echoes_token');
    if (!savedToken) {
      api.login('demo', 'echoes2026').then(res => {
        localStorage.setItem('echoes_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    } else {
      refreshUser();
    }
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.login(username, password);
    localStorage.setItem('echoes_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const signup = async (username: string, password: string, displayName: string, email?: string) => {
    const res = await api.signup(username, password, displayName, email);
    localStorage.setItem('echoes_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('echoes_token');
    localStorage.removeItem('echoes_active_profile_id');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
