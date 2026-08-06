'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Link2,
  MousePointerClick,
  Trophy,
  Clock,
  Copy,
  CheckCircle2,
  Eye,
  BarChart3,
  Activity,
  User,
  CalendarClock,
} from 'lucide-react'
import type { ShortLink } from '@/types/short-link.types'

function formatDate(value?: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ShortLinksDashboard() {
  const [links, setLinks] = useState<ShortLink[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [detailLink, setDetailLink] = useState<ShortLink | null>(null)

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/short-links')
      const data = await response.json()
      if (data.success) {
        setLinks(data.data)
      }
    } catch (error) {
      console.error('[ShortLinksDashboard] Error fetching links:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/r/${token}`)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const stats = useMemo(() => {
    const totalLinks = links.length
    const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0)
    const mostClicked = [...links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0]
    const avgClicks = totalLinks > 0 ? Math.round((totalClicks / totalLinks) * 10) / 10 : 0
    return { totalLinks, totalClicks, mostClicked, avgClicks }
  }, [links])

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard de Links</h2>
        <p className="text-sm text-muted-foreground">
          Visão geral e detalhes de cada link curto.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Link2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de links</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalLinks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <MousePointerClick className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de cliques</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalClicks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Mais acessado</p>
                {stats.mostClicked ? (
                  <p className="text-sm font-semibold text-foreground break-all">
                    /r/{stats.mostClicked.token}
                    <span className="text-muted-foreground font-normal ml-1">
                      ({stats.mostClicked.clicks} cliques)
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Média de cliques</p>
                <p className="text-2xl font-bold text-foreground">{stats.avgClicks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {links.length === 0 ? (
        <Card className="bg-card/50 border border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              Nenhum link curto criado ainda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {links.map((link) => {
            const shortUrl = `${window.location.origin}/r/${link.token}`
            return (
              <Card key={link.id} className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <a
                          href={shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-primary text-sm break-all hover:underline"
                        >
                          /r/{link.token}
                        </a>
                        <Badge variant="outline" className="text-muted-foreground">
                          {link.clicks} cliques
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground break-all">
                        {link.originalUrl}
                      </p>
                      {link.description && (
                        <p className="mt-1 text-xs text-muted-foreground">{link.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Copiar"
                        onClick={() => copyToClipboard(link.token)}
                      >
                        {copiedToken === link.token ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Ver detalhes"
                        onClick={() => setDetailLink(link)}
                      >
                        <Eye className="w-4 h-4 text-blue-400" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarClock className="w-3.5 h-3.5" />
                      Criado em: {formatDate(link.createdAt)}
                    </span>
                    <span>
                      Por {link.createdBy || 'anonymous'} • Cliques: {link.clicks}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={!!detailLink} onOpenChange={(open) => !open && setDetailLink(null)}>
        <DialogContent className="sm:max-w-lg bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Detalhes do Link
            </DialogTitle>
          </DialogHeader>
          {detailLink && (
            <div className="py-2">
              <div className="mb-4">
                <a
                  href={`${window.location.origin}/r/${detailLink.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-primary text-lg break-all hover:underline"
                >
                  /r/{detailLink.token}
                </a>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-muted-foreground">
                    {detailLink.clicks} cliques
                  </Badge>
                  <Badge variant={detailLink.isActive ? 'default' : 'secondary'}>
                    {detailLink.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">URL original</p>
                  <a
                    href={detailLink.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground break-all hover:underline"
                  >
                    {detailLink.originalUrl}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Descrição</p>
                  <p className="text-foreground">{detailLink.description || '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">ID</p>
                    <p className="text-foreground font-mono text-xs break-all">{detailLink.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Token</p>
                    <p className="text-foreground font-mono text-xs">{detailLink.token}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Criado por</p>
                    <p className="text-foreground text-sm">
                      <User className="w-3 h-3 inline mr-1" />
                      {detailLink.createdBy || 'anonymous'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Criado em</p>
                    <p className="text-foreground text-sm">{formatDate(detailLink.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Atualizado em</p>
                    <p className="text-foreground text-sm">{formatDate(detailLink.updatedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Atualizado por</p>
                    <p className="text-foreground text-sm">{detailLink.updatedBy || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Cliques</p>
                    <p className="text-foreground text-sm">{detailLink.clicks}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Deletado em</p>
                    <p className="text-foreground text-sm">{formatDate(detailLink.deletedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
