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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg"></div>
            <span className="text-2xl font-bold text-white">WaveIGL</span>
          </div>
          <CardTitle className="text-white text-2xl">Entrar no Clube</CardTitle>
          <CardDescription className="text-gray-300">
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
            <p className="text-gray-400 text-sm">
              Não tem uma conta?{' '}
              <Link href="/auth/register" className="text-purple-400 hover:text-purple-300">
                Criar conta
              </Link>
            </p>
          </div>

          <div className="pt-4">
            <Badge className="w-full justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              🎉 Oferta de Lançamento: R$9,90/mês
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
