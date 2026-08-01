import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getMockClient, isDevMode } from './mock-db'

export const createServerClient = async () => {
  if (isDevMode()) {
    return getMockClient() as any
  }

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
          }
        },
      },
    }
  )
}

export function getSupabaseAdmin(): SupabaseClient {
  if (isDevMode()) {
    return getMockClient() as unknown as SupabaseClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
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
