'use client'

import { useState, useEffect } from 'react'
import { StreamingInfoPanel } from '@/components/StreamingInfoPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { StreamingPlatform } from '@/types/streaming.types'

interface LinkedAccount {
  platform: StreamingPlatform
  platform_username: string
  platform_user_id: string
}

export default function StreamingInfoPage() {
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadLinkedAccounts = async () => {
      try {
        const res = await fetch('/api/me')
        const data = await res.json()

        if (data.linked_accounts) {
          setLinkedAccounts(
            data.linked_accounts.map((acc: any) => ({
              platform: acc.platform,
              platform_username: acc.platform_username,
              platform_user_id: acc.platform_user_id,
            }))
          )
        }
      } catch (err) {
        console.error('[StreamingInfo] Erro ao carregar contas:', err)
        setError('Erro ao carregar contas vinculadas')
      } finally {
        setIsLoading(false)
      }
    }

    loadLinkedAccounts()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Informações de Streaming</h1>
          <p className="text-muted-foreground mt-2">
            Edite o título, descrição, categoria, tags e outras informações de suas lives em todas as plataformas
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="bg-red-500/10 border-red-500/50">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {/* Streaming Info Panel */}
        <StreamingInfoPanel linkedAccounts={linkedAccounts} />

        {/* Info Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Dicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground mb-1">📝 Títulos Efetivos</p>
              <p>Use títulos descritivos e atrativos. Inclua o jogo ou tópico principal para melhor descoberta.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">🏷️ Tags Relevantes</p>
              <p>Use tags que descrevam seu conteúdo. Separe múltiplas tags com vírgula. Máximo 5-10 tags recomendado.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">🎮 Categorias</p>
              <p>Selecione a categoria mais relevante para seu conteúdo. Isso ajuda na descoberta por outros usuários.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">⚠️ Conteúdo Adulto</p>
              <p>Marque como conteúdo adulto/maduro se sua live contiver conteúdo impróprio para menores de 18 anos.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">🌍 Idioma</p>
              <p>Selecione o idioma principal da sua live para melhor categorização.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">🔄 Aplicar a Todas</p>
              <p>Marque "Aplicar a todas as plataformas" para usar as mesmas informações em Twitch, YouTube e Kick.</p>
            </div>
          </CardContent>
        </Card>

        {/* Plataformas Suportadas */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Plataformas Suportadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-purple-400">Twitch</p>
              <p className="text-muted-foreground">Título, Categoria, Tags, Conteúdo Maduro, Idioma</p>
            </div>
            <div>
              <p className="font-medium text-red-400">YouTube</p>
              <p className="text-muted-foreground">Título, Descrição, Categoria, Tags, Conteúdo Adulto, Idioma</p>
            </div>
            <div>
              <p className="font-medium text-green-400">Kick</p>
              <p className="text-muted-foreground">Título, Descrição, Categoria, Tags, Conteúdo Adulto, Idioma</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
