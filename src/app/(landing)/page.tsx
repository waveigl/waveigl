'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Gamepad2, 
  GraduationCap, 
  Music, 
  Users, 
  Calendar,
  MapPin,
  Award,
  Target,
  Heart,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

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
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E38817] to-[#B86A10] flex items-center justify-center">
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
              >
                <ChevronLeft className="w-5 h-5 text-[#0A0B0F]" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
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
      <div className="absolute left-[27px] top-14 bottom-0 w-[2px] bg-gradient-to-b from-[#E38817]/50 to-transparent last:hidden" />
      
      {/* Icon */}
      <div className={`relative z-10 w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
        highlight 
          ? 'bg-gradient-to-br from-[#E38817] to-[#B86A10] text-white shadow-lg shadow-[#E38817]/30' 
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
      <div className="absolute left-[27px] top-14 bottom-0 w-[2px] bg-gradient-to-b from-[#E38817]/50 to-transparent last:hidden" />
      
      {/* Icon */}
      <div className={`relative z-10 w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
        highlight 
          ? 'bg-gradient-to-br from-[#E38817] to-[#B86A10] text-white shadow-lg shadow-[#E38817]/30' 
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
  return (
    <div className="min-h-screen bg-[#0A0B0F] text-[#D9D9D9]">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(#E38817 1px, transparent 1px), linear-gradient(90deg, #E38817 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#E38817]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#1E202F]/30 rounded-full blur-[100px]" />
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
                <Button className="bg-gradient-to-r from-[#E38817] to-[#B86A10] hover:from-[#F59928] hover:to-[#E38817] text-white border-none shadow-lg shadow-[#E38817]/25 transition-all">
                  Assinar Clube
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Profile Card */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
              {/* Avatar */}
              <div className="relative">
                <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-[#E38817] to-[#B86A10] p-1 overflow-hidden">
                  <Image 
                    src="/waveigl_profile.webp" 
                    alt="WaveIGL - Conrado Koerich" 
                    width={160} 
                    height={160}
                    className="w-full h-full rounded-xl object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#E38817] rounded-lg px-3 py-1 text-white text-sm font-bold">
                  🇧🇷 BR
                </div>
              </div>
              
              {/* Info */}
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-black mb-2">
                  WaveIGL
                </h1>
                <p className="text-2xl text-[#E38817]/70 mb-4">Professor de CS2</p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-[#D9D9D9]/60">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#E38817]" />
                    Florianópolis, SC
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#E38817]" />
                    12/11/1984
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#E38817]" />
                    35k+ Horas de Jogo
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <Card className="bg-[#1E202F]/30 border-[#E38817]/10 backdrop-blur-sm mb-16">
              <CardContent className="p-8">
                <p className="text-lg text-[#D9D9D9]/80 leading-relaxed mb-6">
                  <span className="text-[#E38817] font-bold">WaveIGL</span> é um dos maiores criadores de conteúdo e professores de CS2 do Brasil. 
                  Com mais de <span className="text-[#E38817] font-semibold">35 mil horas de jogo</span> e <span className="text-[#E38817] font-semibold">10 Milhões de pessoas alcançadas</span> nas redes sociais, 
                  Wave dedica sua carreira a ensinar e entreter jogadores de todos os níveis.
                </p>
                <p className="text-lg text-[#D9D9D9]/80 leading-relaxed mb-6">
                  Começou a jogar Counter-Strike em <span className="text-[#E38817] font-semibold">2001</span>, acumulando experiência competitiva que culminou em <span className="text-[#E38817] font-semibold">2011</span>, quando alcançou o <span className="text-[#E38817] font-semibold">Top 9 do Brasil em LAN</span> como IGL (stand-in) do time freNzy!. 
                  Em 2014, se tornou <span className="text-[#E38817] font-semibold">DJ profissional</span>, tocando nos melhores eventos 
                  como <span className="text-[#E38817]">Café de la Musique, Oxygen Party, The Roof</span>, compartilhando palco com grandes nomes como <span className="text-[#E38817] font-semibold">David Guetta e Alok</span>, entre muitos outros. Em 2017, por paixão ao ensino, 
                  se dedicou integralmente ao streaming e educação em CS.
                </p>
                <p className="text-lg text-[#D9D9D9]/80 leading-relaxed">
                  Seu maior case de sucesso é a aluna <span className="text-[#E38817] font-semibold">Giuzinha</span>, que representou o Brasil no cenário mundial feminino 
                  e conquistou o <span className="text-[#E38817] font-semibold">Top 5 no Mundial de CS2</span> pela Team Brazil.
                </p>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
              {[
                { value: '440k+', label: 'Seguidores Twitch', icon: Users },
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

            {/* Timeline */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <Calendar className="w-8 h-8 text-[#E38817]" />
                Trajetória
              </h2>
              
              <div className="space-y-0">
                <TimelineItem 
                  year="2001"
                  title="Início no Counter-Strike"
                  description="Começou a jogar Counter-Strike aos 17 anos, iniciando uma jornada que duraria mais de duas décadas. O início de uma paixão que definiria toda sua trajetória profissional."
                  icon={Gamepad2}
                />
                
                <TimelineItem 
                  year="2011"
                  title="Top 9 Brasil em LAN"
                  description="Como IGL (stand-in) do time freNzy!, alcançou o Top 9 do Brasil em LAN. Nick: conrado. Um marco importante que mostrou seu potencial competitivo e conhecimento estratégico do jogo."
                  icon={Trophy}
                  highlight
                />
                
                <TimelineItemWithCarousel 
                  year="2014-2017"
                  title="Era DJ Hope - O Auge que ele deixou para trás"
                  description="No auge de sua carreira como DJ, tocando nas melhores baladas do Brasil como Café de la Musique, Oxygen Party e The Roof. Compartilhou palco com grandes nomes da música eletrônica mundial como David Guetta, Alok e muitos outros DJs renomados. WaveIGL tomou uma decisão que mudaria sua vida: inspirado em sua mãe, que era professora, decidiu abandonar tudo para se dedicar integralmente àquilo que realmente tinha expertise: ensinar Counter-Strike. Uma escolha corajosa de deixar o sucesso garantido para seguir sua verdadeira paixão."
                  icon={Music}
                  highlight
                  images={[
                    { src: '/dj_hope/dj_hope_01.jpg', alt: 'DJ Hope no Café de la Musique', caption: 'Café de la Musique - No auge da carreira 🎧' },
                    { src: '/dj_hope/dj_hope_02.jpg', alt: 'DJ Hope no Oxygen Party', caption: 'Oxygen Party - Lotação máxima 🔥' },
                    { src: '/dj_hope/dj_hope_03.jpg', alt: 'DJ Hope com David Guetta e Alok', caption: 'Compartilhando palco com David Guetta, Alok e muitos outros 🎵' }
                  ]}
                />
                
                <TimelineItem 
                  year="2017"
                  title="Início como Professor de CS"
                  description="Inspirado em sua mãe professora, começou a ensinar jogadores de todos os níveis a evoluírem. Encerrou a carreira de DJ no auge para se dedicar integralmente ao streaming e educação em CS."
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
            <Card className="bg-gradient-to-r from-[#1E202F] to-[#1E202F]/50 border-[#E38817]/20">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Faça parte da comunidade</h3>
                <p className="text-[#D9D9D9]/60 mb-6 max-w-lg mx-auto">
                  Faça parte do lançamento do Clube WaveIGL e aprenda CS2 com quem mais entende
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/clube-do-waveigl">
                    <Button className="bg-gradient-to-r from-[#E38817] to-[#B86A10] hover:from-[#F59928] hover:to-[#E38817] text-white px-8">
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
              <div className="w-6 h-6 bg-gradient-to-br from-[#E38817] to-[#B86A10] rounded" />
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
