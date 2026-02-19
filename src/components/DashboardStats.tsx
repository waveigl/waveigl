'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Crown, Radio, Twitch, Youtube, Flame } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface DashboardStatsProps {
    onStatsUpdate?: (stats: any) => void
}

export function DashboardStats({ onStatsUpdate }: DashboardStatsProps) {
    const [stats, setStats] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/dashboard/stats')
            if (res.ok) {
                const data = await res.json()
                setStats(data.stats)
                onStatsUpdate?.(data.stats)
            }
        } catch (error) {
            console.error('[DashboardStats] Error fetching stats:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
        // Atualizar a cada 1 minuto (igual ao streaming_sessions update interval)
        const interval = setInterval(fetchStats, 60000)
        return () => clearInterval(interval)
    }, [])

    if (isLoading && !stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-muted rounded-lg" />
                ))}
            </div>
        )
    }

    const platformBreakdown = stats?.platformBreakdown || {}

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Live Viewers */}
            <Card className="bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50 transition-colors shadow-lg">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400 flex items-center justify-between">
                        <span>Espectadores Live</span>
                        <Radio className={`w-4 h-4 ${stats?.liveViewers > 0 ? 'text-red-500 animate-pulse' : 'text-slate-600'}`} />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-white flex items-baseline gap-2">
                        {stats?.liveViewers || 0}
                        <span className="text-xs font-normal text-slate-500">total</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                        {platformBreakdown.twitch > 0 && (
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[10px] px-1.5 py-0 flex items-center gap-1">
                                <Twitch className="w-3 h-3" /> {platformBreakdown.twitch}
                            </Badge>
                        )}
                        {platformBreakdown.youtube > 0 && (
                            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px] px-1.5 py-0 flex items-center gap-1">
                                <Youtube className="w-3 h-3" /> {platformBreakdown.youtube}
                            </Badge>
                        )}
                        {platformBreakdown.kick > 0 && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0 flex items-center gap-1">
                                <Flame className="w-3 h-3" /> {platformBreakdown.kick}
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Club Members */}
            <Card className="bg-slate-800/50 border-slate-700/50 hover:border-amber-500/50 transition-colors shadow-lg">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400 flex items-center justify-between">
                        <span>Membros do Clube</span>
                        <Crown className="w-4 h-4 text-amber-500" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-white">
                        {stats?.clubMembers || 0}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Assinaturas ativas no site</p>
                </CardContent>
            </Card>

            {/* Platform Subscribers */}
            <Card className="bg-slate-800/50 border-slate-700/50 hover:border-purple-500/50 transition-colors shadow-lg">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400 flex items-center justify-between">
                        <span>Inscritos Plataformas</span>
                        <Users className="w-4 h-4 text-purple-500" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-white">
                        {stats?.platformSubscribers || 0}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Total de inscritos (Cache Twitch)</p>
                </CardContent>
            </Card>
        </div>
    )
}
