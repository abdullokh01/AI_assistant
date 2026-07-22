// Supabase Clients - AI Project Intelligence Platform
// Path: src/lib/shared/supabase-client.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder-url-for-build.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

if (!process.env.SUPABASE_URL) {
  console.warn('Warning: SUPABASE_URL is not defined in environment variables. Using build placeholder.');
}

// Client for standard browser or client-side calls (utilizes RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client for administrative backend tasks (bypasses RLS, only use in server context)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
