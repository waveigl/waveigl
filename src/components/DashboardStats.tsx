'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Crown, Radio, Twitch, Youtube, Flame, RefreshCw, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DashboardStatsProps {
    onStatsUpdate?: (stats: any) => void
}

export function DashboardStats({ onStatsUpdate }: DashboardStatsProps) {
    const [stats, setStats] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Estados para as listas
    const [listModal, setListModal] = useState<{ type: 'members' | 'subscribers' | null, isOpen: boolean }>({ type: null, isOpen: false })
    const [listData, setListData] = useState<string[]>([])
    const [isListLoading, setIsListLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [isSyncing, setIsSyncing] = useState(false)

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
        const interval = setInterval(fetchStats, 60000)
        return () => clearInterval(interval)
    }, [])

    const fetchList = async (type: 'members' | 'subscribers') => {
        setIsListLoading(true)
        setListData([])
        try {
            const res = await fetch(`/api/dashboard/${type}`)
            if (res.ok) {
                const data = await res.json()
                setListData(data[type] || [])
            }
        } catch (error) {
            console.error(`[DashboardStats] Error fetching ${type}:`, error)
        } finally {
            setIsListLoading(false)
        }
    }

    const handleSyncTwitch = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (isSyncing) return

        setIsSyncing(true)
        try {
            const res = await fetch('/api/subscribers/sync', { method: 'POST' })
            if (res.ok) {
                alert('Sincronização com Twitch iniciada/concluída!')
                fetchStats()
            } else {
                alert('Erro ao sincronizar com Twitch')
            }
        } catch (error) {
            console.error('[DashboardStats] Sync error:', error)
        } finally {
            setIsSyncing(false)
        }
    }

    const openModal = (type: 'members' | 'subscribers') => {
        setListModal({ type, isOpen: true })
        setSearchTerm('')
        fetchList(type)
    }

    const filteredList = listData.filter(name =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
    )

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
            <Card
                className="bg-slate-800/50 border-slate-700/50 hover:border-amber-500/50 transition-colors shadow-lg cursor-pointer group"
                onClick={() => openModal('members')}
            >
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400 flex items-center justify-between">
                        <span>Membros do Clube</span>
                        <Crown className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-white">
                        {stats?.clubMembers || 0}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-slate-500">Assinaturas ativas no site</p>
                        <span className="text-[10px] text-amber-500/50 group-hover:text-amber-500 transition-colors">ver todos →</span>
                    </div>
                </CardContent>
            </Card>

            {/* Platform Subscribers */}
            <Card
                className="bg-slate-800/50 border-slate-700/50 hover:border-purple-500/50 transition-colors shadow-lg cursor-pointer group"
                onClick={() => openModal('subscribers')}
            >
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400 flex items-center justify-between">
                        <span>Inscritos Plataformas</span>
                        <div className="flex gap-2 items-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-500 hover:text-purple-400 p-0"
                                onClick={handleSyncTwitch}
                                disabled={isSyncing}
                                title="Sincronizar com Twitch"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                            </Button>
                            <Users className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-white">
                        {stats?.platformSubscribers || 0}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-slate-500">Total de inscritos (Cache Twitch)</p>
                        <span className="text-[10px] text-purple-500/50 group-hover:text-purple-500 transition-colors">ver todos →</span>
                    </div>
                </CardContent>
            </Card>

            {/* Modal para Listas */}
            <Dialog open={listModal.isOpen} onOpenChange={(open) => setListModal(prev => ({ ...prev, isOpen: open }))}>
                <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {listModal.type === 'members' ? (
                                <>
                                    <Crown className="w-5 h-5 text-amber-500" />
                                    Membros do Clube
                                </>
                            ) : (
                                <>
                                    <Users className="w-5 h-5 text-purple-500" />
                                    Inscritos Plataformas
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs">
                            Total: {listData.length} usuários detectados como ativos.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Buscar usuário..."
                                className="pl-9 bg-slate-950 border-slate-800 focus:ring-amber-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="h-[300px] rounded-md border border-slate-800 bg-slate-950/50 p-4 overflow-y-auto custom-scrollbar">
                            {isListLoading ? (
                                <div className="flex flex-col gap-2">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="h-8 bg-slate-800/50 rounded animate-pulse" />
                                    ))}
                                </div>
                            ) : filteredList.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {filteredList.map((name, i) => (
                                        <div key={i} className="text-sm p-2 rounded bg-slate-800/30 border border-slate-700/30 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            {name}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500 text-sm">
                                    Nenhum usuário encontrado.
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
