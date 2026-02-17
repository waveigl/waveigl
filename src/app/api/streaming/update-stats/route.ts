/**
 * API Route for Updating Live Viewer Stats
 * POST /api/streaming/update-stats
 * Triggered by Vercel Cron
 */

import { NextRequest, NextResponse } from 'next/server'
import { ViewerStatsService } from '@/lib/streaming/viewer-stats.service'

export async function GET(request: NextRequest) {
    return handleRequest(request)
}

export async function POST(request: NextRequest) {
    return handleRequest(request)
}

async function handleRequest(request: NextRequest) {
    try {
        // 1. Verify CRON_SECRET to ensure only authorized calls (Vercel Cron)
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // Small security: return 401 if secret doesn't match
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Execute the stats update
        const statsService = new ViewerStatsService()
        const result = await statsService.updateAllStats()

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            ...result
        })
    } catch (error) {
        console.error('[UpdateStats] Root error:', error)
        return NextResponse.json(
            {
                error: 'Failed to update stats',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
