'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Gamepad2, 
  GraduationCap, 
  Music, 
  Calendar,
  MapPin,
  Award,
  Target,
  Heart,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Server,
  Play
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'

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

// Hero Carrossel com fotos do WaveIGL
function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const images = [
    { src: '/waveigl.webp', alt: 'WaveIGL - Professor de CS2' },
    { src: '/hero/waveigl_produtor.jpg', alt: 'WaveIGL - Produtor de Eventos' },
    { src: '/hero/waveigl_concierge.jpg', alt: 'WaveIGL - Concierge VIP' },
    { src: '/hero/waveigl_dj.jpg', alt: 'WaveIGL - DJ Hope' },
  ]
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [images.length])
  
  return (
    <div className="relative order-2 lg:order-1 flex justify-center">
      {/* Neon glow effects */}
      <div className="absolute -left-20 top-1/4 w-40 h-80 bg-[#E38817]/30 blur-[100px] rounded-full" />
      <div className="absolute -right-20 top-1/3 w-40 h-80 bg-[#3B82F6]/20 blur-[100px] rounded-full" />
      
      {/* Carrossel */}
      <div className="relative">
        <div className="relative w-[500px] h-[500px] overflow-hidden rounded-2xl">
          {images.map((image, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                idx === currentIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image 
                src={image.src}
                alt={image.alt}
                width={500}
                height={500}
                className="w-full h-full object-cover"
                priority={idx === 0}
                unoptimized
              />
            </div>
          ))}
        </div>
        
        {/* Indicadores */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex 
                  ? 'bg-[#E38817] w-6' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              title={`Ir para foto ${idx + 1}`}
              aria-label={`Ir para foto ${idx + 1}`}
            />
          ))}
        </div>
        
        {/* Orange neon line left */}
        <div className="absolute -left-8 top-1/4 bottom-1/4 w-1 bg-linear-to-b from-transparent via-[#E38817] to-transparent opacity-60" />
        {/* Blue neon line right */}
        <div className="absolute -right-8 top-1/3 bottom-1/3 w-1 bg-linear-to-b from-transparent via-[#3B82F6] to-transparent opacity-40" />
      </div>
    </div>
  )
}

// Componente de Carrossel estilo Instagram
function InstagramCarousel({ 
  images, 
  aspectRatio = 'square' 
}: { 
  images: { src: string; alt: string; caption?: string }[]
  aspectRatio?: 'square' | 'portrait' | 'landscape'
}) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const aspectClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[4/5]',
    landscape: 'aspect-video'
  }

  return (
    <div className="relative w-full max-w-md mx-auto mt-4">
      {/* Instagram-style frame */}
      <div className="bg-[#1E202F] rounded-xl overflow-hidden border border-[#E38817]/20">
        {/* Header */}
        <div className="flex items-center gap-3 p-3 border-b border-[#E38817]/10">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#E38817] to-[#B86A10] flex items-center justify-center">
            <span className="text-white text-xs font-bold">W</span>
          </div>
          <span className="text-[#D9D9D9] text-sm font-medium">waveigl</span>
        </div>
        
        {/* Image Container */}
        <div className={`relative ${aspectClasses[aspectRatio]} bg-[#0A0B0F]`}>
          <Image
            src={images[currentIndex].src}
            alt={images[currentIndex].alt}
            fill
            className="object-cover"
          />
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                title="Foto anterior"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="w-5 h-5 text-[#0A0B0F]" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                title="Próxima foto"
                aria-label="Próxima foto"
              >
                <ChevronRight className="w-5 h-5 text-[#0A0B0F]" />
              </button>
            </>
          )}
        </div>
        
        {/* Dots Indicator */}
        {images.length > 1 && (
          <div className="flex justify-center gap-1 py-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  idx === currentIndex ? 'bg-[#E38817]' : 'bg-[#D9D9D9]/30'
                }`}
                title={`Ir para foto ${idx + 1}`}
                aria-label={`Ir para foto ${idx + 1}`}
              />
            ))}
          </div>
        )}
        
        {/* Caption */}
        {images[currentIndex].caption && (
          <div className="p-3 border-t border-[#E38817]/10">
            <p className="text-[#D9D9D9]/80 text-sm">
              <span className="font-semibold text-[#D9D9D9]">waveigl</span>{' '}
              {images[currentIndex].caption}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function TimelineItem({ 
  year, 
  title, 
  description, 
  icon: Icon,
  highlight = false 
}: { 
  year: string
  title: string
  description: string
  icon: React.ElementType
  highlight?: boolean
}) {
  return (
    <div className="relative flex gap-6 pb-12 last:pb-0">
      {/* Line */}
      <div className="absolute left-[27px] top-14 bottom-0 w-[2px] bg-linear-to-b from-[#E38817]/50 to-transparent last:hidden" />
      
      {/* Icon */}
      <div className={`relative z-10 w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
        highlight 
          ? 'bg-linear-to-br from-[#E38817] to-[#B86A10] text-white shadow-lg shadow-[#E38817]/30' 
          : 'bg-[#1E202F] border border-[#E38817]/20 text-[#E38817]'
      }`}>
        <Icon className="w-6 h-6" />
      </div>
      
      {/* Content */}
      <div className="flex-1 pt-1">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[#E38817] font-mono text-sm">{year}</span>
          {highlight && (
            <Badge className="bg-[#E38817]/20 text-[#E38817] border-[#E38817]/30 text-xs">
              Destaque
            </Badge>
          )}
        </div>
        <h3 className="text-xl font-bold text-[#D9D9D9] mb-2">{title}</h3>
        <p className="text-[#D9D9D9]/60 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function TimelineItemWithCarousel({ 
  year, 
  title, 
  description, 
  icon: Icon,
  highlight = false,
  images
}: { 
  year: string
  title: string
  description: string
  icon: React.ElementType
  highlight?: boolean
  images: { src: string; alt: string; caption?: string }[]
}) {
  return (
    <div className="relative flex gap-6 pb-12 last:pb-0">
      {/* Line */}
      <div className="absolute left-[27px] top-14 bottom-0 w-[2px] bg-linear-to-b from-[#E38817]/50 to-transparent last:hidden" />
      
      {/* Icon */}
      <div className={`relative z-10 w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
        highlight 
          ? 'bg-linear-to-br from-[#E38817] to-[#B86A10] text-white shadow-lg shadow-[#E38817]/30' 
          : 'bg-[#1E202F] border border-[#E38817]/20 text-[#E38817]'
      }`}>
        <Icon className="w-6 h-6" />
      </div>
      
      {/* Content */}
      <div className="flex-1 pt-1">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[#E38817] font-mono text-sm">{year}</span>
          {highlight && (
            <Badge className="bg-[#E38817]/20 text-[#E38817] border-[#E38817]/30 text-xs">
              Destaque
            </Badge>
          )}
        </div>
        <h3 className="text-xl font-bold text-[#D9D9D9] mb-2">{title}</h3>
        <p className="text-[#D9D9D9]/60 leading-relaxed mb-4">{description}</p>
        
        {/* Instagram Carousel */}
        <InstagramCarousel images={images} />
      </div>
    </div>
  )
}

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-[#D9D9D9] selection:bg-[#E38817]/30 selection:text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#E38817 1px, transparent 1px), linear-gradient(90deg, #E38817 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#E38817]/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#1E202F]/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '500ms' }} />
        <div className="absolute top-[40%] right-[20%] w-[400px] h-[400px] bg-[#E38817]/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1000ms' }} />
        
        {/* Diagonal lines */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[20%] left-0 w-full h-px bg-linear-to-r from-transparent via-[#E38817]/20 to-transparent transform -rotate-12" />
          <div className="absolute top-[60%] left-0 w-full h-px bg-linear-to-r from-transparent via-[#E38817]/10 to-transparent transform rotate-6" />
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
              <Link href="/clube-do-waveigl" className="text-[#D9D9D9]/70 hover:text-[#E38817] transition-colors">
                Clube
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
              <Link href="/clube-do-waveigl">
                <Button className="bg-linear-to-r from-[#E38817] to-[#B86A10] hover:from-[#F59928] hover:to-[#E38817] text-white border-none shadow-lg shadow-[#E38817]/25 transition-all">
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
              
              {/* Left - Carrossel */}
              <HeroCarousel />
              
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
                  <span className="block text-[#D9D9D9]">WAVE<span className="bg-linear-to-r from-[#E38817] via-[#F5A623] to-[#E38817] bg-clip-text text-transparent">
                    IGL
                  </span></span>
                  
                </h1>
                
                {/* Subtitle */}
                <p className="text-xl md:text-2xl text-[#D9D9D9]/70 mb-3 leading-relaxed">
                  +35 mil horas de CS • +500k alunos
                </p>
                <p className="text-base text-[#D9D9D9]/50 mb-8">
                  O maior professor de Counter-Strike do Brasil
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/clube-do-waveigl">
                    <Button 
                      size="lg" 
                      className="bg-linear-to-r from-[#E38817] to-[#B86A10] hover:from-[#F59928] hover:to-[#E38817] text-white text-lg px-10 h-14 shadow-xl shadow-[#E38817]/30 transition-all hover:scale-105 hover:shadow-[#E38817]/40 group"
                    >
                      <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                      Conhecer o Clube
                    </Button>
                  </Link>
                  <a href="https://twitch.tv/waveigl" target="_blank" rel="noopener noreferrer">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="border-[#D9D9D9]/20 text-[#D9D9D9] hover:bg-[#D9D9D9]/5 hover:border-[#D9D9D9]/40 text-lg px-10 h-14 backdrop-blur-sm transition-all group"
                    >
                      Assistir na Twitch
                      <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <StatCounter value={513} suffix="k" label="Seguidores" />
              <StatCounter value={2} suffix="M" label="Views/mês" />
              <StatCounter value={70} suffix="h" label="Live/semana" />
              <StatCounter value={500} suffix="k+" label="Alunos" />
            </div>
          </div>
        </div>
      </section>

      {/* Sobre Section */}
      <section className="relative z-10 py-24 border-t border-[#E38817]/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Bio */}
            <Card className="bg-[#1E202F]/30 border-[#E38817]/10 backdrop-blur-sm mb-12">
              <CardContent className="p-8">
                <p className="text-lg text-[#D9D9D9]/80 leading-relaxed mb-6">
                  <span className="text-[#E38817] font-bold">WaveIGL</span> é um dos maiores criadores de conteúdo e professores de CS2 do Brasil. 
                  Com mais de <span className="text-[#E38817] font-semibold">35 mil horas de jogo</span> e <span className="text-[#E38817] font-semibold">10 Milhões de pessoas alcançadas</span> nas redes sociais, 
                  Wave dedica sua carreira a ensinar e entreter jogadores de todos os níveis.
                </p>
                <p className="text-lg text-[#D9D9D9]/80 leading-relaxed mb-6">
                  Começou a jogar Counter-Strike em <span className="text-[#E38817] font-semibold">Junho de 2002</span>, acumulando experiência competitiva que culminou em <span className="text-[#E38817] font-semibold">2011</span>, quando alcançou o <span className="text-[#E38817] font-semibold">Top 9 do Brasil em LAN</span> como IGL (stand-in) do time freNzy!. 
                  Aos 18 anos, iniciou carreira como <span className="text-[#E38817] font-semibold">produtor de eventos</span>, evoluindo de camarotes de R$3k até se tornar <span className="text-[#E38817] font-semibold">concierge VIP</span> para clientes milionários - foi concierge de <span className="text-[#E38817] font-semibold">David Guetta</span> (jantou com ele) e <span className="text-[#E38817] font-semibold">Alok</span>. 
                  Em 2014, se tornou <span className="text-[#E38817] font-semibold">DJ profissional</span>, tocando nos melhores eventos 
                  como <span className="text-[#E38817]">Café de la Musique, Oxygen Party, The Roof</span>. 
                  Em <span className="text-[#E38817] font-semibold">2017</span>, decidiu começar do zero como professor de CS2, sem nunca mencionar sua carreira anterior. 
                  Começou jogando servidores de DM com uma bind, conquistando alunos aos poucos até estourar e viralizar.
                </p>
                <p className="text-lg text-[#D9D9D9]/80 leading-relaxed">
                  Seu maior case de sucesso é a aluna <span className="text-[#E38817] font-semibold">Giuzinha</span>, que representou o Brasil no cenário mundial feminino 
                  e conquistou o <span className="text-[#E38817] font-semibold">Top 5 no Mundial de CS2</span> pela Team Brazil.
                </p>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              {[
                { value: '500k+', label: 'Alunos', icon: GraduationCap },
                { value: '70h', label: 'Lives por Semana', icon: Gamepad2 },
                { value: '7+', label: 'Anos Ensinando', icon: Award },
              ].map((stat, i) => (
                <Card key={i} className="bg-[#1E202F]/30 border-[#E38817]/10">
                  <CardContent className="p-6 text-center">
                    <stat.icon className="w-8 h-8 text-[#E38817] mx-auto mb-3" />
                    <div className="text-2xl font-bold text-[#E38817] mb-1">{stat.value}</div>
                    <div className="text-sm text-[#D9D9D9]/60">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Clube CTA Section */}
      <section className="relative z-10 py-16 border-t border-[#E38817]/10 bg-linear-to-b from-transparent via-[#E38817]/5 to-transparent">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 px-4 py-2 bg-[#E38817]/20 text-[#E38817] border border-[#E38817]/30">
              <Heart className="w-4 h-4 mr-2" />
              Novidade 2026
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Conheça o <span className="text-[#E38817]">Clube WaveIGL</span>
            </h2>
            <p className="text-lg text-[#D9D9D9]/60 mb-8 max-w-2xl mx-auto">
              O conhecimento das aulas particulares de R$449,90 agora disponível em comunidade compartilhada. 
              Discord VIP, aulas ao vivo exclusivas e muito mais.
            </p>
            <Link href="/clube-do-waveigl">
              <Button 
                size="lg" 
                className="bg-linear-to-r from-[#E38817] to-[#B86A10] hover:from-[#F59928] hover:to-[#E38817] text-white text-lg px-10 h-14 shadow-xl shadow-[#E38817]/30 transition-all hover:scale-105"
              >
                <Play className="w-5 h-5 mr-2" />
                Conhecer o Clube
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trajetória Section */}
      <section className="relative z-10 py-24 border-t border-[#E38817]/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Timeline */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <Calendar className="w-8 h-8 text-[#E38817]" />
                Trajetória
              </h2>
              
              <div className="space-y-0">
                <TimelineItem 
                  year="Junho - 2002"
                  title="Início no Counter-Strike"
                  description="Começou a jogar Counter-Strike aos 17 anos, iniciando uma jornada que duraria mais de duas décadas. O início de uma paixão que definiria toda sua trajetória profissional."
                  icon={Gamepad2}
                />
                
                <TimelineItem 
                  year="2005"
                  title="Primeiros alunos de CS profissionalmente"
                  description="Tinha 2 servidores NetRangers: um pessoal e outro para o grupo de aluno. Organizou 2 grupos de alunos - 'bad' e 'good'. O grupo 'bad' podia usar das 12h às 24h, e o grupo 'good' da meia-noite ao meio-dia. Com 40 mensalistas, eram considerados os melhores servidores da época, mostrando desde cedo sua capacidade de liderança e organização de comunidades. Primeiros alunos vieram nessa época, RicardoLepra"
                  icon={Server}
                  highlight
                />
                
                <TimelineItem 
                  year="2002-2010"
                  title="Produtor de Eventos e Concierge VIP"
                  description="Aos 18 anos, começou produzindo eventos com camarotes para amigos. Evoluiu para camarotes de R$3k, depois R$5k com bebidas à vontade. Construiu networking de alto nível, virando concierge para clientes milionários. Camarotes exclusivos para 2 pessoas a R$2,5k+ cada, além de comissão por bebida - um cliente chegou a gastar R$15k+ em champagne em uma noite. Lucro de R$14k+ por noite. Foi concierge de David Guetta (jantou com ele) e Alok."
                  icon={Award}
                  highlight
                />
                
                <TimelineItem 
                  year="2011"
                  title="Top 9 Brasil em LAN"
                  description="Como IGL (stand-in) do time freNzy!, alcançou o Top 9 do Brasil em LAN. Nick: conrado. Um marco importante que mostrou seu potencial competitivo e conhecimento estratégico do jogo."
                  icon={Trophy}
                  highlight
                />
                
                <TimelineItem 
                  year="2015"
                  title="Head de Marketing Digital"
                  description="Foi Head de Marketing Digital, desenvolvendo expertise em estratégias digitais e crescimento de audiência que mais tarde aplicaria em sua carreira como criador de conteúdo."
                  icon={Briefcase}
                />
                
                <TimelineItemWithCarousel 
                  year="2014-2017"
                  title="Era DJ Hope - O Auge que ele deixou para trás"
                  description="No auge de sua carreira como DJ, tocando nas melhores baladas do Brasil como Café de la Musique, Oxygen Party e The Roof. WaveIGL tomou uma decisão que mudaria sua vida: inspirado em sua mãe, que era professora, decidiu abandonar tudo para se dedicar integralmente àquilo que realmente tinha expertise: ensinar Counter-Strike. Uma escolha corajosa de deixar o sucesso garantido para seguir sua verdadeira paixão."
                  icon={Music}
                  highlight
                  images={[
                    { src: '/dj_hope/dj_hope_01.jpg', alt: 'DJ Hope no Café de la Musique', caption: 'Café de la Musique - No auge da carreira 🎧' },
                    { src: '/dj_hope/dj_hope_02.jpg', alt: 'DJ Hope no Oxygen Party', caption: 'Oxygen Party - Lotação máxima 🔥' },
                    { src: '/dj_hope/dj_hope_03.jpg', alt: 'DJ Hope no The Roof', caption: 'The Roof - Uma das melhores baladas do Brasil 🎵' },
                    { src: '/dj_hope/dj_hope_playboy_party.jpg', alt: 'DJ Hope na Playboy Party', caption: 'Playboy Party - Eventos exclusivos 🎉' },
                    { src: '/dj_hope/dj_hope_the_roof.jpg', alt: 'DJ Hope no The Roof', caption: 'The Roof - Uma das melhores baladas do Brasil 🏙️' },
                    { src: '/dj_hope/dj_hope_oxygen_party_jurere_internacional.jpg', alt: 'DJ Hope no Oxygen Party Jurerê Internacional', caption: 'Oxygen Party Jurerê Internacional - Verão no auge ☀️' }
                  ]}
                />
                
                <TimelineItem 
                  year="2017"
                  title="Início como Professor de CS - Do Zero ao Topo"
                  description="Inspirado em sua mãe professora, decidiu começar do zero como professor de CS2. Nunca mencionou sua carreira anterior como DJ. Começou jogando servidores de DM com uma bind, ensinando enquanto jogava. Aos poucos foi conquistando alunos, construindo sua comunidade passo a passo, até estourar e viralizar. Uma jornada de crescimento orgânico e autêntico."
                  icon={GraduationCap}
                  highlight
                />
                
                <TimelineItem 
                  year="2018"
                  title="O Auge no CS"
                  description="Ano marcante com viralizações épicas, incluindo o famoso 'Gank do Skipinho' e outros momentos memoráveis que consolidaram Wave como referência no cenário de CS brasileiro."
                  icon={Target}
                  highlight
                />
                
                <TimelineItem 
                  year="2019-2023"
                  title="Crescimento Contínuo"
                  description="Realizou diversos sorteios de itens raros, incluindo uma AWP Dragon Lore. Consolidou a comunidade e alcançou 440k+ seguidores na Twitch, ensinando mais de 500k alunos através das lives gratuitas."
                  icon={Award}
                />
                
                <TimelineItem 
                  year="2024"
                  title="Giuzinha - Top 5 Mundial"
                  description="Giuzinha, aluna do WaveIGL, representou o Brasil no cenário mundial feminino de CS2 e conquistou o 5º lugar no Mundial pela Team Brazil. O maior case de sucesso que comprova a qualidade do ensino do Wave."
                  icon={Trophy}
                  highlight
                />
                
                <TimelineItem 
                  year="2025"
                  title="Clube WaveIGL"
                  description="Lançamento do projeto Clube WaveIGL: uma plataforma completa com chat unificado, Discord VIP, e aulas gratuitas de CS2 ao vivo na Twitch. O próximo capítulo da comunidade Wave."
                  icon={Heart}
                  highlight
                />
              </div>
            </div>

            {/* CTA */}
            <Card className="bg-linear-to-r from-[#1E202F] to-[#1E202F]/50 border-[#E38817]/20">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Faça parte da comunidade</h3>
                <p className="text-[#D9D9D9]/60 mb-6 max-w-lg mx-auto">
                  Faça parte do lançamento do Clube WaveIGL e aprenda CS2 com quem mais entende
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/clube-do-waveigl">
                    <Button className="bg-linear-to-r from-[#E38817] to-[#B86A10] hover:from-[#F59928] hover:to-[#E38817] text-white px-8">
                      Conhecer o Clube
                    </Button>
                  </Link>
                  <a href="https://twitch.tv/waveigl" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="border-[#E38817]/30 hover:bg-[#E38817]/10 hover:border-[#E38817] px-8">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Assistir na Twitch
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-[#E38817]/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#D9D9D9]/40">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-linear-to-br from-[#E38817] to-[#B86A10] rounded" />
              <span className="font-bold">WaveIGL</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/termos-de-uso" className="hover:text-[#E38817] transition-colors">Termos</Link>
              <Link href="/politica-privacidade" className="hover:text-[#E38817] transition-colors">Privacidade</Link>
              <Link href="/cookies" className="hover:text-[#E38817] transition-colors">Cookies</Link>
            </div>
            <p>© 2025 WaveIGL. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
