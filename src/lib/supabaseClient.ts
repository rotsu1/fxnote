import { createClient } from '@supabase/supabase-js'
import { publicEnv } from '@/src/env'

// Client/browser Supabase instance. Import only in client components.
export const supabaseBrowser = createClient(
  publicEnv.NEXT_PUBLIC_SUPABASE_URL,
  publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: { persistSession: true, autoRefreshToken: true },
  },
)

