'use client'

import { FC, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, Lock, Eye, EyeOff } from 'lucide-react'

interface AdminPasswordModalProps {
  isOpen: boolean
  onSuccess: () => void
  onCancel: () => void
}

/**
 * Modal de proteção por senha para o painel admin
 * Requer senha antes de acessar o painel
 */
export const AdminPasswordModal: FC<AdminPasswordModalProps> = ({
  isOpen,
  onSuccess,
  onCancel
}) => {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [remainingTime, setRemainingTime] = useState(0)

  if (!isOpen) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (data.success) {
        setPassword('')
        onSuccess()
      } else {
        if (data.isLocked) {
          setIsLocked(true)
          setRemainingTime(data.remainingTime)
          setError(data.message)
        } else {
          setError(data.message)
        }
      }
    } catch (err) {
      console.error('[AdminPasswordModal] Erro:', err)
      setError('Erro ao verificar senha. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setPassword('')
    setError(null)
    setIsLocked(false)
    onCancel()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-96 p-6 border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Lock className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Painel Admin Protegido
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Digite sua senha para continuar
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4 border-red-500/50 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertTitle className="text-red-400">Erro de Autenticação</AlertTitle>
            <AlertDescription className="text-red-200/80">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isLocked}
              className="pr-10"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading || isLocked}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading || isLocked}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isLocked || !password}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </>
              ) : (
                'Acessar'
              )}
            </Button>
          </div>
        </form>

        {/* Security Info */}
        <div className="mt-6 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            🔒 <strong>Segurança:</strong> Sua senha é protegida com Argon2 e nunca é armazenada em texto plano.
            Máximo de 5 tentativas antes de bloqueio de 15 minutos.
          </p>
        </div>
      </div>
    </div>
  )
}
