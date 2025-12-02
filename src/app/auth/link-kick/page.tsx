'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

export default function LinkKickPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao vincular conta')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard?success=kick_linked')
      }, 1500)

    } catch (err) {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center text-2xl font-bold text-black mb-4">
            K
          </div>
          <CardTitle className="text-2xl text-foreground">Vincular Kick</CardTitle>
          <CardDescription>
            Informe seu nome de usuário da Kick para vincular sua conta
          </CardDescription>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <p className="text-lg font-medium text-foreground">Conta vinculada com sucesso!</p>
              <p className="text-sm text-muted-foreground">Redirecionando...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Nome de usuário da Kick</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">kick.com/</span>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="seu_username"
                    className="flex-1 bg-muted"
                    disabled={loading}
                    autoComplete="off"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Digite exatamente como aparece na URL do seu canal
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !username.trim()}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-black font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Vincular Conta'
                  )}
                </Button>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  <strong>Nota:</strong> A Kick não possui OAuth público para desenvolvedores.
                  A vinculação é feita verificando a existência do seu canal.
                  Você poderá ler o chat, mas o envio de mensagens pode ser limitado.
                </p>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

