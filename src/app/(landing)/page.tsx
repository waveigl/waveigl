'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Users, Star, Trophy, Gamepad2, ChevronRight, Play, Lock, GraduationCap, Clock, Shield } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

// Cores CS2
const CS2_COLORS = {
  white: '#D9D9D9',
  orange: '#E38817',
  darkBlue: '#1E202F',
}

function GlowingOrb({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div 
      className={`absolute rounded-full blur-[100px] animate-pulse ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    />
  )
}

function StatCounter({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0
    
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    
    return () => clearInterval(timer)
  }, [value])
  
  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-[#E38817] mb-2">
        {count.toLocaleString('pt-BR')}{suffix}
      </div>
      <div className="text-[#D9D9D9]/70 text-sm uppercase tracking-wider">{label}</div>
    </div>
  )
}

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-[#D9D9D9] selection:bg-[#E38817]/30 selection:text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#E38817 1px, transparent 1px), linear-gradient(90deg, #E38817 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Glowing orbs */}
        <GlowingOrb className="top-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#E38817]/10" delay={0} />
        <GlowingOrb className="bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#1E202F]/30" delay={500} />
        <GlowingOrb className="top-[40%] right-[20%] w-[400px] h-[400px] bg-[#E38817]/5" delay={1000} />
        
        {/* Diagonal lines */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[20%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#E38817]/20 to-transparent transform -rotate-12" />
          <div className="absolute top-[60%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#E38817]/10 to-transparent transform rotate-6" />
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-[#E38817]/10 backdrop-blur-md bg-[#0A0B0F]/80">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="relative">
                <Image 
                  src="/favicon.webp" 
                  alt="WaveIGL" 
                  width={40} 
                  height={40} 
                  className="rounded-lg shadow-lg shadow-[#E38817]/30"
                />
                <div className="absolute inset-0 bg-[#E38817] rounded-lg blur-md opacity-30" />
              </div>
              <span className="text-2xl font-bold tracking-tight">
                Wave<span className="text-[#E38817]">IGL</span>
              </span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/sobre" className="text-[#D9D9D9]/70 hover:text-[#E38817] transition-colors">
                Sobre
              </Link>
              <Link href="/midia-kit" className="text-[#D9D9D9]/70 hover:text-[#E38817] transition-colors">
                Mídia Kit
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href="/auth/login">
                <Button 
                  variant="outline" 
                  className="border-[#E38817]/30 text-[#D9D9D9] hover:bg-[#E38817]/10 hover:border-[#E38817] hover:text-[#E38817] transition-all"
                >
                  Entrar
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button className="bg-gradient-to-r from-[#E38817] to-[#B86A10] hover:from-[#F59928] hover:to-[#E38817] text-white border-none shadow-lg shadow-[#E38817]/25 transition-all">
                  Assinar Clube
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className={`max-w-6xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            
            {/* Hero Grid - Image + Content */}
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
              
              {/* Left - Image */}
              <div className="relative order-2 lg:order-1 flex justify-center">
                {/* Neon glow effects */}
                <div className="absolute -left-20 top-1/4 w-40 h-80 bg-[#E38817]/30 blur-[100px] rounded-full" />
                <div className="absolute -right-20 top-1/3 w-40 h-80 bg-[#3B82F6]/20 blur-[100px] rounded-full" />
                
                {/* Main image */}
                {/* Nota: unoptimized é necessário para preservar a transparência do WebP */}
                <div className="relative">
                  <Image 
                    src="/waveigl.webp" 
                    alt="WaveIGL - Conrado Koerich" 
                    width={500} 
                    height={500}
                    className="relative z-10 rounded-2xl bg-transparent"
                    style={{ 
                      backgroundColor: 'transparent',
                      backgroundImage: 'none'
                    }}
                    priority
                    unoptimized
                  />
                  {/* Orange neon line left */}
                  <div className="absolute -left-8 top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-transparent via-[#E38817] to-transparent opacity-60" />
                  {/* Blue neon line right */}
                  <div className="absolute -right-8 top-1/3 bottom-1/3 w-1 bg-gradient-to-b from-transparent via-[#3B82F6] to-transparent opacity-40" />
                </div>
              </div>
              
              {/* Right - Content */}
              <div className="order-1 lg:order-2 text-center lg:text-left">
                {/* Badge */}
                <Badge 
                  className="mb-6 px-4 py-2 bg-[#1E202F]/80 text-[#E38817] border border-[#E38817]/30 hover:bg-[#1E202F] transition-colors backdrop-blur-sm"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Professor de CS2
                </Badge>
                
                {/* Main Title */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight leading-none">
                  <span className="block text-[#D9D9D9]">CLUBE</span>
                  <span className="block bg-gradient-to-r from-[#E38817] via-[#F5A623] to-[#E38817] bg-clip-text text-transparent">
                    WAVEIGL
                  </span>
                </h1>
                
                {/* Subtitle */}
                <p className="text-xl md:text-2xl text-[#D9D9D9]/70 mb-3 leading-relaxed">
                  O conhecimento das aulas particulares, por R$9,90/mês
                </p>
                <p className="text-base text-[#D9D9D9]/50 mb-8">
                  Discord VIP • Aulas ao vivo exclusivas • Início em 01/01/2026
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/auth/login">
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-[#E38817] to-[#B86A10] hover:from-[#F59928] hover:to-[#E38817] text-white text-lg px-10 h-14 shadow-xl shadow-[#E38817]/30 transition-all hover:scale-105 hover:shadow-[#E38817]/40 group"
                    >
                      <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                      Começar Agora
                    </Button>
                  </Link>
                  <Link href="/sobre">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="border-[#D9D9D9]/20 text-[#D9D9D9] hover:bg-[#D9D9D9]/5 hover:border-[#D9D9D9]/40 text-lg px-10 h-14 backdrop-blur-sm transition-all group"
                    >
                      Conheça o Wave
                      <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <StatCounter value={440} suffix="k" label="Seguidores" />
              <StatCounter value={2} suffix="M" label="Views/mês" />
              <StatCounter value={70} suffix="h" label="Live/semana" />
              <StatCounter value={500} suffix="k+" label="Alunos" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24 border-t border-[#E38817]/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Por que o <span className="text-[#E38817]">Clube WaveIGL</span>?
            </h2>
            <p className="text-[#D9D9D9]/60 text-lg">O mesmo conteúdo das aulas particulares de R$149, agora compartilhado em comunidade por apenas R$9,90/mês</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: <GraduationCap className="w-8 h-8" />,
                title: 'Aulas de R$149 por R$9,90',
                description: 'O mesmo conhecimento das aulas particulares que custam R$149, agora em formato compartilhado. Você economiza mais de 98% e aprende o mesmo conteúdo'
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: 'Discord VIP Exclusivo',
                description: 'Acesso a uma comunidade fechada apenas para assinantes do Clube, onde você interage diretamente com outros membros e o WaveIGL'
              },
              {
                icon: <Trophy className="w-8 h-8" />,
                title: 'Professor com Resultados',
                description: 'Aprenda com quem tem 35k+ horas de jogo e formou a aluna Giuzinha, Top 5 Mundial pela Team Brazil. Resultados comprovados'
              },
              {
                icon: <Clock className="w-8 h-8" />,
                title: 'Aulas Ao Vivo',
                description: 'Aulas ao vivo no Discord que não são gravadas nem salvas. Conteúdo denso e avançado que não é apresentado nas lives públicas'
              },
              {
                icon: <Lock className="w-8 h-8" />,
                title: 'Conteúdo Protegido',
                description: 'Nenhum conteúdo interno pode ser gravado ou postado. Aulas e discussões permanecem exclusivas para membros do Clube'
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: 'Comunidade Selecionada',
                description: 'Faça parte de um grupo seleto de pessoas comprometidas em evoluir no CS2. Ambiente focado em aprendizado e crescimento'
              }
            ].map((feature, i) => (
              <Card 
                key={i}
                className="bg-[#1E202F]/30 border-[#E38817]/10 hover:border-[#E38817]/30 backdrop-blur-sm transition-all duration-300 hover:bg-[#1E202F]/50 group"
              >
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#E38817]/20 to-[#E38817]/5 rounded-xl flex items-center justify-center mb-4 text-[#E38817] group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-[#D9D9D9] mb-2">{feature.title}</h3>
                  <p className="text-[#D9D9D9]/60 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 py-24 border-t border-[#E38817]/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#E38817]/10 text-[#E38817] border-[#E38817]/30">
              🎓 O mesmo conhecimento das aulas particulares
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Compare e <span className="text-[#E38817]">Economize</span>
            </h2>
            <p className="text-[#D9D9D9]/60 text-lg">O conhecimento que transforma jogadores, agora acessível</p>
          </div>
          
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
            {/* Aula Avulsa */}
            <Card className="bg-[#1E202F]/30 border-[#E38817]/10">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-bold text-[#D9D9D9]/60 mb-4">Aula Particular Avulsa</h3>
                <div className="text-4xl font-black text-[#D9D9D9]/40 mb-2">R$149</div>
                <div className="text-[#D9D9D9]/40 text-sm mb-6">/por aula</div>
                <ul className="space-y-3 text-left text-sm text-[#D9D9D9]/50">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 opacity-50" />
                    Aula individual com WaveIGL
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 opacity-50" />
                    Conteúdo personalizado
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 opacity-50" />
                    Horário agendado
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Clube WaveIGL - Destaque */}
            <Card className="relative bg-gradient-to-b from-[#1E202F]/80 to-[#0A0B0F] border-[#E38817]/30 shadow-2xl shadow-[#E38817]/10 overflow-hidden md:scale-105">
              {/* Top glow */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#E38817] to-transparent" />
              
              <CardContent className="p-6 text-center">
                <Badge className="mb-4 bg-[#E38817]/20 text-[#E38817] border-[#E38817]/30 px-3 py-1">
                  <Star className="w-3 h-3 mr-1 fill-current" /> Melhor Custo-Benefício
                </Badge>
                
                <h3 className="text-xl font-bold text-[#D9D9D9] mb-4">Clube WaveIGL</h3>
                
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-5xl font-black text-[#E38817]">R$9,90</span>
                  <div className="text-left">
                    <div className="text-[#D9D9D9]/60 text-sm">/mês</div>
                  </div>
                </div>
                
                <div className="text-[#E38817]/80 text-sm mb-6 font-semibold">
                  🚀 Aulas iniciam em 01/01/2026
                </div>
                
                <ul className="space-y-3 mb-6 text-left text-sm">
                  {[
                    'Aulas ao vivo no Discord VIP',
                    'Conteúdo exclusivo não gravado',
                    'Mesmo conhecimento das particulares',
                    'Comunidade fechada e selecionada',
                    'Interação direta com WaveIGL'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center text-[#D9D9D9]/80">
                      <CheckCircle className="w-4 h-4 text-[#E38817] mr-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                
                <Link href="/auth/login" className="block">
                  <Button className="w-full bg-gradient-to-r from-[#E38817] to-[#B86A10] hover:from-[#F59928] hover:to-[#E38817] text-white text-lg h-12 shadow-lg shadow-[#E38817]/25 transition-all hover:scale-[1.02]">
                    Garantir Vaga
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Mensalidade */}
            <Card className="bg-[#1E202F]/30 border-[#E38817]/10">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-bold text-[#D9D9D9]/60 mb-4">Mensalidade Particular</h3>
                <div className="text-4xl font-black text-[#D9D9D9]/40 mb-2">R$499</div>
                <div className="text-[#D9D9D9]/40 text-sm mb-6">/mês (1 aula/semana)</div>
                <ul className="space-y-3 text-left text-sm text-[#D9D9D9]/50">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 opacity-50" />
                    4 aulas mensais individuais
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 opacity-50" />
                    Acompanhamento semanal
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 opacity-50" />
                    Evolução personalizada
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          {/* Destaque de economia */}
          <div className="text-center mt-12">
            <p className="text-[#D9D9D9]/60 text-lg">
              Com o Clube você economiza até <span className="text-[#E38817] font-bold">98%</span> comparado às aulas particulares
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="relative z-10 py-24 border-t border-[#E38817]/10 bg-[#1E202F]/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Assista nas suas plataformas favoritas
            </h2>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { name: 'Twitch', url: 'https://twitch.tv/waveigl', followers: '440k', color: '#9146FF' },
              { name: 'YouTube', url: 'https://youtube.com/@waveigl', followers: '34.5k', color: '#FF0000' },
              { name: 'Instagram', url: 'https://instagram.com/waveigl', followers: '20.7k', color: '#E4405F' },
              { name: 'Kick', url: 'https://kick.com/waveigloficial', followers: '840', color: '#53FC18' },
              { name: 'TikTok', url: 'https://tiktok.com/@waveigloficial', followers: '500', color: '#000000' },
              { name: 'Kwai', url: 'https://kwai.com/@waveigl', followers: '200', color: '#FF6600' },
              { name: 'Facebook', url: 'https://facebook.com/waveigl', followers: '-', color: '#1877F2' },
            ].map((platform) => (
              <a 
                key={platform.name}
                href={platform.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-3 bg-[#1E202F]/50 border border-[#E38817]/10 rounded-xl hover:border-[#E38817]/30 transition-all group"
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: platform.color }}
                />
                <span className="font-medium text-[#D9D9D9] group-hover:text-[#E38817] transition-colors">
                  {platform.name}
                </span>
                <span className="text-[#D9D9D9]/50 text-sm">{platform.followers}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-[#E38817]/10">
        <div className="container mx-auto px-4">
          {/* Main Footer */}
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <Image 
                  src="/favicon.webp" 
                  alt="WaveIGL" 
                  width={32} 
                  height={32}
                  className="rounded-lg"
                />
                <span className="text-xl font-bold">
                  Wave<span className="text-[#E38817]">IGL</span>
                </span>
              </div>
              <p className="text-sm text-[#D9D9D9]/50 mb-4">
                A maior comunidade de CS2 do Brasil. Aprenda, se divirta e evolua com a gente.
              </p>
              <a 
                href="mailto:csgoblackbelt@gmail.com" 
                className="text-sm text-[#E38817] hover:underline"
              >
                csgoblackbelt@gmail.com
              </a>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="font-semibold text-[#D9D9D9] mb-4">Navegação</h4>
              <ul className="space-y-2 text-sm text-[#D9D9D9]/50">
                <li><Link href="/sobre" className="hover:text-[#E38817] transition-colors">Sobre WaveIGL</Link></li>
                <li><Link href="/midia-kit" className="hover:text-[#E38817] transition-colors">Mídia Kit</Link></li>
                <li><Link href="/auth/login" className="hover:text-[#E38817] transition-colors">Entrar</Link></li>
              </ul>
            </div>
            
            {/* Legal */}
            <div>
              <h4 className="font-semibold text-[#D9D9D9] mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-[#D9D9D9]/50">
                <li><Link href="/termos-de-uso" className="hover:text-[#E38817] transition-colors">Termos de Uso</Link></li>
                <li><Link href="/politica-privacidade" className="hover:text-[#E38817] transition-colors">Política de Privacidade</Link></li>
                <li><Link href="/cookies" className="hover:text-[#E38817] transition-colors">Política de Cookies</Link></li>
              </ul>
            </div>
            
            {/* Social */}
            <div>
              <h4 className="font-semibold text-[#D9D9D9] mb-4">Redes Sociais</h4>
              <ul className="space-y-2 text-sm text-[#D9D9D9]/50">
                <li><a href="https://twitch.tv/waveigl" target="_blank" rel="noopener noreferrer" className="hover:text-[#E38817] transition-colors">Twitch</a></li>
                <li><a href="https://youtube.com/@waveigl" target="_blank" rel="noopener noreferrer" className="hover:text-[#E38817] transition-colors">YouTube</a></li>
                <li><a href="https://instagram.com/waveigl" target="_blank" rel="noopener noreferrer" className="hover:text-[#E38817] transition-colors">Instagram</a></li>
                <li><a href="https://kick.com/waveigloficial" target="_blank" rel="noopener noreferrer" className="hover:text-[#E38817] transition-colors">Kick</a></li>
                <li><a href="https://tiktok.com/@waveigloficial" target="_blank" rel="noopener noreferrer" className="hover:text-[#E38817] transition-colors">TikTok</a></li>
                <li><a href="https://facebook.com/waveigl" target="_blank" rel="noopener noreferrer" className="hover:text-[#E38817] transition-colors">Facebook</a></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="pt-8 border-t border-[#E38817]/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[#D9D9D9]/40 text-sm">
              © 2025 WaveIGL. Todos os direitos reservados.
            </p>
            <p className="text-[#D9D9D9]/30 text-xs">
              Florianópolis, SC - Brasil | CNPJ em processo de registro
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
