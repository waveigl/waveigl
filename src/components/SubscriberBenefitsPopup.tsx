'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Gift, MessageCircle, Copy, Check, ChevronRight, ExternalLink } from 'lucide-react'
import { SUBSCRIBER_BENEFITS_LIST } from '@/lib/benefits/constants'

interface SubscriberBenefit {
  id: string
  platform: 'twitch' | 'kick' | 'youtube'
  tier: string
  whatsapp_code: string | null
  whatsapp_joined_at: string | null
  discord_linked: boolean
  onboarding_step: number
  is_gift: boolean
  gifter_username: string | null
}

interface SubscriberBenefitsPopupProps {
  benefit: SubscriberBenefit
  isOpen: boolean
  onClose: () => void
  onDismiss: () => void
  discordConnected: boolean
}

export default function SubscriberBenefitsPopup({
  benefit,
  isOpen,
  onClose,
  onDismiss,
  discordConnected
}: SubscriberBenefitsPopupProps) {
  const [step, setStep] = useState(benefit.onboarding_step || 0)
  const [whatsappCode, setWhatsappCode] = useState<string | null>(benefit.whatsapp_code)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && step === 0) {
      setStep(1) // Começar no step 1 (WhatsApp)
    }
  }, [isOpen, step])

  const handleGenerateCode = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/benefits/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ benefitId: benefit.id })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Erro ao gerar código')
        return
      }
      
      setWhatsappCode(data.code)
      
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = () => {
    if (whatsappCode) {
      navigator.clipboard.writeText(whatsappCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleNextStep = async () => {
    const nextStep = step + 1
    
    // Atualizar step no backend
    try {
      await fetch('/api/benefits/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ benefitId: benefit.id, step: nextStep })
      })
    } catch {
      // Ignorar erro, continuar mesmo assim
    }
    
    if (nextStep > 2) {
      onClose()
    } else {
      setStep(nextStep)
    }
  }

  const handleDismiss = async () => {
    try {
      await fetch('/api/benefits/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ benefitId: benefit.id })
      })
    } catch {
      // Ignorar erro
    }
    onDismiss()
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
      twitch: 'text-purple-400',
      kick: 'text-green-400',
      youtube: 'text-red-400'
    }
    return colors[platform] || 'text-white'
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-md w-full overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header com confetti */}
          <div className="relative bg-linear-to-r from-orange-600 to-amber-500 p-6 text-center">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
              title="Fechar"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
            
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-xl font-bold text-white">
              {benefit.is_gift ? 'Você recebeu um presente!' : 'Parabéns, novo SUB!'}
            </h2>
            <p className="text-white/90 text-sm mt-1">
              {benefit.is_gift 
                ? `@${benefit.gifter_username} te deu uma inscrição!`
                : `Você se inscreveu na ${getPlatformName(benefit.platform)}`
              }
            </p>
            <div className={`inline-block mt-2 px-3 py-1 rounded-full bg-black/20 ${getPlatformColor(benefit.platform)}`}>
              {benefit.tier}
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-6">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <MessageCircle className="text-green-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Grupo de WhatsApp</h3>
                    <p className="text-sm text-zinc-400">Passo 1 de 2</p>
                  </div>
                </div>

                <p className="text-zinc-300 text-sm mb-4">
                  Você tem direito ao grupo exclusivo de subs no WhatsApp! 
                  Gere seu código único e envie no privado do @waveigl para receber o link.
                </p>

                {!whatsappCode ? (
                  <button
                    onClick={handleGenerateCode}
                    disabled={loading}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Gerando...' : 'Gerar meu código'}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-4 text-center">
                      <p className="text-sm text-zinc-400 mb-1">Seu código:</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-mono font-bold text-green-400">
                          {whatsappCode}
                        </span>
                        <button
                          onClick={handleCopyCode}
                          className="p-2 hover:bg-zinc-700 rounded transition-colors"
                          title="Copiar código"
                          aria-label="Copiar código"
                        >
                          {copied ? (
                            <Check size={18} className="text-green-400" />
                          ) : (
                            <Copy size={18} className="text-zinc-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-zinc-500 space-y-1">
                      <p>📱 Envie este código no privado do @waveigl</p>
                      <p>⏳ Aguarde o admin enviar o link do grupo</p>
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-red-400 text-sm mt-2">{error}</p>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <Gift className="text-indigo-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Discord Exclusivo</h3>
                    <p className="text-sm text-zinc-400">Passo 2 de 2</p>
                  </div>
                </div>

                <p className="text-zinc-300 text-sm mb-4">
                  Acesse o <span className="text-indigo-400 font-semibold">Clã do Wave</span> no Discord!
                </p>

                {benefit.platform === 'twitch' ? (
                  <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-zinc-300">
                      Como sua inscrição é na Twitch, siga estes passos:
                    </p>
                    <ol className="text-sm text-zinc-400 space-y-2 list-decimal list-inside">
                      <li>Abra o Discord</li>
                      <li>Vá em <span className="text-white">Configurações</span> → <span className="text-white">Conexões</span></li>
                      <li>Conecte sua conta da Twitch</li>
                      <li>O cargo de SUB será aplicado automaticamente</li>
                    </ol>
                    <a
                      href="https://discord.com/channels/@me"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                      Abrir Discord
                      <ExternalLink size={16} />
                    </a>
                  </div>
                ) : discordConnected ? (
                  <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-center">
                    <Check className="mx-auto text-green-400 mb-2" size={24} />
                    <p className="text-green-400 font-semibold">Discord conectado!</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      Você receberá acesso ao servidor em breve.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-zinc-400">
                      Como sua inscrição é na {getPlatformName(benefit.platform)}, 
                      você precisa vincular seu Discord aqui:
                    </p>
                    <a
                      href="/api/auth/discord"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      Vincular Discord
                      <ExternalLink size={16} />
                    </a>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2 border border-zinc-600 text-zinc-400 hover:text-white hover:border-zinc-500 rounded-lg transition-colors"
            >
              Lembrar depois
            </button>
            <button
              onClick={handleNextStep}
              className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              {step === 2 ? 'Concluir' : 'Próximo'}
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Lista de benefícios resumida */}
          <div className="border-t border-zinc-700 px-6 py-4 bg-zinc-800/50">
            <p className="text-xs text-zinc-500 mb-2">Seus benefícios como SUB:</p>
            <div className="flex flex-wrap gap-2">
              {SUBSCRIBER_BENEFITS_LIST.slice(0, 4).map(b => (
                <span key={b.id} className="text-xs bg-zinc-700 px-2 py-1 rounded-full text-zinc-300">
                  {b.icon} {b.title}
                </span>
              ))}
              <span className="text-xs text-zinc-500">+{SUBSCRIBER_BENEFITS_LIST.length - 4} mais</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

