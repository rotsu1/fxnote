import 'server-only'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/src/lib/supabaseServer'

// Read current user using the Supabase service client and the access token from cookies
export async function requireUser() {
  const store = await cookies()
  const token = store.get('sb-access-token')?.value
  if (!token) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 })
  }
  const { data, error } = await supabaseServer.auth.getUser(token)
  if (error || !data?.user) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 })
  }
  return data.user
}
