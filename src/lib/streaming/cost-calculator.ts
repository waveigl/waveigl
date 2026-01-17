/**
 * Calculadora de Custos de Streaming
 * 
 * Calcula custos atômicos para cada componente de uma stream:
 * - Encoding (resolução, FPS, codec, HDR)
 * - CDN/Bandwidth
 * - Storage
 * - Interações (chat, reactions, etc)
 * 
 * Suporta múltiplos cloud providers: AWS, Azure, GCP, Cloudflare
 */

// ============================================
// TIPOS
// ============================================

export type Resolution = '360p' | '480p' | '720p' | '1080p' | '1440p' | '4K' | '8K' | '16K'
export type FPS = 24 | 30 | 60 | 120 | 240 | 500 | 1000
export type Codec = 'h264_420' | 'h264_422' | 'h265_420' | 'h265_422' | 'h265_444' | 'av1_420' | 'av1_444' | 'vp9_420'
export type HDRType = 'sdr' | 'hdr10' | 'hdr10plus' | 'dolby_vision' | 'hlg'
export type CloudProvider = 'aws' | 'azure' | 'gcp' | 'cloudflare'

export interface StreamingProfile {
  resolution: Resolution
  fps: FPS
  codec: Codec
  hdr: HDRType
}

export interface StreamingConfig {
  profile: StreamingProfile
  durationMinutes: number
  expectedViewers: number
  includeVod: boolean
  storageDays: number
  chatMessagesPerMinute: number
  reactionsPerMinute: number
}


export interface CostBreakdown {
  encoding: {
    costPerMinute: number
    total: number
    multipliers: {
      resolution: number
      fps: number
      codec: number
      hdr: number
      combined: number
    }
  }
  cdn: {
    bitrateKbps: number
    bitrateMbps: number
    dataPerViewerGb: number
    totalDataGb: number
    costPerGb: number
    total: number
  }
  storage: {
    sizeGb: number
    costPerGbMonth: number
    total: number
  }
  interactions: {
    chatMessages: number
    chatCostPerMessage: number
    chatTotal: number
    reactions: number
    reactionCostPer: number
    reactionsTotal: number
    total: number
  }
  total: number
  costPerViewer: number
  costPerViewerPerHour: number
}

export interface CloudCostComparison {
  aws: CostBreakdown
  azure: CostBreakdown
  gcp: CostBreakdown
  cloudflare: CostBreakdown
  cheapest: CloudProvider
  mostExpensive: CloudProvider
  savings: number
}

// ============================================
// CONSTANTES - MULTIPLICADORES
// ============================================

export const RESOLUTION_DATA: Record<Resolution, { pixels: number; multiplier: number; baseKbps: number; label: string }> = {
  '360p':  { pixels: 640 * 360,     multiplier: 0.5,   baseKbps: 800,    label: '360p (640×360)' },
  '480p':  { pixels: 854 * 480,     multiplier: 0.75,  baseKbps: 1500,   label: '480p (854×480)' },
  '720p':  { pixels: 1280 * 720,    multiplier: 1.0,   baseKbps: 3000,   label: '720p HD (1280×720)' },
  '1080p': { pixels: 1920 * 1080,   multiplier: 2.0,   baseKbps: 6000,   label: '1080p Full HD (1920×1080)' },
  '1440p': { pixels: 2560 * 1440,   multiplier: 4.0,   baseKbps: 12000,  label: '1440p 2K (2560×1440)' },
  '4K':    { pixels: 3840 * 2160,   multiplier: 8.0,   baseKbps: 25000,  label: '4K UHD (3840×2160)' },
  '8K':    { pixels: 7680 * 4320,   multiplier: 32.0,  baseKbps: 80000,  label: '8K UHD (7680×4320)' },
  '16K':   { pixels: 15360 * 8640,  multiplier: 128.0, baseKbps: 300000, label: '16K (15360×8640)' },
}

export const FPS_DATA: Record<FPS, { multiplier: number; label: string }> = {
  24:   { multiplier: 0.8,  label: '24 fps (Cinema)' },
  30:   { multiplier: 1.0,  label: '30 fps (Standard)' },
  60:   { multiplier: 1.5,  label: '60 fps (Smooth)' },
  120:  { multiplier: 2.5,  label: '120 fps (High Refresh)' },
  240:  { multiplier: 4.0,  label: '240 fps (Ultra Smooth)' },
  500:  { multiplier: 8.0,  label: '500 fps (Extreme)' },
  1000: { multiplier: 15.0, label: '1000 fps (Insane)' },
}


export const CODEC_DATA: Record<Codec, { multiplier: number; bitrateRatio: number; label: string; description: string }> = {
  'h264_420': { multiplier: 1.0,  bitrateRatio: 1.0,  label: 'H.264 4:2:0', description: 'Compatibilidade máxima' },
  'h264_422': { multiplier: 1.3,  bitrateRatio: 1.3,  label: 'H.264 4:2:2', description: 'Melhor cor, mais dados' },
  'h265_420': { multiplier: 1.3,  bitrateRatio: 0.7,  label: 'H.265/HEVC 4:2:0', description: 'Eficiente, boa qualidade' },
  'h265_422': { multiplier: 2.0,  bitrateRatio: 0.8,  label: 'H.265/HEVC 4:2:2', description: 'Profissional' },
  'h265_444': { multiplier: 3.0,  bitrateRatio: 1.0,  label: 'H.265/HEVC 4:4:4', description: 'Máxima fidelidade de cor' },
  'av1_420':  { multiplier: 2.0,  bitrateRatio: 0.5,  label: 'AV1 4:2:0', description: 'Mais eficiente, encoding lento' },
  'av1_444':  { multiplier: 2.5,  bitrateRatio: 0.6,  label: 'AV1 4:4:4', description: 'Melhor qualidade/tamanho' },
  'vp9_420':  { multiplier: 1.5,  bitrateRatio: 0.6,  label: 'VP9 4:2:0', description: 'Bom para web' },
}

export const HDR_DATA: Record<HDRType, { multiplier: number; bitDepth: number; bitrateIncrease: number; label: string }> = {
  'sdr':          { multiplier: 1.0, bitDepth: 8,  bitrateIncrease: 1.0,  label: 'SDR (8-bit)' },
  'hdr10':        { multiplier: 1.5, bitDepth: 10, bitrateIncrease: 1.25, label: 'HDR10 (10-bit)' },
  'hdr10plus':    { multiplier: 1.7, bitDepth: 10, bitrateIncrease: 1.3,  label: 'HDR10+ (10-bit dinâmico)' },
  'dolby_vision': { multiplier: 2.0, bitDepth: 12, bitrateIncrease: 1.5,  label: 'Dolby Vision (12-bit)' },
  'hlg':          { multiplier: 1.4, bitDepth: 10, bitrateIncrease: 1.2,  label: 'HLG (10-bit broadcast)' },
}

// ============================================
// PREÇOS POR CLOUD PROVIDER
// ============================================

export interface CloudPricing {
  name: string
  encodingBasePerMinute: number  // Custo base por minuto de encoding
  cdnPerGb: number               // Custo por GB de CDN
  storagePerGbMonth: number      // Custo por GB/mês de storage
  chatPerMessage: number         // Custo por mensagem de chat
  reactionPer: number            // Custo por reaction
  color: string                  // Cor para UI
}

export const CLOUD_PRICING: Record<CloudProvider, CloudPricing> = {
  aws: {
    name: 'Amazon Web Services',
    encodingBasePerMinute: 0.00125,
    cdnPerGb: 0.085,
    storagePerGbMonth: 0.023,
    chatPerMessage: 0.0000004,
    reactionPer: 0.0000002,
    color: '#FF9900',
  },
  azure: {
    name: 'Microsoft Azure',
    encodingBasePerMinute: 0.0011,
    cdnPerGb: 0.081,
    storagePerGbMonth: 0.0184,
    chatPerMessage: 0.00000035,
    reactionPer: 0.00000018,
    color: '#0078D4',
  },
  gcp: {
    name: 'Google Cloud Platform',
    encodingBasePerMinute: 0.001,
    cdnPerGb: 0.08,
    storagePerGbMonth: 0.020,
    chatPerMessage: 0.0000003,
    reactionPer: 0.00000015,
    color: '#4285F4',
  },
  cloudflare: {
    name: 'Cloudflare',
    encodingBasePerMinute: 0.0008,
    cdnPerGb: 0.01,
    storagePerGbMonth: 0.015,
    chatPerMessage: 0.00000025,
    reactionPer: 0.0000001,
    color: '#F38020',
  },
}


// ============================================
// FUNÇÕES DE CÁLCULO
// ============================================

/**
 * Calcula o bitrate final baseado no perfil de streaming
 */
export function calculateBitrate(profile: StreamingProfile): { kbps: number; mbps: number } {
  const baseKbps = RESOLUTION_DATA[profile.resolution].baseKbps
  const fpsRatio = FPS_DATA[profile.fps].multiplier
  const codecRatio = CODEC_DATA[profile.codec].bitrateRatio
  const hdrRatio = HDR_DATA[profile.hdr].bitrateIncrease
  
  const kbps = Math.round(baseKbps * fpsRatio * codecRatio * hdrRatio)
  const mbps = Math.round(kbps / 1000 * 100) / 100
  
  return { kbps, mbps }
}

/**
 * Calcula o multiplicador combinado de encoding
 */
export function calculateEncodingMultiplier(profile: StreamingProfile): {
  resolution: number
  fps: number
  codec: number
  hdr: number
  combined: number
} {
  const resolution = RESOLUTION_DATA[profile.resolution].multiplier
  const fps = FPS_DATA[profile.fps].multiplier
  const codec = CODEC_DATA[profile.codec].multiplier
  const hdr = HDR_DATA[profile.hdr].multiplier
  
  return {
    resolution,
    fps,
    codec,
    hdr,
    combined: resolution * fps * codec * hdr,
  }
}

/**
 * Calcula o custo completo para um cloud provider específico
 */
export function calculateCostForProvider(
  config: StreamingConfig,
  provider: CloudProvider
): CostBreakdown {
  const pricing = CLOUD_PRICING[provider]
  const multipliers = calculateEncodingMultiplier(config.profile)
  const bitrate = calculateBitrate(config.profile)
  
  // Encoding
  const encodingCostPerMinute = pricing.encodingBasePerMinute * multipliers.combined
  const encodingTotal = encodingCostPerMinute * config.durationMinutes
  
  // CDN
  const dataPerViewerGb = (bitrate.kbps * config.durationMinutes * 60) / 8 / 1024 / 1024
  const totalDataGb = dataPerViewerGb * config.expectedViewers
  const cdnTotal = totalDataGb * pricing.cdnPerGb
  
  // Storage (VOD)
  let storageTotal = 0
  let storageSizeGb = 0
  if (config.includeVod) {
    storageSizeGb = (bitrate.kbps * config.durationMinutes * 60) / 8 / 1024 / 1024
    const storageCostPerMonth = storageSizeGb * pricing.storagePerGbMonth
    storageTotal = storageCostPerMonth * (config.storageDays / 30)
  }
  
  // Interações
  const totalChatMessages = config.chatMessagesPerMinute * config.durationMinutes
  const chatTotal = totalChatMessages * pricing.chatPerMessage
  
  const totalReactions = config.reactionsPerMinute * config.durationMinutes
  const reactionsTotal = totalReactions * pricing.reactionPer
  
  const interactionsTotal = chatTotal + reactionsTotal
  
  // Total
  const total = encodingTotal + cdnTotal + storageTotal + interactionsTotal
  const costPerViewer = config.expectedViewers > 0 ? total / config.expectedViewers : 0
  const costPerViewerPerHour = config.durationMinutes > 0 
    ? costPerViewer / (config.durationMinutes / 60) 
    : 0
  
  return {
    encoding: {
      costPerMinute: encodingCostPerMinute,
      total: encodingTotal,
      multipliers,
    },
    cdn: {
      bitrateKbps: bitrate.kbps,
      bitrateMbps: bitrate.mbps,
      dataPerViewerGb,
      totalDataGb,
      costPerGb: pricing.cdnPerGb,
      total: cdnTotal,
    },
    storage: {
      sizeGb: storageSizeGb,
      costPerGbMonth: pricing.storagePerGbMonth,
      total: storageTotal,
    },
    interactions: {
      chatMessages: totalChatMessages,
      chatCostPerMessage: pricing.chatPerMessage,
      chatTotal,
      reactions: totalReactions,
      reactionCostPer: pricing.reactionPer,
      reactionsTotal,
      total: interactionsTotal,
    },
    total,
    costPerViewer,
    costPerViewerPerHour,
  }
}


/**
 * Compara custos entre todos os cloud providers
 */
export function compareCloudCosts(config: StreamingConfig): CloudCostComparison {
  const aws = calculateCostForProvider(config, 'aws')
  const azure = calculateCostForProvider(config, 'azure')
  const gcp = calculateCostForProvider(config, 'gcp')
  const cloudflare = calculateCostForProvider(config, 'cloudflare')
  
  const costs: Record<CloudProvider, number> = {
    aws: aws.total,
    azure: azure.total,
    gcp: gcp.total,
    cloudflare: cloudflare.total,
  }
  
  const providers = Object.keys(costs) as CloudProvider[]
  const cheapest = providers.reduce((a, b) => costs[a] < costs[b] ? a : b)
  const mostExpensive = providers.reduce((a, b) => costs[a] > costs[b] ? a : b)
  const savings = costs[mostExpensive] - costs[cheapest]
  
  return {
    aws,
    azure,
    gcp,
    cloudflare,
    cheapest,
    mostExpensive,
    savings,
  }
}

/**
 * Formata valor em dólar
 */
export function formatUSD(value: number): string {
  if (value < 0.01 && value > 0) {
    return `$${value.toFixed(6)}`
  }
  return `$${value.toFixed(2)}`
}

/**
 * Formata valor em real brasileiro
 */
export function formatBRL(value: number, exchangeRate: number = 5.0): string {
  const brl = value * exchangeRate
  return `R$ ${brl.toFixed(2)}`
}

/**
 * Formata bytes para unidade legível
 */
export function formatBytes(gb: number): string {
  if (gb >= 1000) {
    return `${(gb / 1000).toFixed(2)} TB`
  }
  return `${gb.toFixed(2)} GB`
}

/**
 * Formata bitrate para unidade legível
 */
export function formatBitrate(kbps: number): string {
  if (kbps >= 1000000) {
    return `${(kbps / 1000000).toFixed(2)} Gbps`
  }
  if (kbps >= 1000) {
    return `${(kbps / 1000).toFixed(1)} Mbps`
  }
  return `${kbps} Kbps`
}

/**
 * Retorna presets de configuração comuns
 */
export function getPresets(): Record<string, { label: string; config: Partial<StreamingConfig> }> {
  return {
    casual: {
      label: '🎮 Casual Gaming',
      config: {
        profile: { resolution: '720p', fps: 30, codec: 'h264_420', hdr: 'sdr' },
        expectedViewers: 50,
        durationMinutes: 120,
      },
    },
    standard: {
      label: '📺 Stream Padrão',
      config: {
        profile: { resolution: '1080p', fps: 60, codec: 'h264_420', hdr: 'sdr' },
        expectedViewers: 200,
        durationMinutes: 180,
      },
    },
    pro: {
      label: '🎬 Profissional',
      config: {
        profile: { resolution: '1080p', fps: 60, codec: 'h265_420', hdr: 'sdr' },
        expectedViewers: 1000,
        durationMinutes: 240,
      },
    },
    '4k_gaming': {
      label: '🎯 4K Gaming',
      config: {
        profile: { resolution: '4K', fps: 60, codec: 'h265_420', hdr: 'hdr10' },
        expectedViewers: 500,
        durationMinutes: 180,
      },
    },
    '4k_cinema': {
      label: '🎥 4K Cinema HDR',
      config: {
        profile: { resolution: '4K', fps: 24, codec: 'h265_422', hdr: 'dolby_vision' },
        expectedViewers: 2000,
        durationMinutes: 120,
      },
    },
    extreme: {
      label: '🚀 Extreme (4K 240fps)',
      config: {
        profile: { resolution: '4K', fps: 240, codec: 'h265_444', hdr: 'hdr10' },
        expectedViewers: 100,
        durationMinutes: 60,
      },
    },
    insane: {
      label: '💀 Insane (8K 120fps)',
      config: {
        profile: { resolution: '8K', fps: 120, codec: 'av1_444', hdr: 'dolby_vision' },
        expectedViewers: 50,
        durationMinutes: 30,
      },
    },
  }
}
