/**
 * API Route for Views Counter
 * GET /api/streaming/views-counter - Returns current view count as plain text
 * Used for OBS browser source display
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
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
              // Handle cookie setting errors
            }
          },
        },
      }
    )

    // Get current view count from your streaming table
    // Adjust the query based on your actual table structure
    const { data, error } = await supabase
      .from('streaming_sessions')
      .select('view_count')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      // Return 0 if no data found
      return new NextResponse('0', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    }

    const viewCount = data.view_count || 0

    return new NextResponse(viewCount.toString(), {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('[ViewsCounter] Error:', error)
    return new NextResponse('0', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }
}
