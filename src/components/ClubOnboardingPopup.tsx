'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Check, User, Phone, Calendar, Crown, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface UserData {
  id: string
  full_name: string | null
  phone_number: string | null
  birth_date: string | null
  discord_connected: boolean
  discord_username: string | null
}

interface ClubOnboardingPopupProps {
  isOpen: boolean
  onClose: () => void
  userData: UserData
  onComplete: () => void // Chamado quando onboarding completo, vai para checkout
}

type Step = 'discord' | 'personal' | 'complete'

export default function ClubOnboardingPopup({
  isOpen,
  onClose,
  userData,
  onComplete
}: ClubOnboardingPopupProps) {
  // Determinar step inicial baseado nos dados do usuário
  const getInitialStep = (): Step => {
    if (!userData.discord_connected) return 'discord'
    if (!userData.full_name || !userData.phone_number || !userData.birth_date) return 'personal'
    return 'complete'
  }

  const [currentStep, setCurrentStep] = useState<Step>(getInitialStep())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Dados do formulário
  const [fullName, setFullName] = useState(userData.full_name || '')
  const [phoneNumber, setPhoneNumber] = useState(userData.phone_number || '')
  const [birthDate, setBirthDate] = useState(userData.birth_date || '')

  // Recalcular step quando userData mudar
  useEffect(() => {
    if (isOpen) {
      const step = getInitialStep()
      setCurrentStep(step)
      
      // Se já está completo, ir direto para checkout
      if (step === 'complete') {
        onComplete()
      }
    }
  }, [isOpen, userData.discord_connected, userData.full_name, userData.phone_number, userData.birth_date])

  const formatPhoneNumber = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Aplica a máscara (XX) XXXXX-XXXX
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhoneNumber(e.target.value))
  }

  const validatePersonalData = () => {
    if (!fullName.trim() || fullName.trim().split(' ').length < 2) {
      setError('Informe seu nome completo (nome e sobrenome)')
      return false
    }
    
    const phoneDigits = phoneNumber.replace(/\D/g, '')
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setError('Informe um número de celular válido')
      return false
    }
    
    if (!birthDate) {
      setError('Informe sua data de nascimento')
      return false
    }
    
    // Verificar idade mínima (13 anos)
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    if (age < 13) {
      setError('Você precisa ter pelo menos 13 anos')
      return false
    }
    
    if (age > 120) {
      setError('Data de nascimento inválida')
      return false
    }
    
    return true
  }

  const handleSavePersonalData = async () => {
    setError(null)
    
    if (!validatePersonalData()) return
    
    setIsSubmitting(true)
    
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone_number: phoneNumber.replace(/\D/g, ''),
          birth_date: birthDate
        })
      })
      
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erro ao salvar dados')
        return
      }
      
      // Ir para checkout
      onComplete()
      
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDiscordConnect = () => {
    // Redirecionar para OAuth do Discord
    window.location.href = '/api/auth/discord?return_to=/dashboard?onboarding=continue'
  }

  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: 'discord', label: 'Discord', icon: <ExternalLink className="w-4 h-4" /> },
    { key: 'personal', label: 'Dados', icon: <User className="w-4 h-4" /> },
  ]

  const currentStepIndex = steps.findIndex(s => s.key === currentStep)

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
          className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-md w-full overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-linear-to-r from-[#E38817] to-[#B86A10] p-6 text-center">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
              title="Fechar"
              aria-label="Fechar popup"
            >
              <X size={20} />
            </button>
            
            <Crown className="w-12 h-12 mx-auto mb-3 text-white" />
            <h2 className="text-xl font-bold text-white">
              Assinar Clube WaveIGL
            </h2>
            <p className="text-white/90 text-sm mt-1">
              Complete os passos abaixo para continuar
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 py-4 px-6 border-b border-zinc-700">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors
                  ${index < currentStepIndex 
                    ? 'bg-green-500 text-white' 
                    : index === currentStepIndex 
                      ? 'bg-[#E38817] text-white' 
                      : 'bg-zinc-700 text-zinc-400'
                  }
                `}>
                  {index < currentStepIndex ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <span className={`ml-2 text-sm ${index === currentStepIndex ? 'text-white' : 'text-zinc-500'}`}>
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-zinc-600 mx-2" />
                )}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step 1: Discord */}
            {currentStep === 'discord' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto bg-indigo-500/20 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Vincule seu Discord</h3>
                  <p className="text-sm text-zinc-400">
                    O Clube WaveIGL funciona através do Discord. 
                    Vincule sua conta para receber acesso ao servidor exclusivo.
                  </p>
                </div>

                <Button
                  onClick={handleDiscordConnect}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Vincular Discord
                </Button>

                <p className="text-xs text-zinc-500 text-center">
                  Ao vincular, você autoriza o acesso apenas ao seu ID e username do Discord.
                </p>
              </motion.div>
            )}

            {/* Step 2: Personal Data */}
            {currentStep === 'personal' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-white mb-1">Seus dados</h3>
                  <p className="text-sm text-zinc-400">
                    Precisamos de algumas informações para completar sua assinatura
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName" className="text-zinc-300 flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      Nome completo
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Seu nome completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-zinc-800 border-zinc-600 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber" className="text-zinc-300 flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4" />
                      Celular (WhatsApp)
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      className="bg-zinc-800 border-zinc-600 text-white"
                      maxLength={15}
                    />
                  </div>

                  <div>
                    <Label htmlFor="birthDate" className="text-zinc-300 flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4" />
                      Data de nascimento
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="bg-zinc-800 border-zinc-600 text-white"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSavePersonalData}
                  disabled={isSubmitting}
                  className="w-full h-12 bg-[#E38817] hover:bg-[#B86A10] text-white font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      Continuar para pagamento
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-zinc-500 text-center">
                  Seus dados são protegidos conforme nossa{' '}
                  <a href="/politica-privacidade" target="_blank" className="text-[#E38817] hover:underline">
                    Política de Privacidade
                  </a>
                </p>
              </motion.div>
            )}
          </div>

          {/* Footer com info do preço */}
          <div className="border-t border-zinc-700 px-6 py-4 bg-zinc-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">Assinatura mensal</p>
                <p className="text-lg font-bold text-white">
                  R$ 9,90<span className="text-sm font-normal text-zinc-400">/mês</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">Cancele quando quiser</p>
                <p className="text-xs text-green-400">✓ Acesso imediato</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

