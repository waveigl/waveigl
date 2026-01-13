'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Crown, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import ClubOnboardingPopup from './ClubOnboardingPopup'

interface ClubSubscriptionButtonProps {
  userId: string
  onStatusChange?: (status: 'no_club' | 'eligible' | 'subscriber') => void
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

export default function ClubSubscriptionButton({ userId, onStatusChange }: ClubSubscriptionButtonProps) {
  const [status, setStatus] = useState<'no_club' | 'eligible' | 'subscriber'>('no_club')
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [eligibilityData, setEligibilityData] = useState<EligibilityData | null>(null)
  const [notificationData, setNotificationData] = useState<{
    found: boolean
    count: number
    updates: string[]
  } | null>(null)

  // Buscar elegibilidade e verificar notificações
  useEffect(() => {
    const checkEligibility = async () => {
      try {
        setLoading(true)

        // Buscar elegibilidade
        const res = await fetch('/api/subscription/check-eligibility')
        const data: EligibilityData = await res.json()

        setEligibilityData(data)

        // Determinar status
        if (data.user.subscription_status === 'active') {
          setStatus('subscriber')
        } else if (data.eligible) {
          setStatus('eligible')
        } else {
          setStatus('no_club')
        }

        // Verificar notificações do Mercado Pago
        checkMercadoPagoNotifications(data.user.id)

      } catch (error) {
        console.error('[Club Button] Erro ao verificar elegibilidade:', error)
        setStatus('no_club')
      } finally {
        setLoading(false)
      }
    }

    checkEligibility()
  }, [userId])

  // Notificar mudança de status
  useEffect(() => {
    onStatusChange?.(status)
  }, [status, onStatusChange])

  const checkMercadoPagoNotifications = async (userId: string) => {
    try {
      // Buscar histórico de sincronizações/atualizações do Mercado Pago
      const res = await fetch('/api/subscription/sync', { method: 'POST' })
      const syncData = await res.json()

      if (syncData.success || syncData.recovered_via_search) {
        setNotificationData({
          found: true,
          count: 1,
          updates: [
            `Status sincronizado: ${syncData.mp_status}`,
            syncData.recovered_via_search ? 'Assinatura recuperada via email' : 'Assinatura verificada'
          ]
        })

        // Se encontrou uma assinatura ativa, atualizar status
        if (syncData.mp_status === 'authorized') {
          setStatus('subscriber')
        }
      }
    } catch (error) {
      console.error('[Club Button] Erro ao verificar notificações MP:', error)
    }
  }

  const handleSubscribeClick = () => {
    if (status === 'eligible') {
      setShowOnboarding(true)
    }
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    // Redirecionar para checkout do Mercado Pago
    window.location.href = '/checkout/club'
  }

  if (loading) {
    return (
      <Button disabled className="gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Verificando...
      </Button>
    )
  }

  // Status: Assinante
  if (status === 'subscriber') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
        <CheckCircle2 className="w-5 h-5 text-green-500" />
        <span className="text-sm font-medium text-green-500">Assinante</span>
      </div>
    )
  }

  // Status: Elegível
  if (status === 'eligible') {
    return (
      <>
        <Button
          onClick={handleSubscribeClick}
          className="gap-2 bg-[#E38817] hover:bg-[#B86A10]"
        >
          <Crown className="w-4 h-4" />
          Assinar Clube
        </Button>

        {notificationData?.found && (
          <div className="mt-2 p-2 text-xs bg-blue-500/10 border border-blue-500/30 rounded text-blue-400">
            <CheckCircle2 className="w-3 h-3 inline mr-1" />
            {notificationData.updates.join(' • ')}
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

  // Status: Sem Clube (faltam dados)
  return (
    <div className="space-y-2">
      <Button
        onClick={() => setShowOnboarding(true)}
        variant="outline"
        className="w-full gap-2"
      >
        <Crown className="w-4 h-4" />
        Sem Clube
      </Button>

      {eligibilityData?.missing && eligibilityData.missing.length > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-400">
              <p className="font-medium mb-1">Complete seu cadastro para assinar:</p>
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
    </div>
  )
}
