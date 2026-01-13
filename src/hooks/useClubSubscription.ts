import { useState, useEffect, useCallback } from 'react'

export type ClubStatus = 'no_club' | 'eligible' | 'subscriber' | 'loading' | 'error'

export interface ClubSubscriptionData {
  status: ClubStatus
  eligible: boolean
  missing: string[]
  isSubscriber: boolean
  discordConnected: boolean
  birthDateSet: boolean
  notificationData?: {
    found: boolean
    count: number
    updates: string[]
  }
  error?: string
}

/**
 * Hook para gerenciar estado de assinatura do Clube
 * Verifica elegibilidade, notificações do Mercado Pago e status de assinatura
 */
export function useClubSubscription() {
  const [data, setData] = useState<ClubSubscriptionData>({
    status: 'loading',
    eligible: false,
    missing: [],
    isSubscriber: false,
    discordConnected: false,
    birthDateSet: false
  })

  const checkEligibility = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, status: 'loading' }))

      const res = await fetch('/api/subscription/check-eligibility')
      const eligibilityData = await res.json()

      if (!res.ok) {
        throw new Error(eligibilityData.message || 'Erro ao verificar elegibilidade')
      }

      const isSubscriber = eligibilityData.user.subscription_status === 'active'
      const discordConnected = eligibilityData.user.discord_connected
      const birthDateSet = !!eligibilityData.user.birth_date

      // Verificar notificações do Mercado Pago
      let notificationData = undefined
      if (!isSubscriber) {
        try {
          const syncRes = await fetch('/api/subscription/sync', { method: 'POST' })
          const syncData = await syncRes.json()

          if (syncData.success || syncData.recovered_via_search) {
            notificationData = {
              found: true,
              count: 1,
              updates: [
                `Status: ${syncData.mp_status}`,
                syncData.recovered_via_search ? 'Assinatura recuperada' : 'Verificada'
              ]
            }

            // Se encontrou ativa, atualizar status
            if (syncData.mp_status === 'authorized') {
              setData(prev => ({
                ...prev,
                status: 'subscriber',
                isSubscriber: true,
                eligible: false,
                notificationData
              }))
              return
            }
          }
        } catch (error) {
          console.error('[useClubSubscription] Erro ao verificar MP:', error)
        }
      }

      setData({
        status: isSubscriber ? 'subscriber' : eligibilityData.eligible ? 'eligible' : 'no_club',
        eligible: eligibilityData.eligible,
        missing: eligibilityData.missing || [],
        isSubscriber,
        discordConnected,
        birthDateSet,
        notificationData
      })

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido'
      setData(prev => ({
        ...prev,
        status: 'error',
        error: message
      }))
    }
  }, [])

  useEffect(() => {
    checkEligibility()
  }, [checkEligibility])

  return { ...data, refetch: checkEligibility }
}
