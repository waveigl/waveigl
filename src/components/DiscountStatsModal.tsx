/**
 * Modal para exibir estatísticas de um discount
 */

'use client'

import { FC, useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, DollarSign, BarChart3 } from 'lucide-react'

interface DiscountStatsModalProps {
  discount: any
  discountType: 'link' | 'coupon' | 'direct_user'
  onClose: () => void
}

const DiscountStatsModal: FC<DiscountStatsModalProps> = ({ discount, discountType, onClose }) => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/discounts/stats/${discountType}/${discount.id}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('[DiscountStatsModal] Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400'
      case 'exhausted': return 'bg-yellow-500/20 text-yellow-400'
      case 'expired': return 'bg-red-500/20 text-red-400'
      case 'inactive': return 'bg-gray-500/20 text-gray-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const redemptionRate = discount.maxRedemptions > 0
    ? ((discount.currentRedemptions / discount.maxRedemptions) * 100).toFixed(1)
    : '0'

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle>
            Estatísticas - {discountType === 'link' ? 'Link' : discountType === 'coupon' ? 'Cupom' : 'Desconto'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                Valor do Desconto
              </div>
              <div className="text-2xl font-bold">R$ {discount.discountPrice.toFixed(2)}</div>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                Utilizações
              </div>
              <div className="text-2xl font-bold">
                {discount.currentRedemptions}/{discount.maxRedemptions}
              </div>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <BarChart3 className="w-4 h-4" />
                Taxa de Uso
              </div>
              <div className="text-2xl font-bold">{redemptionRate}%</div>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                Expira em
              </div>
              <div className="text-sm font-medium">
                {new Date(discount.expirationDate).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge className={getStatusColor(discount.status)}>
              {discount.status}
            </Badge>
          </div>

          {discountType === 'link' && discount.token && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Token do Link</div>
              <code className="text-xs break-all font-mono">
                {discount.token}
              </code>
            </div>
          )}

          {discountType === 'coupon' && discount.code && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Código do Cupom</div>
              <code className="text-xs font-mono font-bold">
                {discount.code}
              </code>
            </div>
          )}

          {loading && stats === null && (
            <div className="text-center py-4 text-muted-foreground">
              Carregando estatísticas detalhadas...
            </div>
          )}

          {stats && (
            <div className="space-y-2 pt-2 border-t">
              <h4 className="text-sm font-semibold">Resumo</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Criado em: {new Date(discount.createdAt).toLocaleDateString('pt-BR')}</p>
                <p>Criado por: {discount.createdBy}</p>
                {discountType === 'direct_user' && (
                  <p>ID do Usuário: {discount.userId}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DiscountStatsModal