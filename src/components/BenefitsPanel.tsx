'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Gift, Check, Clock, AlertCircle, 
  MessageCircle, Copy, ExternalLink, 
  ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react'
import { SUBSCRIBER_BENEFITS_LIST } from '@/lib/benefits/constants'

interface SubscriberBenefit {
  id: string
  platform: 'twitch' | 'kick' | 'youtube'
  tier: string
  subscribed_at: string
  expires_at: string
  whatsapp_code: string | null
  whatsapp_joined_at: string | null
  discord_linked: boolean
  is_gift: boolean
  gifter_username: string | null
}

interface DiscordConnection {
  discord_username: string
  discord_avatar: string | null
}

interface BenefitsPanelProps {
  isOpen: boolean
  onClose: () => void
  onOpenOnboarding: (benefit: SubscriberBenefit) => void
}

export default function BenefitsPanel({ isOpen, onClose, onOpenOnboarding }: BenefitsPanelProps) {
  const [benefits, setBenefits] = useState<SubscriberBenefit[]>([])
  const [discordConnection, setDiscordConnection] = useState<DiscordConnection | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedBenefit, setExpandedBenefit] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadBenefits()
    }
  }, [isOpen])

  const loadBenefits = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/benefits')
      const data = await res.json()
      setBenefits(data.benefits || [])
      setDiscordConnection(data.discordConnection)
    } catch (error) {
      console.error('Erro ao carregar benefícios:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      twitch: 'Twitch',
      kick: 'Kick',
      youtube: 'YouTube'
    }
    return names[platform] || platform
  }

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      twitch: 'bg-purple-500',
      kick: 'bg-green-500',
      youtube: 'bg-red-500'
    }
    return colors[platform] || 'bg-gray-500'
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-700">
            <div className="flex items-center gap-2">
              <Gift className="text-orange-400" size={24} />
              <h2 className="text-lg font-bold text-white">Meus Benefícios</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadBenefits}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(80vh-140px)]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="animate-spin text-zinc-400" size={24} />
              </div>
            ) : benefits.length === 0 ? (
              <div className="text-center py-8">
                <Gift className="mx-auto text-zinc-600 mb-3" size={48} />
                <p className="text-zinc-400">Você ainda não tem benefícios ativos.</p>
                <p className="text-sm text-zinc-500 mt-1">
                  Torne-se SUB em qualquer plataforma para desbloquear benefícios exclusivos!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Lista de vantagens */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-zinc-400 mb-3">Suas Vantagens</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {SUBSCRIBER_BENEFITS_LIST.map(b => (
                      <div 
                        key={b.id}
                        className="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg"
                      >
                        <span className="text-lg">{b.icon}</span>
                        <span className="text-sm text-zinc-300">{b.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Discord Connection */}
                <div className="p-3 bg-zinc-800/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                        {discordConnection?.discord_avatar ? (
                          <img 
                            src={discordConnection.discord_avatar} 
                            alt="Discord" 
                            className="w-full h-full rounded-full"
                          />
                        ) : (
                          <span className="text-white text-sm">D</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-white">Discord</p>
                        {discordConnection ? (
                          <p className="text-xs text-green-400">{discordConnection.discord_username}</p>
                        ) : (
                          <p className="text-xs text-zinc-500">Não conectado</p>
                        )}
                      </div>
                    </div>
                    {discordConnection ? (
                      <Check className="text-green-400" size={18} />
                    ) : (
                      <a
                        href="/api/auth/discord"
                        className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                      >
                        Vincular
                      </a>
                    )}
                  </div>
                </div>

                {/* Lista de benefícios por plataforma */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 mb-3">Inscrições Ativas</h3>
                  <div className="space-y-2">
                    {benefits.map(benefit => {
                      const daysRemaining = getDaysRemaining(benefit.expires_at)
                      const isExpiring = daysRemaining <= 5
                      const isExpanded = expandedBenefit === benefit.id

                      return (
                        <div 
                          key={benefit.id}
                          className="bg-zinc-800 rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => setExpandedBenefit(isExpanded ? null : benefit.id)}
                            className="w-full p-3 flex items-center justify-between hover:bg-zinc-700/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-8 rounded-full ${getPlatformColor(benefit.platform)}`} />
                              <div className="text-left">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-medium">
                                    {getPlatformName(benefit.platform)}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 bg-zinc-700 rounded text-zinc-300">
                                    {benefit.tier}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  {isExpiring ? (
                                    <span className="text-amber-400 flex items-center gap-1">
                                      <AlertCircle size={12} />
                                      Expira em {daysRemaining} dias
                                    </span>
                                  ) : (
                                    <span className="text-zinc-500 flex items-center gap-1">
                                      <Clock size={12} />
                                      {daysRemaining} dias restantes
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="text-zinc-400" size={18} />
                            ) : (
                              <ChevronDown className="text-zinc-400" size={18} />
                            )}
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-zinc-700"
                              >
                                <div className="p-3 space-y-3">
                                  {benefit.is_gift && (
                                    <div className="text-xs text-zinc-400">
                                      🎁 Presente de @{benefit.gifter_username}
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-400">Inscrito em:</span>
                                    <span className="text-white">{formatDate(benefit.subscribed_at)}</span>
                                  </div>

                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-400">Expira em:</span>
                                    <span className="text-white">{formatDate(benefit.expires_at)}</span>
                                  </div>

                                  {/* WhatsApp status */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <MessageCircle size={16} className="text-green-400" />
                                      <span className="text-sm text-zinc-300">WhatsApp</span>
                                    </div>
                                    {benefit.whatsapp_joined_at ? (
                                      <span className="text-xs text-green-400 flex items-center gap-1">
                                        <Check size={12} />
                                        No grupo
                                      </span>
                                    ) : benefit.whatsapp_code ? (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono bg-zinc-700 px-2 py-1 rounded text-green-400">
                                          {benefit.whatsapp_code}
                                        </span>
                                        <button
                                          onClick={() => handleCopyCode(benefit.whatsapp_code!)}
                                          className="p-1 hover:bg-zinc-600 rounded"
                                        >
                                          {copied ? (
                                            <Check size={14} className="text-green-400" />
                                          ) : (
                                            <Copy size={14} className="text-zinc-400" />
                                          )}
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => onOpenOnboarding(benefit)}
                                        className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                                      >
                                        Gerar código
                                      </button>
                                    )}
                                  </div>

                                  {/* Discord status */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <ExternalLink size={16} className="text-indigo-400" />
                                      <span className="text-sm text-zinc-300">Discord</span>
                                    </div>
                                    {benefit.discord_linked || discordConnection ? (
                                      <span className="text-xs text-green-400 flex items-center gap-1">
                                        <Check size={12} />
                                        Vinculado
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => onOpenOnboarding(benefit)}
                                        className="text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                                      >
                                        Configurar
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-700 bg-zinc-800/50">
            <p className="text-xs text-zinc-500 text-center">
              Dúvidas sobre seus benefícios? Entre em contato com @waveigl
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

