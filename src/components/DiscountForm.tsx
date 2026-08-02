/**
 * Formulário para criar/editar discounts (links, coupons, direct-user)
 */

'use client'

import { FC, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, Copy } from 'lucide-react'

interface DiscountFormProps {
  type: 'link' | 'coupon' | 'direct_user'
  discount?: any
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}

const DiscountForm: FC<DiscountFormProps> = ({ type, discount, onSubmit, onCancel }) => {
  const [discountPrice, setDiscountPrice] = useState(discount?.discountPrice || 5.0)
  const [maxRedemptions, setMaxRedemptions] = useState(discount?.maxRedemptions || 100)
  const [expirationDate, setExpirationDate] = useState(discount?.expirationDate || '')
  const [description, setDescription] = useState(discount?.description || '')
  const [code, setCode] = useState(discount?.code || '')
  const [userId, setUserId] = useState(discount?.userId || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        discountPrice: Number(discountPrice),
        maxRedemptions: Number(maxRedemptions),
        expirationDate,
        description,
        code: type === 'coupon' ? code : undefined,
        userId: type === 'direct_user' ? userId : undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTypeName = () => {
    switch (type) {
      case 'link': return 'Link de Desconto'
      case 'coupon': return 'Código de Cupom'
      case 'direct_user': return 'Desconto Direto ao Usuário'
      default: return 'Desconto'
    }
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle>{discount ? 'Editar' : 'Criar'} {getTypeName()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="discountPrice">Valor do Desconto (R$)</Label>
            <Input
              id="discountPrice"
              type="number"
              min="0"
              max="9.9"
              step="0.1"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(Number(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxRedemptions">Número Máximo de Utilizações</Label>
            <Input
              id="maxRedemptions"
              type="number"
              min="1"
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(Number(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expirationDate">Data de Expiração</Label>
            <div className="relative">
              <Input
                id="expirationDate"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                required
                className="pl-10"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {type === 'link' && (
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva a oferta..."
                rows={3}
              />
            </div>
          )}

          {type === 'coupon' && (
            <div className="space-y-2">
              <Label htmlFor="code">Código do Cupom</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="EX: SAVE20"
                  maxLength={20}
                  required
                />
                {code && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => navigator.clipboard.writeText(code)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {type === 'direct_user' && (
            <div className="space-y-2">
              <Label htmlFor="userId">ID do Usuário</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Digite o ID do usuário..."
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : (discount ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default DiscountForm