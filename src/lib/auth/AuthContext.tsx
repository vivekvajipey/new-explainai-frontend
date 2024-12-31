'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants';
import { User} from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  authError: string | null;  // Add this
  login: (googleToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initial auth check - only check saved auth_token
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      if (!checkTokenExpiration()) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    }
  }, []);

  // Handle Google login token - separate from auth check
  useEffect(() => {
    const googleToken = localStorage.getItem('google_token');
    if (googleToken && googleToken !== 'undefined') {
      login(googleToken)
        .then(() => {
          localStorage.removeItem('google_token');  // Remove after successful login
        })
        .catch((error) => {
          localStorage.removeItem('google_token');  // Remove on failed login too
          setAuthError(error.message || "Authentication failed");
        });
    }
  }, []); // Only run once on mount


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
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      setAuthError(null);
    } catch (error) {
      console.error('Login failed:', error);
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      throw error;
    }
  };

  // Set up fetch interceptor
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      if (response.status === 401) {
        handleUnauthorized();
      }
      
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const handleUnauthorized = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setAuthError("Your account access has been revoked or is pending approval.");
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
    localStorage.removeItem('auth_token');  // Consistent token name
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiresAt');
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      authError,  // Include this in the value
      login, 
      logout 
    }}>
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
