'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants';

interface User {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (googleToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage for existing token/user
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      // Check if token is expired
      if (!checkTokenExpiration()) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    }
  }, []);

  const login = async (googleToken: string) => {
    try {
      console.log('Starting login with token:', googleToken.substring(0, 10) + '...');
      const loginUrl = `${API_BASE_URL}/api/auth/google/login?token=${encodeURIComponent(googleToken)}`;
      console.log('Using API URL:', loginUrl);
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      console.log('Login response status:', response.status);

      if (response.status === 401) {
        throw new Error('Currently, this app is open only to Stanford email holders and approved users. To get approved, please fill out the form.');
      }
      
      const data = await response.json();
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const checkTokenExpiration = () => {
    const expiresAt = localStorage.getItem('tokenExpiresAt');
    if (expiresAt) {
      const isExpired = Date.now() > parseInt(expiresAt);
      if (isExpired) {
        console.log('Token has expired, logging out');
        logout();
        return true;
      }
    }
    return false;
  };

  interface GoogleNotification {
    isNotDisplayed(): boolean;
    isSkippedMoment(): boolean;
  }

  const refreshToken = async () => {
    await new Promise<void>((resolve, reject) => {
      // @ts-expect-error google.accounts.id is added by Google Identity script
      google.accounts.id.prompt((notification: GoogleNotification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          logout();
          reject(new Error('Google auth prompt was skipped or not displayed'));
        }
      });
    });
  };

  // Add interval to check token expiration
  useEffect(() => {
    const interval = setInterval(() => {
      if (token && checkTokenExpiration()) {
        refreshToken().catch(console.error);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [token]);

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiresAt');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
