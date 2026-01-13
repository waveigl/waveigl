'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function ClubCheckoutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initPoint, setInitPoint] = useState<string | null>(null)

  useEffect(() => {
    const createSubscription = async () => {
      try {
        setLoading(true)
        setError(null)

        // Obter ID do usuário da sessão
        const profileRes = await fetch('/api/me/profile')
        if (!profileRes.ok) {
          throw new Error('Não autenticado')
        }

        const profileData = await profileRes.json()
        const userId = profileData.profile?.id

        if (!userId) {
          throw new Error('Usuário não encontrado')
        }

        // Criar assinatura no Mercado Pago
        const res = await fetch('/api/subscription/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })

        const data = await res.json()

        if (!res.ok) {
          // Tratamento de erros específicos
          if (data.reason === 'already_subscribed') {
            setError('Você já possui uma assinatura ativa do Clube WaveIGL')
            setTimeout(() => router.push('/dashboard'), 2000)
            return
          }
          if (data.reason === 'discord_required') {
            setError('Você precisa vincular seu Discord antes de assinar')
            setTimeout(() => router.push('/dashboard'), 2000)
            return
          }
          if (data.reason === 'personal_data_required') {
            setError('Complete seus dados pessoais antes de assinar')
            setTimeout(() => router.push('/dashboard'), 2000)
            return
          }
          if (data.reason === 'underage') {
            setError('Você precisa ter 18 anos ou mais para assinar')
            setTimeout(() => router.push('/dashboard'), 2000)
            return
          }
          throw new Error(data.error || 'Erro ao criar assinatura')
        }

        if (data.init_point) {
          setInitPoint(data.init_point)
          // Redirecionar para Mercado Pago
          window.location.href = data.init_point
        } else {
          throw new Error('Não foi possível gerar link de pagamento')
        }

      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido'
        setError(message)
        console.error('[Checkout] Erro:', err)
      } finally {
        setLoading(false)
      }
    }

    createSubscription()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-900 to-black">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#E38817] mx-auto mb-4" />
          <p className="text-white font-medium">Preparando seu checkout...</p>
          <p className="text-zinc-400 text-sm mt-2">Você será redirecionado para o Mercado Pago</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-900 to-black p-4">
        <div className="max-w-md w-full">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-white font-bold mb-2">Erro ao processar</h2>
            <p className="text-red-400 text-sm mb-6">{error}</p>
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-900 to-black">
      <div className="text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <p className="text-white font-medium">Redirecionando para pagamento...</p>
      </div>
    </div>
  )
}
