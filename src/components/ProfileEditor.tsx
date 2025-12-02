'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPen, Phone, AlertCircle } from 'lucide-react'

// Função para formatar telefone para exibição
function formatPhoneDisplay(phone: string | null): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  // Formato: +55 (11) 99999-9999
  if (digits.length === 13 && digits.startsWith('55')) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
  }
  if (digits.length === 12 && digits.startsWith('55')) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`
  }
  return phone
}

// Calcula dias restantes para poder editar
function getDaysUntilEdit(lastEditAt: string | null): number {
  if (!lastEditAt) return 0
  const lastEdit = new Date(lastEditAt)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - lastEdit.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, 30 - diffDays)
}

export function ProfileEditor({ user, onUpdate }: { user: any, onUpdate: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [birthDate, setBirthDate] = useState(user?.birth_date || '')
  const [phoneNumber, setPhoneNumber] = useState(formatPhoneDisplay(user?.phone_number) || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Atualiza estados quando user muda
  useEffect(() => {
    setFullName(user?.full_name || '')
    setBirthDate(user?.birth_date || '')
    setPhoneNumber(formatPhoneDisplay(user?.phone_number) || '')
  }, [user])

  const daysUntilNameEdit = getDaysUntilEdit(user?.last_profile_edit_at)
  const daysUntilPhoneEdit = getDaysUntilEdit(user?.last_phone_edit_at)
  const canEditName = daysUntilNameEdit === 0
  const canEditPhone = daysUntilPhoneEdit === 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload: any = {}
      
      // Só envia campos que mudaram
      if (fullName !== (user?.full_name || '') && canEditName) {
        payload.full_name = fullName || undefined
      }
      if (birthDate !== (user?.birth_date || '')) {
        payload.birth_date = birthDate || undefined
      }
      if (phoneNumber !== formatPhoneDisplay(user?.phone_number) && canEditPhone) {
        payload.phone_number = phoneNumber || undefined
      }

      if (Object.keys(payload).length === 0) {
        setIsOpen(false)
        return
      }

      const res = await fetch('/api/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao atualizar')
      } else {
        setIsOpen(false)
        onUpdate()
      }
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted">
          <UserPen className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Mantenha seus dados atualizados.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {error && (
            <div className="p-2 text-sm text-red-500 bg-red-500/10 rounded border border-red-500/20 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="full_name">Nome Completo</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome real"
              className="bg-muted"
              disabled={!canEditName}
            />
            <p className="text-[10px] text-muted-foreground">
              {canEditName 
                ? 'Pode ser alterado a cada 30 dias.'
                : `Aguarde ${daysUntilNameEdit} dias para editar.`
              }
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="birth_date">Data de Nascimento</Label>
            <Input
              id="birth_date"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="bg-muted"
              disabled={(user?.birth_date_edits || 0) >= 2}
            />
             <p className="text-[10px] text-muted-foreground">
              Apenas {Math.max(0, 2 - (user?.birth_date_edits || 0))} edições restantes.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone_number" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Número de WhatsApp
            </Label>
            <Input
              id="phone_number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(11) 99999-9999"
              className="bg-muted"
              disabled={!canEditPhone}
            />
            <p className="text-[10px] text-muted-foreground">
              {canEditPhone 
                ? 'Vincule seu número para ser convidado ao grupo do WhatsApp. Pode ser alterado a cada 30 dias.'
                : `Aguarde ${daysUntilPhoneEdit} dias para editar.`
              }
            </p>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
