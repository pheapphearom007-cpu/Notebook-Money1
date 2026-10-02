import { User, AuthSession } from '../types/auth';
import { Customer } from '../types/customer';
import { GeneralNote } from '../types/note';
import { isSupabaseConfigured, getSupabaseClient } from './supabaseClient';

const TOKEN_KEY = 'sievphov_auth_token_v1';
const USER_KEY = 'sievphov_auth_user_v1';

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
    // Check Supabase first if configured
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
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
        name: name.trim(),
        email: data.user.email || email,
        createdAt: data.user.created_at || new Date().toISOString(),
      };
      const token = data.session?.access_token || `supa_${Date.now()}`;
      const session = { user: sessionUser, token };
      this.saveSession(session);
      return session;
    }

    // Central Server API
    try {
      const res = await fetch(`${getApiBase()}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      const session: AuthSession = {
        user: data.user,
        token: data.token,
      };
      this.saveSession(session);
      return session;
    } catch (err: any) {
      // If server unreachable (e.g. file:// mode), provide client-isolated secure registration
      if (typeof window !== 'undefined' && (err.message.includes('fetch') || err.message.includes('Network'))) {
        return this.clientFallbackRegister(name, email, password);
      }
      throw err;
    }
  },

  // 2. LOGIN
  async login(email: string, password: string): Promise<AuthSession> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
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
        email: data.user.email || email,
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
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      const session: AuthSession = {
        user: data.user,
        token: data.token,
      };
      this.saveSession(session);
      return session;
    } catch (err: any) {
      if (typeof window !== 'undefined' && (err.message.includes('fetch') || err.message.includes('Network'))) {
        return this.clientFallbackLogin(email, password);
      }
      throw err;
    }
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

    try {
      const res = await fetch(`${getApiBase()}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return null;
      const data = await res.json();
      return data.user || null;
    } catch {
      // In offline/file mode, return saved session user
      const saved = this.getSavedSession();
      return saved?.user || null;
    }
  },

  // 4. LOGOUT
  async logout(token?: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;
      await supabase.auth.signOut();
    } else if (token) {
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

    try {
      const res = await fetch(`${getApiBase()}/customers`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        return this.getCachedCustomers(userId);
      }

      const customers = await res.json();
      this.cacheCustomers(userId, customers);
      return customers;
    } catch (err) {
      console.warn('Network issue fetching customers from cloud, using cached records:', err);
      return this.getCachedCustomers(userId);
    }
  },

  // 6. CREATE CUSTOMER
  async createCustomer(token: string, userId: string, customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const now = new Date().toISOString();
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      createdAt: now,
      updatedAt: now,
    };

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
      this.saveLocalCustomer(userId, newCustomer);
      return newCustomer;
    }

    try {
      const res = await fetch(`${getApiBase()}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCustomer),
      });

      if (res.ok) {
        const saved = await res.json();
        this.saveLocalCustomer(userId, saved);
        return saved;
      }
    } catch (err) {
      console.warn('Cloud save failed, cached locally:', err);
    }

    this.saveLocalCustomer(userId, newCustomer);
    return newCustomer;
  },

  // 7. UPDATE CUSTOMER
  async updateCustomer(token: string, userId: string, id: string, data: Partial<Customer>): Promise<void> {
    const now = new Date().toISOString();

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
    } else {
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

    // Update client cache
    const current = this.getCachedCustomers(userId);
    const updated = current.map((c) => (c.id === id ? { ...c, ...data, updatedAt: now } : c));
    this.cacheCustomers(userId, updated);
  },

  // 8. DELETE CUSTOMER
  async deleteCustomer(token: string, userId: string, id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;
      await supabase.from('customers').delete().eq('id', id).eq('user_id', userId);
    } else {
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

    const current = this.getCachedCustomers(userId);
    this.cacheCustomers(userId, current.filter((c) => c.id !== id));
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

    try {
      const res = await fetch(`${getApiBase()}/notes`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        return this.getCachedNotes(userId);
      }

      const notes = await res.json();
      this.cacheNotes(userId, notes);
      return notes;
    } catch {
      return this.getCachedNotes(userId);
    }
  },

  // 10. CREATE NOTE
  async createNote(token: string, userId: string, noteData: Omit<GeneralNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<GeneralNote> {
    const now = new Date().toISOString();
    const newNote: GeneralNote = {
      ...noteData,
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      createdAt: now,
      updatedAt: now,
    };

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
      this.saveLocalNote(userId, newNote);
      return newNote;
    }

    try {
      const res = await fetch(`${getApiBase()}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newNote),
      });

      if (res.ok) {
        const saved = await res.json();
        this.saveLocalNote(userId, saved);
        return saved;
      }
    } catch (err) {
      console.warn('Cloud note save failed, cached locally:', err);
    }

    this.saveLocalNote(userId, newNote);
    return newNote;
  },

  // 11. UPDATE NOTE
  async updateNote(token: string, userId: string, id: string, data: Partial<GeneralNote>): Promise<void> {
    const now = new Date().toISOString();

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
    } else {
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

    const current = this.getCachedNotes(userId);
    const updated = current.map((n) => (n.id === id ? { ...n, ...data, updatedAt: now } : n));
    this.cacheNotes(userId, updated);
  },

  // 12. DELETE NOTE
  async deleteNote(token: string, userId: string, id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient()!;
      await supabase.from('notes').delete().eq('id', id).eq('user_id', userId);
    } else {
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

    const current = this.getCachedNotes(userId);
    this.cacheNotes(userId, current.filter((n) => n.id !== id));
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
    const users: any[] = JSON.parse(usersStr);
    const normalizedEmail = email.trim().toLowerCase();

    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error('An account with this email address already exists.');
    }

    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: normalizedEmail,
      password, // In real backend pbkdf2 is used
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
    const users: any[] = JSON.parse(usersStr);
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

    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail && u.password === password);
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
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      phone: row.phone,
      address: row.address || '',
      province: row.province || '',
      date: row.date,
      note: row.note || '',
      status: row.status,
      category: row.category,
      priority: row.priority,
      email: row.email,
      telegram: row.telegram,
      balance: row.balance !== null ? Number(row.balance) : 0,
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
