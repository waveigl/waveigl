import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const createServerClient = async () => {
  const cookieStore = await cookies()

  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    // Ambiente de dev sem envs: cria client apontando para localhost (supabase start)
    if (process.env.NODE_ENV !== 'production' && process.env.SUPABASE_LOCAL_URL && process.env.SUPABASE_LOCAL_SERVICE_KEY) {
      return createClient(process.env.SUPABASE_LOCAL_URL, process.env.SUPABASE_LOCAL_SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
    }
    throw new Error('Supabase admin env vars ausentes')
  }
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
