# Changelog - WaveIGL

## [0.0.15] - 2025-01-15

### ✨ Features
- Added: Scripts automáticos para fazer push da migração via Supabase CLI
- Added: `push-migration.ps1` para Windows (PowerShell)
- Added: `push-migration.sh` para macOS/Linux (Bash)
- Added: Guia completo de Supabase CLI em `docs/SUPABASE_CLI_SETUP.md`

### 🔧 Improvements
- Improved: Documentação dos scripts com 3 opções de setup
- Improved: Instruções claras para cada sistema operacional
- Improved: Troubleshooting expandido

### 📝 Documentation
- Added: `docs/SUPABASE_CLI_SETUP.md` - Guia do Supabase CLI
- Updated: `scripts/README.md` com todas as opções de setup

## [0.0.14] - 2025-01-15

### 🔧 Improvements
- Improved: Mensagens de erro mais claras quando tabelas não existem
- Improved: Documentação de setup da migração
- Improved: Script SQL com instruções passo a passo

### 📝 Documentation
- Added: `docs/SETUP_MIGRATION.md` com guia completo de migração
- Added: `scripts/run-migration.sql` com SQL pronto para copiar/colar
- Added: Instruções claras para executar migração no Supabase

### 🐛 Bug Fixes
- Fixed: Detecção de erro quando tabelas não existem
- Fixed: Mensagem de erro mais informativa na página de setup

## [0.0.13] - 2025-01-15

### ✨ Features
- Added: Página web de setup `/admin/setup` para configurar senha sem terminal
- Added: Assistente interativo com 4 passos (Welcome → User ID → Password → SQL)
- Added: Endpoint `/api/admin/my-user-id` para obter User ID automaticamente
- Added: Endpoint `/api/admin/generate-password-hash` para gerar hash bcrypt
- Added: Validação de força de senha em tempo real na página
- Added: Botão de copiar comando SQL para clipboard
- Added: Suporte para mostrar contas vinculadas (Twitch, Kick, YouTube)

### 🔧 Improvements
- Improved: UX ao permitir setup via interface web (sem terminal)
- Improved: Validação visual de requisitos de senha
- Improved: Feedback em tempo real enquanto digita a senha
- Improved: Design responsivo e moderno com Tailwind

### 📝 Documentation
- Added: Scripts auxiliares em `scripts/README.md`
- Added: Página de setup acessível em `/admin/setup`

## [0.0.12] - 2025-01-15

### 🔐 Security
- Fixed: Modal de senha agora só aparece se a senha estiver configurada no banco
- Added: Endpoint `/api/admin/password-configured` para verificar se senha está configurada
- Added: Script `scripts/setup-admin-password.js` para gerar hash bcrypt de forma segura
- Added: Script `scripts/find-admin-user-id.sql` para encontrar User ID no Supabase

### ✨ Features
- Added: Verificação automática se senha está configurada antes de mostrar modal
- Added: Se senha não estiver configurada, painel abre sem pedir autenticação
- Added: Suporte para setup gradual da senha (pode ser configurada depois)

### 🔧 Improvements
- Improved: UX ao não forçar senha se não estiver configurada
- Improved: Fluxo de setup com scripts auxiliares
- Improved: Documentação com instruções passo a passo

### 📝 Documentation
- Added: `docs/ADMIN_PASSWORD_SETUP.md` com guia completo de setup
- Added: Scripts para facilitar configuração da senha

## [0.0.11] - 2025-01-15

### 🔐 Security
- Added: Sistema de proteção por senha para painel admin com bcrypt
- Added: Migração SQL para tabelas de segurança (`admin_security_config`, `admin_password_audit`)
- Added: Rate limiting com bloqueio de 15 minutos após 5 tentativas falhadas
- Added: Auditoria completa de tentativas de acesso (IP, User-Agent, timestamp)
- Added: Validação de força de senha (maiúscula, minúscula, número, caractere especial)
- Added: Modal de autenticação por senha antes de acessar painel admin

### ✨ Features
- Added: Componente `AdminPasswordModal` para inserção segura de senha
- Added: Função `verifyAdminPassword` com proteção contra força bruta
- Added: Função `hashPassword` usando bcrypt com 12 rounds
- Added: Função `validatePasswordStrength` para validar requisitos de senha
- Added: Endpoint `/api/admin/verify-password` para verificação server-side
- Added: Hook `useAdminPanel` atualizado com estado de verificação de senha
- Added: Auditoria de tentativas de acesso com logs estruturados

### 🔧 Improvements
- Improved: Segurança do painel admin com autenticação em duas camadas (OAuth + Senha)
- Improved: Performance com cache de 5 minutos para módulos
- Improved: UX com modal de senha elegante e responsivo
- Improved: Proteção contra força bruta com bloqueio progressivo
- Improved: Logs estruturados para auditoria de segurança

### 🗄️ Database
- Added: Tabela `admin_security_config` para armazenar hash de senha
- Added: Tabela `admin_password_audit` para auditoria de tentativas
- Added: RLS policies para proteger dados de segurança
- Added: Índices para performance em queries de auditoria
- Added: Triggers para atualizar timestamp automaticamente

### 🧪 Tests
- Added: 28 testes para funções de proteção por senha
- Added: Testes de hash bcrypt com salt aleatório
- Added: Testes de validação de força de senha
- Added: Testes de bloqueio por tentativas excessivas
- Added: Testes de integração completa do fluxo de autenticação

### 📦 Dependencies
- Added: `bcrypt@^5.1.1` para hash seguro de senhas
- Added: `@types/bcrypt` para tipos TypeScript

## [0.0.10] - 2025-01-15

### ✨ Features
- Added: Admin panel agora abre ao clicar no badge de cargo (Admin/Streamer)
- Added: Integração do AdminPanel com o dashboard via estado `showAdminPanel`
- Added: Comportamento interativo no badge de cargo para usuários admin/streamer

### 🔧 Improvements
- Improved: UX ao permitir acesso rápido ao painel admin pelo badge de cargo
- Improved: Feedback visual com cursor pointer e hover effect no badge para admin/streamer
- Improved: Segurança mantida com verificação server-side no AdminPanel

## [0.0.9] - 2025-01-15

### 🐛 Bug Fixes
- Fixed: Botão "Assinar Clube" agora não é renderizado para usuários já assinantes
- Fixed: Botão "Assinar Clube" não carrega no client para usuários com status ativo

### ✨ Features
- Added: Condicional `{!isClubMember && <Button>}` para ocultar botão de assinatura para membros ativos
- Added: Condicional de texto dinâmico no badge - muda de "Sem Clube" para "Assinante" baseado no status do Mercado Pago
- Added: Badge agora exibe status real da assinatura usando `clubOnboardingData?.subscription_status`

### 🔧 Improvements
- Improved: Performance ao não renderizar botão desnecessário para assinantes
- Improved: UX ao remover botão de assinatura quando usuário já é membro do clube
- Improved: Feedback visual ao mostrar "Assinante" quando status é 'active' no Mercado Pago
- Improved: Badge agora reflete o estado real da assinatura em tempo real

## [0.0.8] - 2025-01-15

### ✨ Features
- Added: Painel admin completo para Gabriel Toth (ogabrieltoth)
- Added: Controle individual de módulos de chat (Twitch, Kick, YouTube)
- Added: Controle individual de tipos de mensagens (sub, gift, raid, follow, cheer, host, etc)
- Added: Grupo de mensagens com toggle global (desativa todas mantendo config individual)
- Added: Controle de player de vídeo (ligar/desligar)
- Added: Controle de mensagens internas do sistema
- Added: Auditoria completa de ações do admin (logs com IP, User-Agent, timestamp)
- Added: Hook `useAdminPanel` para gerenciar painel admin
- Added: Hook `useChatStatus` para verificar status dos módulos
- Added: Componente `ChatOfflineNotice` para mostrar quando chat está offline
- Added: Componente `AdminModuleStatus` para debug de status
- Added: Filtro de mensagens baseado em configurações de admin

### 🔧 Improvements
- Improved: Sistema de cache para módulos (5 minutos TTL)
- Improved: Detecção automática de tipo de mensagem por badges e conteúdo
- Improved: API endpoints com verificação de permissão server-side
- Improved: Segurança: Painel admin não renderiza client-side para usuários comuns
- Improved: Auditoria: Todas as ações registram IP, User-Agent e timestamp

### 🗄️ Database
- Added: Tabela `admin_module_settings` para configurações de módulos
- Added: Tabela `admin_message_settings` para configurações de mensagens
- Added: Tabela `admin_action_log` para auditoria de ações
- Added: RLS policies para proteger dados de admin
- Added: Índices para performance em queries de logs

### 🧪 Tests
- Added: Testes unitários para verificação de admin (verify.test.ts)
- Added: Testes unitários para filtro de chat (chat-filter.test.ts)

### 📝 Documentation
- Added: Tipos TypeScript para admin (admin.types.ts)
- Added: Comentários JSDoc em todas as funções públicas
- Added: Exemplos de integração em `src/lib/chat/message-processor.ts` e `src/lib/chat/hub-with-filters.ts`

### 🔐 Security
- Security: Apenas Gabriel Toth (ID Twitch: 129980106, ID Kick: 4053403) pode acessar painel
- Security: Verificação server-side em todos os endpoints
- Security: Componente admin não renderiza para usuários comuns
- Security: Auditoria completa de todas as ações

## [0.0.7] - 2025-01-13

### 🐛 Bug Fixes
- Fixed: `sendStreamerWhisper` em `commands.ts` não enviava whispers para subscribers reais
- Fixed: Função bloqueava se `authorized_scopes` não estivesse no banco (agora tenta enviar mesmo assim)
- Fixed: Falta de logs detalhados para diagnosticar problemas de whisper
- Fixed: Token expirado não era renovado automaticamente
- Fixed: YouTube detectava lives de outros canais em vez de apenas do WaveIGL
- Fixed: Scraping do YouTube não validava channelId antes de considerar como live válida

### 🔧 Improvements
- Improved: Logs extremamente detalhados em `sendStreamerWhisper` para debug completo
- Improved: Tratamento de `authorized_scopes` como string ou array
- Improved: Diagnóstico detalhado para cada código de erro HTTP (400, 401, 403, 404, 429)
- Improved: Renovação automática de token quando expirado (401)
- Improved: Mensagens de erro explicativas para cada cenário de falha
- Improved: YouTube scraping agora valida channelId e nome do canal antes de aceitar live
- Improved: Logs detalhados no scraping do YouTube para debug
- Improved: Discord OAuth callback com diagnóstico detalhado para erros 401 (invalid_client) e 400

### ⏸️ Temporarily Disabled
- Disabled: Notificações de sub no chat (queueMessage) - aguardando whisper funcionar corretamente
- Note: Discord notifications e whispers continuam funcionando normalmente

### 📝 Documentation
- Updated: TWITCH_WHISPER_FIX.md com informações sobre a função correta
- Added: Logs explicando cada passo do envio de whisper
- Added: Logs de validação de canal no YouTube scraping
- Added: Diagnóstico de erros de OAuth do Discord

---

## [0.0.6] - 2025-01-13

### 🐛 Bug Fixes
- Fixed: Whispers não estavam sendo enviados para subscribers na Twitch
- Fixed: Função `sendTwitchWhisper` não validava `toUserId` corretamente
- Fixed: Falta de tratamento de erros e logging estruturado no envio de whispers
- Fixed: Credenciais não configuradas não eram diagnosticadas corretamente

### ✨ Features
- Added: Comprehensive Twitch whisper validation test suite (23 tests)
- Added: Detailed error diagnostics para problemas comuns de whisper
- Added: Validação de toUserId antes de enviar whisper

### 🔧 Improvements
- Improved: Logs estruturados com contexto completo para debug
- Improved: Tratamento de erros específicos (400, 401, 403)
- Improved: Mensagens de erro mais descritivas
- Improved: Validação de credenciais com mensagens claras

### 📝 Documentation
- Added: Comments explicando requisitos de whisper na Twitch
- Added: Diagnóstico de erros comuns (usuário não segue, bloqueou whispers, etc)

### 🔐 Security
- Added: Validação de toUserId para evitar injeção
- Added: Verificação de credenciais antes de fazer requisição

---

## [0.0.5] - 2025-01-13

### 🐛 Bug Fixes
- Fixed: YouTube live detection agora valida que é uma live **AO VIVO** (não vídeo pré-gravado)
- Fixed: YouTube live detection agora valida que é do canal **WaveIGL** (não outro canal)
- Fixed: Chat offline mesmo com live online - agora valida `actualStartTime` e `actualEndTime` corretamente
- Fixed: Removed vídeos pré-gravados sendo detectados como lives

### ✨ Features
- Added: Comprehensive YouTube live validation test suite (11 tests)
- Added: API validation para confirmar live status antes de usar liveChatId
- Added: Channel ID validation para garantir que é do WaveIGL

### 🔧 Improvements
- Improved: YouTube live detection agora usa API para validar status real
- Improved: Scraping agora procura por indicadores de live ativa
- Improved: Logs estruturados para debug de detecção de live
- Improved: Validação em múltiplas camadas (scraping + API)

### 📝 Documentation
- Updated: Logs com mensagens claras sobre validação de live
- Added: Comments explicando validações de live ao vivo

### 🔐 Security
- Added: Validação de channelId para evitar lives de outros canais

---

## [0.0.4] - 2025-01-13

### 🐛 Bug Fixes
- Fixed: TypeScript error em `useClubSubscription.ts` - notificationData implicitly has type 'any'
- Fixed: Duplicate `.env.example` and `env.example` files consolidated into single `.env.example`

### ✨ Features
- Added: Comprehensive versioning rules and documentation in `.kiro/steering/VERSIONING.md`
- Added: Mandatory version update checklist before commits

### 📝 Documentation
- Updated: README.md with complete versionamento section
- Updated: README.md with development scripts and testing information
- Updated: README.md with links to all steering documentation
- Updated: `.env.example` with consolidated environment variables
- Created: `.kiro/steering/VERSIONING.md` with semantic versioning rules

### 🔧 Improvements
- Improved: Type safety in `useClubSubscription.ts` with explicit type annotation
- Improved: Environment configuration documentation
- Improved: Development workflow documentation

---

## [0.0.3] - 2025-01-13

### 🐛 Bug Fixes
- Fixed: ClubSubscriptionWidget não exibia "Clube Ativo" quando usuário já tinha assinatura
- Fixed: TypeScript error em useClubSubscription com notificationData

### ✨ Features
- Added: Comprehensive test suite para ClubSubscriptionWidget (11 tests)

### 📝 Documentation
- Updated: CHANGELOG.md com novo formato
- Updated: .env.example consolidado em um único arquivo

### 🔧 Improvements
- Improved: Type safety em testes com MockEligibilityData interface

---

## [0.0.0] - 2025-10-21

### ✨ Implementação Inicial Completa

Primeira versão completa do sistema WaveIGL com todas as funcionalidades planejadas.### 🎉 Funcionalidades Implementadas

#### Core
- ✅ Landing page SEO otimizada com metadata e schemas
- ✅ Sistema de autenticação multi-plataforma (Twitch, YouTube, Kick)
- ✅ Dashboard com player de vídeo unificado
- ✅ Chat unificado em tempo real
- ✅ Sistema de moderação cross-platform
- ✅ Integração com Mercado Pago (R$9,90/mês)
- ✅ Bot Discord com cargos automáticos
- ✅ Sistema de permissões (Owner, Admin, Moderador)

#### Infraestrutura
- ✅ Next.js 15 com App Router
- ✅ TypeScript
- ✅ Tailwind CSS + shadcn/ui
- ✅ Supabase (PostgreSQL + Realtime + Auth)
- ✅ Vercel Cron Jobs
- ✅ Middleware para gerenciamento de sessões

### 📦 Dependências Principais

```json
{
  "@supabase/ssr": "^0.5.2",
  "@supabase/supabase-js": "^2.45.4",
  "next": "^15.0.3",
  "react": "^18.3.1",
  "discord.js": "^14.16.3",
  "mercadopago": "^2.0.15"
}
```

### 🔄 Migrações Importantes

#### Supabase
- **Removido**: `@supabase/auth-helpers-nextjs` (deprecated)
- **Adicionado**: `@supabase/ssr` (novo padrão oficial)
- Implementado middleware para gerenciamento de sessões
- Atualizado para usar `createBrowserClient` e `createServerClient`

#### Next.js
- Atualizado para Next.js 15
- Removido `experimental.appDir` (agora é padrão)
- Configuração de imagens atualizada para `remotePatterns`

#### ESLint
- Atualizado para ESLint 9 (última versão)
- Configuração compatível com Next.js 15

### 📋 Estrutura do Projeto

```
waveigl/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (landing)/           # Landing page
│   │   ├── auth/                # Autenticação
│   │   ├── dashboard/           # Dashboard principal
│   │   └── api/                 # API Routes
│   │       ├── auth/            # OAuth handlers
│   │       ├── subscription/    # Mercado Pago
│   │       ├── moderation/      # Sistema de moderação
│   │       ├── chat/            # Chat unificado
│   │       └── discord/         # Bot Discord
│   ├── components/              # Componentes React
│   │   ├── ui/                  # Componentes base
│   │   ├── VideoPlayer.tsx
│   │   ├── UnifiedChat.tsx
│   │   └── PlatformSelector.tsx
│   ├── lib/                     # Bibliotecas
│   │   ├── supabase/            # Cliente Supabase
│   │   └── permissions.ts       # Sistema de permissões
│   ├── types/                   # TypeScript types
│   └── middleware.ts            # Middleware Supabase
├── supabase/
│   ├── migrations/              # Migrations SQL
│   └── config.toml              # Configuração Supabase
└── public/                      # Assets estáticos
```

### 🗄️ Banco de Dados

#### Tabelas Criadas
- `users` - Usuários do sistema
- `linked_accounts` - Contas vinculadas (Twitch, YouTube, Kick)
- `moderation_actions` - Ações de moderação
- `active_timeouts` - Timeouts ativos para reaplicação
- `chat_messages` - Mensagens do chat unificado

### 🔒 Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Middleware para proteção de rotas
- Validação de permissões em todas as operações
- Tokens seguros para autenticação
- Sanitização de inputs

### 🚀 Deploy

#### Vercel
- Configurado para deploy automático
- Cron Jobs para:
  - Reaplicação de timeouts (*/5 * * * *)
  - Polling do chat (*/1 * * * *)
- Variáveis de ambiente configuradas

### 💰 Custos

#### Gratuito
- ✅ Vercel (Hobby Plan)
- ✅ Supabase (Free Tier)
- ✅ Discord Bot
- ✅ Next.js
- ✅ Todas as bibliotecas

#### Com Custos
- ⚠️ Mercado Pago: ~4-5% por transação (R$0,45 por assinatura)
- ⚠️ Domínio: ~R$40/ano

### 📚 Documentação

- ✅ README.md completo
- ✅ ATUALIZACOES.md com detalhes das dependências
- ✅ CHANGELOG.md (este arquivo)
- ✅ Comentários no código
- ✅ Tipos TypeScript documentados

### 🔧 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm start            # Iniciar produção
npm run lint         # Linting
npm run db:reset     # Reset database
npm run db:push      # Push migrations
```

### 📝 Próximos Passos

1. Configurar variáveis de ambiente
2. Criar projeto no Supabase
3. Executar migrations
4. Configurar OAuth nas plataformas
5. Configurar Mercado Pago
6. Configurar Bot Discord
7. Deploy na Vercel
8. Testes de integração

### 👥 Permissões Configuradas

#### Owner (WaveIGL)
- Twitch: `waveigl`
- YouTube: `@waveigl`
- Kick: `waveigl`
- Permissões: Todas (timeout, ban, gerenciar moderadores)

#### Admin (Gabriel Toth)
- Twitch: `ogabrieltoth`
- YouTube: `OGabrielToth`
- Kick: `OGabrielToth`
- Permissões: Todas (mesmo que owner)

#### Moderadores
- Detectados automaticamente via badges/roles
- Sync automático entre plataformas
- Permissões: Timeout (não pode banir)

### 🐛 Issues Conhecidas

Nenhuma no momento.

### 🙏 Agradecimentos

- Next.js team pela excelente framework
- Supabase pela infraestrutura backend
- Vercel pelo hosting
- Comunidade open-source

---

**Versão**: 0.0.0  
**Data**: 21 de Outubro de 2025  
**Status**: ✅ Completo e pronto para deploy
