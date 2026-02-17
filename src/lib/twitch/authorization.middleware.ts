/**
 * Authorization Middleware
 * Verifies user is authenticated and has required permissions for subscriber management
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const REQUIRED_SCOPES = ['channel:read:subscriptions', 'channel:manage:whispers']

export interface AuthContext {
  userId: string
  channelId: string
  isChannelOwner: boolean
  isChannelAdmin: boolean
  twitchUsername: string
  accessToken: string
}

/**
 * Verify user is authenticated and has required permissions
 */
export async function verifySubscriberManagementAccess(
  request: NextRequest
): Promise<{ success: boolean; context?: AuthContext; error?: string }> {
  try {
    // Get session from cookies
    const sessionCookie = request.cookies.get('auth-token')?.value
    if (!sessionCookie) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    // Parse session
    let session: any
    try {
      session = JSON.parse(sessionCookie)
    } catch {
      return { success: false, error: 'Unauthorized: Invalid session' }
    }

    const userId = session.user?.id
    const accessToken = session.provider_token

    if (!userId || !accessToken) {
      return { success: false, error: 'Unauthorized: Missing user or token' }
    }

    // Get channel ID from query or body
    const channelId =
      request.nextUrl.searchParams.get('channelId') ||
      (await getChannelIdFromBody(request))

    if (!channelId) {
      return { success: false, error: 'Bad Request: Missing channelId' }
    }

    // Verify user is channel owner or admin
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user's role for this channel
    const { data: userRole, error: roleError } = await supabase
      .from('user_channel_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('channel_id', channelId)
      .single()

    if (roleError || !userRole) {
      return { success: false, error: 'Forbidden: User does not have access to this channel' }
    }

    const isChannelOwner = userRole.role === 'owner'
    const isChannelAdmin = userRole.role === 'admin'

    if (!isChannelOwner && !isChannelAdmin) {
      return { success: false, error: 'Forbidden: User does not have required role' }
    }

    // Verify OAuth token has required scopes
    const { data: linkedAccount, error: linkedError } = await supabase
      .from('linked_accounts')
      .select('platform_username, scopes')
      .eq('user_id', userId)
      .eq('platform', 'twitch')
      .single()

    if (linkedError || !linkedAccount) {
      return { success: false, error: 'Forbidden: Twitch account not linked' }
    }

    // Check scopes
    const scopes = linkedAccount.scopes ? linkedAccount.scopes.split(' ') : []
    const hasRequiredScopes = REQUIRED_SCOPES.every((scope) => scopes.includes(scope))

    if (!hasRequiredScopes) {
      return {
        success: false,
        error: `Forbidden: Missing required OAuth scopes. Required: ${REQUIRED_SCOPES.join(', ')}`,
      }
    }

    return {
      success: true,
      context: {
        userId,
        channelId,
        isChannelOwner,
        isChannelAdmin,
        twitchUsername: linkedAccount.platform_username,
        accessToken,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[AuthorizationMiddleware] Error:', message)
    return { success: false, error: 'Internal Server Error' }
  }
}

/**
 * Extract channel ID from request body
 */
async function getChannelIdFromBody(request: NextRequest): Promise<string | null> {
  try {
    const body = await request.json()
    return body.channelId || null
  } catch {
    return null
  }
}

/**
 * Middleware wrapper for API routes
 */
export async function withSubscriberManagementAuth(
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const auth = await verifySubscriberManagementAccess(request)

    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: auth.error?.includes('Forbidden') ? 403 : 401 }
      )
    }

    return handler(request, auth.context!)
  }
}
