---
inclusion: always
---

# 🏗️ Architecture & System Design

Arquitetura e design do sistema WaveIGL.

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
