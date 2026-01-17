/**
 * Tipos para gerenciamento de informações de streaming
 */

export type StreamingPlatform = 'twitch' | 'youtube' | 'kick'

export interface StreamingCategory {
  id: string
  name: string
  platform: StreamingPlatform
}

export interface StreamingTag {
  id: string
  name: string
  platform: StreamingPlatform
}

export interface StreamingInfo {
  platform: StreamingPlatform
  title: string
  description?: string
  category?: string
  categoryId?: string
  tags: string[]
  isAdultContent: boolean
  language?: string
  isMature?: boolean
  thumbnail?: string
  scheduledStartTime?: string
}

export interface StreamingInfoFormData {
  // Campos globais (aplicados a todas as plataformas)
  applyToAll: boolean
  
  // Informações por plataforma
  platforms: {
    twitch?: {
      title: string
      category: string
      tags: string[]
      isMature: boolean
      language: string
    }
    youtube?: {
      title: string
      description: string
      category: string
      tags: string[]
      isAdultContent: boolean
      language: string
      scheduledStartTime?: string
    }
    kick?: {
      title: string
      description: string
      category: string
      tags: string[]
      isAdultContent: boolean
      language: string
    }
  }
}

export interface StreamingInfoResponse {
  success: boolean
  message?: string
  error?: string
  updated?: StreamingPlatform[]
  failed?: {
    platform: StreamingPlatform
    error: string
  }[]
}

// Categorias por plataforma
export const TWITCH_CATEGORIES = [
  { id: '509658', name: 'Just Chatting' },
  { id: '12379', name: 'Minecraft' },
  { id: '21779', name: 'League of Legends' },
  { id: '516575', name: 'VALORANT' },
  { id: '12295', name: 'Counter-Strike 2' },
  { id: '32982', name: 'Grand Theft Auto V' },
  { id: '27471', name: 'Fortnite' },
  { id: '12345', name: 'Creative' },
  { id: '12294', name: 'Dota 2' },
  { id: '32399', name: 'World of Warcraft' },
]

export const YOUTUBE_CATEGORIES = [
  { id: '20', name: 'Gaming' },
  { id: '21', name: 'Videoblogging' },
  { id: '22', name: 'People & Blogs' },
  { id: '23', name: 'Comedy' },
  { id: '24', name: 'Entertainment' },
  { id: '25', name: 'News & Politics' },
  { id: '26', name: 'Howto & Style' },
  { id: '27', name: 'Education' },
  { id: '28', name: 'Science & Technology' },
  { id: '29', name: 'Nonprofits & Activism' },
]

export const KICK_CATEGORIES = [
  { id: 'just-chatting', name: 'Just Chatting' },
  { id: 'minecraft', name: 'Minecraft' },
  { id: 'league-of-legends', name: 'League of Legends' },
  { id: 'valorant', name: 'VALORANT' },
  { id: 'counter-strike', name: 'Counter-Strike 2' },
  { id: 'gta', name: 'Grand Theft Auto V' },
  { id: 'fortnite', name: 'Fortnite' },
  { id: 'creative', name: 'Creative' },
  { id: 'dota-2', name: 'Dota 2' },
  { id: 'world-of-warcraft', name: 'World of Warcraft' },
]

export const LANGUAGES = [
  { code: 'pt-BR', name: 'Português (Brasil)' },
  { code: 'en-US', name: 'English (US)' },
  { code: 'es-ES', name: 'Español' },
  { code: 'fr-FR', name: 'Français' },
  { code: 'de-DE', name: 'Deutsch' },
  { code: 'it-IT', name: 'Italiano' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'ko-KR', name: '한국어' },
  { code: 'zh-CN', name: '中文 (简体)' },
  { code: 'ru-RU', name: 'Русский' },
]
