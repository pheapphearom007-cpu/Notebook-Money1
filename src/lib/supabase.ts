import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Centrally managed environment variables (Vite build & runtime)
const getCredentials = () => {
  const url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  return { url, key };
};

// Clean up any legacy localStorage entries from older versions
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('sievphov_supabase_url');
    localStorage.removeItem('sievphov_supabase_key');
  } catch {}
}

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
    !url.includes('your-project') &&
    !key.includes('your-anon-public-key') &&
    !isServiceRoleKey(key)
  );
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    if (import.meta.env.DEV) {
      console.warn(
        '[Supabase Developer Notice] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not configured in .env. ' +
        'Please define them in your environment variables for automatic cloud authentication.'
      );
    }
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
