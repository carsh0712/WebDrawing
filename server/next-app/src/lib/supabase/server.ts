import { createClient } from '@supabase/supabase-js';
import { runtimeEnvironment } from '@/lib/runtime/environment';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasSupabaseServerConfig = Boolean(supabaseUrl && serviceRoleKey);

export const createSupabaseServerClient = () => {
  if (runtimeEnvironment.databaseProvider !== 'supabase') {
    throw new Error('Supabase server client is only available when DATABASE_PROVIDER=supabase.');
  }

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase server environment variables are not configured.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const createSupabaseUserClient = (accessToken: string) => {
  if (runtimeEnvironment.databaseProvider !== 'supabase') {
    throw new Error('Supabase user client is only available when DATABASE_PROVIDER=supabase.');
  }

  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase user environment variables are not configured.');
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};
