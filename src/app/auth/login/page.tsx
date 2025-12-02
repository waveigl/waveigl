'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Github, Youtube, Twitch } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleOAuthLogin = async (platform: string) => {
    setIsLoading(platform)
    try {
      // Redirect para OAuth da plataforma
      window.location.href = `/api/auth/${platform}`
    } catch (error) {
      console.error('Erro no login:', error)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-amber-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/90 border border-border/60">
        <CardHeader className="text-center">
          <CardTitle className="text-white text-2xl">Acesse sua conta</CardTitle>
          <CardDescription className="text-muted-foreground">
            Conecte-se com uma das suas contas para acessar o clube exclusivo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => handleOAuthLogin('twitch')}
            disabled={isLoading === 'twitch'}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Twitch className="w-5 h-5 mr-2" />
            {isLoading === 'twitch' ? 'Conectando...' : 'Entrar com Twitch'}
          </Button>

          <Button
            onClick={() => handleOAuthLogin('youtube')}
            disabled={isLoading === 'youtube'}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            <Youtube className="w-5 h-5 mr-2" />
            {isLoading === 'youtube' ? 'Conectando...' : 'Entrar com YouTube'}
          </Button>

          <Button
            onClick={() => handleOAuthLogin('kick')}
            disabled={isLoading === 'kick'}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <Github className="w-5 h-5 mr-2" />
            {isLoading === 'kick' ? 'Conectando...' : 'Entrar com Kick'}
          </Button>

          <div className="text-center pt-4">
            <p className="text-muted-foreground text-sm">
              Não tem uma conta?{' '}
              <Link href="/auth/register" className="text-primary hover:text-primary/80">
                Criar conta
              </Link>
            </p>
          </div>

          <div className="pt-4">
            <Badge className="w-full justify-center bg-gradient-to-r from-amber-500 to-yellow-400 text-black">
              🎉 Oferta de Lançamento: R$9,90/mês
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
