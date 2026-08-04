'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Loader2, Gift, Sparkles } from 'lucide-react'

type DiscountInfo = {
  discountAmount: number
  finalPrice: number
  discount: {
    id: string
    token: string
    discountPrice: number
    maxRedemptions: number
    currentRedemptions: number
    expirationDate: string
  }
}

export default function RedeemLinkPage() {
  const params = useParams()
  const token = typeof params.token === 'string' ? params.token : ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<DiscountInfo | null>(null)
  const [redeeming, setRedeeming] = useState(false)
  const [redeemed, setRedeemed] = useState(false)

  useEffect(() => {
    validate()
  }, [token])

  const validate = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountType: 'link', token }),
      })
      const data = await response.json()
      if (data.success && data.data?.isValid) {
        setInfo(data.data)
      } else {
        setError(data.data?.error || 'Link de desconto inválido')
      }
    } catch (e) {
      setError('Não foi possível validar o link. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleRedeem = async () => {
    if (!token || !info) return
    setRedeeming(true)
    try {
      const response = await fetch('/api/discounts/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await response.json()
      if (data.success) {
        setRedeemed(true)
      } else {
        setError(data.error || 'Não foi possível resgatar o desconto.')
      }
    } catch (e) {
      setError('Não foi possível resgatar o desconto. Tente novamente.')
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-card border-border shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            {loading ? (
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
            ) : error && !info ? (
              <XCircle className="h-7 w-7 text-red-500" />
            ) : (
              <Gift className="h-7 w-7 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl text-foreground">WaveIGL</CardTitle>
          <p className="text-muted-foreground text-sm">
            {loading
              ? 'Validando seu link de desconto...'
              : error && !info
                ? 'Link de desconto'
                : 'Seu desconto está aqui!'}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading && (
            <div className="text-center text-sm text-muted-foreground">
              Aguarde um instante...
            </div>
          )}

          {!loading && error && !info && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button asChild variant="outline">
                <Link href="/">Voltar ao site</Link>
              </Button>
            </div>
          )}

          {!loading && info && !redeemed && (
            <>
              <div className="text-center">
                <Badge className="bg-linear-to-r from-amber-500 to-yellow-400 text-black text-sm px-4 py-1">
                  Oferta de Lançamento: R$9,90/mês
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Desconto</p>
                  <p className="text-2xl font-bold text-green-500">
                    - R$ {info.discountAmount.toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Você paga</p>
                  <p className="text-2xl font-bold text-primary">
                    R$ {info.finalPrice.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-muted-foreground line-through">
                    R$ 9,90
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Utilize o link para assinar o WaveIGL com {info.discountAmount.toFixed(2).replace('.', ',')} de desconto.
                </p>
                <p className="mt-2 text-xs">
                  Validade: {new Date(info.discount.expirationDate).toLocaleDateString('pt-BR')} · Redenções restantes:{' '}
                  {Math.max(info.discount.maxRedemptions - info.discount.currentRedemptions, 0)}
                </p>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleRedeem}
                disabled={redeeming}
              >
                {redeeming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resgatando...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Resgatar Desconto
                  </>
                )}
              </Button>
            </>
          )}

          {!loading && info && redeemed && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <h2 className="text-xl font-bold text-foreground">Desconto resgatado!</h2>
              <p className="text-sm text-muted-foreground">
                Agora você paga{' '}
                <span className="font-bold text-primary">
                  R$ {info.finalPrice.toFixed(2).replace('.', ',')}
                </span>{' '}
                em vez de R$ 9,90 por mês.
              </p>
              <Button asChild className="w-full">
                <Link href="/auth/login">Assinar agora</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
