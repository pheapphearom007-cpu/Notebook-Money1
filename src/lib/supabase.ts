import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variable and local override configuration
const getCredentials = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('sievphov_supabase_url') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('sievphov_supabase_key') : null;

  const url = (localUrl || envUrl || '').trim();
  const key = (localKey || envKey || '').trim();

  return { url, key };
};

// Security check: Verify that service_role key is NEVER used on client
const isServiceRoleKey = (key: string): boolean => {
  try {
    if (!key.includes('.')) return false;
    const parts = key.split('.');
    if (parts.length >= 2) {
      const payload = JSON.parse(atob(parts[1]));
      return payload.role === 'service_role';
    }
  } catch {
    // If not a standard JWT or cannot parse
  }
  return false;
};

let clientInstance: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getCredentials();
  return Boolean(
    url &&
    key &&
    (url.startsWith('https://') || url.startsWith('http://')) &&
    !isServiceRoleKey(key)
  );
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { url, key } = getCredentials();

  if (isServiceRoleKey(key)) {
    console.error('SECURITY WARNING: Supabase service_role key must NEVER be used on the client. Anon key required.');
    return null;
  }

  if (!clientInstance) {
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return clientInstance;
};

export const configureSupabaseCredentials = (url: string, key: string): void => {
  if (typeof window !== 'undefined') {
    const cleanUrl = url.trim();
    const cleanKey = key.trim();

    if (isServiceRoleKey(cleanKey)) {
      throw new Error('SECURITY VIOLATION: Cannot configure service_role key in frontend. Use anon public key only.');
    }

    if (cleanUrl && cleanKey) {
      localStorage.setItem('sievphov_supabase_url', cleanUrl);
      localStorage.setItem('sievphov_supabase_key', cleanKey);
    } else {
      localStorage.removeItem('sievphov_supabase_url');
      localStorage.removeItem('sievphov_supabase_key');
    }
    clientInstance = null; // Invalidate current client instance to re-initialize
  }
};

export const clearSupabaseCredentials = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('sievphov_supabase_url');
    localStorage.removeItem('sievphov_supabase_key');
    clientInstance = null;
  }
};

// Convenient accessor for the Supabase instance
export const supabase = {
  get auth() {
    return getSupabaseClient()?.auth ?? null;
  },
  from(table: string) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client is not configured');
    return client.from(table);
  },
  channel(name: string) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client is not configured');
    return client.channel(name);
  },
  removeChannel(channel: any) {
    const client = getSupabaseClient();
    return client?.removeChannel(channel);
  },
};
