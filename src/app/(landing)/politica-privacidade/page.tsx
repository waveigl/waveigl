import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Shield, Database, Eye, Lock, UserCheck, Globe, Mail, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Política de Privacidade | WaveIGL',
  description: 'Política de Privacidade do WaveIGL em conformidade com a LGPD - Lei Geral de Proteção de Dados.',
}

export default function PoliticaPrivacidadePage() {
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
              <Shield className="w-8 h-8 text-[#E38817]" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Política de Privacidade</h1>
            <p className="text-[#D9D9D9]/60">Última atualização: {lastUpdate}</p>
          </div>

          {/* Quick Links */}
          <Card className="bg-[#1E202F]/30 border-[#E38817]/10 mb-12">
            <CardHeader>
              <CardTitle className="text-lg">Índice</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-2 text-sm">
              {[
                { href: '#introducao', label: '1. Introdução e Identificação do Controlador' },
                { href: '#dados-coletados', label: '2. Dados Pessoais Coletados' },
                { href: '#finalidade', label: '3. Finalidade do Tratamento' },
                { href: '#base-legal', label: '4. Base Legal (LGPD)' },
                { href: '#compartilhamento', label: '5. Compartilhamento de Dados' },
                { href: '#retencao', label: '6. Retenção de Dados' },
                { href: '#direitos', label: '7. Seus Direitos (LGPD)' },
                { href: '#seguranca', label: '8. Segurança dos Dados' },
                { href: '#cookies', label: '9. Cookies' },
                { href: '#menores', label: '10. Menores de Idade' },
                { href: '#alteracoes', label: '11. Alterações desta Política' },
                { href: '#contato', label: '12. Contato do Encarregado (DPO)' },
              ].map((item) => (
                <a 
                  key={item.href}
                  href={item.href}
                  className="text-[#D9D9D9]/70 hover:text-[#E38817] transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </CardContent>
          </Card>

          {/* Content Sections */}
          <div className="space-y-12 text-[#D9D9D9]/80 leading-relaxed">
            
            {/* 1. Introdução */}
            <section id="introducao">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">1. Introdução e Identificação do Controlador</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>
                  Esta Política de Privacidade descreve como o <strong className="text-[#E38817]">WaveIGL</strong> 
                  ("nós", "nosso" ou "WaveIGL") coleta, usa, armazena e protege suas informações pessoais em conformidade 
                  com a <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong> e demais legislações aplicáveis.
                </p>
                <div className="bg-[#1E202F]/50 rounded-lg p-4 border border-[#E38817]/10">
                  <p className="font-semibold text-[#D9D9D9] mb-2">Controlador dos Dados:</p>
                  <p>WaveIGL (Conrado Koerich)</p>
                  <p>Florianópolis, Santa Catarina, Brasil</p>
                  <p>E-mail: <a href="mailto:csgoblackbelt@gmail.com" className="text-[#E38817] hover:underline">csgoblackbelt@gmail.com</a></p>
                </div>
                <p>
                  Ao utilizar nossos serviços, você concorda com os termos desta Política de Privacidade. 
                  Caso não concorde, recomendamos que não utilize nossos serviços.
                </p>
              </div>
            </section>

            {/* 2. Dados Coletados */}
            <section id="dados-coletados">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">2. Dados Pessoais Coletados</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>Coletamos os seguintes tipos de dados pessoais:</p>
                
                <div className="space-y-4">
                  <div className="bg-[#1E202F]/50 rounded-lg p-4 border border-[#E38817]/10">
                    <h4 className="font-semibold text-[#D9D9D9] mb-2">2.1. Dados de Cadastro</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Nome de usuário (das plataformas vinculadas)</li>
                      <li>Endereço de e-mail</li>
                      <li>Foto de perfil (obtida das plataformas vinculadas)</li>
                      <li>Identificadores únicos das plataformas (Twitch, YouTube, Kick, Discord)</li>
                    </ul>
                  </div>
                  
                  <div className="bg-[#1E202F]/50 rounded-lg p-4 border border-[#E38817]/10">
                    <h4 className="font-semibold text-[#D9D9D9] mb-2">2.2. Dados de Assinatura</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Status de assinatura em cada plataforma</li>
                      <li>Histórico de benefícios resgatados</li>
                      <li>Códigos de acesso gerados (WhatsApp)</li>
                    </ul>
                  </div>
                  
                  <div className="bg-[#1E202F]/50 rounded-lg p-4 border border-[#E38817]/10">
                    <h4 className="font-semibold text-[#D9D9D9] mb-2">2.3. Dados de Uso</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Mensagens enviadas no chat unificado</li>
                      <li>Logs de acesso (data, hora, IP)</li>
                      <li>Informações do dispositivo (navegador, sistema operacional)</li>
                    </ul>
                  </div>
                  
                  <div className="bg-[#1E202F]/50 rounded-lg p-4 border border-[#E38817]/10">
                    <h4 className="font-semibold text-[#D9D9D9] mb-2">2.4. Dados Obtidos de Terceiros</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Informações públicas do perfil Twitch, YouTube, Kick e Discord</li>
                      <li>Status de inscrição/assinatura nessas plataformas</li>
                    </ul>
                  </div>
                </div>
                
                <p className="text-sm text-[#D9D9D9]/60">
                  <strong>Nota:</strong> Não coletamos dados sensíveis como origem racial, convicção religiosa, 
                  opinião política, dados de saúde ou vida sexual, salvo quando estritamente necessário e com consentimento expresso.
                </p>
              </div>
            </section>

            {/* 3. Finalidade */}
            <section id="finalidade">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">3. Finalidade do Tratamento</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>Utilizamos seus dados pessoais para as seguintes finalidades:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Prestação do serviço:</strong> Autenticação, chat unificado, gestão de assinaturas e benefícios</li>
                  <li><strong>Comunicação:</strong> Envio de notificações sobre o serviço, atualizações e novidades</li>
                  <li><strong>Moderação:</strong> Garantir o cumprimento das regras da comunidade e prevenir abusos</li>
                  <li><strong>Melhoria do serviço:</strong> Análise de uso para aprimorar a experiência do usuário</li>
                  <li><strong>Segurança:</strong> Prevenção de fraudes, acessos não autorizados e atividades ilegais</li>
                  <li><strong>Obrigações legais:</strong> Cumprimento de obrigações legais e regulatórias</li>
                </ul>
              </div>
            </section>

            {/* 4. Base Legal */}
            <section id="base-legal">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">4. Base Legal para o Tratamento (Art. 7º da LGPD)</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>O tratamento dos seus dados pessoais é fundamentado nas seguintes bases legais da LGPD:</p>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <span className="text-[#E38817] font-bold">I.</span>
                    <p><strong>Execução de contrato (Art. 7º, V):</strong> Quando você se cadastra e utiliza nossos serviços, celebra um contrato conosco (Termos de Uso).</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[#E38817] font-bold">II.</span>
                    <p><strong>Consentimento (Art. 7º, I):</strong> Para comunicações de marketing e uso de cookies não essenciais.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[#E38817] font-bold">III.</span>
                    <p><strong>Legítimo interesse (Art. 7º, IX):</strong> Para melhoria dos serviços, segurança e prevenção de fraudes.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[#E38817] font-bold">IV.</span>
                    <p><strong>Cumprimento de obrigação legal (Art. 7º, II):</strong> Quando exigido por lei ou regulamentação.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Compartilhamento */}
            <section id="compartilhamento">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">5. Compartilhamento de Dados</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>Podemos compartilhar seus dados com:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Provedores de serviço:</strong> Supabase (banco de dados), Vercel (hospedagem), que atuam como operadores sob nossas instruções</li>
                  <li><strong>Plataformas de streaming:</strong> Twitch, YouTube, Kick para verificação de assinaturas (APIs oficiais)</li>
                  <li><strong>Discord:</strong> Para gestão do servidor VIP</li>
                  <li><strong>Autoridades competentes:</strong> Quando exigido por lei ou ordem judicial</li>
                </ul>
                <p className="text-sm text-[#D9D9D9]/60">
                  <strong>Importante:</strong> Não vendemos, alugamos ou comercializamos seus dados pessoais para terceiros para fins de marketing.
                </p>
                
                <div className="bg-[#1E202F]/50 rounded-lg p-4 border border-[#E38817]/10">
                  <h4 className="font-semibold text-[#D9D9D9] mb-2">Transferência Internacional</h4>
                  <p className="text-sm">
                    Alguns de nossos provedores de serviço podem estar localizados fora do Brasil (ex: Vercel nos EUA). 
                    Nesses casos, garantimos que a transferência ocorre em conformidade com o Art. 33 da LGPD, 
                    mediante cláusulas contratuais padrão ou certificações de privacidade adequadas.
                  </p>
                </div>
              </div>
            </section>

            {/* 6. Retenção */}
            <section id="retencao">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">6. Retenção de Dados</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>Mantemos seus dados pessoais pelos seguintes períodos:</p>
                <div className="space-y-3">
                  <div className="bg-[#1E202F]/50 rounded-lg p-4 border border-[#E38817]/10">
                    <p><strong>Dados de conta:</strong> Enquanto sua conta estiver ativa</p>
                  </div>
                  <div className="bg-[#1E202F]/50 rounded-lg p-4 border border-[#E38817]/10">
                    <p><strong>Logs de acesso:</strong> 6 meses (conforme Marco Civil da Internet, Art. 15)</p>
                  </div>
                  <div className="bg-[#1E202F]/50 rounded-lg p-4 border border-[#E38817]/10">
                    <p><strong>Dados de assinatura:</strong> 5 anos após o término (para fins contábeis e fiscais)</p>
                  </div>
                  <div className="bg-[#1E202F]/50 rounded-lg p-4 border border-[#E38817]/10">
                    <p><strong>Mensagens do chat:</strong> 30 dias (logs de moderação por 1 ano)</p>
                  </div>
                </div>
                <p className="text-sm text-[#D9D9D9]/60">
                  Após os períodos de retenção, os dados são anonimizados ou excluídos de forma segura.
                </p>
              </div>
            </section>

            {/* 7. Direitos */}
            <section id="direitos">
              <div className="flex items-center gap-3 mb-4">
                <UserCheck className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">7. Seus Direitos como Titular (Art. 18 da LGPD)</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>Você possui os seguintes direitos em relação aos seus dados pessoais:</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { title: 'Confirmação', desc: 'Confirmar a existência de tratamento de dados' },
                    { title: 'Acesso', desc: 'Acessar seus dados pessoais' },
                    { title: 'Correção', desc: 'Corrigir dados incompletos, inexatos ou desatualizados' },
                    { title: 'Anonimização/Bloqueio', desc: 'Solicitar anonimização ou bloqueio de dados desnecessários' },
                    { title: 'Portabilidade', desc: 'Solicitar portabilidade dos dados a outro fornecedor' },
                    { title: 'Eliminação', desc: 'Solicitar eliminação dos dados tratados com consentimento' },
                    { title: 'Informação', desc: 'Saber com quem compartilhamos seus dados' },
                    { title: 'Revogação', desc: 'Revogar consentimento a qualquer momento' },
                  ].map((right) => (
                    <div key={right.title} className="bg-[#1E202F]/50 rounded-lg p-3 border border-[#E38817]/10">
                      <p className="font-semibold text-[#E38817] text-sm">{right.title}</p>
                      <p className="text-sm text-[#D9D9D9]/70">{right.desc}</p>
                    </div>
                  ))}
                </div>
                <p>
                  Para exercer seus direitos, entre em contato conosco através do e-mail 
                  <a href="mailto:csgoblackbelt@gmail.com" className="text-[#E38817] hover:underline ml-1">csgoblackbelt@gmail.com</a>.
                  Responderemos em até 15 dias úteis.
                </p>
              </div>
            </section>

            {/* 8. Segurança */}
            <section id="seguranca">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">8. Segurança dos Dados</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>Implementamos medidas técnicas e organizacionais para proteger seus dados:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Criptografia em trânsito (HTTPS/TLS) e em repouso</li>
                  <li>Autenticação via OAuth 2.0 (sem armazenamento de senhas)</li>
                  <li>Controle de acesso baseado em funções (RBAC)</li>
                  <li>Monitoramento e logs de segurança</li>
                  <li>Backup regular dos dados</li>
                  <li>Infraestrutura em provedores com certificações de segurança (SOC 2, ISO 27001)</li>
                </ul>
                <p className="text-sm text-[#D9D9D9]/60">
                  Em caso de incidente de segurança que possa gerar risco ou dano relevante aos titulares, 
                  comunicaremos a ANPD e os afetados conforme Art. 48 da LGPD.
                </p>
              </div>
            </section>

            {/* 9. Cookies */}
            <section id="cookies">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">9. Cookies</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>
                  Utilizamos cookies para melhorar sua experiência. Para informações detalhadas sobre 
                  os cookies que utilizamos e como gerenciá-los, consulte nossa 
                  <Link href="/cookies" className="text-[#E38817] hover:underline ml-1">Política de Cookies</Link>.
                </p>
              </div>
            </section>

            {/* 10. Menores */}
            <section id="menores">
              <div className="flex items-center gap-3 mb-4">
                <UserCheck className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">10. Menores de Idade</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>
                  Nossos serviços são destinados exclusivamente a maiores de 18 anos.
                </p>
                <p>
                  Não coletamos intencionalmente dados de menores de 18 anos. Se você é responsável 
                  e acredita que um menor forneceu dados pessoais, entre em contato conosco para que 
                  possamos tomar as medidas necessárias.
                </p>
              </div>
            </section>

            {/* 11. Alterações */}
            <section id="alteracoes">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">11. Alterações desta Política</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>
                  Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre 
                  alterações significativas através do e-mail cadastrado ou aviso em destaque no site.
                </p>
                <p>
                  A continuidade do uso dos serviços após as alterações constitui aceitação da nova política.
                </p>
              </div>
            </section>

            {/* 12. Contato */}
            <section id="contato">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">12. Contato do Encarregado de Dados (DPO)</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>
                  Para questões relacionadas a esta Política de Privacidade ou ao tratamento dos seus 
                  dados pessoais, entre em contato com nosso Encarregado de Dados (DPO):
                </p>
                <div className="bg-[#1E202F]/50 rounded-lg p-4 border border-[#E38817]/10">
                  <p><strong>E-mail:</strong> <a href="mailto:csgoblackbelt@gmail.com" className="text-[#E38817] hover:underline">csgoblackbelt@gmail.com</a></p>
                  <p><strong>Assunto:</strong> [LGPD] - Sua solicitação</p>
                  <p className="text-sm text-[#D9D9D9]/60 mt-2">Prazo de resposta: até 15 dias úteis</p>
                </div>
                <p className="text-sm text-[#D9D9D9]/60">
                  Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD) 
                  caso entenda que seus direitos não foram atendidos.
                </p>
              </div>
            </section>

          </div>

          {/* Footer Links */}
          <div className="mt-16 pt-8 border-t border-[#E38817]/10 flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/termos-de-uso" className="text-[#D9D9D9]/60 hover:text-[#E38817] transition-colors">
              Termos de Uso
            </Link>
            <Link href="/cookies" className="text-[#D9D9D9]/60 hover:text-[#E38817] transition-colors">
              Política de Cookies
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

