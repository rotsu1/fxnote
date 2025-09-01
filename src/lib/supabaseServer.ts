import 'server-only'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/src/env'

// Server-side admin client using service role key.
export const supabaseServer: SupabaseClient = createClient(
  // Use the same URL as the public client
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { 'X-Client-Info': 'fxnote-admin' } },
  },
)

