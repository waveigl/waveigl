# Changelog - WaveIGL

## [0.3.5] - 2025-02-12

### 🔧 Improvements - Comprehensive Dependency Updates
- Updated: `next` from ^16.1.4 to ^16.1.6 (latest stable) - fixes 3 high severity vulnerabilities
  - Fixed: Next.js self-hosted applications vulnerable to DoS via Image Optimizer remotePatterns
  - Fixed: Next.js HTTP request deserialization can lead to DoS with insecure React Server Components
  - Fixed: Next.js Unbounded Memory Consumption via PPR Resume Endpoint
- Updated: `axios` from ^1.7.7 to ^1.13.5 (latest) - fixes high severity DoS vulnerability
  - Fixed: Axios Vulnerable to Denial of Service via __proto__ Key in mergeConfig
- Updated: `@supabase/ssr` from ^0.7.0 to ^0.8.0 (latest)
- Updated: `@supabase/supabase-js` from ^2.72.7 to ^2.95.3 (latest) - fixes transitive tar vulnerabilities
  - Fixed: node-tar Vulnerable to Arbitrary File Overwrite and Symlink Poisoning
  - Fixed: Race Condition in node-tar Path Reservations via Unicode Ligature Collisions
  - Fixed: node-tar Vulnerable to Arbitrary File Creation/Overwrite via Hardlink Path Traversal
- Updated: `bcrypt` from ^5.1.1 to ^6.0.0 (latest, major bump)
- Updated: `eslint` from ^10.0.0 to ^9.15.0 (compatible with TypeScript ESLint packages)
- Updated: `eslint-config-next` from ^16.1.4 to ^16.1.6 (aligns with next.js version)
- Updated: `lucide-react` from ^0.263.1 to ^0.563.0 (latest)
- Updated: `playwright` from ^1.40.0 to ^1.58.2 (latest)
- Updated: `vitest` from ^1.0.0 to ^4.0.18 (latest)
- Updated: `supabase` from ^2.73.0 to ^2.76.8 (latest)
- Updated: All other dependencies to latest compatible versions

### 🔐 Security
- Security: All 7 critical/high severity vulnerabilities resolved
  - 3 Next.js vulnerabilities (DoS, memory consumption)
  - 1 Axios vulnerability (DoS via __proto__)
  - 3 node-tar vulnerabilities (file overwrite, symlink poisoning, race condition)
- Security: Transitive dependencies (tar, @mapbox/node-pre-gyp) now use secure versions
- Security: No breaking changes - all updates are patch/minor version compatible (except bcrypt major bump)
- Security: npm audit shows 0 vulnerabilities after updates

### 📝 Documentation
- Updated: CHANGELOG.md with comprehensive dependency update details
- Note: All tests passing after dependency updates
- Note: Build verified successful with all latest versions

## [0.3.3] - 2025-02-11

### 🔧 Improvements - Dependency Updates
- Updated: `next` from ^16.1.1 to ^16.1.4 - fixes 3 high severity vulnerabilities
  - Fixed: Next.js self-hosted applications vulnerable to DoS via Image Optimizer remotePatterns
  - Fixed: Next.js HTTP request deserialization can lead to DoS with insecure React Server Components
  - Fixed: Next.js Unbounded Memory Consumption via PPR Resume Endpoint
- Updated: `axios` added at ^1.7.7 - fixes high severity DoS vulnerability
  - Fixed: Axios Vulnerable to Denial of Service via __proto__ Key in mergeConfig
- Updated: `supabase` from ^2.72.7 to ^2.73.0 - fixes transitive tar vulnerabilities
  - Fixed: node-tar Vulnerable to Arbitrary File Overwrite and Symlink Poisoning
  - Fixed: Race Condition in node-tar Path Reservations via Unicode Ligature Collisions
  - Fixed: node-tar Vulnerable to Arbitrary File Creation/Overwrite via Hardlink Path Traversal
- Updated: `eslint-config-next` from ^16.1.1 to ^16.1.4 - aligns with next.js version

### 🔐 Security
- Security: All 5 high severity vulnerabilities resolved
- Security: Transitive dependencies (tar, @mapbox/node-pre-gyp) now use secure versions
- Security: No breaking changes - all updates are patch/minor version compatible

### 📝 Documentation
- Updated: CHANGELOG.md with dependency update details
- Note: All tests passing after dependency updates

## [0.4.0] - 2025-02-11

### ✨ Features - Subscription System Reliability & Error Recovery
- Added: Comprehensive UUID validation module (`src/lib/validation/uuid.ts`) with v4 format validation
- Added: Retry handler with exponential backoff (1s, 2s, 4s, 8s) in `src/lib/retry/backoff.ts`
- Added: Structured logging module (`src/lib/logging/subscription-logger.ts`) with context-aware logging
- Added: Event storage for failed operations (`src/lib/storage/event-store.ts`) with Supabase persistence
- Added: Health check endpoint (`/api/health/webhooks`) for webhook connectivity verification
- Added: Background job for retrying failed events (`src/lib/jobs/retry-failed-events.ts`)
- Added: Enhanced Discord notification handler with retry logic and error context
- Added: Subscription event validation module (`src/lib/validation/subscription-event.ts`)
- Added: Configuration check for `NOTIFY_UNREGISTERED_SUBS` environment variable

### 🔧 Improvements - Webhook Processing
- Improved: Mercado Pago webhook handler (`/api/subscription/webhook`) with:
  - Rigorous UUID validation before processing
  - Subscription event validation with detailed error messages
  - Retry logic with exponential backoff for transient failures
  - Structured logging at each step
  - Discord error notifications on validation/creation failure
  - Graceful error handling for Discord notification failures
  - Proper HTTP status codes (400 for validation, 500 for operation errors)

- Improved: Twitch EventSub webhook handler (`/api/webhooks/twitch/eventsub`) with:
  - UUID validation for user IDs
  - Subscription event validation
  - Retry logic with exponential backoff
  - Structured logging at each step
  - Discord error notifications on failure
  - Try-catch blocks around subscription event handling
  - Graceful error handling for whisper failures

- Improved: Twitch whisper handler with:
  - Full error context capture (recipient, message, error)
  - Error re-throwing for upstream handling
  - Discord warning notifications on failure
  - Success logging with recipient and timestamp

### 🧪 Tests - Comprehensive Test Coverage
- Added: 11 property-based tests for UUID validation (Property 1)
- Added: 12 property-based tests for exponential backoff retry (Properties 3, 4, 5)
- Added: 8 property-based tests for structured logging (Property 9)
- Added: 6 property-based tests for event storage round trip (Property 11)
- Added: 8 property-based tests for Discord error notifications (Properties 2, 7)
- Added: 6 property-based tests for Twitch whisper error handling (Property 6)
- Added: 6 property-based tests for notification configuration (Property 8)
- Added: 8 property-based tests for health check (Property 10)
- Added: 25+ integration tests covering:
  - Full subscription flow from webhook to notifications
  - Validation failure scenarios with Discord alerts
  - Retry logic with exponential backoff
  - Max retry exhaustion with critical notifications
  - Notification configuration respect (enabled/disabled)
  - Event storage and retrieval
- Added: 15+ end-to-end tests covering:
  - Successful subscription creation through webhook
  - Discord and Twitch notification delivery
  - Error recovery and retry scenarios
  - Health check endpoint functionality
  - Concurrent webhook request handling
  - Duplicate webhook idempotency

### 🔐 Security
- Security: Rigorous UUID v4 validation prevents invalid data from corrupting system
- Security: Subscription event validation ensures only valid events are processed
- Security: Discord notification failures don't interrupt subscription processing
- Security: Graceful error handling prevents cascading failures
- Security: Structured logging with full context for audit trails

### 📝 Documentation
- Added: Comprehensive design document with correctness properties (14 properties)
- Added: Requirements document with 10 user stories and acceptance criteria
- Added: Implementation plan with 17 tasks and property-based testing strategy
- Added: JSDoc documentation for all new modules and functions
- Added: Inline comments explaining retry logic and validation steps

### 🔄 Correctness Properties Validated
- **Property 1**: UUID Validation Consistency - All UUIDs validated before processing
- **Property 2**: Error Notification on Validation Failure - Discord alerts on validation errors
- **Property 3**: Exponential Backoff Retry Pattern - Correct delays (1s, 2s, 4s, 8s)
- **Property 4**: Successful Retry Completion - No additional retries after success
- **Property 5**: Maximum Retry Exhaustion - Critical alerts after max retries
- **Property 6**: Twitch Whisper Error Propagation - Errors captured and re-thrown
- **Property 7**: Graceful Discord Notification Failure - Processing continues on Discord failure
- **Property 8**: Notification Configuration Respect - Respects NOTIFY_UNREGISTERED_SUBS setting
- **Property 9**: Comprehensive Structured Logging - Logs at all critical points
- **Property 10**: Health Check Connectivity Verification - Verifies all webhook connectivity
- **Property 11**: Event Storage Round Trip - Failed events stored and retried identically
- **Property 12**: Notification Delivery Retry - Notifications retry with backoff
- **Property 13**: Successful Subscription Confirmation - Discord notifications on success
- **Property 14**: No Retry on First Success - No retries on immediate success

### 🐛 Bug Fixes
- Fixed: Subscription detection system that stopped working on 02/02/26
- Fixed: Discord notifications not being sent for new subscriptions
- Fixed: Twitch whispers not being delivered to subscribers
- Fixed: Missing error handling for webhook failures
- Fixed: No retry logic for transient failures
- Fixed: Lack of structured logging for debugging
- Fixed: No event storage for failed operations
- Fixed: No health check endpoint for monitoring

## [0.3.2] - 2025-01-19

### 🐛 Bug Fixes
- Fixed: Discord notifications system - added missing `notifyDiscord()` function that was causing import errors
- Fixed: Subscription notifications now properly send Discord messages for new subs and gifts
- Fixed: Twitch whisper system restored - now correctly sends private messages to subscribers
- Fixed: Discord webhook integration for subscription events (sussuro and server notifications)

### 🔧 Improvements
- Improved: Added generic Discord notification interface for error handling and alerts
- Improved: Discord notifications now support multiple severity levels (info, warning, error, critical)
- Improved: Better error context in Discord notifications with formatted metadata

## [0.3.1] - 2025-01-18

### 🐛 Bug Fixes
- Fixed: UUID validator was too permissive - now properly rejects incomplete UUIDs and special characters
- Fixed: UUID validation now detects UUID-like patterns (3+ hyphens) and validates them strictly
- Fixed: Simple ID validation (0-2 hyphens) now properly rejects strings with special characters like @

### 🧪 Tests
- Fixed: All 311 unit tests now passing (was 310 passing, 1 failing)
- Fixed: UUID validation test now correctly rejects invalid formats
- Fixed: Test suite for discount validators now 100% passing

## [0.3.0] - 2025-01-17

### ✨ Features - Complete Discount Coupons System
- Added: DiscountAnalyticsService com cálculo de estatísticas completas
- Added: API endpoints para Direct User Discounts (CRUD)
- Added: API endpoints para Discount Links (generate, list, delete)
- Added: API endpoints para Coupon Codes (CRUD)
- Added: API endpoints para validação de descontos (validate, apply)
- Added: Mercado Pago integration com PreApproval customizado
- Added: React components para gerenciamento de descontos (DiscountManagementPanel, tabs, forms, stats)
- Added: Admin page para gerenciamento de descontos (/admin/discounts)
- Added: Checkout integration para aplicação de descontos
- Added: Permission checks e audit logging para operações de desconto
- Added: Error handling com notificações Discord
- Added: Analytics endpoints com exportação CSV

### 🧪 Tests - 203 Testes Passando
- Added: 12 testes de propriedade para DiscountAnalyticsService (Property 16)
- Added: 4 testes unitários para Direct User Discount API
- Added: 4 testes unitários para Discount Links API
- Added: 4 testes unitários para Coupon Codes API
- Added: 11 testes de propriedade para Discount Validation (Properties 8, 9, 14)
- Added: 13 testes de propriedade para Mercado Pago Integration (Properties 8, 9, 10)
- Added: Testes com edge cases (0, 1, 3, 100 resgates)
- Added: Testes de precisão decimal e múltiplos tipos de desconto

### 🔧 Improvements
- Improved: Cálculo preciso de métricas de analytics com suporte a filtros
- Improved: Validação completa de entrada em todos os endpoints
- Improved: Tratamento de erros com contexto detalhado
- Improved: Logs estruturados em todas as operações
- Improved: Suporte a soft-delete para preservação de dados
- Improved: Formatação de valores monetários em BRL

### 📝 Documentation
- Added: Tipos e interfaces para discount system em `src/types/discount.types.ts`
- Added: Comentários JSDoc em todos os services e componentes
- Added: Documentação de todas as 16 propriedades de correção no design.md
- Added: Guia de permissões e audit logging

### 🔐 Security
- Added: Permission checks para acesso admin
- Added: Audit logging para todas as operações
- Added: Validação de entrada em todos os endpoints
- Added: Rate limiting ready (estrutura preparada)

## [0.2.0] - 2025-01-17

### ✨ Features
- Added: DiscountAnalyticsService para cálculo de estatísticas de descontos
- Added: Suporte para análise de descontos por tipo (direct_user, link, coupon)
- Added: Cálculo de revenue_impact (soma de discount_amounts)
- Added: Cálculo de average_discount_value (média de discount_amounts)
- Added: Geração de timeline de resgates por data
- Added: Exportação de dados de descontos em formato CSV
- Added: Funções de formatação para exibição de analytics (formatAnalytics, formatStats)

### 🧪 Tests
- Added: 12 testes de propriedade para DiscountAnalyticsService
- Added: Property 16: Analytics Aggregation Accuracy - validação de precisão de agregação
- Added: Testes com 0, 1, 3, 100 resgates para validar edge cases
- Added: Testes de precisão decimal para valores monetários
- Added: Testes de agregação com múltiplos tipos de desconto

### 🔧 Improvements
- Improved: Cálculo preciso de métricas de analytics com suporte a filtros
- Improved: Suporte a filtros por tipo de desconto, data range e ordenação
- Improved: Tratamento de casos vazios (0 resgates)
- Improved: Formatação de valores monetários em BRL

### 📝 Documentation
- Added: Tipos e interfaces para analytics em `src/types/discount.types.ts`
- Added: Comentários JSDoc em DiscountAnalyticsService
- Added: Documentação de Property 16 no design.md

## [0.1.0] - 2025-01-17

### ✨ Features
- Added: Painel de edição de informações de streaming (`/admin/streaming-info`)
- Added: Componente `StreamingInfoPanel` para editar título, descrição, categoria, tags, idioma e conteúdo adulto
- Added: Suporte para editar informações em múltiplas plataformas (Twitch, YouTube, Kick)
- Added: Opção "Aplicar a todas as plataformas" para sincronizar informações
- Added: API endpoint `/api/streaming/info` para salvar informações
- Added: Hook `useStreamingInfo` para gerenciar estado de streaming
- Added: Categorias pré-configuradas para cada plataforma (10+ categorias por plataforma)
- Added: Suporte a 10+ idiomas diferentes (Português, Inglês, Espanhol, Francês, Alemão, Italiano, Japonês, Coreano, Chinês, Russo)
- Added: Validação de comprimento de título (100 caracteres) e descrição (5000 caracteres)
- Added: Sistema de tags com visualização em badges
- Added: Checkbox para marcar conteúdo adulto/maduro (18+)
- Added: Tipos TypeScript completos para streaming (`StreamingInfo`, `StreamingInfoFormData`, `StreamingInfoResponse`)

### 🧪 Tests
- Added: 13 testes unitários para tipos de streaming
- Added: Testes de validação de categorias e idiomas
- Added: Testes de unicidade de IDs e códigos
- Added: Testes de validação de dados vazios

### 🔧 Improvements
- Improved: Interface intuitiva com seletor de plataformas
- Improved: Feedback visual com mensagens de sucesso/erro
- Improved: Suporte a diferentes campos por plataforma (Twitch sem descrição, YouTube com descrição)
- Improved: Contador de caracteres em tempo real
- Improved: Carregamento automático de contas vinculadas
- Improved: Página dedicada com dicas de uso e informações sobre plataformas

### 📝 Documentation
- Added: Tipos e interfaces documentadas em `src/types/streaming.types.ts`
- Added: Comentários JSDoc em componentes e hooks
- Added: Página de admin com guia de uso

## [0.0.21] - 2025-01-17

### 🐛 Bug Fixes
- Fixed: React error #310 no dashboard ao clicar no badge de admin
- Fixed: Dependências faltando no useEffect do dashboard
- Fixed: useCallback adicionado para evitar recriação de funções
- Fixed: Erro de sintaxe JSX no chat section header (extra closing divs)
- Fixed: ModerationStats agora renderiza corretamente no header do chat

### ✨ Features
- Added: LiveInfoPanel component para exibir bans e timeouts ativos
- Added: ModerationStats component para mostrar contadores de moderação
- Added: API endpoints para gerenciar ações de moderação (`/api/moderation/actions`)
- Added: Painel de informações de live para streamer/admin com refresh automático

### 🔧 Improvements
- Improved: Dashboard agora carrega ações de moderação na inicialização
- Improved: Contadores de moderação aparecem no header do chat quando há ações ativas
- Improved: Painel de live info exibe bans e timeouts com tempo restante

## [0.0.20] - 2025-01-16

### ✨ Features
- Added: Calculadora de Custos de Streaming no painel admin (`/admin/streaming-calculator`)
- Added: Comparativo de custos entre AWS, Azure, GCP e Cloudflare
- Added: Cálculos atômicos para encoding, CDN, storage e interações
- Added: Suporte a resoluções de 360p até 16K
- Added: Suporte a FPS de 24 até 1000
- Added: Suporte a codecs H.264, H.265, AV1, VP9 com chroma 4:2:0, 4:2:2, 4:4:4
- Added: Suporte a HDR (SDR, HDR10, HDR10+, Dolby Vision, HLG)
- Added: Presets rápidos (Casual, Standard, Pro, 4K Gaming, 4K Cinema, Extreme, Insane)
- Added: Cálculo de bitrate estimado por perfil
- Added: Custo por viewer e custo por viewer/hora
- Added: Conversão USD → BRL com taxa configurável

### 🧪 Tests
- Added: 27 testes unitários para `cost-calculator.ts`
- Added: Testes para cálculo de bitrate, multiplicadores, custos por provider
- Added: Testes para formatação de valores (USD, BRL, bytes, bitrate)

## [0.0.19] - 2025-01-16

### ✨ Features
- Added: Gabriel Toth pode criar/alterar senha do painel admin diretamente pelo site (`/admin/setup`)
- Added: Endpoint `/api/admin/set-password` para salvar senha no banco automaticamente
- Added: Logs detalhados na Vercel quando WaveIGL é detectado ao vivo na Twitch ou Kick

### 🔧 Improvements
- Improved: Logs `[STREAMER LIVE] 🟢 WaveIGL detectado AO VIVO` aparecem na Vercel quando streamer inicia live
- Improved: Página `/admin/setup` agora salva senha diretamente no banco (sem precisar de SQL manual)
- Improved: Verificação automática se usuário é Gabriel Toth antes de permitir configurar senha

### 🔐 Security
- Security: Apenas Gabriel Toth pode acessar `/admin/setup` e definir senha
- Security: Validação de força de senha com requisitos (maiúscula, minúscula, número, especial)

## [0.0.18] - 2025-01-16

### 🔧 Improvements
- Improved: Chat agora só é visível para usuários logados (economiza quota da API do YouTube)
- Improved: Usuários não logados veem mensagem "Chat disponível apenas para usuários logados"
- Improved: YouTube API só é chamada quando Twitch/Kick detecta que o streamer está ao vivo (já implementado)

### 🔐 Security
- Security: Redução de consumo de quota do YouTube ao esconder chat de visitantes não autenticados

### 📝 Notes
- YouTube live detection usa `search.list?eventType=live` (não inclui lives programadas/upcoming)
- Trigger do YouTube é acionado automaticamente quando Twitch ou Kick recebe primeira mensagem

## [0.0.17] - 2025-01-16

### 🐛 Bug Fixes
- Fixed: YouTube mostrando "offline" mesmo com live ao vivo
- Fixed: Detecção de live agora busca especificamente o canal WaveIGL usando `channels.list` + `search.list`
- Fixed: Todos os usuários no dashboard agora veem a live do WaveIGL (não apenas o dono do token)

### 🔧 Improvements
- Improved: Usa `channels.list?forHandle=waveigl` para obter o channelId do WaveIGL
- Improved: Usa `search.list?channelId=X&eventType=live` para buscar lives ativas do canal
- Improved: Scraping como fallback quando não há token disponível

### 📝 Documentation
- Ref: https://developers.google.com/youtube/v3/docs/search/list
- Ref: https://developers.google.com/youtube/v3/docs/channels/list

## [0.0.16] - 2025-01-15

### 🔧 Improvements
- Improved: Criado arquivo `src/lib/admin/password.ts` com todas as funções de proteção por senha
- Improved: Implementado bcrypt com 12 rounds para hash seguro
- Improved: Adicionado rate limiting com bloqueio de 15 minutos após 5 tentativas
- Improved: Validação de força de senha com requisitos (maiúscula, minúscula, número, caractere especial)

### 🧪 Tests
- Added: 28 testes unitários para funções de proteção por senha (todos passando)
- Added: Testes de hash bcrypt com salt aleatório
- Added: Testes de validação de força de senha
- Added: Testes de bloqueio por tentativas excessivas
- Added: Testes de integração completa do fluxo de autenticação

### 📝 Documentation
- Added: Script `scripts/setup-migration-manual.js` para guiar setup manual da migração
- Added: Script `scripts/execute-migration.js` para tentar executar migração automaticamente
- Updated: Instruções claras para executar migração no Supabase Dashboard

### 🔐 Security
- Added: Função `hashPassword()` com bcrypt 12 rounds
- Added: Função `verifyPassword()` para comparação segura
- Added: Função `validatePasswordStrength()` com requisitos rigorosos
- Added: Função `calculateLockoutTime()` para bloqueio de 15 minutos
- Added: Função `getAccountLockStatus()` para verificar status de bloqueio

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
