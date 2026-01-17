'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Ban,
  Clock,
  AlertTriangle,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react'

interface ModerationAction {
  id: string
  userId: string
  username: string
  platform: string
  action: 'ban' | 'timeout'
  reason?: string
  duration?: number // em segundos
  appliedAt: number // timestamp
  expiresAt?: number // timestamp (para timeouts)
}

interface LiveInfoPanelProps {
  isStreamer?: boolean
  isAdmin?: boolean
  onRefresh?: () => void
}

export function LiveInfoPanel({ isStreamer = false, isAdmin = false, onRefresh }: LiveInfoPanelProps) {
  const [moderationActions, setModerationActions] = useState<ModerationAction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedSection, setExpandedSection] = useState<'bans' | 'timeouts' | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Carregar ações de moderação
  const loadModerationActions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/moderation/actions')
      if (res.ok) {
        const data = await res.json()
        setModerationActions(data.actions || [])
      } else {
        setError('Erro ao carregar ações de moderação')
      }
    } catch (err) {
      console.error('[LiveInfoPanel] Erro ao carregar ações:', err)
      setError('Erro ao conectar com o servidor')
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar na montagem
  useEffect(() => {
    loadModerationActions()
  }, [])

  // Separar bans e timeouts
  const { bans, timeouts, activeBans, activeTimeouts } = useMemo(() => {
    const now = Date.now()
    const bans = moderationActions.filter(a => a.action === 'ban')
    const timeouts = moderationActions.filter(a => a.action === 'timeout')
    
    const activeBans = bans.filter(a => !a.expiresAt || a.expiresAt > now)
    const activeTimeouts = timeouts.filter(a => !a.expiresAt || a.expiresAt > now)

    return { bans, timeouts, activeBans, activeTimeouts }
  }, [moderationActions])

  // Calcular tempo restante
  const getTimeRemaining = (expiresAt?: number): string => {
    if (!expiresAt) return 'Permanente'
    
    const now = Date.now()
    const remaining = expiresAt - now
    
    if (remaining <= 0) return 'Expirado'
    
    const seconds = Math.floor(remaining / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  // Remover ação de moderação
  const handleRemoveAction = async (actionId: string) => {
    if (!confirm('Tem certeza que deseja remover esta ação?')) return

    try {
      const res = await fetch(`/api/moderation/actions/${actionId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setModerationActions(prev => prev.filter(a => a.id !== actionId))
      } else {
        alert('Erro ao remover ação')
      }
    } catch (err) {
      console.error('[LiveInfoPanel] Erro ao remover ação:', err)
      alert('Erro ao remover ação')
    }
  }

  if (!isStreamer && !isAdmin) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header com refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          Informações de Live
        </h2>
        <Button
          onClick={() => {
            loadModerationActions()
            onRefresh?.()
          }}
          disabled={isLoading}
          size="sm"
          variant="outline"
          className="border-slate-600"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && (
        <Alert className="bg-red-500/10 border-red-500/50">
          <AlertDescription className="text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {/* Resumo de Bans e Timeouts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Card de Bans */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Ban className="w-4 h-4 text-red-400" />
              Banimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">{activeBans.length}</div>
            <p className="text-xs text-slate-400 mt-1">
              {activeBans.length === 1 ? 'pessoa banida' : 'pessoas banidas'}
            </p>
          </CardContent>
        </Card>

        {/* Card de Timeouts */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              Timeouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">{activeTimeouts.length}</div>
            <p className="text-xs text-slate-400 mt-1">
              {activeTimeouts.length === 1 ? 'pessoa em timeout' : 'pessoas em timeout'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Banimentos */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader
          className="pb-3 cursor-pointer hover:bg-slate-700/50 transition-colors"
          onClick={() => setExpandedSection(expandedSection === 'bans' ? null : 'bans')}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-400" />
              Banimentos ({activeBans.length})
            </CardTitle>
            {expandedSection === 'bans' ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </CardHeader>

        {expandedSection === 'bans' && (
          <CardContent className="space-y-2">
            {activeBans.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Nenhum banimento ativo</p>
            ) : (
              activeBans.map(ban => (
                <div
                  key={ban.id}
                  className="bg-slate-900/50 rounded-lg p-3 flex items-center justify-between border border-red-500/20"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{ban.username}</span>
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                        {ban.platform}
                      </Badge>
                    </div>
                    {ban.reason && (
                      <p className="text-xs text-slate-400 mt-1">Motivo: {ban.reason}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      Banido há {getTimeRemaining(ban.expiresAt)}
                    </p>
                  </div>
                  {isAdmin && (
                    <Button
                      onClick={() => handleRemoveAction(ban.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:bg-red-500/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        )}
      </Card>

      {/* Seção de Timeouts */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader
          className="pb-3 cursor-pointer hover:bg-slate-700/50 transition-colors"
          onClick={() => setExpandedSection(expandedSection === 'timeouts' ? null : 'timeouts')}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              Timeouts ({activeTimeouts.length})
            </CardTitle>
            {expandedSection === 'timeouts' ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </CardHeader>

        {expandedSection === 'timeouts' && (
          <CardContent className="space-y-2">
            {activeTimeouts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Nenhum timeout ativo</p>
            ) : (
              activeTimeouts.map(timeout => (
                <div
                  key={timeout.id}
                  className="bg-slate-900/50 rounded-lg p-3 flex items-center justify-between border border-yellow-500/20"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{timeout.username}</span>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                        {timeout.platform}
                      </Badge>
                    </div>
                    {timeout.reason && (
                      <p className="text-xs text-slate-400 mt-1">Motivo: {timeout.reason}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-yellow-400" />
                      <p className="text-xs text-yellow-400 font-medium">
                        Tempo restante: {getTimeRemaining(timeout.expiresAt)}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      onClick={() => handleRemoveAction(timeout.id)}
                      size="sm"
                      variant="ghost"
                      className="text-yellow-400 hover:bg-yellow-500/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        )}
      </Card>

      {/* Info */}
      <Alert className="bg-blue-500/10 border-blue-500/50">
        <AlertDescription className="text-blue-200 text-sm">
          💡 Este painel mostra todas as ações de moderação ativas. Os timeouts expiram automaticamente.
        </AlertDescription>
      </Alert>
    </div>
  )
}
