---
inclusion: always
---

# 🏗️ Architecture & System Design

Architecture and design of the WaveIGL system.

## 🎯 Overview

WaveIGL is a streaming platform with subscription system (Club), integration with Discord, Twitch, YouTube, Kick and Mercado Pago.

### Technology Stack

```
Frontend:
├── Next.js 14 (App Router)
├── React 18
├── TypeScript
├── Tailwind CSS
└── shadcn/ui

Backend:
├── Next.js API Routes
├── Supabase (PostgreSQL)
├── Node.js runtime
└── Webhooks (Mercado Pago, Discord)

Integrations:
├── Discord (OAuth + Bot)
├── Twitch (OAuth)
├── YouTube (OAuth)
├── Kick (OAuth)
└── Mercado Pago (Payments)
```

## 📊 Data Flow

### Authentication

```
User → OAuth Provider → Callback → Session → Protected Routes
                                      ↓
                              Supabase Auth
```

### Club Subscription

```
User → Check Eligibility → Onboarding → Mercado Pago → Webhook → Discord Role
         (Discord + Data)   (Complete)   (Payment)     (Update)   (Assign)
```

### Notifications

```
Event → Handler → Discord Webhook → User Notification
         (Error)   (Embed)          (Alert)
```

## 🗂️ Folder Structure

### src/app

```
app/
├── api/                          # API Routes
│   ├── auth/
│   │   ├── discord/route.ts      # Discord OAuth
│   │   ├── twitch/route.ts       # Twitch OAuth
│   │   ├── youtube/route.ts      # YouTube OAuth
│   │   ├── kick/route.ts         # Kick OAuth
│   │   └── logout/route.ts       # Logout
│   ├── subscription/
│   │   ├── check-eligibility/    # Check requirements
│   │   ├── create/               # Create subscription
│   │   ├── sync/                 # Sync with MP
│   │   └── webhook/              # MP Webhook
│   ├── user/
│   │   └── profile/              # User profile
│   ├── me/
│   │   ├── profile/              # My profile
│   │   └── check-moderator/      # Check mod
│   ├── benefits/                 # Benefits
│   ├── discord/
│   │   └── sync-roles/           # Sync roles
│   └── chat/
│       └── stream/               # Chat SSE
├── dashboard/                    # Dashboard page
├── checkout/
│   └── club/                     # Checkout page
├── auth/                         # Auth pages
└── (landing)/                    # Landing pages
```

### src/components

```
components/
├── ui/                           # shadcn/ui components
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── badge.tsx
│   └── ...
├── ClubSubscriptionWidget.tsx    # Club subscription
├── ClubOnboardingPopup.tsx       # Onboarding flow
├── ProfileEditor.tsx            # Profile editing
├── BenefitsPanel.tsx            # Benefits display
├── SubscriberBenefitsPopup.tsx  # Benefits popup
├── BenefitsIndicator.tsx        # Benefits indicator
├── VideoPlayer.tsx              # Video player
├── UnifiedChat.tsx              # Chat component
├── ModerationPanel.tsx          # Moderation
└── ...
```

### src/lib

```
lib/
├── auth/
│   ├── session.ts               # Session management
│   └── oauth.ts                 # OAuth helpers
├── supabase/
│   ├── server.ts                # Server client
│   └── client.ts                # Client client
├── discord/
│   ├── server.ts                # Discord API
│   └── lazy-check.ts            # Lazy cleanup
├── notifications/
│   ├── discord.ts               # Discord webhooks
│   ├── subscription.ts          # Sub notifications
│   ├── error-handler.ts         # Error handling
│   └── index.ts                 # Exports
├── benefits/
│   ├── index.ts                 # Benefits logic
│   └── constants.ts             # Constants
├── chat/
│   ├── hub.ts                   # Chat hub
│   ├── twitch.ts                # Twitch chat
│   ├── youtube.ts               # YouTube chat
│   └── kick.ts                  # Kick chat
├── permissions.ts               # Permission checks
└── utils/
    ├── formatDate.ts
    ├── validateEmail.ts
    └── ...
```

### src/hooks

```
hooks/
├── useClubSubscription.ts        # Club subscription state
├── useSessionProvider.ts         # Session provider
├── useDiscordConnection.ts       # Discord connection
├── useUserProfile.ts            # User profile
└── ...
```

### src/types

```
types/
├── index.ts                      # Main types
├── user.types.ts                # User types
├── subscription.types.ts        # Subscription types
├── discord.types.ts             # Discord types
└── ...
```

## 🔄 Main Flows

### 1. OAuth Login

```
1. User clicks "Login with Discord"
2. Redirects to /api/auth/discord
3. Discord OAuth callback
4. Creates/updates user in Supabase
5. Creates session cookie
6. Redirects to /dashboard
```

### 2. Club Subscription

```
1. User clicks "Subscribe to Club"
2. Check eligibility (/api/subscription/check-eligibility)
   - Discord linked?
   - Birth date filled?
   - Over 18 years old?
3. If not eligible → Show onboarding
4. If eligible → Redirect to /checkout/club
5. Create subscription in Mercado Pago
6. Redirect to MP checkout
7. User completes payment
8. MP sends webhook
9. Update status in database
10. Add role on Discord
```

### 3. Discord Synchronization

```
1. User subscribes
2. Check if Discord linked
3. If yes → Add to server
4. Assign subscriber role
5. Lazy check: Every 6h check expired
6. Remove from server if expired
```

### 4. Error Notification

```
1. Error occurs in production
2. Capture context (userId, timestamp, etc)
3. Log structured to console
4. If ERROR or CRITICAL → Send to Discord
5. Discord webhook receives embed
6. Notify dev on Discord
```

## 🔐 Security

### Authentication

- JWT tokens with expiration
- Refresh tokens for renewal
- HTTP-only session cookies
- CSRF protection

### Authorization

- Check permissions on each API route
- Validate resource ownership
- Rate limiting on critical endpoints

### Sensitive Data

- Never log passwords/tokens
- Use environment variables
- Sanitize user input
- Prepared statements in database

## 📊 Database

### Main Tables

```sql
-- Users
profiles (
  id UUID PRIMARY KEY,
  email VARCHAR,
  full_name VARCHAR,
  phone_number VARCHAR,
  birth_date DATE,
  subscription_status VARCHAR,
  subscription_id VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Linked accounts
linked_accounts (
  id UUID PRIMARY KEY,
  user_id UUID,
  platform VARCHAR,
  platform_user_id VARCHAR,
  platform_username VARCHAR,
  access_token VARCHAR,
  refresh_token VARCHAR,
  is_moderator BOOLEAN,
  created_at TIMESTAMP
)

-- Subscriber benefits
subscriber_benefits (
  id UUID PRIMARY KEY,
  user_id UUID,
  platform VARCHAR,
  tier VARCHAR,
  subscribed_at TIMESTAMP,
  expires_at TIMESTAMP,
  discord_linked BOOLEAN,
  onboarding_step INT,
  created_at TIMESTAMP
)

-- Discord connections
discord_connections (
  id UUID PRIMARY KEY,
  user_id UUID,
  discord_id VARCHAR,
  discord_username VARCHAR,
  connected_at TIMESTAMP
)
```

## 🔌 Integrations

### Discord

- OAuth for authentication
- Bot to manage roles
- Webhooks for notifications
- SSE for real-time events

### Mercado Pago

- PreApproval for recurring subscriptions
- Webhooks for payment notifications
- Status synchronization

### Twitch/YouTube/Kick

- OAuth for authentication
- Chat integration via APIs
- Chat moderation

## 🚀 Performance

### Frontend

- Automatic code splitting
- Lazy loading of components
- Heavy component memoization
- Image optimization

### Backend

- Database indexes
- Frequent query caching
- Connection pooling
- Lazy cleanup of expired data

### Monitoring

- Structured logs
- Discord alerts
- Performance metrics
- Error tracking

## 🧪 Testing

### Structure

```
tests/
├── unit/
│   ├── lib/
│   ├── utils/
│   └── hooks/
├── integration/
│   ├── api/
│   └── database/
└── e2e/
    ├── auth.spec.ts
    ├── subscription.spec.ts
    └── discord.spec.ts
```

### Coverage

- Minimum 80% overall
- 100% for critical functions
- Happy path + error cases + edge cases

## 📈 Scalability

### Horizontal

- Stateless API routes
- Session storage in cookies
- Database connection pooling

### Vertical

- Query optimization
- Strategic caching
- Lazy data loading

## 🔄 CI/CD

```
Commit → Tests → Lint → Type Check → Build → Deploy
         ↓
      Fails? → Notify Discord
```

### Environments

- **Development**: Local
- **Staging**: Preview deployment
- **Production**: Live

## 📞 Support

Questions about architecture?
- Check `PROJECT_STANDARDS.md`
- Review examples in `src/`
- See tests in `tests/`

## 🎯 Visão Geral

WaveIGL é uma plataforma de streaming com sistema de assinatura (Clube), integração com Discord, Twitch, YouTube, Kick e Mercado Pago.

### Stack Tecnológico

```
Frontend:
├── Next.js 14 (App Router)
├── React 18
├── TypeScript
├── Tailwind CSS
└── shadcn/ui

Backend:
├── Next.js API Routes
├── Supabase (PostgreSQL)
├── Node.js runtime
└── Webhooks (Mercado Pago, Discord)

Integrações:
├── Discord (OAuth + Bot)
├── Twitch (OAuth)
├── YouTube (OAuth)
├── Kick (OAuth)
└── Mercado Pago (Payments)
```

## 📊 Fluxo de Dados

### Autenticação

```
User → OAuth Provider → Callback → Session → Protected Routes
                                      ↓
                              Supabase Auth
```

### Assinatura do Clube

```
User → Check Eligibility → Onboarding → Mercado Pago → Webhook → Discord Role
         (Discord + Data)   (Complete)   (Payment)     (Update)   (Assign)
```

### Notificações

```
Event → Handler → Discord Webhook → User Notification
         (Error)   (Embed)          (Alert)
```

## 🗂️ Estrutura de Pastas

### src/app

```
app/
├── api/                          # API Routes
│   ├── auth/
│   │   ├── discord/route.ts      # Discord OAuth
│   │   ├── twitch/route.ts       # Twitch OAuth
│   │   ├── youtube/route.ts      # YouTube OAuth
│   │   ├── kick/route.ts         # Kick OAuth
│   │   └── logout/route.ts       # Logout
│   ├── subscription/
│   │   ├── check-eligibility/    # Verifica requisitos
│   │   ├── create/               # Cria assinatura
│   │   ├── sync/                 # Sincroniza com MP
│   │   └── webhook/              # Webhook do MP
│   ├── user/
│   │   └── profile/              # Perfil do usuário
│   ├── me/
│   │   ├── profile/              # Meu perfil
│   │   └── check-moderator/      # Verifica mod
│   ├── benefits/                 # Benefícios
│   ├── discord/
│   │   └── sync-roles/           # Sincroniza roles
│   └── chat/
│       └── stream/               # Chat SSE
├── dashboard/                    # Dashboard page
├── checkout/
│   └── club/                     # Checkout page
├── auth/                         # Auth pages
└── (landing)/                    # Landing pages
```

### src/components

```
components/
├── ui/                           # shadcn/ui components
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── badge.tsx
│   └── ...
├── ClubSubscriptionWidget.tsx    # Club subscription
├── ClubOnboardingPopup.tsx       # Onboarding flow
├── ProfileEditor.tsx            # Profile editing
├── BenefitsPanel.tsx            # Benefits display
├── SubscriberBenefitsPopup.tsx  # Benefits popup
├── BenefitsIndicator.tsx        # Benefits indicator
├── VideoPlayer.tsx              # Video player
├── UnifiedChat.tsx              # Chat component
├── ModerationPanel.tsx          # Moderation
└── ...
```

### src/lib

```
lib/
├── auth/
│   ├── session.ts               # Session management
│   └── oauth.ts                 # OAuth helpers
├── supabase/
│   ├── server.ts                # Server client
│   └── client.ts                # Client client
├── discord/
│   ├── server.ts                # Discord API
│   └── lazy-check.ts            # Lazy cleanup
├── notifications/
│   ├── discord.ts               # Discord webhooks
│   ├── subscription.ts          # Sub notifications
│   ├── error-handler.ts         # Error handling
│   └── index.ts                 # Exports
├── benefits/
│   ├── index.ts                 # Benefits logic
│   └── constants.ts             # Constants
├── chat/
│   ├── hub.ts                   # Chat hub
│   ├── twitch.ts                # Twitch chat
│   ├── youtube.ts               # YouTube chat
│   └── kick.ts                  # Kick chat
├── permissions.ts               # Permission checks
└── utils/
    ├── formatDate.ts
    ├── validateEmail.ts
    └── ...
```

### src/hooks

```
hooks/
├── useClubSubscription.ts        # Club subscription state
├── useSessionProvider.ts         # Session provider
├── useDiscordConnection.ts       # Discord connection
├── useUserProfile.ts            # User profile
└── ...
```

### src/types

```
types/
├── index.ts                      # Main types
├── user.types.ts                # User types
├── subscription.types.ts        # Subscription types
├── discord.types.ts             # Discord types
└── ...
```

## 🔄 Fluxos Principais

### 1. Login com OAuth

```
1. User clica "Login com Discord"
2. Redireciona para /api/auth/discord
3. Discord OAuth callback
4. Cria/atualiza usuário no Supabase
5. Cria session cookie
6. Redireciona para /dashboard
```

### 2. Assinatura do Clube

```
1. User clica "Assinar Clube"
2. Verifica elegibilidade (/api/subscription/check-eligibility)
   - Discord vinculado?
   - Data de nascimento preenchida?
   - Maior de 18 anos?
3. Se não elegível → Mostra onboarding
4. Se elegível → Redireciona para /checkout/club
5. Cria assinatura no Mercado Pago
6. Redireciona para checkout do MP
7. User completa pagamento
8. MP envia webhook
9. Atualiza status no banco
10. Adiciona role no Discord
```

### 3. Sincronização Discord

```
1. User se inscreve
2. Verifica se Discord vinculado
3. Se sim → Adiciona ao servidor
4. Atribui role de subscriber
5. Lazy check: A cada 6h verifica expirados
6. Remove do servidor se expirou
```

### 4. Notificação de Erro

```
1. Erro ocorre em produção
2. Captura contexto (userId, timestamp, etc)
3. Loga estruturado no console
4. Se ERROR ou CRITICAL → Envia para Discord
5. Discord webhook recebe embed
6. Notifica dev no Discord
```

## 🔐 Segurança

### Autenticação

- JWT tokens com expiração
- Refresh tokens para renovação
- Session cookies HTTP-only
- CSRF protection

### Autorização

- Verificar permissões em cada API route
- Validar ownership de recursos
- Rate limiting em endpoints críticos

### Dados Sensíveis

- Nunca logar senhas/tokens
- Usar variáveis de ambiente
- Sanitizar entrada do usuário
- Prepared statements no banco

## 📊 Banco de Dados

### Tabelas Principais

```sql
-- Usuários
profiles (
  id UUID PRIMARY KEY,
  email VARCHAR,
  full_name VARCHAR,
  phone_number VARCHAR,
  birth_date DATE,
  subscription_status VARCHAR,
  subscription_id VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Contas vinculadas
linked_accounts (
  id UUID PRIMARY KEY,
  user_id UUID,
  platform VARCHAR,
  platform_user_id VARCHAR,
  platform_username VARCHAR,
  access_token VARCHAR,
  refresh_token VARCHAR,
  is_moderator BOOLEAN,
  created_at TIMESTAMP
)

-- Benefícios de subscriber
subscriber_benefits (
  id UUID PRIMARY KEY,
  user_id UUID,
  platform VARCHAR,
  tier VARCHAR,
  subscribed_at TIMESTAMP,
  expires_at TIMESTAMP,
  discord_linked BOOLEAN,
  onboarding_step INT,
  created_at TIMESTAMP
)

-- Conexões Discord
discord_connections (
  id UUID PRIMARY KEY,
  user_id UUID,
  discord_id VARCHAR,
  discord_username VARCHAR,
  connected_at TIMESTAMP
)
```

## 🔌 Integrações

### Discord

- OAuth para autenticação
- Bot para gerenciar roles
- Webhooks para notificações
- SSE para eventos em tempo real

### Mercado Pago

- PreApproval para assinaturas recorrentes
- Webhooks para notificações de pagamento
- Sincronização de status

### Twitch/YouTube/Kick

- OAuth para autenticação
- Chat integration via APIs
- Moderação de chat

## 🚀 Performance

### Frontend

- Code splitting automático
- Lazy loading de componentes
- Memoização de componentes pesados
- Otimização de imagens

### Backend

- Índices no banco de dados
- Caching de queries frequentes
- Connection pooling
- Lazy cleanup de dados expirados

### Monitoramento

- Logs estruturados
- Alertas Discord
- Métricas de performance
- Rastreamento de erros

## 🧪 Testes

### Estrutura

```
tests/
├── unit/
│   ├── lib/
│   ├── utils/
│   └── hooks/
├── integration/
│   ├── api/
│   └── database/
└── e2e/
    ├── auth.spec.ts
    ├── subscription.spec.ts
    └── discord.spec.ts
```

### Cobertura

- Mínimo 80% geral
- 100% para funções críticas
- Happy path + error cases + edge cases

## 📈 Escalabilidade

### Horizontal

- Stateless API routes
- Session storage em cookies
- Database connection pooling

### Vertical

- Otimização de queries
- Caching estratégico
- Lazy loading de dados

## 🔄 CI/CD

```
Commit → Tests → Lint → Type Check → Build → Deploy
         ↓
      Falha? → Notifica Discord
```

### Ambientes

- **Development**: Local
- **Staging**: Preview deployment
- **Production**: Live

## 📞 Suporte

Dúvidas sobre arquitetura?
- Consulte `PROJECT_STANDARDS.md`
- Revise exemplos em `src/`
- Veja testes em `tests/`
