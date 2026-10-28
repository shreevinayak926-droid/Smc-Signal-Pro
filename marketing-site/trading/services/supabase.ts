import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Default fallback credentials provided for this project
const DEFAULT_SUPABASE_URL = 'https://siuzursbntzvegquepaq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_OoYXJUHbuHrrp_qes0HlUg_n9mQOO9O';

export const getSupabaseConfig = (): SupabaseConfig => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('smc_custom_supabase_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.url && parsed.anonKey) {
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse custom Supabase config from localStorage', e);
      }
    }
  }

  const env = (typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>;
  const url =
    env.NEXT_PUBLIC_SUPABASE_URL ||
    env.VITE_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;
  const anonKey =
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_ANON_KEY;

  return { url, anonKey };
};

export const saveCustomSupabaseConfig = (config: SupabaseConfig | null) => {
  if (typeof window === 'undefined') return;
  if (!config) {
    localStorage.removeItem('smc_custom_supabase_config');
  } else {
    localStorage.setItem('smc_custom_supabase_config', JSON.stringify(config));
  }
};

let clientInstance: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey && config.url.startsWith('https://'));
};

export const getSupabaseClient = (): SupabaseClient => {
  const config = getSupabaseConfig();
  if (!clientInstance) {
    clientInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return clientInstance;
};

export const supabase = getSupabaseClient();
