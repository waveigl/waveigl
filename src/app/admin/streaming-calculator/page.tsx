'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Calculator,
  Monitor,
  Zap,
  Film,
  Sun,
  Users,
  Clock,
  HardDrive,
  MessageSquare,
  Heart,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Cloud,
  ArrowLeft,
  RefreshCw,
  Info,
  Loader2,
  Shield,
  AlertTriangle,
} from 'lucide-react'

import {
  type Resolution,
  type FPS,
  type Codec,
  type HDRType,
  type CloudProvider,
  type StreamingConfig,
  RESOLUTION_DATA,
  FPS_DATA,
  CODEC_DATA,
  HDR_DATA,
  CLOUD_PRICING,
  compareCloudCosts,
  calculateBitrate,
  formatUSD,
  formatBRL,
  formatBytes,
  formatBitrate,
  getPresets,
} from '@/lib/streaming/cost-calculator'

/**
 * Calculadora de Custos de Streaming
 * 
 * Permite simular custos de streaming para diferentes configurações
 * e comparar entre cloud providers (AWS, Azure, GCP, Cloudflare)
 */
export default function StreamingCalculatorPage() {
  // Auth state
  const [authStep, setAuthStep] = useState<'checking' | 'not-admin' | 'calculator'>('checking')
  const [authError, setAuthError] = useState<string | null>(null)

  // Config state
  const [resolution, setResolution] = useState<Resolution>('1080p')
  const [fps, setFps] = useState<FPS>(60)
  const [codec, setCodec] = useState<Codec>('h264_420')
  const [hdr, setHdr] = useState<HDRType>('sdr')
  const [durationMinutes, setDurationMinutes] = useState(180)
  const [expectedViewers, setExpectedViewers] = useState(200)
  const [includeVod, setIncludeVod] = useState(true)
  const [storageDays, setStorageDays] = useState(30)
  const [chatMessagesPerMinute, setChatMessagesPerMinute] = useState(10)
  const [reactionsPerMinute, setReactionsPerMinute] = useState(5)
  const [exchangeRate, setExchangeRate] = useState(5.0)

  // Verificar acesso admin
  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/admin/verify')
      const data = await response.json()

      if (!data.authenticated) {
        setAuthStep('not-admin')
        setAuthError('Você precisa estar logado para acessar esta página')
        return
      }

      if (!data.isAdmin) {
        setAuthStep('not-admin')
        setAuthError('Apenas administradores podem acessar a calculadora de custos')
        return
      }

      setAuthStep('calculator')
    } catch (err) {
      console.error('[StreamingCalculator] Auth error:', err)
      setAuthStep('not-admin')
      setAuthError('Erro ao verificar permissões')
    }
  }


  // Configuração atual
  const config: StreamingConfig = useMemo(() => ({
    profile: { resolution, fps, codec, hdr },
    durationMinutes,
    expectedViewers,
    includeVod,
    storageDays,
    chatMessagesPerMinute,
    reactionsPerMinute,
  }), [resolution, fps, codec, hdr, durationMinutes, expectedViewers, includeVod, storageDays, chatMessagesPerMinute, reactionsPerMinute])

  // Cálculos
  const comparison = useMemo(() => compareCloudCosts(config), [config])
  const bitrate = useMemo(() => calculateBitrate(config.profile), [config.profile])
  const presets = useMemo(() => getPresets(), [])

  // Aplicar preset
  const applyPreset = (presetKey: string) => {
    const preset = presets[presetKey]
    if (!preset?.config) return

    const { profile, expectedViewers: viewers, durationMinutes: duration } = preset.config
    if (profile) {
      setResolution(profile.resolution)
      setFps(profile.fps)
      setCodec(profile.codec)
      setHdr(profile.hdr)
    }
    if (viewers) setExpectedViewers(viewers)
    if (duration) setDurationMinutes(duration)
  }

  // Reset para padrão
  const resetToDefault = () => {
    setResolution('1080p')
    setFps(60)
    setCodec('h264_420')
    setHdr('sdr')
    setDurationMinutes(180)
    setExpectedViewers(200)
    setIncludeVod(true)
    setStorageDays(30)
    setChatMessagesPerMinute(10)
    setReactionsPerMinute(5)
  }

  // Render Auth States
  if (authStep === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-slate-300">Verificando permissões...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (authStep === 'not-admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 max-w-md">
          <CardContent className="py-8">
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="text-red-200/80">
                {authError || 'Acesso negado'}
              </AlertDescription>
            </Alert>
            <div className="mt-6 text-center">
              <Button onClick={() => window.location.href = '/dashboard'} variant="outline" className="border-slate-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Calculator className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Calculadora de Custos</h1>
            </div>
            <p className="text-slate-400">Simule custos de streaming e compare entre cloud providers</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => window.location.href = '/dashboard'} variant="outline" className="border-slate-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button onClick={resetToDefault} variant="outline" className="border-slate-600">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Presets */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Presets Rápidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(presets).map(([key, preset]) => (
                <Button
                  key={key}
                  onClick={() => applyPreset(key)}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 hover:bg-slate-700"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configurações */}
          <div className="lg:col-span-1 space-y-4">
            {/* Qualidade de Vídeo */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-purple-400" />
                  Qualidade de Vídeo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Resolução */}
                <div>
                  <Label className="text-slate-300 text-sm">Resolução</Label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value as Resolution)}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white text-sm"
                  >
                    {Object.entries(RESOLUTION_DATA).map(([key, data]) => (
                      <option key={key} value={key}>{data.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Multiplicador: {RESOLUTION_DATA[resolution].multiplier}x
                  </p>
                </div>

                {/* FPS */}
                <div>
                  <Label className="text-slate-300 text-sm">Taxa de Quadros (FPS)</Label>
                  <select
                    value={fps}
                    onChange={(e) => setFps(Number(e.target.value) as FPS)}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white text-sm"
                  >
                    {Object.entries(FPS_DATA).map(([key, data]) => (
                      <option key={key} value={key}>{data.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Multiplicador: {FPS_DATA[fps].multiplier}x
                  </p>
                </div>

                {/* Codec */}
                <div>
                  <Label className="text-slate-300 text-sm">Codec / Chroma</Label>
                  <select
                    value={codec}
                    onChange={(e) => setCodec(e.target.value as Codec)}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white text-sm"
                  >
                    {Object.entries(CODEC_DATA).map(([key, data]) => (
                      <option key={key} value={key}>{data.label} - {data.description}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Multiplicador: {CODEC_DATA[codec].multiplier}x | Bitrate: {CODEC_DATA[codec].bitrateRatio}x
                  </p>
                </div>

                {/* HDR */}
                <div>
                  <Label className="text-slate-300 text-sm">HDR / Profundidade de Cor</Label>
                  <select
                    value={hdr}
                    onChange={(e) => setHdr(e.target.value as HDRType)}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white text-sm"
                  >
                    {Object.entries(HDR_DATA).map(([key, data]) => (
                      <option key={key} value={key}>{data.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Multiplicador: {HDR_DATA[hdr].multiplier}x | {HDR_DATA[hdr].bitDepth}-bit
                  </p>
                </div>
              </CardContent>
            </Card>


            {/* Stream Config */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Film className="w-5 h-5 text-green-400" />
                  Configuração da Stream
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Duração (minutos)
                  </Label>
                  <Input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Math.max(1, Number(e.target.value)))}
                    className="mt-1 bg-slate-900 border-slate-700 text-white"
                    min={1}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    = {(durationMinutes / 60).toFixed(1)} horas
                  </p>
                </div>

                <div>
                  <Label className="text-slate-300 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Viewers Esperados
                  </Label>
                  <Input
                    type="number"
                    value={expectedViewers}
                    onChange={(e) => setExpectedViewers(Math.max(0, Number(e.target.value)))}
                    className="mt-1 bg-slate-900 border-slate-700 text-white"
                    min={0}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="includeVod"
                    checked={includeVod}
                    onChange={(e) => setIncludeVod(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-900"
                  />
                  <Label htmlFor="includeVod" className="text-slate-300 text-sm flex items-center gap-2">
                    <HardDrive className="w-4 h-4" />
                    Incluir VOD (gravação)
                  </Label>
                </div>

                {includeVod && (
                  <div>
                    <Label className="text-slate-300 text-sm">Dias de armazenamento</Label>
                    <Input
                      type="number"
                      value={storageDays}
                      onChange={(e) => setStorageDays(Math.max(1, Number(e.target.value)))}
                      className="mt-1 bg-slate-900 border-slate-700 text-white"
                      min={1}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Interações */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-pink-400" />
                  Interações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300 text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Mensagens de chat/min
                  </Label>
                  <Input
                    type="number"
                    value={chatMessagesPerMinute}
                    onChange={(e) => setChatMessagesPerMinute(Math.max(0, Number(e.target.value)))}
                    className="mt-1 bg-slate-900 border-slate-700 text-white"
                    min={0}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Total: {(chatMessagesPerMinute * durationMinutes).toLocaleString()} mensagens
                  </p>
                </div>

                <div>
                  <Label className="text-slate-300 text-sm flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Reactions/min
                  </Label>
                  <Input
                    type="number"
                    value={reactionsPerMinute}
                    onChange={(e) => setReactionsPerMinute(Math.max(0, Number(e.target.value)))}
                    className="mt-1 bg-slate-900 border-slate-700 text-white"
                    min={0}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Total: {(reactionsPerMinute * durationMinutes).toLocaleString()} reactions
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Câmbio */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Conversão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label className="text-slate-300 text-sm">Taxa USD → BRL</Label>
                  <Input
                    type="number"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(Math.max(0.01, Number(e.target.value)))}
                    className="mt-1 bg-slate-900 border-slate-700 text-white"
                    step={0.01}
                    min={0.01}
                  />
                </div>
              </CardContent>
            </Card>
          </div>


          {/* Resultados */}
          <div className="lg:col-span-2 space-y-4">
            {/* Resumo do Perfil */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-400" />
                  Perfil Selecionado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400">Resolução</p>
                    <p className="text-lg font-bold text-white">{resolution}</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400">FPS</p>
                    <p className="text-lg font-bold text-white">{fps}</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400">Bitrate Estimado</p>
                    <p className="text-lg font-bold text-white">{formatBitrate(bitrate.kbps)}</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400">Multiplicador Total</p>
                    <p className="text-lg font-bold text-white">
                      {(RESOLUTION_DATA[resolution].multiplier * FPS_DATA[fps].multiplier * CODEC_DATA[codec].multiplier * HDR_DATA[hdr].multiplier).toFixed(1)}x
                    </p>
                  </div>
                </div>

                {/* Alertas */}
                {bitrate.kbps > 100000 && (
                  <Alert className="mt-4 bg-yellow-500/10 border-yellow-500/50">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <AlertDescription className="text-yellow-200/80">
                      Bitrate muito alto ({formatBitrate(bitrate.kbps)}). Viewers precisarão de conexão de alta velocidade.
                    </AlertDescription>
                  </Alert>
                )}

                {bitrate.kbps > 500000 && (
                  <Alert className="mt-2 bg-red-500/10 border-red-500/50">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-200/80">
                      Configuração extrema! Requer infraestrutura dedicada e viewers com conexão gigabit.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Comparativo de Clouds */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-cyan-400" />
                  Comparativo de Cloud Providers
                </CardTitle>
                <CardDescription>
                  Economia potencial: {formatUSD(comparison.savings)} ({formatBRL(comparison.savings, exchangeRate)})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['aws', 'azure', 'gcp', 'cloudflare'] as CloudProvider[]).map((provider) => {
                    const data = comparison[provider]
                    const pricing = CLOUD_PRICING[provider]
                    const isCheapest = provider === comparison.cheapest
                    const isMostExpensive = provider === comparison.mostExpensive

                    return (
                      <Card 
                        key={provider} 
                        className={`bg-slate-900/50 border-2 ${
                          isCheapest ? 'border-green-500/50' : 
                          isMostExpensive ? 'border-red-500/30' : 
                          'border-slate-700'
                        }`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-white text-base flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: pricing.color }}
                              />
                              {pricing.name}
                            </CardTitle>
                            {isCheapest && (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                                <TrendingDown className="w-3 h-3 mr-1" />
                                Mais Barato
                              </Badge>
                            )}
                            {isMostExpensive && (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Mais Caro
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Total */}
                          <div className="bg-slate-800 rounded-lg p-3">
                            <p className="text-xs text-slate-400">Total</p>
                            <p className="text-2xl font-bold text-white">{formatUSD(data.total)}</p>
                            <p className="text-sm text-slate-400">{formatBRL(data.total, exchangeRate)}</p>
                          </div>

                          {/* Breakdown */}
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Encoding</span>
                              <span className="text-white">{formatUSD(data.encoding.total)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">CDN ({formatBytes(data.cdn.totalDataGb)})</span>
                              <span className="text-white">{formatUSD(data.cdn.total)}</span>
                            </div>
                            {includeVod && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Storage ({formatBytes(data.storage.sizeGb)})</span>
                                <span className="text-white">{formatUSD(data.storage.total)}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-slate-400">Interações</span>
                              <span className="text-white">{formatUSD(data.interactions.total)}</span>
                            </div>
                            <hr className="border-slate-700" />
                            <div className="flex justify-between">
                              <span className="text-slate-400">Por Viewer</span>
                              <span className="text-white">{formatUSD(data.costPerViewer)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Por Viewer/Hora</span>
                              <span className="text-white">{formatUSD(data.costPerViewerPerHour)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>


            {/* Detalhamento por Categoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Encoding Details */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    Detalhes de Encoding
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Multiplicador Resolução</span>
                      <span className="text-white">{RESOLUTION_DATA[resolution].multiplier}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Multiplicador FPS</span>
                      <span className="text-white">{FPS_DATA[fps].multiplier}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Multiplicador Codec</span>
                      <span className="text-white">{CODEC_DATA[codec].multiplier}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Multiplicador HDR</span>
                      <span className="text-white">{HDR_DATA[hdr].multiplier}x</span>
                    </div>
                    <hr className="border-slate-700" />
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-300">Multiplicador Total</span>
                      <span className="text-white">
                        {(RESOLUTION_DATA[resolution].multiplier * FPS_DATA[fps].multiplier * CODEC_DATA[codec].multiplier * HDR_DATA[hdr].multiplier).toFixed(2)}x
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-slate-400 mb-2">Custo por minuto de encoding:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['aws', 'azure', 'gcp', 'cloudflare'] as CloudProvider[]).map((provider) => (
                        <div key={provider} className="flex justify-between">
                          <span className="text-slate-500">{provider.toUpperCase()}</span>
                          <span className="text-white">{formatUSD(comparison[provider].encoding.costPerMinute)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CDN Details */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-cyan-400" />
                    Detalhes de CDN/Bandwidth
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bitrate</span>
                      <span className="text-white">{formatBitrate(bitrate.kbps)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dados por Viewer</span>
                      <span className="text-white">{formatBytes(comparison.aws.cdn.dataPerViewerGb)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total de Dados</span>
                      <span className="text-white">{formatBytes(comparison.aws.cdn.totalDataGb)}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-slate-400 mb-2">Custo por GB:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['aws', 'azure', 'gcp', 'cloudflare'] as CloudProvider[]).map((provider) => (
                        <div key={provider} className="flex justify-between">
                          <span className="text-slate-500">{provider.toUpperCase()}</span>
                          <span className="text-white">{formatUSD(CLOUD_PRICING[provider].cdnPerGb)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Interactions Details */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-pink-400" />
                    Detalhes de Interações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total de Mensagens</span>
                      <span className="text-white">{(chatMessagesPerMinute * durationMinutes).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total de Reactions</span>
                      <span className="text-white">{(reactionsPerMinute * durationMinutes).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-slate-400 mb-2">Custo por mensagem:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['aws', 'azure', 'gcp', 'cloudflare'] as CloudProvider[]).map((provider) => (
                        <div key={provider} className="flex justify-between">
                          <span className="text-slate-500">{provider.toUpperCase()}</span>
                          <span className="text-white">{formatUSD(CLOUD_PRICING[provider].chatPerMessage)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Storage Details */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-green-400" />
                    Detalhes de Storage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tamanho do VOD</span>
                      <span className="text-white">{formatBytes(comparison.aws.storage.sizeGb)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dias de Armazenamento</span>
                      <span className="text-white">{storageDays} dias</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-slate-400 mb-2">Custo por GB/mês:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['aws', 'azure', 'gcp', 'cloudflare'] as CloudProvider[]).map((provider) => (
                        <div key={provider} className="flex justify-between">
                          <span className="text-slate-500">{provider.toUpperCase()}</span>
                          <span className="text-white">{formatUSD(CLOUD_PRICING[provider].storagePerGbMonth)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-4">
            <p className="text-xs text-slate-500 text-center">
              ⚠️ Valores são estimativas baseadas em preços públicos de Jan/2025. 
              Custos reais podem variar com volume, região e negociação com providers.
              Esta calculadora é apenas para planejamento interno.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
