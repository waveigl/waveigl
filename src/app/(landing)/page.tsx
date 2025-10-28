import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Users, MessageSquare, Zap, Star } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg"></div>
            <span className="text-2xl font-bold text-white">WaveIGL</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black">
                Entrar
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                Assinar Clube
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            🎉 Oferta de Lançamento
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Clube <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">WaveIGL</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Acesse conteúdo exclusivo, chat unificado e uma comunidade VIP por apenas{' '}
            <span className="text-3xl font-bold text-green-400">R$9,90</span>/mês
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login">
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg px-8 py-4">
                Começar Agora
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-black text-lg px-8 py-4">
              Saiba Mais
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Por que escolher o Clube WaveIGL?</h2>
          <p className="text-xl text-gray-300">Benefícios exclusivos para membros</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Chat Unificado</CardTitle>
              <CardDescription className="text-gray-300">
                Conecte-se com a comunidade em todas as plataformas: Twitch, YouTube e Kick
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Comunidade VIP</CardTitle>
              <CardDescription className="text-gray-300">
                Acesso exclusivo ao Discord com cargos especiais e benefícios únicos
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Conteúdo Exclusivo</CardTitle>
              <CardDescription className="text-gray-300">
                Lives especiais, conteúdo behind-the-scenes e interações únicas
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Preço Especial de Lançamento</h2>
          <p className="text-xl text-gray-300">Por tempo limitado</p>
        </div>
        
        <div className="max-w-md mx-auto">
          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 border-0">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-yellow-400 mr-2" />
                <Badge className="bg-yellow-400 text-black">Mais Popular</Badge>
              </div>
              <CardTitle className="text-white text-3xl">Clube WaveIGL</CardTitle>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-5xl font-bold text-white">R$9,90</span>
                <div className="text-left">
                  <div className="text-white/70 line-through text-lg">R$19,90</div>
                  <div className="text-white text-sm">/mês</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-white">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Chat unificado em todas as plataformas
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Acesso ao Discord VIP
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Conteúdo exclusivo
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Suporte prioritário
                </li>
              </ul>
              <Link href="/auth/login" className="block mt-6">
                <Button className="w-full bg-white text-purple-600 hover:bg-gray-100 text-lg py-3">
                  Assinar Agora
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Perguntas Frequentes</h2>
        </div>
        
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Como funciona o chat unificado?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                O chat unificado conecta as mensagens do Twitch, YouTube e Kick em uma única interface, 
                permitindo que você interaja com a comunidade independentemente da plataforma que estiver assistindo.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Posso cancelar a qualquer momento?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Sim! Você pode cancelar sua assinatura a qualquer momento através da sua conta. 
                Não há taxas de cancelamento ou compromissos de longo prazo.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Como acesso o Discord VIP?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Após vincular suas contas do Twitch, YouTube e Kick, você receberá automaticamente 
                o cargo de membro completo no Discord com acesso a canais exclusivos.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-white/20">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg"></div>
            <span className="text-2xl font-bold text-white">WaveIGL</span>
          </div>
          <p className="text-gray-400 mb-4">
            Conecte-se com a comunidade em todas as plataformas
          </p>
          <div className="flex justify-center space-x-6">
            <a href="https://twitch.tv/waveigl" className="text-gray-400 hover:text-white transition-colors">
              Twitch
            </a>
            <a href="https://youtube.com/@waveigl" className="text-gray-400 hover:text-white transition-colors">
              YouTube
            </a>
            <a href="https://kick.com/waveigloficial" className="text-gray-400 hover:text-white transition-colors">
              Kick
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
