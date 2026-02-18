/**
 * ViewerStatsService
 * Aggregates live viewer counts from Twitch, YouTube, and Kick
 */

import { createClient } from '@supabase/supabase-js'
import { getCurrentYouTubeLive } from '../youtube/live'

const TWITCH_API_BASE = 'https://api.twitch.tv/helix'
const KICK_API_BASE = 'https://kick.com/api/v2'
const UPDATE_LOCK_TIMEOUT_MIN = 1 // Prevent concurrent updates within 1 minute

export class ViewerStatsService {
    private supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    /**
     * Fetches viewer count from Twitch
     */
    async fetchTwitchViewers(): Promise<number> {
        try {
            const channel = process.env.WAVEIGL_TWITCH_CHANNEL || 'waveigl'

            // We need an OAuth token. We can get a Client Credentials token or use a stored one.
            // For simplicity in this cron context, let's try to get a client credentials token
            const tokenResponse = await fetch(`https://id.twitch.tv/oauth2/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: process.env.TWITCH_CLIENT_ID!,
                    client_secret: process.env.TWITCH_CLIENT_SECRET!,
                    grant_type: 'client_credentials'
                })
            })

            if (!tokenResponse.ok) {
                throw new Error('Failed to get Twitch client token')
            }

            const { access_token } = await tokenResponse.json()

            const response = await fetch(`${TWITCH_API_BASE}/streams?user_login=${channel}`, {
                headers: {
                    'Client-ID': process.env.TWITCH_CLIENT_ID!,
                    'Authorization': `Bearer ${access_token}`
                }
            })

            if (!response.ok) {
                throw new Error(`Twitch API error: ${response.status}`)
            }

            const { data } = await response.json()
            if (data && data.length > 0) {
                return data[0].viewer_count || 0
            }

            return 0
        } catch (error) {
            console.error('[ViewerStats] Twitch error:', error)
            return 0
        }
    }

    /**
     * Fetches viewer count from YouTube bypassing local cache
     */
    async fetchYouTubeViewers(): Promise<number> {
        try {
            const liveInfo = await getCurrentYouTubeLive()
            return liveInfo.viewerCount || 0
        } catch (error) {
            console.error('[ViewerStats] YouTube error:', error)
            return 0
        }
    }

    /**
     * Fetches viewer count from Kick
     */
    async fetchKickViewers(): Promise<number> {
        try {
            const channel = 'waveigl'
            const response = await fetch(`${KICK_API_BASE}/channels/${channel}`, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            })

            if (!response.ok) {
                throw new Error(`Kick API error: ${response.status}`)
            }

            const data = await response.json()
            // Kick API structure: data.livestream.viewer_count
            return data?.livestream?.viewer_count || 0
        } catch (error) {
            console.error('[ViewerStats] Kick error:', error)
            return 0
        }
    }

    /**
     * Updates the aggregate view count in the database
     * Includes a locking mechanism to prevent race conditions
     */
    async updateAllStats(): Promise<{ total: number; breakdown: Record<string, number> } | null> {
        try {
            // 1. Check if update is needed and not already in progress
            const needsUpdate = await this.checkAndLock()
            if (!needsUpdate) {
                console.log('[ViewerStats] Update not needed or already in progress')
                return null
            }

            // We only care about Twitch for now, as requested
            const [twitch] = await Promise.all([
                this.fetchTwitchViewers()
            ])

            const youtube = 0
            const kick = 0
            const total = twitch + youtube + kick

            console.log('[ViewerStats] Updating stats (Twitch-only mode):', { twitch, youtube, kick, total })

            // Insert the actual result
            const { error } = await this.supabase
                .from('streaming_sessions')
                .insert({
                    view_count: total,
                    platform_breakdown: { twitch, youtube, kick },
                    created_at: new Date().toISOString()
                })

            if (error) {
                console.error('[ViewerStats] Database error:', error)
                throw error
            }

            return {
                total,
                breakdown: { twitch, youtube, kick }
            }
        } catch (error) {
            console.error('[ViewerStats] Global error:', error)
            return null
        }
    }

    /**
     * Internal logic to check if update is needed based on dynamic rules
     * and sets a temporary lock (-1) to avoid race conditions.
     */
    private async checkAndLock(): Promise<boolean> {
        const now = new Date()

        // Get latest record (including potential lock)
        const { data: latest } = await this.supabase
            .from('streaming_sessions')
            .select('view_count, created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (!latest) return true

        const lastUpdate = new Date(latest.created_at)
        const diffMin = (now.getTime() - lastUpdate.getTime()) / (1000 * 60)

        // Current lock check
        if (latest.view_count === -1) {
            if (diffMin < UPDATE_LOCK_TIMEOUT_MIN) return false
            // If lock is older than 1 minute, assume it failed and proceed
        }

        // Dynamic Interval Logic
        const { data: lastLive } = await this.supabase
            .from('streaming_sessions')
            .select('created_at')
            .gt('view_count', 0)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        const isLive = latest.view_count > 0
        const lastLiveAt = lastLive ? new Date(lastLive.created_at) : new Date(0)
        const offlineMin = (now.getTime() - lastLiveAt.getTime()) / (1000 * 60)

        let intervalMin = 10 // Default 10 min
        if (isLive) {
            intervalMin = 1
        } else if (offlineMin >= 30 && offlineMin < 390) { // 30m to 6.5h
            intervalMin = 30
        } else {
            intervalMin = 10
        }

        if (diffMin < intervalMin) return false

        // Set lock
        await this.supabase
            .from('streaming_sessions')
            .insert({ view_count: -1, created_at: now.toISOString() })

        return true
    }
}
