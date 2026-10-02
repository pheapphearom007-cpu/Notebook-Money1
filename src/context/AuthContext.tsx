import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthContextType, LoginPayload, RegisterPayload } from '../types/auth';
import { ApiService } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');

  // Initialize and restore authentication on application load
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const saved = ApiService.getSavedSession();
        if (!saved || !saved.token) {
          if (isMounted) {
            setUser(null);
            setToken(null);
            setIsLoading(false);
          }
          return;
        }

        // Verify token with backend
        const verifiedUser = await ApiService.getCurrentUser(saved.token);
        if (isMounted) {
          if (verifiedUser) {
            setUser(verifiedUser);
            setToken(saved.token);
            setSyncStatus('synced');
          } else {
            // Token expired or invalid
            ApiService.clearSession();
            setUser(null);
            setToken(null);
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Authentication restoration notice:', err);
        if (isMounted) {
          // If network failed but user was previously saved, allow offline access with cached token
          const saved = ApiService.getSavedSession();
          if (saved) {
            setUser(saved.user);
            setToken(saved.token);
            setSyncStatus('offline');
          } else {
            setUser(null);
            setToken(null);
          }
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async ({ email, password }: LoginPayload): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setSyncStatus('syncing');
    try {
      const session = await ApiService.login(email, password);
      setUser(session.user);
      setToken(session.token);
      setSyncStatus('synced');
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      setSyncStatus('error');
      return { success: false, error: msg };
    }
  }, []);

  const register = useCallback(async ({ name, email, password }: RegisterPayload): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setSyncStatus('syncing');
    try {
      const session = await ApiService.register(name, email, password);
      setUser(session.user);
      setToken(session.token);
      setSyncStatus('synced');
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please try again.';
      setError(msg);
      setSyncStatus('error');
      return { success: false, error: msg };
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await ApiService.logout(token || undefined);
    } finally {
      setUser(null);
      setToken(null);
      setError(null);
      setSyncStatus('synced');
    }
  }, [token]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
        syncStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
