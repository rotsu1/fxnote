import { createClient } from '@supabase/supabase-js';
import 'server-only';

if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL is not set in environment variables');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
}

/**
 * Supabase client with service role key for server-side operations
 * ⚠️ IMPORTANT: This should NEVER be imported on the client side
 * Use this only in API routes, server components, and server actions
 */
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
