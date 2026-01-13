'use client'

import { useState } from 'react'
import { Crown, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useClubSubscription } from '@/hooks/useClubSubscription'
import ClubOnboardingPopup from './ClubOnboardingPopup'

interface ClubSubscriptionStatusProps {
  onStatusChange?: (status: 'no_club' | 'eligible' | 'subscriber') => void
}

export default function ClubSubscriptionStatus({ onStatusChange }: ClubSubscriptionStatusProps) {
  const { status, eligible, missing, isSubscriber, discordConnected, birthDateSet, notificationData, error, refetch } = useClubSubscription()
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Notificar mudança de status
  if (status === 'subscriber' && onStatusChange) {
    onStatusChange('subscriber')
  } else if (status === 'eligible' && onStatusChange) {
    onStatusChange('eligible')
  } else if (status === 'no_club' && onStatusChange) {
    onStatusChange('no_club')
  }

  const handleSubscribeClick = () => {
    if (status === 'eligible') {
      setShowOnboarding(true)
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

  // Error
  if (status === 'error') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <span className="text-sm text-red-400">{error}</span>
      </div>
    )
  }

  // Subscriber
  if (status === 'subscriber') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
        <CheckCircle2 className="w-5 h-5 text-green-500" />
        <span className="text-sm font-medium text-green-500">Assinante</span>
      </div>
    )
  }

  // Eligible
  if (status === 'eligible') {
    return (
      <>
        <div className="space-y-3">
          <Button
            onClick={handleSubscribeClick}
            className="w-full gap-2 bg-[#E38817] hover:bg-[#B86A10] text-white"
          >
            <Crown className="w-4 h-4" />
            Você está elegível para assinar o Clube
          </Button>

          {notificationData?.found && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex gap-2">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-400">
                <p className="font-medium mb-1">Atualização do Mercado Pago:</p>
                {notificationData.updates.map((update, i) => (
                  <p key={i}>• {update}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        <ClubOnboardingPopup
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          userData={{
            id: '',
            full_name: null,
            phone_number: null,
            birth_date: null,
            discord_connected: discordConnected,
            discord_username: null
          }}
          onComplete={handleOnboardingComplete}
        />
      </>
    )
  }

  // No Club (missing data)
  return (
    <div className="space-y-3">
      <Button
        onClick={() => setShowOnboarding(true)}
        variant="outline"
        className="w-full gap-2"
      >
        <Crown className="w-4 h-4" />
        Sem Clube
      </Button>

      {missing.length > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-400">
              <p className="font-medium mb-2">Complete seu cadastro para assinar:</p>
              <ul className="text-xs space-y-1">
                {missing.includes('discord') && (
                  <li className="flex items-center gap-2">
                    <span className="text-amber-600">○</span>
                    Vincule seu Discord
                  </li>
                )}
                {missing.includes('full_name') && (
                  <li className="flex items-center gap-2">
                    <span className="text-amber-600">○</span>
                    Adicione seu nome completo
                  </li>
                )}
                {missing.includes('phone_number') && (
                  <li className="flex items-center gap-2">
                    <span className="text-amber-600">○</span>
                    Adicione seu número de WhatsApp
                  </li>
                )}
                {missing.includes('birth_date') && (
                  <li className="flex items-center gap-2">
                    <span className="text-amber-600">○</span>
                    Adicione sua data de nascimento
                  </li>
                )}
                {missing.includes('underage') && (
                  <li className="flex items-center gap-2">
                    <span className="text-amber-600">○</span>
                    Você precisa ter 18 anos ou mais
                  </li>
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
          id: '',
          full_name: null,
          phone_number: null,
          birth_date: null,
          discord_connected: discordConnected,
          discord_username: null
        }}
        onComplete={handleOnboardingComplete}
      />
    </div>
  )
}
