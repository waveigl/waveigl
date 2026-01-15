'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Copy, CheckCircle2, AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react'

/**
 * Página de setup da senha do painel admin
 * Acesso: /admin/setup
 * 
 * Permite:
 * 1. Obter User ID automaticamente
 * 2. Gerar hash bcrypt da senha
 * 3. Copiar comando SQL pronto
 */
export default function AdminSetupPage() {
  const [step, setStep] = useState<'welcome' | 'user-id' | 'password' | 'sql'>('welcome')
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([])
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordHash, setPasswordHash] = useState('')
  const [sqlCommand, setSqlCommand] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  // Obter User ID
  const handleGetUserId = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/my-user-id')
      const data = await response.json()

      if (data.success) {
        setUserId(data.userId)
        setEmail(data.email)
        setLinkedAccounts(data.linkedAccounts || [])
        setStep('password')
      } else {
        setError(data.message || 'Erro ao obter User ID')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao conectar'
      
      // Verificar se é erro de tabela não existente
      if (errorMsg.includes('admin_security_config') || errorMsg.includes('does not exist')) {
        setError('⚠️ As tabelas ainda não foram criadas no banco de dados. Siga as instruções em docs/SETUP_MIGRATION.md para criar as tabelas.')
      } else {
        setError(errorMsg)
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Validar força da senha
  const validatePassword = (pwd: string) => {
    const errors: string[] = []

    if (!pwd) {
      errors.push('Senha é obrigatória')
      return errors
    }

    if (pwd.length < 8) {
      errors.push('Mínimo 8 caracteres')
    }

    if (!/[A-Z]/.test(pwd)) {
      errors.push('Maiúscula (A-Z)')
    }

    if (!/[a-z]/.test(pwd)) {
      errors.push('Minúscula (a-z)')
    }

    if (!/[0-9]/.test(pwd)) {
      errors.push('Número (0-9)')
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      errors.push('Caractere especial (!@#$%^&*)')
    }

    return errors
  }

  // Gerar hash
  const handleGenerateHash = async () => {
    const errors = validatePassword(password)
    setPasswordErrors(errors)

    if (errors.length > 0) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Usar a API do servidor para gerar o hash
      const response = await fetch('/api/admin/generate-password-hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (data.success) {
        setPasswordHash(data.hash)
        const sql = `INSERT INTO admin_security_config (
  admin_user_id,
  password_hash,
  password_salt
) VALUES (
  '${userId}',
  '${data.hash}',
  'salt'
);`
        setSqlCommand(sql)
        setStep('sql')
      } else {
        setError(data.message || 'Erro ao gerar hash')
      }
    } catch (err) {
      setError('Erro ao gerar hash')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Copiar para clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sqlCommand)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      setError('Erro ao copiar')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🔐 Setup do Painel Admin</h1>
          <p className="text-slate-400">Configure a senha de proteção do seu painel</p>
        </div>

        {/* Step 1: Welcome */}
        {step === 'welcome' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Bem-vindo!</CardTitle>
              <CardDescription>
                Este assistente irá ajudá-lo a configurar a senha do painel admin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Obter User ID</h3>
                    <p className="text-sm text-slate-400">Seu identificador único será obtido automaticamente</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Definir Senha</h3>
                    <p className="text-sm text-slate-400">Escolha uma senha forte com requisitos específicos</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Executar SQL</h3>
                    <p className="text-sm text-slate-400">Cole o comando no Supabase para finalizar</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGetUserId}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Obtendo User ID...
                  </>
                ) : (
                  'Começar'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: User ID */}
        {step === 'user-id' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">✅ User ID Obtido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-900 p-4 rounded-lg space-y-3">
                <div>
                  <label className="text-sm text-slate-400">User ID</label>
                  <div className="mt-1 p-3 bg-slate-800 rounded text-white font-mono text-sm break-all">
                    {userId}
                  </div>
                </div>

                {email && (
                  <div>
                    <label className="text-sm text-slate-400">Email</label>
                    <div className="mt-1 p-3 bg-slate-800 rounded text-white text-sm">
                      {email}
                    </div>
                  </div>
                )}

                {linkedAccounts.length > 0 && (
                  <div>
                    <label className="text-sm text-slate-400">Contas Vinculadas</label>
                    <div className="mt-1 space-y-2">
                      {linkedAccounts.map((acc, idx) => (
                        <div key={idx} className="p-2 bg-slate-800 rounded text-white text-sm">
                          {acc.platform}: {acc.username}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Alert className="bg-blue-500/10 border-blue-500/50">
                <AlertTriangle className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-400">Próximo Passo</AlertTitle>
                <AlertDescription className="text-blue-200/80">
                  Clique em "Próximo" para definir sua senha
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => setStep('password')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Próximo: Definir Senha
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Password */}
        {step === 'password' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Defina sua Senha</CardTitle>
              <CardDescription>
                A senha deve conter todos os requisitos abaixo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setPasswordErrors(validatePassword(e.target.value))
                  }}
                  className="pr-10 bg-slate-900 border-slate-700 text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Requisitos */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-300">Requisitos:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Mínimo 8 caracteres', check: password.length >= 8 },
                    { label: 'Maiúscula (A-Z)', check: /[A-Z]/.test(password) },
                    { label: 'Minúscula (a-z)', check: /[a-z]/.test(password) },
                    { label: 'Número (0-9)', check: /[0-9]/.test(password) },
                    { label: 'Caractere especial', check: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) }
                  ].map((req, idx) => (
                    <div key={idx} className={`flex items-center gap-2 text-sm ${req.check ? 'text-green-400' : 'text-slate-400'}`}>
                      <div className={`w-4 h-4 rounded-full border-2 ${req.check ? 'bg-green-500 border-green-500' : 'border-slate-600'}`} />
                      {req.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('welcome')}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleGenerateHash}
                  disabled={loading || passwordErrors.length > 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    'Gerar Hash'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: SQL */}
        {step === 'sql' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Comando SQL Pronto
              </CardTitle>
              <CardDescription>
                Cole este comando no Supabase SQL Editor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-green-500/10 border-green-500/50">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-400">Pronto para usar!</AlertTitle>
                <AlertDescription className="text-green-200/80">
                  Copie o comando abaixo e execute no Supabase
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Comando SQL:</label>
                <div className="relative">
                  <pre className="bg-slate-900 p-4 rounded text-slate-300 text-sm overflow-x-auto border border-slate-700">
                    <code>{sqlCommand}</code>
                  </pre>
                  <Button
                    size="sm"
                    onClick={handleCopy}
                    className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold text-white">Próximos passos:</h4>
                <ol className="space-y-2 text-sm text-slate-300">
                  <li>1. Acesse: <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">supabase.com/dashboard</a></li>
                  <li>2. Vá para: SQL Editor</li>
                  <li>3. Cole o comando acima</li>
                  <li>4. Clique em "Run"</li>
                  <li>5. Pronto! Sua senha está configurada</li>
                </ol>
              </div>

              <Button
                onClick={() => {
                  setStep('welcome')
                  setPassword('')
                  setPasswordHash('')
                  setSqlCommand('')
                  setPasswordErrors([])
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Fazer Outro Setup
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
