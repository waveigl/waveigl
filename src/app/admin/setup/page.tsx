'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CheckCircle2, AlertTriangle, Eye, EyeOff, Loader2, Shield, Lock } from 'lucide-react'

/**
 * Página de setup da senha do painel admin
 * Acesso: /admin/setup
 * 
 * Permite Gabriel Toth criar/atualizar a senha do painel admin
 * diretamente pelo site, sem precisar de comandos ou SQL manual
 */
export default function AdminSetupPage() {
  const [step, setStep] = useState<'checking' | 'not-admin' | 'password' | 'success'>('checking')
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordConfigured, setPasswordConfigured] = useState(false)

  // Verificar se é admin ao carregar
  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/admin/verify')
      const data = await response.json()

      if (!data.authenticated) {
        setStep('not-admin')
        setError('Você precisa estar logado para acessar esta página')
        return
      }

      if (!data.isAdmin) {
        setStep('not-admin')
        setError('Apenas Gabriel Toth pode configurar a senha do painel admin')
        return
      }

      // É admin, buscar dados
      const userResponse = await fetch('/api/admin/my-user-id')
      const userData = await userResponse.json()

      if (userData.success) {
        setUserId(userData.userId)
        setEmail(userData.email)
        setLinkedAccounts(userData.linkedAccounts || [])
      }

      // Verificar se já tem senha configurada
      const configResponse = await fetch('/api/admin/password-configured')
      const configData = await configResponse.json()
      setPasswordConfigured(configData.configured)

      setStep('password')
    } catch (err) {
      console.error('Erro ao verificar acesso:', err)
      setStep('not-admin')
      setError('Erro ao verificar permissões')
    }
  }

  // Validar força da senha
  const getPasswordRequirements = () => {
    return [
      { label: 'Mínimo 8 caracteres', check: password.length >= 8 },
      { label: 'Letra maiúscula (A-Z)', check: /[A-Z]/.test(password) },
      { label: 'Letra minúscula (a-z)', check: /[a-z]/.test(password) },
      { label: 'Número (0-9)', check: /[0-9]/.test(password) },
      { label: 'Caractere especial (!@#$%^&*)', check: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
      { label: 'Senhas coincidem', check: password === confirmPassword && password.length > 0 }
    ]
  }

  const isPasswordValid = () => {
    return getPasswordRequirements().every(req => req.check)
  }

  // Salvar senha
  const handleSavePassword = async () => {
    if (!isPasswordValid()) {
      setError('Preencha todos os requisitos da senha')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (data.success) {
        setStep('success')
      } else {
        setError(data.message || 'Erro ao salvar senha')
        
        if (data.needsMigration) {
          setError('As tabelas do banco de dados ainda não foram criadas. Execute a migração primeiro.')
        }
      }
    } catch (err) {
      console.error('Erro ao salvar senha:', err)
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-4">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Configurar Senha Admin</h1>
          <p className="text-slate-400">Proteja o painel de administração</p>
        </div>

        {/* Checking */}
        {step === 'checking' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
              <p className="text-slate-300">Verificando permissões...</p>
            </CardContent>
          </Card>
        )}

        {/* Not Admin */}
        {step === 'not-admin' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="py-8">
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle className="text-red-400">Acesso Negado</AlertTitle>
                <AlertDescription className="text-red-200/80">
                  {error || 'Você não tem permissão para acessar esta página'}
                </AlertDescription>
              </Alert>
              
              <div className="mt-6 text-center">
                <Button
                  onClick={() => window.location.href = '/dashboard'}
                  variant="outline"
                  className="border-slate-600"
                >
                  Voltar ao Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Password Form */}
        {step === 'password' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lock className="w-5 h-5" />
                {passwordConfigured ? 'Alterar Senha' : 'Criar Senha'}
              </CardTitle>
              <CardDescription>
                {passwordConfigured 
                  ? 'Você já tem uma senha configurada. Digite uma nova para alterá-la.'
                  : 'Defina uma senha forte para proteger o painel admin'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Info do usuário */}
              <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400">Logado como:</span>
                  <span className="text-white font-medium">{email}</span>
                </div>
                {linkedAccounts.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {linkedAccounts.map((acc, idx) => (
                      <span key={idx} className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
                        {acc.platform}: {acc.username}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Campo de senha */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 block mb-2">Nova Senha</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 bg-slate-900 border-slate-700 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-300 block mb-2">Confirmar Senha</label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirme sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Requisitos */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-300">Requisitos:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {getPasswordRequirements().map((req, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-2 text-sm ${req.check ? 'text-green-400' : 'text-slate-500'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        req.check ? 'bg-green-500 border-green-500' : 'border-slate-600'
                      }`}>
                        {req.check && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      {req.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão salvar */}
              <Button
                onClick={handleSavePassword}
                disabled={loading || !isPasswordValid()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    {passwordConfigured ? 'Atualizar Senha' : 'Criar Senha'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Success */}
        {step === 'success' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="py-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Senha Configurada!</h2>
              <p className="text-slate-400 mb-6">
                Sua senha foi salva com sucesso. Agora você precisará digitá-la para acessar o painel admin.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Ir para o Dashboard
                </Button>
                
                <Button
                  onClick={() => {
                    setStep('password')
                    setPassword('')
                    setConfirmPassword('')
                  }}
                  variant="outline"
                  className="w-full border-slate-600"
                >
                  Alterar Senha Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
