import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from Vite environment or localStorage override (configured in settings)
const getEnvSupabase = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('sievphov_supabase_url') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('sievphov_supabase_key') : null;

  const url = localUrl || envUrl || '';
  const key = localKey || envKey || '';

  return { url, key };
};

let clientInstance: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getEnvSupabase();
  return Boolean(url && key && url.startsWith('http'));
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { url, key } = getEnvSupabase();
  if (!clientInstance) {
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return clientInstance;
};

export const configureSupabaseCredentials = (url: string, key: string): void => {
  if (typeof window !== 'undefined') {
    if (url && key) {
      localStorage.setItem('sievphov_supabase_url', url.trim());
      localStorage.setItem('sievphov_supabase_key', key.trim());
    } else {
      localStorage.removeItem('sievphov_supabase_url');
      localStorage.removeItem('sievphov_supabase_key');
    }
    clientInstance = null; // Reset instance to recreate
  }
};
