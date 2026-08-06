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
  Smartphone,
  Monitor,
  Globe,
  MapPin,
  ExternalLink,
  History,
} from 'lucide-react'
import type { ShortLink, ShortLinkStats } from '@/types/short-link.types'

function formatDate(value?: string | null): string {
  if (!value) return 'â€”'
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Breakdown({
  title,
  icon,
  counts,
  total,
}: {
  title: string
  icon: React.ReactNode
  counts: Record<string, number>
  total: number
}) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) {
    return null
  }
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      </div>
      <div className="space-y-1.5">
        {entries.map(([label, count]) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={label}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground truncate">{label}</span>
                <span className="text-muted-foreground ml-2 shrink-0">
                  {count} ({pct}%)
                </span>
              </div>
              <div className="mt-0.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ShortLinksDashboard() {
  const [links, setLinks] = useState<ShortLink[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [detailLink, setDetailLink] = useState<ShortLink | null>(null)
  const [stats, setStats] = useState<ShortLinkStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    fetchLinks()
  }, [])

  useEffect(() => {
    if (!detailLink) {
      setStats(null)
      return
    }
    let cancelled = false
    setStatsLoading(true)
    fetch(`/api/short-links/stats?id=${detailLink.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) setStats(data.data)
      })
      .catch((error) => console.error('[ShortLinksDashboard] Error fetching stats:', error))
      .finally(() => {
        if (!cancelled) setStatsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [detailLink])

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

  const summary = useMemo(() => {
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
          VisÃ£o geral e detalhes de cada link curto.
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
                <p className="text-2xl font-bold text-foreground">{summary.totalLinks}</p>
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
                <p className="text-2xl font-bold text-foreground">{summary.totalClicks}</p>
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
                {summary.mostClicked ? (
                  <p className="text-sm font-semibold text-foreground break-all">
                    /r/{summary.mostClicked.token}
                    <span className="text-muted-foreground font-normal ml-1">
                      ({summary.mostClicked.clicks} cliques)
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">â€”</p>
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
                <p className="text-sm text-muted-foreground">MÃ©dia de cliques</p>
                <p className="text-2xl font-bold text-foreground">{summary.avgClicks}</p>
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
                      Por {link.createdBy || 'anonymous'} â€¢ Cliques: {link.clicks}
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
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">DescriÃ§Ã£o</p>
                  <p className="text-foreground">{detailLink.description || 'â€”'}</p>
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
                    <p className="text-foreground text-sm">{detailLink.updatedBy || 'â€”'}</p>
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

              {statsLoading ? (
                <p className="text-sm text-muted-foreground mt-6">Carregando analytics...</p>
              ) : stats ? (
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Analytics de cliques
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Breakdown
                      title="Dispositivo"
                      icon={<Smartphone className="w-3.5 h-3.5 text-muted-foreground" />}
                      counts={stats.clicksByDevice}
                      total={stats.totalClicks}
                    />
                    <Breakdown
                      title="Sistema & Navegador"
                      icon={<Monitor className="w-3.5 h-3.5 text-muted-foreground" />}
                      counts={{ ...stats.clicksByOs, ...Object.fromEntries(Object.entries(stats.clicksByBrowser).map(([k, v]) => [`${k} (browser)`, v])) }}
                      total={stats.totalClicks}
                    />
                    <Breakdown
                      title="LocalizaÃ§Ã£o"
                      icon={<MapPin className="w-3.5 h-3.5 text-muted-foreground" />}
                      counts={stats.clicksByCountry}
                      total={stats.totalClicks}
                    />
                    <Breakdown
                      title="Origem"
                      icon={<ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />}
                      counts={stats.clicksByReferrer}
                      total={stats.totalClicks}
                    />
                  </div>

                  {stats.recentClicks.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <History className="w-4 h-4 text-muted-foreground" />
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Ãšltimos cliques
                        </p>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {stats.recentClicks.map((click) => (
                          <div
                            key={click.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {click.deviceType === 'mobile' ? (
                                <Smartphone className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                              ) : click.deviceType === 'tablet' ? (
                                <Globe className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                              ) : (
                                <Monitor className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                              )}
                              <span className="text-foreground truncate">
                                {click.deviceType || 'desconhecido'}
                                {click.country ? ` â€¢ ${click.country}` : ''}
                                {click.city ? ` â€¢ ${click.city}` : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
                              {click.referrer && (
                                <span className="truncate max-w-[120px]">
                                  {(() => {
                                    try {
                                      return new URL(click.referrer).hostname.replace(/^www\./, '')
                                    } catch {
                                      return click.referrer
                                    }
                                  })()}
                                </span>
                              )}
                              <Clock className="w-3 h-3" />
                              <span>{formatDate(click.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-6">Nenhum clique registrado ainda.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
