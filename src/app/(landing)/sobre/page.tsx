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
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

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

export default function SobrePage() {
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
          <nav className="flex items-center justify-center">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-[#D9D9D9]/70 hover:text-[#E38817] transition-colors font-medium">
                Home
              </Link>
              <Link href="/midia-kit" className="text-[#D9D9D9]/70 hover:text-[#E38817] transition-colors font-medium">
                Mídia Kit
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
                    Ex-Top 9 Nacional CS
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <Card className="bg-[#1E202F]/30 border-[#E38817]/10 backdrop-blur-sm mb-16">
              <CardContent className="p-8">
                <p className="text-lg text-[#D9D9D9]/80 leading-relaxed mb-6">
                  <span className="text-[#E38817] font-bold">WaveIGL</span> é um dos maiores criadores de conteúdo de CS2 do Brasil. 
                  Com mais de <span className="text-[#E38817] font-semibold">10 Milhões de pessoas alcançadas</span> nas redes sociais, 
                  Wave dedica sua carreira a ensinar e entreter jogadores de todos os níveis.
                </p>
                <p className="text-lg text-[#D9D9D9]/80 leading-relaxed">
                  Em 2011, competiu no cenário profissional de CS 1.6, alcançando o <span className="text-[#E38817] font-semibold">Top 9 nacional</span> no CWB Jungle Cup.
                  Após o competitivo, Wave se tornou <span className="text-[#E38817] font-semibold">DJ profissional</span> em 2014, tocando nos melhores eventos 
                  como <span className="text-[#E38817]">Café de la Musique, Oxygen Party, The Roof</span>, entre outros. Em 2017, por paixão ao ensino, 
                  fundou a BlackBelt e se dedicou integralmente ao streaming e educação em CS.
                </p>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
              {[
                { value: '440k+', label: 'Seguidores Twitch', icon: Users },
                { value: '400+', label: 'Alunos BlackBelt', icon: GraduationCap },
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
                  year="2011"
                  title="Top 9 Nacional CS 1.6"
                  description="Competiu profissionalmente no Counter-Strike 1.6 com o time freNzy!, alcançando o Top 9 no CWB Jungle Cup em Curitiba. Nick: conrado. O início de uma paixão que definiria sua carreira."
                  icon={Trophy}
                  highlight
                />
                
                <TimelineItem 
                  year="2014"
                  title="Era DJ Hope"
                  description="Após o competitivo, iniciou carreira como DJ com os projetos Mix Factor e Mixshow. Tocou nas melhores baladas do Brasil, incluindo Café de la Musique, Oxygen Party, The Roof e muitos outros eventos de grande porte."
                  icon={Music}
                />
                
                <TimelineItem 
                  year="2017"
                  title="Fundação da BlackBelt CSGO Inteligente"
                  description="Por paixão ao ensino e ao CS, criou o projeto BlackBelt com foco em auxiliar jogadores de todos os níveis a evoluírem. Encerrou a carreira de DJ para se dedicar integralmente ao streaming e educação."
                  icon={GraduationCap}
                  highlight
                />
                
                <TimelineItem 
                  year="2018"
                  title="O Auge"
                  description="Ano marcante com viralizações épicas, incluindo o famoso 'Gank do Skipinho' e outros momentos memoráveis que consolidaram Wave como referência no cenário de CS brasileiro."
                  icon={Target}
                  highlight
                />
                
                <TimelineItem 
                  year="2019-2024"
                  title="Crescimento Contínuo"
                  description="Realizou diversos sorteios de itens raros, incluindo uma AWP Dragon Lore. Consolidou a comunidade com mais de 400 alunos ativos na BlackBelt e alcançou 440k+ seguidores na Twitch."
                  icon={Award}
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
                  Junte-se a milhares de jogadores que aprendem e se divertem todos os dias com WaveIGL
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/login">
                    <Button className="bg-gradient-to-r from-[#E38817] to-[#B86A10] hover:from-[#F59928] hover:to-[#E38817] text-white px-8">
                      Assinar Clube
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

