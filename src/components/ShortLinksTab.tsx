'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, ExternalLink, BarChart3, CheckCircle2 } from 'lucide-react'

interface ShortLink {
  id: string
  token: string
  maxRedemptions: number
  currentRedemptions: number
  expirationDate: string
  isActive: boolean
  createdAt: string
}

export default function ShortLinksTab() {
  const [links, setLinks] = useState<ShortLink[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/discounts/links')
      const data = await response.json()
      if (data.success) {
        setLinks(data.data)
      }
    } catch (error) {
      console.error('[ShortLinksTab] Error fetching links:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/r/${token}`
    navigator.clipboard.writeText(url)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando links...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Links Curtos</h2>
      </div>

      {links.length === 0 ? (
        <Card className="bg-card/50 border border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">Nenhum link curto criado ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {links.map((link) => (
            <Card key={link.id} className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="font-mono text-sm break-all">
                    {window.location.origin}/r/{link.token.slice(0, 16)}...
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(link.token)}
                  >
                    {copiedToken === link.token ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Resgates:</span>
                    <span className="ml-2 font-medium">
                      {link.currentRedemptions}/{link.maxRedemptions}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`ml-2 font-medium ${link.isActive ? 'text-green-500' : 'text-red-500'}`}>
                      {link.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expira:</span>
                    <span className="ml-2 font-medium">
                      {new Date(link.expirationDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Criado em: {new Date(link.createdAt).toLocaleDateString()}</span>
                    <Button variant="link" size="sm" asChild>
                      <a href={`/r/${link.token}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Abrir link
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
