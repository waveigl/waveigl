import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Users, MessageSquare, Zap, Star } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/30 selection:text-primary-foreground">
      {/* Background Gradient Effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="container relative z-10 mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg shadow-lg shadow-primary/20"></div>
            <span className="text-2xl font-bold text-foreground tracking-tight">WaveIGL</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="outline" className="bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white backdrop-blur-sm">
                Entrar
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button className="bg-primary hover:bg-primary/90 text-white border-none shadow-lg shadow-primary/20">
                Assinar Clube
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container relative z-10 mx-auto px-4 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 transition-colors">
            🎉 Oferta de Lançamento
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-8 tracking-tight">
            Clube <span className="text-primary">WaveIGL</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Acesse conteúdo exclusivo, chat unificado e uma comunidade VIP por apenas{' '}
            <span className="font-semibold text-foreground">R$9,90</span>/mês
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white text-lg px-8 h-14 shadow-lg shadow-primary/25 transition-all hover:scale-105">
                Começar Agora
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="bg-transparent border-border hover:bg-muted text-lg px-8 h-14 backdrop-blur-sm transition-all">
              Saiba Mais
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container relative z-10 mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">Por que escolher o Clube WaveIGL?</h2>
          <p className="text-lg text-muted-foreground">Benefícios exclusivos para membros</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-card/50 border-border/50 backdrop-blur-sm hover:bg-card/80 transition-colors duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
                <MessageSquare className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl text-foreground">Chat Unificado</CardTitle>
              <CardDescription className="text-muted-foreground leading-relaxed">
                Conecte-se com a comunidade em todas as plataformas: Twitch, YouTube e Kick
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card/50 border-border/50 backdrop-blur-sm hover:bg-card/80 transition-colors duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
                <Users className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl text-foreground">Comunidade VIP</CardTitle>
              <CardDescription className="text-muted-foreground leading-relaxed">
                Acesso exclusivo ao Discord com cargos especiais e benefícios únicos
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card/50 border-border/50 backdrop-blur-sm hover:bg-card/80 transition-colors duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
                <Zap className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl text-foreground">Conteúdo Exclusivo</CardTitle>
              <CardDescription className="text-muted-foreground leading-relaxed">
                Lives especiais, conteúdo behind-the-scenes e interações únicas
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container relative z-10 mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">Preço Especial de Lançamento</h2>
          <p className="text-lg text-muted-foreground">Por tempo limitado</p>
        </div>
        
        <div className="max-w-md mx-auto">
          <Card className="relative bg-card border-primary/20 shadow-2xl shadow-primary/10 overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
            <CardHeader className="text-center pb-2">
              <div className="flex items-center justify-center mb-6">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                  <Star className="w-3 h-3 mr-1 fill-current" /> Mais Popular
                </Badge>
              </div>
              <CardTitle className="text-3xl font-bold text-foreground mb-4">Clube WaveIGL</CardTitle>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <span className="text-5xl font-bold text-foreground">R$9,90</span>
                <div className="text-left flex flex-col justify-center">
                  <div className="text-muted-foreground line-through text-sm">R$19,90</div>
                  <div className="text-muted-foreground text-sm">/mês</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 mb-8">
                {[
                  'Chat unificado em todas as plataformas',
                  'Acesso ao Discord VIP',
                  'Conteúdo exclusivo',
                  'Suporte prioritário'
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-muted-foreground">
                    <CheckCircle className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/login" className="block">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white text-lg h-12 transition-all shadow-lg shadow-primary/20">
                  Assinar Agora
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container relative z-10 mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">Perguntas Frequentes</h2>
        </div>
        
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Como funciona o chat unificado?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                O chat unificado conecta as mensagens do Twitch, YouTube e Kick em uma única interface, 
                permitindo que você interaja com a comunidade independentemente da plataforma que estiver assistindo.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Posso cancelar a qualquer momento?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Sim! Você pode cancelar sua assinatura a qualquer momento através da sua conta. 
                Não há taxas de cancelamento ou compromissos de longo prazo.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Como acesso o Discord VIP?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Após vincular suas contas do Twitch, YouTube e Kick, você receberá automaticamente 
                o cargo de membro completo no Discord com acesso a canais exclusivos.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="container relative z-10 mx-auto px-4 py-12 border-t border-border/40">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-primary rounded-lg shadow-lg shadow-primary/20"></div>
            <span className="text-2xl font-bold text-foreground tracking-tight">WaveIGL</span>
          </div>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            Conecte-se com a comunidade em todas as plataformas
          </p>
          <div className="flex justify-center space-x-8">
            <a href="https://twitch.tv/waveigl" className="text-muted-foreground hover:text-primary transition-colors">
              Twitch
            </a>
            <a href="https://youtube.com/@waveigl" className="text-muted-foreground hover:text-primary transition-colors">
              YouTube
            </a>
            <a href="https://kick.com/waveigloficial" className="text-muted-foreground hover:text-primary transition-colors">
              Kick
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
