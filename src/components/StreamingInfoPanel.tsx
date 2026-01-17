'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Twitch, Youtube, Zap, Save, AlertTriangle, CheckCircle2 } from 'lucide-react'
import {
  StreamingPlatform,
  StreamingInfoFormData,
  TWITCH_CATEGORIES,
  YOUTUBE_CATEGORIES,
  KICK_CATEGORIES,
  LANGUAGES,
} from '@/types/streaming.types'

interface StreamingInfoPanelProps {
  linkedAccounts: Array<{
    platform: StreamingPlatform
    platform_username: string
  }>
  onSave?: () => void
}

export function StreamingInfoPanel({ linkedAccounts, onSave }: StreamingInfoPanelProps) {
  const [applyToAll, setApplyToAll] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<StreamingPlatform | null>(
    linkedAccounts.length > 0 ? linkedAccounts[0].platform : null
  )

  const [formData, setFormData] = useState<StreamingInfoFormData>({
    applyToAll,
    platforms: {
      twitch: {
        title: '',
        category: '',
        tags: [],
        isMature: false,
        language: 'pt-BR',
      },
      youtube: {
        title: '',
        description: '',
        category: '',
        tags: [],
        isAdultContent: false,
        language: 'pt-BR',
      },
      kick: {
        title: '',
        description: '',
        category: '',
        tags: [],
        isAdultContent: false,
        language: 'pt-BR',
      },
    },
  })

  const availablePlatforms = linkedAccounts.map(acc => acc.platform)

  const handleTitleChange = useCallback((platform: StreamingPlatform, value: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: {
          ...prev.platforms[platform]!,
          title: value,
        },
      },
    }))
  }, [])

  const handleDescriptionChange = useCallback((platform: StreamingPlatform, value: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: {
          ...prev.platforms[platform]!,
          description: value,
        },
      },
    }))
  }, [])

  const handleCategoryChange = useCallback((platform: StreamingPlatform, value: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: {
          ...prev.platforms[platform]!,
          category: value,
        },
      },
    }))
  }, [])

  const handleTagsChange = useCallback((platform: StreamingPlatform, value: string) => {
    const tags = value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    setFormData(prev => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: {
          ...prev.platforms[platform]!,
          tags,
        },
      },
    }))
  }, [])

  const handleAdultContentChange = useCallback((platform: StreamingPlatform, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: {
          ...prev.platforms[platform]!,
          [platform === 'twitch' ? 'isMature' : 'isAdultContent']: value,
        },
      },
    }))
  }, [])

  const handleLanguageChange = useCallback((platform: StreamingPlatform, value: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: {
          ...prev.platforms[platform]!,
          language: value,
        },
      },
    }))
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/streaming/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          applyToAll,
          platforms: Object.fromEntries(
            Object.entries(formData.platforms).filter(([platform]) =>
              availablePlatforms.includes(platform as StreamingPlatform)
            )
          ),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Informações atualizadas com sucesso em ${data.updated?.length || 0} plataforma(s)`,
        })
        onSave?.()
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Erro ao salvar informações',
        })
      }
    } catch (error) {
      console.error('[StreamingInfoPanel] Erro ao salvar:', error)
      setMessage({
        type: 'error',
        text: 'Erro ao conectar com o servidor',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getPlatformIcon = (platform: StreamingPlatform) => {
    switch (platform) {
      case 'twitch':
        return <Twitch className="w-4 h-4" />
      case 'youtube':
        return <Youtube className="w-4 h-4" />
      case 'kick':
        return <Zap className="w-4 h-4" />
    }
  }

  const getCategoriesForPlatform = (platform: StreamingPlatform) => {
    switch (platform) {
      case 'twitch':
        return TWITCH_CATEGORIES
      case 'youtube':
        return YOUTUBE_CATEGORIES
      case 'kick':
        return KICK_CATEGORIES
    }
  }

  const renderPlatformForm = (platform: StreamingPlatform) => {
    const platformData = formData.platforms[platform]
    if (!platformData) return null

    const categories = getCategoriesForPlatform(platform)
    const hasDescription = platform !== 'twitch'
    const adultContentKey = platform === 'twitch' ? 'isMature' : 'isAdultContent'
    const adultContentValue = platformData[adultContentKey as keyof typeof platformData]

    return (
      <div className="space-y-4">
        {/* Título */}
        <div>
          <label className="text-sm font-medium text-foreground">Título da Live</label>
          <Input
            value={platformData.title}
            onChange={e => handleTitleChange(platform, e.target.value)}
            placeholder="Digite o título da sua live"
            maxLength={100}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {platformData.title.length}/100 caracteres
          </p>
        </div>

        {/* Descrição (YouTube e Kick) */}
        {hasDescription && (
          <div>
            <label className="text-sm font-medium text-foreground">Descrição</label>
            <textarea
              value={(platformData as any).description || ''}
              onChange={e => handleDescriptionChange(platform, e.target.value)}
              placeholder="Digite a descrição da sua live"
              maxLength={5000}
              rows={4}
              className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {((platformData as any).description || '').length}/5000 caracteres
            </p>
          </div>
        )}

        {/* Categoria */}
        <div>
          <label className="text-sm font-medium text-foreground">Categoria</label>
          <select
            value={platformData.category}
            onChange={e => handleCategoryChange(platform, e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecione uma categoria</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="text-sm font-medium text-foreground">Tags</label>
          <Input
            value={platformData.tags.join(', ')}
            onChange={e => handleTagsChange(platform, e.target.value)}
            placeholder="Digite as tags separadas por vírgula"
            className="mt-1"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {platformData.tags.map((tag, idx) => (
              <Badge key={idx} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {platformData.tags.length} tag(s)
          </p>
        </div>

        {/* Conteúdo Adulto */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id={`adult-${platform}`}
            checked={typeof adultContentValue === 'boolean' ? adultContentValue : false}
            onChange={e => handleAdultContentChange(platform, e.target.checked)}
            className="w-4 h-4 rounded border-input"
          />
          <label htmlFor={`adult-${platform}`} className="text-sm font-medium text-foreground cursor-pointer">
            {platform === 'twitch' ? 'Conteúdo Maduro (18+)' : 'Conteúdo Adulto (18+)'}
          </label>
        </div>

        {/* Idioma */}
        <div>
          <label className="text-sm font-medium text-foreground">Idioma</label>
          <select
            value={platformData.language}
            onChange={e => handleLanguageChange(platform, e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground">Informações de Streaming</CardTitle>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="apply-to-all"
              checked={applyToAll}
              onChange={e => setApplyToAll(e.target.checked)}
              className="w-4 h-4 rounded border-input"
            />
            <label htmlFor="apply-to-all" className="text-sm font-medium text-foreground cursor-pointer">
              Aplicar a todas as plataformas
            </label>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Mensagem de Status */}
        {message && (
          <Alert className={message.type === 'success' ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              )}
              <AlertDescription className={message.type === 'success' ? 'text-green-200' : 'text-red-200'}>
                {message.text}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Plataformas Disponíveis */}
        {availablePlatforms.length === 0 ? (
          <Alert className="bg-yellow-500/10 border-yellow-500/50">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <AlertDescription className="text-yellow-200">
              Nenhuma plataforma vinculada. Vincule pelo menos uma plataforma para editar informações de streaming.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Seletor de Plataformas */}
            <div className="flex gap-2 flex-wrap">
              {availablePlatforms.map(platform => (
                <button
                  key={platform}
                  onClick={() => setSelectedPlatform(platform)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    selectedPlatform === platform
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary'
                  }`}
                >
                  {getPlatformIcon(platform)}
                  <span className="capitalize">{platform}</span>
                </button>
              ))}
            </div>

            {/* Formulário da Plataforma Selecionada */}
            {selectedPlatform && renderPlatformForm(selectedPlatform)}

            {/* Botão Salvar */}
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
