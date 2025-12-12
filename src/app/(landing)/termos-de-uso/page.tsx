import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, FileText, AlertTriangle, CheckCircle, Ban, Shield, Scale, Gavel } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Termos de Uso | WaveIGL',
  description: 'Termos de Uso e Condições do Clube WaveIGL. Leia atentamente antes de utilizar nossos serviços.',
}

export default function TermosDeUsoPage() {
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
              <Gavel className="w-8 h-8 text-[#E38817]" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Termos de Uso</h1>
            <p className="text-[#D9D9D9]/60">Última atualização: {lastUpdate}</p>
          </div>

          {/* Important Notice */}
          <Card className="bg-[#E38817]/10 border-[#E38817]/30 mb-12">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <AlertTriangle className="w-6 h-6 text-[#E38817] shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-[#E38817] mb-2">Leia com atenção</p>
                  <p className="text-sm text-[#D9D9D9]/80">
                    Ao utilizar o Clube WaveIGL, você concorda com estes Termos de Uso. Se você não concordar 
                    com qualquer parte destes termos, não utilize nossos serviços.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Index */}
          <Card className="bg-[#1E202F]/30 border-[#E38817]/10 mb-12">
            <CardHeader>
              <CardTitle className="text-lg">Índice</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-2 text-sm">
              {[
                { href: '#definicoes', label: '1. Definições' },
                { href: '#servicos', label: '2. Descrição dos Serviços' },
                { href: '#cadastro', label: '3. Cadastro e Conta' },
                { href: '#assinatura', label: '4. Assinatura e Pagamento' },
                { href: '#regras', label: '5. Regras de Conduta' },
                { href: '#propriedade', label: '6. Propriedade Intelectual' },
                { href: '#responsabilidades', label: '7. Limitação de Responsabilidade' },
                { href: '#suspensao', label: '8. Suspensão e Cancelamento' },
                { href: '#modificacoes', label: '9. Modificações dos Termos' },
                { href: '#legislacao', label: '10. Legislação Aplicável' },
                { href: '#disposicoes', label: '11. Disposições Gerais' },
                { href: '#contato', label: '12. Contato' },
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
            
            {/* 1. Definições */}
            <section id="definicoes">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">1. Definições</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>Para os fins destes Termos de Uso, considera-se:</p>
                <ul className="space-y-3">
                  <li><strong className="text-[#E38817]">"WaveIGL" ou "nós":</strong> Refere-se ao Clube WaveIGL, operado por Conrado Koerich.</li>
                  <li><strong className="text-[#E38817]">"Usuário" ou "você":</strong> Pessoa física que utiliza os serviços do Clube WaveIGL.</li>
                  <li><strong className="text-[#E38817]">"Serviços":</strong> Plataforma web, chat unificado, acesso ao Discord VIP e demais funcionalidades.</li>
                  <li><strong className="text-[#E38817]">"Assinatura":</strong> Inscrição paga em qualquer das plataformas parceiras (Twitch, YouTube, Kick).</li>
                  <li><strong className="text-[#E38817]">"Conteúdo":</strong> Textos, imagens, vídeos, mensagens e qualquer material disponibilizado na plataforma.</li>
                </ul>
              </div>
            </section>

            {/* 2. Serviços */}
            <section id="servicos">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">2. Descrição dos Serviços</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>O Clube WaveIGL oferece os seguintes serviços para assinantes:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Chat Unificado:</strong> Interface que integra mensagens de Twitch, YouTube e Kick</li>
                  <li><strong>Discord VIP:</strong> Acesso a canais exclusivos no servidor Discord</li>
                  <li><strong>WhatsApp:</strong> Acesso ao grupo exclusivo mediante código único</li>
                  <li><strong>Aulas de CS2:</strong> Conteúdo educacional transmitido ao vivo</li>
                  <li><strong>Sorteios:</strong> Participação em sorteios exclusivos para membros</li>
                </ul>
                <p className="text-sm text-[#D9D9D9]/60">
                  Os serviços podem ser modificados, expandidos ou descontinuados a qualquer momento, 
                  mediante aviso prévio quando possível.
                </p>
              </div>
            </section>

            {/* 3. Cadastro */}
            <section id="cadastro">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">3. Cadastro e Conta</h2>
              </div>
              <div className="space-y-4 pl-9">
                <h3 className="font-semibold text-[#D9D9D9]">3.1. Requisitos</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Ter pelo menos 13 anos de idade (menores de 18 anos necessitam consentimento dos responsáveis)</li>
                  <li>Fornecer informações verdadeiras e atualizadas</li>
                  <li>Vincular pelo menos uma conta de plataforma de streaming (Twitch, YouTube ou Kick)</li>
                </ul>
                
                <h3 className="font-semibold text-[#D9D9D9] mt-6">3.2. Responsabilidades do Usuário</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Manter a segurança de suas credenciais de acesso</li>
                  <li>Não compartilhar acesso à conta com terceiros</li>
                  <li>Notificar imediatamente sobre uso não autorizado da conta</li>
                  <li>Responsabilizar-se por todas as atividades realizadas em sua conta</li>
                </ul>
              </div>
            </section>

            {/* 4. Assinatura */}
            <section id="assinatura">
              <div className="flex items-center gap-3 mb-4">
                <Scale className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">4. Assinatura e Pagamento</h2>
              </div>
              <div className="space-y-4 pl-9">
                <h3 className="font-semibold text-[#D9D9D9]">4.1. Formas de Acesso</h3>
                <p>
                  O acesso aos benefícios do Clube WaveIGL é concedido através de assinatura ativa em 
                  uma das seguintes plataformas:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Twitch (Sub Tier 1, 2 ou 3)</li>
                  <li>YouTube (Membro do canal)</li>
                  <li>Kick (Assinante do canal)</li>
                </ul>
                
                <h3 className="font-semibold text-[#D9D9D9] mt-6">4.2. Processamento de Pagamentos</h3>
                <p>
                  Os pagamentos são processados diretamente pelas plataformas de streaming (Twitch, YouTube, Kick). 
                  O WaveIGL não processa nem armazena dados de pagamento. Consulte os termos de cada plataforma 
                  para informações sobre reembolsos e cancelamentos.
                </p>
                
                <h3 className="font-semibold text-[#D9D9D9] mt-6">4.3. Vigência dos Benefícios</h3>
                <p>
                  Os benefícios permanecem ativos enquanto a assinatura estiver vigente na plataforma de origem. 
                  O cancelamento da assinatura resulta na perda de acesso aos benefícios ao término do período pago.
                </p>
              </div>
            </section>

            {/* 5. Regras */}
            <section id="regras">
              <div className="flex items-center gap-3 mb-4">
                <Ban className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">5. Regras de Conduta</h2>
              </div>
              <div className="space-y-4 pl-9">
                <h3 className="font-semibold text-[#D9D9D9]">5.1. Comportamento Esperado</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Tratar outros membros com respeito e cordialidade</li>
                  <li>Contribuir positivamente para a comunidade</li>
                  <li>Seguir as orientações dos moderadores e administradores</li>
                </ul>
                
                <h3 className="font-semibold text-[#D9D9D9] mt-6 text-red-400">5.2. Condutas Proibidas</h3>
                <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                  <p className="font-semibold text-red-400 mb-3">É estritamente proibido:</p>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>Assédio, bullying, discriminação ou discurso de ódio</li>
                    <li>Spam, flood ou mensagens repetitivas</li>
                    <li>Divulgação de conteúdo ilegal, pornográfico ou violento</li>
                    <li>Tentativas de fraude ou uso de bots/automação não autorizados</li>
                    <li>Compartilhamento de informações pessoais de terceiros (doxxing)</li>
                    <li>Promoção de cheats, hacks ou exploits em jogos</li>
                    <li>Uso de linguagem excessivamente ofensiva</li>
                    <li>Personificação de moderadores ou staff</li>
                    <li>Qualquer atividade que viole leis brasileiras</li>
                  </ul>
                </div>
                
                <h3 className="font-semibold text-[#D9D9D9] mt-6">5.3. Penalidades</h3>
                <p>
                  O descumprimento das regras pode resultar em advertência, timeout, banimento temporário 
                  ou permanente, a critério exclusivo da equipe de moderação, sem direito a reembolso.
                </p>
              </div>
            </section>

            {/* 6. Propriedade */}
            <section id="propriedade">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">6. Propriedade Intelectual</h2>
              </div>
              <div className="space-y-4 pl-9">
                <h3 className="font-semibold text-[#D9D9D9]">6.1. Direitos do WaveIGL</h3>
                <p>
                  Todo o conteúdo da plataforma, incluindo mas não limitado a logotipos, design, código-fonte, 
                  textos e imagens, é de propriedade do WaveIGL ou licenciado para uso, protegido por leis de 
                  direitos autorais e propriedade intelectual.
                </p>
                
                <h3 className="font-semibold text-[#D9D9D9] mt-6">6.2. Conteúdo do Usuário</h3>
                <p>
                  Ao enviar mensagens ou conteúdo na plataforma, você concede ao WaveIGL uma licença não exclusiva, 
                  gratuita e mundial para usar, reproduzir e exibir tal conteúdo no contexto dos serviços.
                </p>
                
                <h3 className="font-semibold text-[#D9D9D9] mt-6">6.3. Uso Permitido</h3>
                <p>
                  O usuário pode acessar e usar os serviços apenas para fins pessoais e não comerciais. 
                  É proibida a reprodução, modificação, distribuição ou uso comercial sem autorização expressa.
                </p>
              </div>
            </section>

            {/* 7. Responsabilidades */}
            <section id="responsabilidades">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">7. Limitação de Responsabilidade</h2>
              </div>
              <div className="space-y-4 pl-9">
                <h3 className="font-semibold text-[#D9D9D9]">7.1. Disponibilidade</h3>
                <p>
                  Os serviços são fornecidos "como estão". Não garantimos disponibilidade ininterrupta, 
                  livre de erros ou que atenda todas as expectativas do usuário.
                </p>
                
                <h3 className="font-semibold text-[#D9D9D9] mt-6">7.2. Limitações</h3>
                <p>O WaveIGL não se responsabiliza por:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Danos indiretos, incidentais ou consequenciais</li>
                  <li>Perda de dados ou interrupções de serviço</li>
                  <li>Condutas de terceiros ou outros usuários</li>
                  <li>Conteúdo de sites externos linkados na plataforma</li>
                  <li>Problemas técnicos nas plataformas de streaming parceiras</li>
                </ul>
                
                <h3 className="font-semibold text-[#D9D9D9] mt-6">7.3. Indenização</h3>
                <p>
                  O usuário concorda em indenizar e isentar o WaveIGL de qualquer reclamação, dano ou despesa 
                  decorrente do uso indevido dos serviços ou violação destes Termos.
                </p>
              </div>
            </section>

            {/* 8. Suspensão */}
            <section id="suspensao">
              <div className="flex items-center gap-3 mb-4">
                <Ban className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">8. Suspensão e Cancelamento</h2>
              </div>
              <div className="space-y-4 pl-9">
                <h3 className="font-semibold text-[#D9D9D9]">8.1. Pelo Usuário</h3>
                <p>
                  Você pode cancelar sua conta a qualquer momento desvinculando suas contas das plataformas. 
                  Seus dados serão tratados conforme nossa Política de Privacidade.
                </p>
                
                <h3 className="font-semibold text-[#D9D9D9] mt-6">8.2. Pelo WaveIGL</h3>
                <p>Podemos suspender ou encerrar sua conta, a nosso critério, em caso de:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Violação destes Termos de Uso</li>
                  <li>Atividade fraudulenta ou suspeita</li>
                  <li>Solicitação de autoridade competente</li>
                  <li>Inatividade prolongada (mais de 12 meses)</li>
                </ul>
              </div>
            </section>

            {/* 9. Modificações */}
            <section id="modificacoes">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">9. Modificações dos Termos</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>
                  Reservamos o direito de modificar estes Termos a qualquer momento. Alterações significativas 
                  serão comunicadas com antecedência de pelo menos 30 dias através do e-mail cadastrado ou 
                  aviso na plataforma.
                </p>
                <p>
                  O uso continuado dos serviços após as modificações constitui aceitação dos novos termos.
                </p>
              </div>
            </section>

            {/* 10. Legislação */}
            <section id="legislacao">
              <div className="flex items-center gap-3 mb-4">
                <Gavel className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">10. Legislação Aplicável e Foro</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>
                  Estes Termos são regidos pelas leis da República Federativa do Brasil, especialmente:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Código Civil Brasileiro (Lei nº 10.406/2002)</li>
                  <li>Código de Defesa do Consumidor (Lei nº 8.078/1990)</li>
                  <li>Marco Civil da Internet (Lei nº 12.965/2014)</li>
                  <li>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</li>
                </ul>
                <p className="mt-4">
                  Fica eleito o foro da comarca de Florianópolis, Santa Catarina, Brasil, para dirimir 
                  quaisquer questões decorrentes destes Termos, com exclusão de qualquer outro.
                </p>
              </div>
            </section>

            {/* 11. Disposições */}
            <section id="disposicoes">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">11. Disposições Gerais</h2>
              </div>
              <div className="space-y-4 pl-9">
                <ul className="space-y-4">
                  <li>
                    <strong className="text-[#D9D9D9]">Integralidade:</strong> Estes Termos constituem o acordo 
                    integral entre você e o WaveIGL, substituindo acordos anteriores.
                  </li>
                  <li>
                    <strong className="text-[#D9D9D9]">Independência:</strong> Se qualquer disposição for considerada 
                    inválida, as demais permanecerão em vigor.
                  </li>
                  <li>
                    <strong className="text-[#D9D9D9]">Renúncia:</strong> A não aplicação de qualquer direito não 
                    constitui renúncia ao mesmo.
                  </li>
                  <li>
                    <strong className="text-[#D9D9D9]">Cessão:</strong> Você não pode ceder ou transferir seus 
                    direitos sob estes Termos sem consentimento prévio.
                  </li>
                </ul>
              </div>
            </section>

            {/* 12. Contato */}
            <section id="contato">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-[#E38817]" />
                <h2 className="text-2xl font-bold text-[#D9D9D9]">12. Contato</h2>
              </div>
              <div className="space-y-4 pl-9">
                <p>Para dúvidas sobre estes Termos de Uso, entre em contato:</p>
                <div className="bg-[#1E202F]/50 rounded-lg p-4 border border-[#E38817]/10">
                  <p><strong>E-mail:</strong> <a href="mailto:csgoblackbelt@gmail.com" className="text-[#E38817] hover:underline">csgoblackbelt@gmail.com</a></p>
                  <p><strong>Assunto:</strong> [Termos de Uso] - Sua dúvida</p>
                </div>
              </div>
            </section>

          </div>

          {/* Footer Links */}
          <div className="mt-16 pt-8 border-t border-[#E38817]/10 flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/politica-privacidade" className="text-[#D9D9D9]/60 hover:text-[#E38817] transition-colors">
              Política de Privacidade
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

