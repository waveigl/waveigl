'use client'

import { useState, useEffect } from 'react'
import { Crown, AlertCircle, Loader2, Info, CreditCard, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ClubOnboardingPopup from './ClubOnboardingPopup'

interface ClubSubscriptionWidgetProps {
  onStatusChange?: (status: 'no_club' | 'eligible' | 'subscriber') => void
  isTargetUserForSync?: boolean
  onForceSync?: () => void
}

interface EligibilityData {
  eligible: boolean
  missing: string[]
  user: {
    id: string
    full_name: string | null
    phone_number: string | null
    birth_date: string | null
    discord_connected: boolean
    discord_username: string | null
    subscription_status: string
  }
}

export default function ClubSubscriptionWidget({
  onStatusChange,
  isTargetUserForSync = false,
  onForceSync
}: ClubSubscriptionWidgetProps) {
  const [status, setStatus] = useState<'no_club' | 'eligible' | 'subscriber' | 'loading'>('loading')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [eligibilityData, setEligibilityData] = useState<EligibilityData | null>(null)
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false)
  const [notificationData, setNotificationData] = useState<{
    found: boolean
    count: number
    updates: string[]
  } | null>(null)

  // Buscar elegibilidade
  useEffect(() => {
    const checkEligibility = async () => {
      try {
        setStatus('loading')

        const res = await fetch('/api/subscription/check-eligibility')
        const data: any = await res.json()

        setEligibilityData(data)

        // Determinar status - verificar subscription_status OU reason
        if (data.user?.subscription_status === 'active' || data.reason === 'already_subscribed') {
          setStatus('subscriber')
        } else if (data.eligible) {
          setStatus('eligible')
        } else {
          setStatus('no_club')
        }

        // Verificar notificações do Mercado Pago
        checkMercadoPagoNotifications()

      } catch (error) {
        console.error('[Club Widget] Erro ao verificar elegibilidade:', error)
        setStatus('no_club')
      }
    }

    checkEligibility()
  }, [])

  // Notificar mudança de status
  useEffect(() => {
    if (status !== 'loading') {
      onStatusChange?.(status as 'no_club' | 'eligible' | 'subscriber')
    }
  }, [status, onStatusChange])

  const checkMercadoPagoNotifications = async () => {
    try {
      const res = await fetch('/api/subscription/sync', { method: 'POST' })
      const syncData = await res.json()

      if (syncData.success || syncData.recovered_via_search) {
        setNotificationData({
          found: true,
          count: 1,
          updates: [
            `Status: ${syncData.mp_status}`,
            syncData.recovered_via_search ? 'Assinatura recuperada via email' : 'Verificada'
          ]
        })

        // Se encontrou uma assinatura ativa, atualizar status
        if (syncData.mp_status === 'authorized') {
          setStatus('subscriber')
        }
      }
    } catch (error) {
      console.error('[Club Widget] Erro ao verificar notificações MP:', error)
    }
  }

  const handleSubscribeClick = async () => {
    if (isCheckingEligibility) return

    setIsCheckingEligibility(true)
    try {
      if (status === 'eligible') {
        // Se já está elegível, ir direto para checkout
        window.location.href = '/checkout/club'
      } else {
        // Mostrar onboarding
        setShowOnboarding(true)
      }
    } finally {
      setIsCheckingEligibility(false)
    }
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    window.location.href = '/checkout/club'
  }

  // Loading
  if (status === 'loading') {
    return (
      <Button disabled className="gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Verificando...
      </Button>
    )
  }

  // Subscriber
  if (status === 'subscriber') {
    return (
      <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
        <Crown className="w-3 h-3 mr-1" />
        Clube Ativo
      </Badge>
    )
  }

  // Eligible
  if (status === 'eligible') {
    return (
      <>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSubscribeClick}
            disabled={isCheckingEligibility}
            className="bg-linear-to-r from-[#E38817] to-[#B86A10] hover:from-[#F59928] hover:to-[#E38817] text-white shadow-lg shadow-[#E38817]/25 transition-all"
            size="sm"
          >
            {isCheckingEligibility ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Você está elegível para assinar
              </>
            )}
          </Button>

          {notificationData?.found && (
            <div className="relative group">
              <Info className="w-4 h-4 text-blue-400 cursor-help" />
              <div className="absolute right-0 top-6 hidden group-hover:block bg-blue-500/20 border border-blue-500/30 rounded p-2 text-xs text-blue-400 whitespace-nowrap z-10">
                {notificationData.updates.join(' • ')}
              </div>
            </div>
          )}
        </div>

        <ClubOnboardingPopup
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          userData={{
            id: eligibilityData?.user.id || '',
            full_name: eligibilityData?.user.full_name || null,
            phone_number: eligibilityData?.user.phone_number || null,
            birth_date: eligibilityData?.user.birth_date || null,
            discord_connected: eligibilityData?.user.discord_connected || false,
            discord_username: eligibilityData?.user.discord_username || null
          }}
          onComplete={handleOnboardingComplete}
        />
      </>
    )
  }

  // No Club (missing data)
  return (
    <>
      <div className="flex items-center gap-2">
        <Badge
          className={`bg-zinc-700/50 text-zinc-400 border border-zinc-600 ${isTargetUserForSync ? 'cursor-pointer hover:bg-zinc-700' : ''}`}
          onClick={isTargetUserForSync ? onForceSync : undefined}
          title={isTargetUserForSync ? 'Dev Mode: Clique para sincronizar com Mercado Pago' : ''}
        >
          <XCircle className="w-3 h-3 mr-1" />
          Sem Clube
        </Badge>
        <Button
          onClick={handleSubscribeClick}
          size="sm"
          disabled={isCheckingEligibility}
          className="bg-linear-to-r from-[#E38817] to-[#B86A10] hover:from-[#F59928] hover:to-[#E38817] text-white shadow-lg shadow-[#E38817]/25 transition-all"
        >
          {isCheckingEligibility ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Assinar Clube
            </>
          )}
        </Button>
      </div>

      {eligibilityData?.missing && eligibilityData.missing.length > 0 && (
        <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-amber-400">
              <p className="font-medium mb-1">Complete seu cadastro:</p>
              <ul className="text-xs space-y-1">
                {eligibilityData.missing.includes('discord') && (
                  <li>• Vincule seu Discord</li>
                )}
                {eligibilityData.missing.includes('full_name') && (
                  <li>• Adicione seu nome completo</li>
                )}
                {eligibilityData.missing.includes('phone_number') && (
                  <li>• Adicione seu número de WhatsApp</li>
                )}
                {eligibilityData.missing.includes('birth_date') && (
                  <li>• Adicione sua data de nascimento</li>
                )}
                {eligibilityData.missing.includes('underage') && (
                  <li>• Você precisa ter 18 anos ou mais</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      <ClubOnboardingPopup
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        userData={{
          id: eligibilityData?.user.id || '',
          full_name: eligibilityData?.user.full_name || null,
          phone_number: eligibilityData?.user.phone_number || null,
          birth_date: eligibilityData?.user.birth_date || null,
          discord_connected: eligibilityData?.user.discord_connected || false,
          discord_username: eligibilityData?.user.discord_username || null
        }}
        onComplete={handleOnboardingComplete}
      />
    </>
  )
}
