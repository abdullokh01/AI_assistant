// Supabase Clients - AI Project Intelligence Platform
// Path: src/lib/shared/supabase-client.ts

import { createClient } from '@supabase/supabase-js';

// Browser-exposed values (NEXT_PUBLIC_*) fall back to the server-only names so
// server code keeps working; only the NEXT_PUBLIC_* ones reach the browser bundle.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://placeholder-url-for-build.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'placeholder-anon-key';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

if (!supabaseUrl.includes('supabase.co') || supabaseUrl.includes('placeholder')) {
  console.warn('Warning: Supabase URL is not configured. Using build placeholder.');
}

// Client for standard browser or client-side calls (utilizes RLS + auth session)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Client for administrative backend tasks (bypasses RLS, only use in server context)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
