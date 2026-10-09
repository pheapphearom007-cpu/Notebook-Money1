import { User, AuthSession } from '../types/auth';
import { Customer } from '../types/customer';
import { GeneralNote } from '../types/note';
import { isSupabaseConfigured, getSupabaseClient } from './supabaseClient';

const TOKEN_KEY = 'sievphov_auth_token_v1';
const USER_KEY = 'sievphov_auth_user_v1';

export interface SafeResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  isJson: boolean;
  isHtml: boolean;
  isEmpty: boolean;
  error?: string;
}

// Safely parse JSON from a response, handling empty bodies, 404/405, and HTML fallback
async function safeParseJson<T = any>(res: Response): Promise<SafeResponse<T>> {
  const status = res.status;
  try {
    const text = await res.text();
    if (!text || !text.trim()) {
      return {
        ok: false,
        status,
        data: {} as T,
        isJson: false,
        isHtml: false,
        isEmpty: true,
        error: 'Empty response received from server',
      };
    }
    const trimmed = text.trim();
    // Static servers returning HTML (like index.html rewrite or 404 HTML error page)
    if (trimmed.startsWith('<') || trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<!doctype')) {
      return {
        ok: false,
        status,
        data: {} as T,
        isJson: false,
        isHtml: true,
        isEmpty: false,
        error: 'HTML page received instead of API response',
      };
    }
    const data = JSON.parse(trimmed);
    return {
      ok: res.ok,
      status,
      data,
      isJson: true,
      isHtml: false,
      isEmpty: false,
      error: !res.ok && data?.error ? data.error : undefined,
    };
  } catch (err: any) {
    return {
      ok: false,
      status,
      data: {} as T,
      isJson: false,
      isHtml: false,
      isEmpty: false,
      error: err?.message || 'Failed to parse JSON response',
    };
  }
}

// Base API URL: default to current origin + /api
const getApiBase = (): string => {
  if (typeof window !== 'undefined') {
    // If running in browser and origin is available
    if (window.location.protocol.startsWith('http')) {
      return `${window.location.origin}/api`;
    }
  }
  return '/api';
};

// Client-side fallback storage key helper for user data isolation
const getUserScopedStorageKey = (userId: string, key: string) => `sievphov_u_${userId}_${key}`;

export const ApiService = {
  // Simple non-plaintext hashing for client-side local fallback storage
  simpleHash(password: string, salt: string): string {
    let hash = 0;
    const combined = salt + ':' + password;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  },

  // Save active session token
  saveSession(session: AuthSession): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(TOKEN_KEY, session.token);
      localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    } catch (e) {
      console.error('Failed to save session to localStorage', e);
    }
  },

  getSavedSession(): { user: User; token: string } | null {
    if (typeof window === 'undefined') return null;
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);
      if (!token || !userStr) return null;
      return {
        token,
        user: JSON.parse(userStr) as User,
      };
    } catch {
      return null;
    }
  },

  clearSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // 1. REGISTER
  async register(name: string, email: string, password: string): Promise<AuthSession> {
    const normalizedEmail = email.trim().toLowerCase();

    // Check Supabase first if configured
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { name: name.trim() },
        },
      });

      if (error) {
        throw new Error(error.message);
      }
      if (!data.user) {
        throw new Error('Registration failed. Please try again.');
      }

      const sessionUser: User = {
        id: data.user.id,
        name: name.trim() || data.user.user_metadata?.name || normalizedEmail.split('@')[0],
        email: data.user.email || normalizedEmail,
        createdAt: data.user.created_at || new Date().toISOString(),
      };
      const token = data.session?.access_token || `supa_${Date.now()}`;
      const session = { user: sessionUser, token };
      this.saveSession(session);
      return session;
    }

    // Central Server API (PostgreSQL / Central Database)
    try {
      const res = await fetch(`${getApiBase()}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: normalizedEmail, password }),
      });

      const parsed = await safeParseJson(res);

      if (parsed.isJson && parsed.ok && parsed.data?.user) {
        const session: AuthSession = {
          user: parsed.data.user,
          token: parsed.data.token,
        };
        this.saveSession(session);

        // Remove from legacy local vault if it existed
        this.clearLegacyUser(normalizedEmail);

        return session;
      }

      if (parsed.isJson && parsed.data?.error) {
        throw new Error(parsed.data.error);
      }

      // Handle Static Site / missing backend API gracefully
      if (parsed.isEmpty || parsed.isHtml || parsed.status === 404) {
        throw new Error(
          'សេវាចុះឈ្មោះកណ្តាលមិនទាន់ដំណើរការ (Static hosting mode detected - API unavailable). សូមកំណត់ភ្ជាប់ Supabase Cloud ក្នុងប្រព័ន្ធដើម្បីចុះឈ្មោះ។'
        );
      }

      throw new Error(parsed.error || 'Registration failed. Server returned an invalid response.');
    } catch (err: any) {
      if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('network')) {
        throw new Error('Cannot connect to authentication server. Please verify your connection or server status.');
      }
      throw err;
    }
  },

  // 2. LOGIN
  async login(email: string, password: string): Promise<AuthSession> {
    const normalizedEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }
      if (!data.user || !data.session) {
        throw new Error('Login failed. Please check your credentials.');
      }

      const sessionUser: User = {
        id: data.user.id,
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
        email: data.user.email || normalizedEmail,
        createdAt: data.user.created_at || new Date().toISOString(),
      };

      const session: AuthSession = {
        user: sessionUser,
        token: data.session.access_token,
      };
      this.saveSession(session);
      return session;
    }

    try {
      const res = await fetch(`${getApiBase()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      const parsed = await safeParseJson(res);

      if (parsed.isJson && parsed.ok && parsed.data?.user) {
        const session: AuthSession = {
          user: parsed.data.user,
          token: parsed.data.token,
        };
        this.saveSession(session);
        this.clearLegacyUser(normalizedEmail);
        return session;
      }

      // If user was created in legacy local vault on Device A, auto-promote to central server
      const legacyUser = this.findLegacyUser(normalizedEmail, password);
      if (legacyUser) {
        try {
          console.log(`[AUTH] Auto-migrating legacy device-local account for ${normalizedEmail} to central database...`);
          return await this.register(legacyUser.name || 'User', normalizedEmail, password);
        } catch {
          // If promotion fails, proceed to report error
        }
      }

      if (parsed.isJson && !parsed.ok && parsed.data?.error) {
        throw new Error(parsed.data.error);
      }

      // Handle Static Site / missing backend API gracefully
      if (parsed.isEmpty || parsed.isHtml || parsed.status === 404) {
        throw new Error(
          'សេវាចូលប្រើប្រាស់កណ្តាលមិនទាន់ដំណើរការ (Static hosting mode detected - API unavailable). សូមកំណត់ភ្ជាប់ Supabase Cloud ក្នុងប្រព័ន្ធដើម្បីចូលប្រើប្រាស់។'
        );
      }

      throw new Error('Invalid email or password.');
    } catch (err: any) {
      if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('network')) {
        throw new Error('Cannot connect to authentication server. Please verify your connection or server status.');
      }
      throw err;
    }
  },

  // Helper to find legacy user in local storage for auto-promotion
  findLegacyUser(email: string, password: string): { name: string; email: string } | null {
    if (typeof window === 'undefined') return null;
    try {
      const usersStr = localStorage.getItem('sievphov_vault_users');
      if (!usersStr) return null;
      const users = JSON.parse(usersStr);
      const match = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase() && u.password === password);
      return match ? { name: match.name, email: match.email } : null;
    } catch {
      return null;
    }
  },

  clearLegacyUser(email: string): void {
    if (typeof window === 'undefined') return;
    try {
      const usersStr = localStorage.getItem('sievphov_vault_users');
      if (!usersStr) return;
      const users = JSON.parse(usersStr);
      const filtered = users.filter((u: any) => u.email?.toLowerCase() !== email.toLowerCase());
      localStorage.setItem('sievphov_vault_users', JSON.stringify(filtered));
    } catch {}
  },

  // PASSWORD RESET APIS
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string; devResetUrl?: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}`
        : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: redirectUrl,
      });
      if (error) throw new Error(error.message);
      return { success: true, message: 'Password reset link sent.' };
    }

    const res = await fetch(`${getApiBase()}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail }),
    });

    const parsed = await safeParseJson(res);
    if (parsed.isJson && parsed.ok) {
      return {
        success: true,
        message: parsed.data?.message || 'Password reset link sent.',
        devResetUrl: parsed.data?.devResetUrl,
      };
    }

    if (parsed.isJson && parsed.data?.error) {
      throw new Error(parsed.data.error);
    }

    throw new Error('Failed to request password reset. Please try again.');
  },

  async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string; error?: string }> {
    const res = await fetch(`${getApiBase()}/auth/verify-reset-token?token=${encodeURIComponent(token)}`, {
      method: 'GET',
    });

    const parsed = await safeParseJson(res);
    if (parsed.isJson && parsed.ok && parsed.data?.valid) {
      return { valid: true, email: parsed.data?.email };
    }

    return {
      valid: false,
      error: parsed.data?.error || 'Invalid or expired password reset token.',
    };
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${getApiBase()}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.trim(), newPassword }),
    });

    const parsed = await safeParseJson(res);
    if (parsed.isJson && parsed.ok) {
      return {
        success: true,
        message: parsed.data?.message || 'Password reset successfully.',
      };
    }

    if (parsed.isJson && parsed.data?.error) {
      throw new Error(parsed.data.error);
    }

    throw new Error('Failed to reset password. Token may be invalid or expired.');
  },

  // 3. GET CURRENT USER (Verify Session)
  async getCurrentUser(token: string): Promise<User | null> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return null;
      return {
        id: data.user.id,
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
        email: data.user.email || '',
        createdAt: data.user.created_at || new Date().toISOString(),
      };
    }

    // Isolated vault tokens & demo tokens don't query external /api
    if (token.startsWith('vault_') || token.startsWith('demo_') || token.startsWith('supa_')) {
      const saved = this.getSavedSession();
      return saved?.user || null;
    }

    try {
      const res = await fetch(`${getApiBase()}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const parsed = await safeParseJson(res);
      if (parsed.isJson && parsed.ok && parsed.data?.user) {
        return parsed.data.user;
      }

      // If backend is not available or static hosting rewrite, fall back to saved session
      const saved = this.getSavedSession();
      return saved?.user || null;
    } catch {
      // In offline/static mode, return saved session user
      const saved = this.getSavedSession();
      return saved?.user || null;
    }
  },

  // 4. LOGOUT
  async logout(token?: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;
      await supabase.auth.signOut();
    } else if (token && !token.startsWith('vault_') && !token.startsWith('demo_')) {
      try {
        await fetch(`${getApiBase()}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Ignore network errors on logout
      }
    }
    this.clearSession();
  },

  // 5. FETCH USER'S CUSTOMERS
  async getCustomers(token: string, userId: string): Promise<Customer[]> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Supabase getCustomers error:', error);
        return this.getCachedCustomers(userId);
      }
      const mapped = (data || []).map(this.mapSupabaseCustomer);
      this.cacheCustomers(userId, mapped);
      return mapped;
    }

    if (token.startsWith('vault_') || token.startsWith('demo_')) {
      return this.getCachedCustomers(userId);
    }

    try {
      const res = await fetch(`${getApiBase()}/customers`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const parsed = await safeParseJson(res);
      if (parsed.isJson && parsed.ok && Array.isArray(parsed.data)) {
        this.cacheCustomers(userId, parsed.data);
        return parsed.data;
      }
      return this.getCachedCustomers(userId);
    } catch (err) {
      console.warn('Network issue fetching customers from cloud, using cached records:', err);
      return this.getCachedCustomers(userId);
    }
  },

  // 6. CREATE CUSTOMER
  async createCustomer(token: string, userId: string, customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const now = new Date().toISOString();
    const customerId = (customerData as any).id || `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newCustomer: Customer = {
      ...customerData,
      id: customerId,
      userId,
      createdAt: (customerData as any).createdAt || now,
      updatedAt: now,
    };

    // Cache locally immediately to ensure no data loss even during sudden reloads
    this.saveLocalCustomer(userId, newCustomer);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;
      const { error } = await supabase.from('customers').insert({
        id: newCustomer.id,
        user_id: userId,
        name: newCustomer.name,
        phone: newCustomer.phone,
        address: newCustomer.address,
        province: newCustomer.province,
        date: newCustomer.date,
        note: newCustomer.note,
        status: newCustomer.status,
        category: newCustomer.category,
        priority: newCustomer.priority,
        email: newCustomer.email,
        telegram: newCustomer.telegram,
        balance: newCustomer.balance,
        currency: newCustomer.currency || 'USD',
        history: newCustomer.history || [],
        created_at: newCustomer.createdAt,
        updated_at: newCustomer.updatedAt,
      });

      if (error) {
        console.error('Supabase createCustomer error:', error);
      }
      return newCustomer;
    }

    if (!token.startsWith('vault_') && !token.startsWith('demo_')) {
      try {
        const res = await fetch(`${getApiBase()}/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newCustomer),
        });

        const parsed = await safeParseJson(res);
        if (parsed.isJson && parsed.ok && parsed.data?.id) {
          this.saveLocalCustomer(userId, parsed.data);
          return parsed.data;
        }
      } catch (err) {
        console.warn('Cloud save failed, cached locally:', err);
      }
    }

    return newCustomer;
  },

  // 7. UPDATE CUSTOMER
  async updateCustomer(token: string, userId: string, id: string, data: Partial<Customer>): Promise<void> {
    const now = new Date().toISOString();

    // 1. Immediately update client cache so reload never reverts to old data!
    const current = this.getCachedCustomers(userId);
    const existingIdx = current.findIndex((c) => c.id === id);
    let updated: Customer[];
    if (existingIdx !== -1) {
      updated = current.map((c) => (c.id === id ? { ...c, ...data, updatedAt: now } : c));
    } else {
      updated = [{ ...data, id, userId, createdAt: now, updatedAt: now } as Customer, ...current];
    }
    this.cacheCustomers(userId, updated);

    // 2. Sync update to cloud database
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;
      await supabase
        .from('customers')
        .update({
          ...data,
          updated_at: now,
        })
        .eq('id', id)
        .eq('user_id', userId);
    } else if (!token.startsWith('vault_') && !token.startsWith('demo_')) {
      try {
        await fetch(`${getApiBase()}/customers/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });
      } catch (err) {
        console.warn('Cloud update failed, updating cached records:', err);
      }
    }
  },

  // 8. DELETE CUSTOMER
  async deleteCustomer(token: string, userId: string, id: string): Promise<void> {
    // 1. Immediately remove from client cache
    const current = this.getCachedCustomers(userId);
    this.cacheCustomers(userId, current.filter((c) => c.id !== id));

    // 2. Sync deletion to cloud database
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;
      await supabase.from('customers').delete().eq('id', id).eq('user_id', userId);
    } else if (!token.startsWith('vault_') && !token.startsWith('demo_')) {
      try {
        await fetch(`${getApiBase()}/customers/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.warn('Cloud delete failed, removing from local cache:', err);
      }
    }
  },

  // 9. FETCH USER'S NOTES
  async getNotes(token: string, userId: string): Promise<GeneralNote[]> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        return this.getCachedNotes(userId);
      }
      const mapped = (data || []).map(this.mapSupabaseNote);
      this.cacheNotes(userId, mapped);
      return mapped;
    }

    if (token.startsWith('vault_') || token.startsWith('demo_')) {
      return this.getCachedNotes(userId);
    }

    try {
      const res = await fetch(`${getApiBase()}/notes`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const parsed = await safeParseJson(res);
      if (parsed.isJson && parsed.ok && Array.isArray(parsed.data)) {
        this.cacheNotes(userId, parsed.data);
        return parsed.data;
      }
      return this.getCachedNotes(userId);
    } catch {
      return this.getCachedNotes(userId);
    }
  },

  // 10. CREATE NOTE
  async createNote(token: string, userId: string, noteData: Omit<GeneralNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<GeneralNote> {
    const now = new Date().toISOString();
    const noteId = (noteData as any).id || `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newNote: GeneralNote = {
      ...noteData,
      id: noteId,
      userId,
      createdAt: (noteData as any).createdAt || now,
      updatedAt: now,
    };

    // Cache locally immediately to ensure persistence across reloads
    this.saveLocalNote(userId, newNote);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;
      await supabase.from('notes').insert({
        id: newNote.id,
        user_id: userId,
        title: newNote.title,
        content: newNote.content,
        category: newNote.category,
        customer_id: newNote.customerId,
        customer_name: newNote.customerName,
        color: newNote.color,
        is_pinned: newNote.isPinned,
        created_at: newNote.createdAt,
        updated_at: newNote.updatedAt,
      });
      return newNote;
    }

    if (!token.startsWith('vault_') && !token.startsWith('demo_')) {
      try {
        const res = await fetch(`${getApiBase()}/notes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newNote),
        });

        const parsed = await safeParseJson(res);
        if (parsed.isJson && parsed.ok && parsed.data?.id) {
          this.saveLocalNote(userId, parsed.data);
          return parsed.data;
        }
      } catch (err) {
        console.warn('Cloud note save failed, cached locally:', err);
      }
    }

    return newNote;
  },

  // 11. UPDATE NOTE
  async updateNote(token: string, userId: string, id: string, data: Partial<GeneralNote>): Promise<void> {
    const now = new Date().toISOString();

    // 1. Immediately update client cache
    const current = this.getCachedNotes(userId);
    const existingIdx = current.findIndex((n) => n.id === id);
    let updated: GeneralNote[];
    if (existingIdx !== -1) {
      updated = current.map((n) => (n.id === id ? { ...n, ...data, updatedAt: now } : n));
    } else {
      updated = [{ ...data, id, userId, createdAt: now, updatedAt: now } as GeneralNote, ...current];
    }
    this.cacheNotes(userId, updated);

    // 2. Sync to cloud database
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;
      await supabase
        .from('notes')
        .update({
          title: data.title,
          content: data.content,
          category: data.category,
          color: data.color,
          is_pinned: data.isPinned,
          updated_at: now,
        })
        .eq('id', id)
        .eq('user_id', userId);
    } else if (!token.startsWith('vault_') && !token.startsWith('demo_')) {
      try {
        await fetch(`${getApiBase()}/notes/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });
      } catch (err) {
        console.warn('Cloud update note failed, updating cached records:', err);
      }
    }
  },

  // 12. DELETE NOTE
  async deleteNote(token: string, userId: string, id: string): Promise<void> {
    // 1. Immediately remove from client cache
    const current = this.getCachedNotes(userId);
    this.cacheNotes(userId, current.filter((n) => n.id !== id));

    // 2. Sync deletion to cloud database
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;
      await supabase.from('notes').delete().eq('id', id).eq('user_id', userId);
    } else if (!token.startsWith('vault_') && !token.startsWith('demo_')) {
      try {
        await fetch(`${getApiBase()}/notes/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.warn('Cloud delete note failed:', err);
      }
    }
  },

  // Cache & Local Vault Helpers (User-isolated)
  getCachedCustomers(userId: string): Customer[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(getUserScopedStorageKey(userId, 'customers'));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  cacheCustomers(userId: string, customers: Customer[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(getUserScopedStorageKey(userId, 'customers'), JSON.stringify(customers));
    } catch (e) {
      console.error('Failed to cache customers', e);
    }
  },

  saveLocalCustomer(userId: string, customer: Customer): void {
    const list = this.getCachedCustomers(userId);
    const updated = [customer, ...list.filter((c) => c.id !== customer.id)];
    this.cacheCustomers(userId, updated);
  },

  getCachedNotes(userId: string): GeneralNote[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(getUserScopedStorageKey(userId, 'notes'));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  cacheNotes(userId: string, notes: GeneralNote[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(getUserScopedStorageKey(userId, 'notes'), JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to cache notes', e);
    }
  },

  saveLocalNote(userId: string, note: GeneralNote): void {
    const list = this.getCachedNotes(userId);
    const updated = [note, ...list.filter((n) => n.id !== note.id)];
    this.cacheNotes(userId, updated);
  },

  // Client Fallback Helpers for offline / file:// protocol
  clientFallbackRegister(name: string, email: string, password: string): AuthSession {
    const usersStr = localStorage.getItem('sievphov_vault_users') || '[]';
    let users: any[] = [];
    try {
      users = JSON.parse(usersStr);
    } catch {
      users = [];
    }
    const normalizedEmail = email.trim().toLowerCase();

    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error('An account with this email address already exists.');
    }

    const salt = Math.random().toString(36).substring(2, 10);
    const passwordHash = this.simpleHash(password, salt);

    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: normalizedEmail,
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem('sievphov_vault_users', JSON.stringify(users));

    const token = `vault_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const sessionUser: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };
    const session = { user: sessionUser, token };
    this.saveSession(session);
    return session;
  },

  clientFallbackLogin(email: string, password: string): AuthSession {
    const usersStr = localStorage.getItem('sievphov_vault_users') || '[]';
    let users: any[] = [];
    try {
      users = JSON.parse(usersStr);
    } catch {
      users = [];
    }
    const normalizedEmail = email.trim().toLowerCase();

    // Check pre-configured demo user
    if (normalizedEmail === 'demo@sievphov.com' && password === 'password123') {
      const demoUser: User = {
        id: 'user_demo_sovannara',
        name: 'សុខ សុវណ្ណារ៉ា',
        email: 'demo@sievphov.com',
        createdAt: '2026-09-01T00:00:00Z',
      };
      const session = { user: demoUser, token: 'demo_token_valid' };
      this.saveSession(session);
      return session;
    }

    const user = users.find((u) => {
      if (u.email?.toLowerCase() !== normalizedEmail) return false;
      if (u.passwordHash && u.salt) {
        return u.passwordHash === this.simpleHash(password, u.salt);
      }
      return u.password === password;
    });
    if (!user) {
      throw new Error('Invalid email address or password.');
    }

    const token = `vault_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const sessionUser: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
    const session = { user: sessionUser, token };
    this.saveSession(session);
    return session;
  },

  // Map Supabase rows to Customer interface
  mapSupabaseCustomer(row: any): Customer {
    const rawDebt = row.outstanding_debt !== null && row.outstanding_debt !== undefined
      ? Number(row.outstanding_debt)
      : (row.balance !== null && row.balance !== undefined ? Number(row.balance) : 0);
    const cName = row.customer_name || row.name || '';
    const cCat = row.product_category || row.category || 'general';
    const cNotes = row.notes || row.note || '';

    return {
      id: row.id,
      userId: row.user_id,
      customerName: cName,
      name: cName,
      phone: row.phone || '',
      address: row.address || '',
      province: row.province || '',
      date: row.date,
      notes: cNotes,
      note: cNotes,
      status: row.status,
      productCategory: cCat,
      category: cCat,
      amount: row.amount !== null && row.amount !== undefined ? Number(row.amount) : 0,
      priceOfGoods: row.price_of_goods !== null && row.price_of_goods !== undefined ? Number(row.price_of_goods) : 0,
      outstandingDebt: rawDebt,
      priority: row.priority,
      email: row.email,
      telegram: row.telegram,
      balance: rawDebt,
      currency: row.currency || 'USD',
      history: row.history || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  mapSupabaseNote(row: any): GeneralNote {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      content: row.content || '',
      category: row.category,
      customerId: row.customer_id,
      customerName: row.customer_name,
      color: row.color || 'yellow',
      isPinned: Boolean(row.is_pinned),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },
};
