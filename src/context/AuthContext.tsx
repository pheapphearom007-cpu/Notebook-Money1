import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthContextType, LoginPayload, RegisterPayload } from '../types/auth';
import { ApiService } from '../services/api';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Restore initial user session synchronously from storage to prevent layout flashes
  const [user, setUser] = useState<User | null>(() => {
    const saved = ApiService.getSavedSession();
    return saved?.user || null;
  });
  const [token, setToken] = useState<string | null>(() => {
    const saved = ApiService.getSavedSession();
    return saved?.token || null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const saved = ApiService.getSavedSession();
    return !saved;
  });
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);

  // Initialize and verify authentication on application mount
  useEffect(() => {
    let isMounted = true;

    // Check for password reset token in URL parameters or hash
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      let queryToken = urlParams.get('token');
      if (!queryToken && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        queryToken = hashParams.get('token');
      }

      if (queryToken) {
        const tokenToVerify = queryToken.trim();
        ApiService.verifyResetToken(tokenToVerify).then((res) => {
          if (!isMounted) return;
          if (res.valid) {
            setRecoveryToken(tokenToVerify);
            setIsPasswordRecovery(true);
            try {
              const cleanUrl = window.location.pathname + window.location.hash.replace(/[?&]token=[^&]+/, '');
              window.history.replaceState({}, document.title, cleanUrl || '/');
            } catch {}
          } else {
            setError(res.error || 'តំណរភ្ជាប់កំណត់ពាក្យសម្ងាត់មិនត្រឹមត្រូវ ឬផុតកំណត់ហើយ (Invalid or expired reset token)');
          }
        });
      }
    }

    // 1. If Supabase is configured, set up auth state change listener
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;

      // Check current session from Supabase
      supabase.auth.getSession().then(({ data: { session }, error: sessionErr }) => {
        if (!isMounted) return;
        if (sessionErr) {
          console.warn('Supabase getSession error:', sessionErr);
        }

        if (session && session.user) {
          const authUser: User = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            createdAt: session.user.created_at || new Date().toISOString(),
          };
          setUser(authUser);
          setToken(session.access_token);
          ApiService.saveSession({ user: authUser, token: session.access_token });
          setSyncStatus('synced');
        } else {
          // If no active Supabase session, clear state
          setUser(null);
          setToken(null);
          ApiService.clearSession();
        }
        setIsLoading(false);
      });

      // Listen to Supabase Auth events (login, logout, token refresh, password recovery)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session?.user) {
            const authUser: User = {
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              createdAt: session.user.created_at || new Date().toISOString(),
            };
            setUser(authUser);
            setToken(session.access_token);
            ApiService.saveSession({ user: authUser, token: session.access_token });
            setSyncStatus('synced');
          }
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setToken(null);
          setIsPasswordRecovery(false);
          ApiService.clearSession();
          setSyncStatus('synced');
          setIsLoading(false);
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }

    // 2. Fallback session restoration if Supabase is not yet configured (e.g. offline vault)
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

        const verifiedUser = await ApiService.getCurrentUser(saved.token);
        if (isMounted) {
          if (verifiedUser) {
            setUser(verifiedUser);
            setToken(saved.token);
            setSyncStatus('synced');
          } else if (saved.user) {
            setUser(saved.user);
            setToken(saved.token);
            setSyncStatus('offline');
          } else {
            ApiService.clearSession();
            setUser(null);
            setToken(null);
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Session restoration notice:', err);
        if (isMounted) {
          const saved = ApiService.getSavedSession();
          if (saved?.user) {
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

  // 1. LOGIN
  const login = useCallback(async ({ email, password }: LoginPayload): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setSyncStatus('syncing');

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;
      try {
        const { data, error: supaErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (supaErr) {
          const msg = supaErr.message === 'Invalid login credentials'
            ? 'អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវឡើយ (Invalid email or password)'
            : supaErr.message;
          setError(msg);
          setSyncStatus('error');
          return { success: false, error: msg };
        }

        if (!data.user || !data.session) {
          const msg = 'បរាជ័យក្នុងការចូលប្រើប្រាស់។ សូមព្យាយាមម្តងទៀត។';
          setError(msg);
          setSyncStatus('error');
          return { success: false, error: msg };
        }

        const sessionUser: User = {
          id: data.user.id,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
          email: data.user.email || email,
          createdAt: data.user.created_at || new Date().toISOString(),
        };

        setUser(sessionUser);
        setToken(data.session.access_token);
        ApiService.saveSession({ user: sessionUser, token: data.session.access_token });
        setSyncStatus('synced');
        return { success: true };
      } catch (err: any) {
        const msg = err.message || 'Login failed. Please check your credentials.';
        setError(msg);
        setSyncStatus('error');
        return { success: false, error: msg };
      }
    }

    // Fallback login
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

  // 2. REGISTER
  const register = useCallback(async ({ name, email, password }: RegisterPayload): Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }> => {
    setError(null);
    setSyncStatus('syncing');

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;
      try {
        const { data, error: supaErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { name: cleanName },
          },
        });

        if (supaErr) {
          const raw = supaErr.message.toLowerCase();
          let userMsg = supaErr.message;
          if (raw.includes('already registered') || raw.includes('already exists') || raw.includes('user_already_exists')) {
            userMsg = 'អ៊ីមែលនេះមានចុះឈ្មោះរួចហើយ សូមជ្រើសរើសអ៊ីមែលផ្សេង ឬចូលប្រើប្រាស់ (An account with this email already exists)';
          } else if (raw.includes('at least 6') || raw.includes('weak_password') || raw.includes('password should')) {
            userMsg = 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ (Password must be at least 6 characters)';
          } else if (raw.includes('rate limit') || raw.includes('over_email_send_rate_limit')) {
            userMsg = 'អ្នកបានព្យាយាមច្រើនដងពេក សូមរង់ចាំមួយភ្លែតរួចព្យាយាមម្តងទៀត (Rate limit exceeded. Please wait a moment)';
          } else if (raw.includes('invalid email') || raw.includes('unable to validate email')) {
            userMsg = 'ទម្រង់អ៊ីមែលមិនត្រឹមត្រូវឡើយ (Invalid email address format)';
          }

          setError(userMsg);
          setSyncStatus('error');
          return { success: false, error: userMsg };
        }

        // Supabase duplicate prevention check with email confirmation
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          const userMsg = 'អ៊ីមែលនេះមានចុះឈ្មោះរួចហើយ សូមជ្រើសរើសអ៊ីមែលផ្សេង ឬចូលប្រើប្រាស់ (An account with this email already exists)';
          setError(userMsg);
          setSyncStatus('error');
          return { success: false, error: userMsg };
        }

        if (!data.user) {
          const msg = 'ការចុះឈ្មោះមិនបានជោគជ័យ សូមព្យាយាមម្តងទៀត (Registration failed. Please try again)';
          setError(msg);
          setSyncStatus('error');
          return { success: false, error: msg };
        }

        // If email confirmation is required, session will be null
        if (!data.session) {
          setSyncStatus('synced');
          return { success: true, requiresEmailConfirmation: true };
        }

        // Active session established
        const sessionUser: User = {
          id: data.user.id,
          name: cleanName || data.user.user_metadata?.name || cleanEmail.split('@')[0],
          email: data.user.email || cleanEmail,
          createdAt: data.user.created_at || new Date().toISOString(),
        };

        const authToken = data.session.access_token;
        setUser(sessionUser);
        setToken(authToken);
        ApiService.saveSession({ user: sessionUser, token: authToken });
        setSyncStatus('synced');
        return { success: true };
      } catch (err: any) {
        const msg = err.message || 'Registration failed. Please try again.';
        setError(msg);
        setSyncStatus('error');
        return { success: false, error: msg };
      }
    }

    // Fallback register
    try {
      const session = await ApiService.register(cleanName, cleanEmail, password);
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

  // 3. LOGOUT
  const logout = useCallback(async (): Promise<void> => {
    try {
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient()!;
        await supabase.auth.signOut();
      } else {
        await ApiService.logout(token || undefined);
      }
    } catch (e) {
      console.warn('Logout notice:', e);
    } finally {
      setUser(null);
      setToken(null);
      setError(null);
      setIsPasswordRecovery(false);
      ApiService.clearSession();
      setSyncStatus('synced');
    }
  }, [token]);

  // 4. PASSWORD RESET (Request reset email)
  const resetPasswordForEmail = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;
      try {
        const redirectUrl = typeof window !== 'undefined'
          ? `${window.location.origin}${window.location.pathname}`
          : undefined;

        const { error: supaErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: redirectUrl,
        });

        if (supaErr) {
          setError(supaErr.message);
          return { success: false, error: supaErr.message };
        }

        return { success: true };
      } catch (err: any) {
        const msg = err.message || 'Failed to send password reset email';
        setError(msg);
        return { success: false, error: msg };
      }
    }

    // Central Server API password reset request
    try {
      const res = await ApiService.requestPasswordReset(email.trim());
      return { success: res.success };
    } catch (err: any) {
      const msg = err.message || 'Failed to send password reset email';
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // 5. UPDATE PASSWORD (Save new password during recovery or user profile)
  const updatePassword = useCallback(async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);

    // If active recovery token from central server
    if (recoveryToken) {
      try {
        const res = await ApiService.resetPassword(recoveryToken, newPassword);
        setRecoveryToken(null);
        setIsPasswordRecovery(false);
        return { success: res.success };
      } catch (err: any) {
        const msg = err.message || 'Failed to reset password';
        setError(msg);
        return { success: false, error: msg };
      }
    }

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;
      try {
        const { error: supaErr } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (supaErr) {
          setError(supaErr.message);
          return { success: false, error: supaErr.message };
        }

        setIsPasswordRecovery(false);
        return { success: true };
      } catch (err: any) {
        const msg = err.message || 'Failed to update password';
        setError(msg);
        return { success: false, error: msg };
      }
    }

    return {
      success: false,
      error: 'Cannot update password: No active recovery session or server connection found.',
    };
  }, [recoveryToken]);

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
        resetPasswordForEmail,
        updatePassword,
        isPasswordRecovery,
        setIsPasswordRecovery,
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
