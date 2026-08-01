import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { getMockClient, isDevMode } from './mock-db'

export const createSupabaseClient = () => {
  if (isDevMode() && typeof window === 'undefined') {
    return getMockClient() as any
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const supabase = createSupabaseClient()

export const supabaseAdmin = (() => {
  if (isDevMode() && typeof window === 'undefined') {
    return getMockClient() as any
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
})()
