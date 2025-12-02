'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, UserPlus, AlertTriangle, CheckCircle2, Loader2, Twitch, Youtube, RefreshCw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'

interface ModerationPanelProps {
  isAdmin: boolean
}

interface GrantStatus {
  canGrantModerator: boolean
  broadcasterLinked: boolean
  message: string
}

export function ModerationPanel({ isAdmin }: ModerationPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [grantStatus, setGrantStatus] = useState<GrantStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [targetUsername, setTargetUsername] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<'twitch' | 'all'>('twitch')
  const [grantResult, setGrantResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isGranting, setIsGranting] = useState(false)

  // Verificar status de capacidade de conceder moderação
  const checkGrantStatus = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/moderation/grant')
      const data = await res.json()
      setGrantStatus(data)
    } catch (e) {
      console.error('Erro ao verificar status de grant:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      checkGrantStatus()
    }
  }, [isOpen])

  // Conceder moderação
  const handleGrantModerator = async () => {
    if (!targetUsername.trim()) return
    
    setIsGranting(true)
    setGrantResult(null)
    
    try {
      // Primeiro, buscar o usuário pelo username
      const searchRes = await fetch(`/api/users/search?username=${encodeURIComponent(targetUsername)}`)
      const searchData = await searchRes.json()
      
      if (!searchData.user) {
        setGrantResult({ 
          success: false, 
          message: `Usuário "${targetUsername}" não encontrado no sistema. O usuário precisa ter uma conta vinculada.` 
        })
        return
      }
      
      // Conceder moderação
      const grantRes = await fetch('/api/moderation/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: searchData.user.id,
          platform: selectedPlatform
        })
      })
      
      const grantData = await grantRes.json()
      
      if (grantRes.ok && grantData.success) {
        setGrantResult({ 
          success: true, 
          message: grantData.message || 'Moderação concedida com sucesso!' 
        })
        setTargetUsername('')
      } else {
        setGrantResult({ 
          success: false, 
          message: grantData.error || grantData.message || 'Erro ao conceder moderação' 
        })
      }
    } catch (e) {
      console.error('Erro ao conceder moderação:', e)
      setGrantResult({ 
        success: false, 
        message: 'Erro de conexão. Tente novamente.' 
      })
    } finally {
      setIsGranting(false)
    }
  }

  if (!isAdmin) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Shield className="w-4 h-4" />
          Gerenciar Moderadores
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Gerenciamento de Moderadores
          </DialogTitle>
          <DialogDescription>
            Conceda ou remova moderação para usuários nas plataformas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status do sistema */}
          <Card className="bg-muted/50 border-border">
            <CardContent className="pt-4">
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando capacidade do sistema...
                </div>
              ) : grantStatus ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {grantStatus.canGrantModerator ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="text-sm">{grantStatus.message}</span>
                  </div>
                  
                  {!grantStatus.canGrantModerator && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {!grantStatus.broadcasterLinked ? (
                        <p>O streamer precisa vincular sua conta Twitch nas configurações.</p>
                      ) : (
                        <p>O streamer precisa reautorizar com as novas permissões.</p>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={checkGrantStatus}
                    className="mt-2"
                  >
                    <RefreshCw className="w-3 h-3 mr-2" />
                    Verificar novamente
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Erro ao verificar status</p>
              )}
            </CardContent>
          </Card>

          {/* Formulário para conceder moderação */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Adicionar Moderador</h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Username do usuário
                </label>
                <Input
                  placeholder="Ex: usuario123"
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  O usuário precisa ter uma conta vinculada no sistema.
                </p>
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Plataforma
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={selectedPlatform === 'twitch' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPlatform('twitch')}
                    className="gap-2"
                  >
                    <Twitch className="w-4 h-4" />
                    Twitch
                  </Button>
                  <Button
                    variant={selectedPlatform === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPlatform('all')}
                    disabled
                    className="gap-2"
                  >
                    Todas
                    <Badge variant="outline" className="text-[10px]">Em breve</Badge>
                  </Button>
                </div>
              </div>
            </div>

            {/* Resultado da operação */}
            {grantResult && (
              <div className={`p-3 rounded-lg ${grantResult.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                <div className="flex items-start gap-2">
                  {grantResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                  )}
                  <p className={`text-sm ${grantResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {grantResult.message}
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={handleGrantModerator}
              disabled={!targetUsername.trim() || isGranting || !grantStatus?.canGrantModerator}
              className="w-full gap-2"
            >
              {isGranting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Concedendo...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Conceder Moderação
                </>
              )}
            </Button>
          </div>

          {/* Informações sobre plataformas */}
          <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-4">
            <p><strong>Twitch:</strong> Adiciona moderador via API (requer scope do broadcaster)</p>
            <p><strong>YouTube:</strong> Funciona apenas durante transmissões ao vivo</p>
            <p><strong>Kick:</strong> Não suporta adicionar moderadores via API</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

