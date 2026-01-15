'use client'

import { FC } from 'react'
import { useChatStatus } from '@/hooks/useChatStatus'
import { AlertCircle } from 'lucide-react'

interface ChatOfflineNoticeProps {
  platform?: 'twitch' | 'kick' | 'youtube'
}

/**
 * Mostra notificação quando o chat está offline
 * Controlado pelo admin
 */
export const ChatOfflineNotice: FC<ChatOfflineNoticeProps> = ({ platform }) => {
  const { isChatOnline, isVideoPlayerOnline } = useChatStatus()

  // Se não especificou plataforma, verificar player de vídeo
  if (!platform) {
    if (isVideoPlayerOnline()) {
      return null
    }

    return (
      <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        <div>
          <p className="font-medium text-yellow-900 dark:text-yellow-300">
            Player de vídeo offline
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            O player de vídeo está temporariamente desabilitado
          </p>
        </div>
      </div>
    )
  }

  // Verificar chat específico
  if (isChatOnline(platform)) {
    return null
  }

  const platformNames = {
    twitch: 'Twitch',
    kick: 'Kick',
    youtube: 'YouTube'
  }

  return (
    <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
      <div>
        <p className="font-medium text-yellow-900 dark:text-yellow-300">
          Chat {platformNames[platform]} offline
        </p>
        <p className="text-sm text-yellow-700 dark:text-yellow-400">
          O chat está temporariamente desabilitado pelo administrador
        </p>
      </div>
    </div>
  )
}
