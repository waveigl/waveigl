'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Eye,
  Clock,
  Globe,
  TrendingUp,
  Mail,
  ExternalLink,
  Percent,
  Target,
  Zap,
  MessageSquare,
  Video,
  Image as ImageIcon,
  Mic,
  Package,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  subtext,
  highlight = false 
}: { 
  icon: React.ElementType
  value: string
  label: string
  subtext?: string
  highlight?: boolean
}) {
  return (
    <Card className={`${highlight ? 'bg-gradient-to-br from-[#E38817]/20 to-[#1E202F]/50 border-[#E38817]/30' : 'bg-[#1E202F]/30 border-[#E38817]/10'}`}>
      <CardContent className="p-6">
        <Icon className={`w-8 h-8 mb-4 ${highlight ? 'text-[#E38817]' : 'text-[#D9D9D9]/60'}`} />
        <div className={`text-3xl font-bold mb-1 ${highlight ? 'text-[#E38817]' : 'text-[#D9D9D9]'}`}>
          {value}
        </div>
        <div className="text-[#D9D9D9]/60 text-sm">{label}</div>
        {subtext && <div className="text-[#D9D9D9]/40 text-xs mt-1">{subtext}</div>}
      </CardContent>
    </Card>
  )
}

function PlatformCard({ 
  name, 
  followers, 
  viewShare,
  color,
  url
}: { 
  name: string
  followers: string
  viewShare: string
  color: string
  url: string
}) {
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block group"
    >
      <Card className="bg-[#1E202F]/30 border-[#E38817]/10 hover:border-[#E38817]/30 transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="font-bold text-[#D9D9D9] group-hover:text-[#E38817] transition-colors">
                {name}
              </span>
            </div>
            <ExternalLink className="w-4 h-4 text-[#D9D9D9]/30 group-hover:text-[#E38817] transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[#D9D9D9]/40 mb-1">Seguidores</div>
              <div className="text-[#D9D9D9] font-semibold">{followers}</div>
            </div>
            <div>
              <div className="text-[#D9D9D9]/40 mb-1">% das Views</div>
              <div className="text-[#E38817] font-semibold">{viewShare}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </a>
  )
}

function AdFormatCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex gap-4 p-4 bg-[#1E202F]/20 rounded-xl border border-[#E38817]/5 hover:border-[#E38817]/20 transition-colors">
      <div className="w-12 h-12 bg-[#E38817]/10 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-[#E38817]" />
      </div>
      <div>
        <h4 className="font-bold text-[#D9D9D9] mb-1">{title}</h4>
        <p className="text-sm text-[#D9D9D9]/60">{description}</p>
      </div>
    </div>
  )
}

export default function MidiaKitPage() {
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
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#E38817]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-[#1E202F]/30 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-[#E38817]/10 backdrop-blur-md bg-[#0A0B0F]/80">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-center">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-[#D9D9D9]/70 hover:text-[#E38817] transition-colors font-medium">
                Home
              </Link>
              <Link href="/sobre" className="text-[#D9D9D9]/70 hover:text-[#E38817] transition-colors font-medium">
                Sobre
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <Badge className="mb-6 bg-[#E38817]/10 text-[#E38817] border-[#E38817]/30">
              📊 Mídia Kit 2025
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black mb-6">
              Anuncie com <span className="text-[#E38817]">WaveIGL</span>
            </h1>
            <p className="text-xl text-[#D9D9D9]/70 max-w-2xl mx-auto">
              Alcance uma audiência engajada de gamers e entusiastas de Counter-Strike 2
            </p>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16">
            <StatCard 
              icon={Eye} 
              value="~2M" 
              label="Views por Mês" 
              subtext="Todas as plataformas"
              highlight
            />
            <StatCard 
              icon={Users} 
              value="440k+" 
              label="Seguidores Totais" 
              subtext="Comunidade ativa"
            />
            <StatCard 
              icon={Clock} 
              value="70h" 
              label="Live por Semana" 
              subtext="Conteúdo constante"
            />
            <StatCard 
              icon={Percent} 
              value="5%" 
              label="Taxa de Engajamento" 
              subtext="Posts e vídeos"
            />
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="relative z-10 py-16 border-t border-[#E38817]/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
              <Globe className="w-8 h-8 text-[#E38817]" />
              Plataformas
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <PlatformCard 
                name="Twitch" 
                followers="440k" 
                viewShare="30%"
                color="#9146FF"
                url="https://twitch.tv/waveigl"
              />
              <PlatformCard 
                name="YouTube" 
                followers="34.5k" 
                viewShare="25%"
                color="#FF0000"
                url="https://youtube.com/@waveigl"
              />
              <PlatformCard 
                name="Instagram" 
                followers="20.7k" 
                viewShare="15%"
                color="#E4405F"
                url="https://instagram.com/waveigl"
              />
              <PlatformCard 
                name="TikTok" 
                followers="500" 
                viewShare="10%"
                color="#000000"
                url="https://tiktok.com/@waveigl"
              />
              <PlatformCard 
                name="Kick" 
                followers="840" 
                viewShare="5%"
                color="#53FC18"
                url="https://kick.com/waveigloficial"
              />
              <PlatformCard 
                name="Outras" 
                followers="Kwai, Facebook" 
                viewShare="15%"
                color="#D9D9D9"
                url="#"
              />
            </div>
            
            <Card className="bg-[#1E202F]/20 border-[#E38817]/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-[#E38817]" />
                  <span className="font-bold text-[#D9D9D9]">Distribuição de Views Mensal</span>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center text-sm">
                  {[
                    { platform: 'Twitch', share: '30%', color: '#9146FF' },
                    { platform: 'YouTube', share: '25%', color: '#FF0000' },
                    { platform: 'Instagram', share: '15%', color: '#E4405F' },
                    { platform: 'TikTok', share: '10%', color: '#000000' },
                    { platform: 'Kwai', share: '5%', color: '#FF6600' },
                    { platform: 'Facebook', share: '5%', color: '#1877F2' },
                  ].map((item) => (
                    <div key={item.platform}>
                      <div 
                        className="text-2xl font-bold mb-1"
                        style={{ color: item.color }}
                      >
                        {item.share}
                      </div>
                      <div className="text-[#D9D9D9]/50 text-xs">{item.platform}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="relative z-10 py-16 border-t border-[#E38817]/10 bg-[#1E202F]/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
              <Target className="w-8 h-8 text-[#E38817]" />
              Audiência
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Demographics */}
              <Card className="bg-[#1E202F]/30 border-[#E38817]/10">
                <CardHeader>
                  <CardTitle className="text-lg text-[#D9D9D9]">Faixa Etária</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { age: '18-24 anos', percent: 27.4 },
                    { age: '25-34 anos', percent: 51.9 },
                    { age: '35-44 anos', percent: 14.0 },
                    { age: '13-17 anos', percent: 2.3 },
                    { age: '45+ anos', percent: 4.4 },
                  ].map((item) => (
                    <div key={item.age}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#D9D9D9]/70">{item.age}</span>
                        <span className="text-[#E38817] font-semibold">{item.percent}%</span>
                      </div>
                      <div className="h-2 bg-[#0A0B0F] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#E38817] to-[#B86A10] rounded-full"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-[#D9D9D9]/40 mt-4 pt-4 border-t border-[#E38817]/10">
                    📊 Público majoritário: 25-34 anos (51.9%)
                  </p>
                </CardContent>
              </Card>
              
              {/* Gender & Location */}
              <div className="space-y-6">
                <Card className="bg-[#1E202F]/30 border-[#E38817]/10">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#D9D9D9]">Gênero</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="h-4 bg-[#0A0B0F] rounded-full overflow-hidden flex">
                          <div className="h-full bg-[#E38817]" style={{ width: '98%' }} />
                          <div className="h-full bg-[#FF69B4]" style={{ width: '2%' }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-3 text-sm">
                      <span className="text-[#D9D9D9]/70">
                        <span className="text-[#E38817] font-bold">98%</span> Masculino
                      </span>
                      <span className="text-[#D9D9D9]/70">
                        <span className="text-pink-400 font-bold">2%</span> Feminino
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#1E202F]/30 border-[#E38817]/10">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#D9D9D9]">Localização</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { country: '🇧🇷 Brasil', percent: '93.2%' },
                      { country: '🇵🇹 Portugal', percent: '3.7%' },
                      { country: '🇺🇸 Estados Unidos', percent: '0.4%' },
                      { country: '🌍 Outros', percent: '2.7%' },
                    ].map((item) => (
                      <div key={item.country} className="flex justify-between text-sm">
                        <span className="text-[#D9D9D9]/70">{item.country}</span>
                        <span className="text-[#E38817] font-semibold">{item.percent}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ad Formats */}
      <section className="relative z-10 py-16 border-t border-[#E38817]/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
              <Zap className="w-8 h-8 text-[#E38817]" />
              Formatos de Anúncio
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <AdFormatCard 
                icon={Video}
                title="Overlay na Live"
                description="Banner permanente durante a transmissão com sua marca em destaque"
              />
              <AdFormatCard 
                icon={Mic}
                title="Menção ao Vivo"
                description="Citação e recomendação do produto/serviço durante a live"
              />
              <AdFormatCard 
                icon={ImageIcon}
                title="Post no Instagram"
                description="Publicação dedicada com conteúdo sobre sua marca"
              />
              <AdFormatCard 
                icon={Video}
                title="Vídeo Dedicado"
                description="Vídeo completo no YouTube focado no seu produto"
              />
              <AdFormatCard 
                icon={MessageSquare}
                title="Comando no Chat"
                description="Comando personalizado no chat com informações do anunciante"
              />
              <AdFormatCard 
                icon={Package}
                title="Sorteio Patrocinado"
                description="Sorteio de produtos com destaque para a marca patrocinadora"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="relative z-10 py-16 border-t border-[#E38817]/10 bg-[#1E202F]/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              Marcas que <span className="text-[#E38817]">confiam</span> em nós
            </h2>
            
            <div className="flex flex-wrap justify-center gap-6">
              {['KeyDrop', 'Hellcase', 'CSMoney'].map((brand) => (
                <div 
                  key={brand}
                  className="px-8 py-4 bg-[#1E202F]/30 border border-[#E38817]/10 rounded-xl flex items-center gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-[#E38817]" />
                  <span className="font-semibold text-[#D9D9D9]">{brand}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 border-t border-[#E38817]/10">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Vamos <span className="text-[#E38817]">conversar</span>?
            </h2>
            <p className="text-[#D9D9D9]/60 mb-8 text-lg">
              Entre em contato para discutir parcerias e oportunidades de anúncio
            </p>
            
            <Card className="bg-[#1E202F]/30 border-[#E38817]/20 mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-3 text-lg">
                  <Mail className="w-6 h-6 text-[#E38817]" />
                  <a 
                    href="mailto:csgoblackbelt@gmail.com" 
                    className="text-[#E38817] font-semibold hover:underline"
                  >
                    csgoblackbelt@gmail.com
                  </a>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:csgoblackbelt@gmail.com">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-[#E38817] to-[#B86A10] hover:from-[#F59928] hover:to-[#E38817] text-white px-10 h-14 shadow-lg shadow-[#E38817]/25"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Enviar Email
                </Button>
              </a>
              <Link href="/sobre">
                <Button 
                  size="lg"
                  variant="outline" 
                  className="border-[#E38817]/30 hover:bg-[#E38817]/10 hover:border-[#E38817] px-10 h-14"
                >
                  Conhecer WaveIGL
                </Button>
              </Link>
            </div>
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

