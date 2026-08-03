import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Cookie, Settings, Shield, Clock, ToggleLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://waveigl.com'

export const metadata: Metadata = {
  title: 'Política de Cookies',
  description: 'Política de Cookies do WaveIGL. Saiba quais cookies utilizamos (apenas essenciais para autenticação) e como gerenciá-los.',
  keywords: ['política de cookies', 'cookies', 'LGPD', 'WaveIGL cookies', 'Supabase'],
  openGraph: {
    title: 'Política de Cookies | WaveIGL',
    description: 'Saiba quais cookies utilizamos e como gerenciá-los.',
    url: `${siteUrl}/cookies`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Política de Cookies | WaveIGL',
    description: 'Política de Cookies em conformidade com a LGPD.',
  },
  alternates: {
    canonical: `${siteUrl}/cookies`,
  },
}

export default function CookiesPage() {
  const lastUpdate = '04 de dezembro de 2025'
  
  return (
    <div className="min-h-screen bg-[#0A0B0F] text-[#D9D9D9]">
      {/* Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(#E38817 1px, transparent 1px), linear-gradient(90deg, #E38817 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-[#E38817]/10 backdrop-blur-md bg-[#0A0B0F]/80">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <ArrowLeft className="w-5 h-5 text-[#D9D9D9]/50 group-hover:text-[#E38817] transition-colors" />
              <Image 
                src="/favicon.webp" 
                alt="WaveIGL" 
                width={40} 
                height={40}
                className="rounded-lg shadow-lg shadow-[#E38817]/30"
              />
              <span className="text-2xl font-bold">Wave<span className="text-[#E38817]">IGL</span></span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Title */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-[#E38817]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Cookie className="w-8 h-8 text-[#E38817]" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Política de Cookies</h1>
            <p className="text-[#D9D9D9]/60">Última atualização: {lastUpdate}</p>
          </div>

          {/* Quick Summary */}
          <Card className="bg-[#1E202F]/30 border-[#E38817]/10 mb-12">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Cookie className="w-5 h-5 text-[#E38817]" />
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[#D9D9D9]/80">
              <p>
                Utilizamos cookies essenciais para o funcionamento do site e cookies de análise para 
                melhorar sua experiência. Você pode gerenciar suas preferências a qualquer momento 
                através das configurações do seu navegador.
              </p>
            </CardContent>
          </Card>

          {/* Content Sections */}
          <div className="space-y-12 text-[#D9D9D9]/80 leading-relaxed">
            
            {/* O que são Cookies */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Cookie className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">1. O que são Cookies?</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>
                  Cookies são pequenos arquivos de texto armazenados no seu dispositivo (computador, tablet 
                  ou celular) quando você visita um site. Eles são amplamente utilizados para fazer os sites 
                  funcionarem de forma mais eficiente e fornecer informações aos proprietários do site.
                </p>
                <p>
                  Além de cookies, também podemos utilizar outras tecnologias similares como:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Local Storage:</strong> Armazenamento de dados no navegador</li>
                  <li><strong>Session Storage:</strong> Armazenamento temporário durante a sessão</li>
                  <li><strong>Pixels de rastreamento:</strong> Imagens invisíveis que coletam informações de uso</li>
                </ul>
              </div>
            </section>

            {/* Por que usamos */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">2. Por que Utilizamos Cookies?</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>Utilizamos cookies para diversos fins:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Manter você conectado durante a navegação</li>
                  <li>Lembrar suas preferências de configuração</li>
                  <li>Garantir segurança e prevenir fraudes</li>
                  <li>Analisar como o site é utilizado para melhorá-lo</li>
                  <li>Personalizar sua experiência</li>
                </ul>
              </div>
            </section>

            {/* Tipos de Cookies */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">3. Tipos de Cookies que Utilizamos</h2>
              </div>
              <div className="space-y-6 pl-9">
                
                {/* Essenciais */}
                <div className="bg-[#1E202F]/50 rounded-lg p-6 border border-[#E38817]/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[#D9D9D9] text-lg">🔒 Cookies Essenciais</h3>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Sempre Ativos</span>
                  </div>
                  <p className="text-sm mb-4">
                    Necessários para o funcionamento básico do site. Sem eles, o site não funciona corretamente.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#E38817]/10">
                          <th className="text-left py-2 text-[#E38817]">Cookie</th>
                          <th className="text-left py-2 text-[#E38817]">Finalidade</th>
                          <th className="text-left py-2 text-[#E38817]">Duração</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#D9D9D9]/70">
                        <tr className="border-b border-[#E38817]/5">
                          <td className="py-2 font-mono text-xs">sb-*-auth-token</td>
                          <td className="py-2">Token de autenticação (Supabase Auth)</td>
                          <td className="py-2">7 dias</td>
                        </tr>
                        <tr className="border-b border-[#E38817]/5">
                          <td className="py-2 font-mono text-xs">sb-*-auth-token-code-verifier</td>
                          <td className="py-2">Verificação PKCE para OAuth seguro</td>
                          <td className="py-2">Sessão</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono text-xs">sb-*-auth-refresh-token</td>
                          <td className="py-2">Renovação automática da sessão</td>
                          <td className="py-2">7 dias</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-[#D9D9D9]/50 mt-4">
                    * O asterisco (*) representa o ID único do projeto Supabase.
                  </p>
                </div>

                {/* Local Storage */}
                <div className="bg-[#1E202F]/50 rounded-lg p-6 border border-[#E38817]/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[#D9D9D9] text-lg">💾 Local Storage</h3>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Essencial</span>
                  </div>
                  <p className="text-sm mb-4">
                    Armazenamento local no navegador usado para manter sua sessão e preferências.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#E38817]/10">
                          <th className="text-left py-2 text-[#E38817]">Chave</th>
                          <th className="text-left py-2 text-[#E38817]">Finalidade</th>
                          <th className="text-left py-2 text-[#E38817]">Duração</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#D9D9D9]/70">
                        <tr>
                          <td className="py-2 font-mono text-xs">sb-*-auth-token</td>
                          <td className="py-2">Dados da sessão do usuário logado</td>
                          <td className="py-2">Até logout ou expiração</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-green-500/10 rounded-lg p-6 border border-green-500/20">
                  <h3 className="font-bold text-green-400 text-lg mb-3">✅ Boa Notícia!</h3>
                  <p className="text-sm text-[#D9D9D9]/80">
                    <strong>Não utilizamos cookies de terceiros, rastreamento ou publicidade.</strong> Todos os cookies 
                    que usamos são estritamente necessários para o funcionamento do sistema de autenticação. 
                    Não vendemos nem compartilhamos dados de navegação com terceiros.
                  </p>
                </div>

              </div>
            </section>

            {/* Duração */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">4. Duração dos Cookies</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>Os cookies podem ser classificados por sua duração:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-[#1E202F]/50 rounded-lg p-4 border border-[#E38817]/10">
                    <h4 className="font-semibold text-[#D9D9D9] mb-2">Cookies de Sessão</h4>
                    <p className="text-sm text-[#D9D9D9]/70">
                      São temporários e excluídos automaticamente quando você fecha o navegador.
                    </p>
                  </div>
                  <div className="bg-[#1E202F]/50 rounded-lg p-4 border border-[#E38817]/10">
                    <h4 className="font-semibold text-[#D9D9D9] mb-2">Cookies Persistentes</h4>
                    <p className="text-sm text-[#D9D9D9]/70">
                      Permanecem no seu dispositivo até expirar ou serem excluídos manualmente.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Como Gerenciar */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <ToggleLeft className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">5. Como Gerenciar seus Cookies</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>
                  Você pode controlar e/ou excluir cookies conforme desejar. A maioria dos navegadores 
                  permite que você:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Visualize quais cookies estão armazenados</li>
                  <li>Exclua todos ou alguns cookies</li>
                  <li>Bloqueie cookies de terceiros</li>
                  <li>Bloqueie cookies de sites específicos</li>
                  <li>Bloqueie todos os cookies</li>
                  <li>Exclua todos os cookies ao fechar o navegador</li>
                </ul>
                
                <div className="bg-[#1E202F]/50 rounded-lg p-4 border border-[#E38817]/10 mt-6">
                  <h4 className="font-semibold text-[#D9D9D9] mb-3">Links para configurações dos navegadores:</h4>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-[#E38817] hover:underline">
                        Google Chrome
                      </a>
                    </li>
                    <li>
                      <a href="https://support.mozilla.org/pt-BR/kb/limpar-cookies-dados-armazenados" target="_blank" rel="noopener noreferrer" className="text-[#E38817] hover:underline">
                        Mozilla Firefox
                      </a>
                    </li>
                    <li>
                      <a href="https://support.apple.com/pt-br/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-[#E38817] hover:underline">
                        Safari
                      </a>
                    </li>
                    <li>
                      <a href="https://support.microsoft.com/pt-br/microsoft-edge/excluir-cookies-no-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-[#E38817] hover:underline">
                        Microsoft Edge
                      </a>
                    </li>
                  </ul>
                </div>
                
                <p className="text-sm text-[#D9D9D9]/60 mt-4">
                  <strong>Atenção:</strong> Bloquear cookies essenciais pode impedir o funcionamento correto 
                  do site, incluindo a impossibilidade de fazer login.
                </p>
              </div>
            </section>

            {/* Base Legal */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">6. Base Legal (LGPD)</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>Conforme a Lei Geral de Proteção de Dados (LGPD):</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong>Cookies Essenciais:</strong> Base legal de execução de contrato (Art. 7º, V) - 
                    necessários para fornecer o serviço solicitado.
                  </li>
                  <li>
                    <strong>Cookies Funcionais e de Análise:</strong> Base legal de consentimento (Art. 7º, I) - 
                    utilizados apenas após sua permissão.
                  </li>
                </ul>
                <p>
                  Você pode revogar seu consentimento para cookies opcionais a qualquer momento através 
                  das configurações do navegador ou entrando em contato conosco.
                </p>
              </div>
            </section>

            {/* Alterações */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">7. Alterações desta Política</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>
                  Podemos atualizar esta Política de Cookies periodicamente para refletir mudanças em nossas 
                  práticas ou por razões operacionais, legais ou regulatórias.
                </p>
                <p>
                  Recomendamos que você revise esta política regularmente. A data da última atualização 
                  está indicada no topo da página.
                </p>
              </div>
            </section>

            {/* Contato */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Cookie className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">8. Contato</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>
                  Para dúvidas sobre o uso de cookies ou esta política, entre em contato:
                </p>
                <div className="bg-[#1E202F]/50 rounded-lg p-4 border border-[#E38817]/10">
                  <p><strong>E-mail:</strong> <a href="mailto:csgoblackbelt@gmail.com" className="text-[#E38817] hover:underline">csgoblackbelt@gmail.com</a></p>
                  <p><strong>Assunto:</strong> [Cookies] - Sua dúvida</p>
                </div>
              </div>
            </section>

          </div>

          {/* Footer Links */}
          <div className="mt-16 pt-8 border-t border-[#E38817]/10 flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/politica-privacidade" className="text-[#D9D9D9]/60 hover:text-[#E38817] transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/termos-de-uso" className="text-[#D9D9D9]/60 hover:text-[#E38817] transition-colors">
              Termos de Uso
            </Link>
            <Link href="/" className="text-[#D9D9D9]/60 hover:text-[#E38817] transition-colors">
              Voltar ao Início
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-[#E38817]/10">
        <div className="container mx-auto px-4 text-center text-sm text-[#D9D9D9]/40">
          <p>© 2025 WaveIGL. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

