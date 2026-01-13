---
inclusion: always
---

# 📝 Naming Conventions

Convenções de nomenclatura para o projeto WaveIGL.

## 📁 Arquivos e Pastas

### Componentes React

```
PascalCase.tsx

✅ BOM:
- UserProfile.tsx
- ClubSubscriptionWidget.tsx
- BenefitsPanel.tsx
- SubscriberBenefitsPopup.tsx

❌ RUIM:
- userProfile.tsx
- club-subscription-widget.tsx
- benefits_panel.tsx
```

### Hooks

```
useNomeDoHook.ts

✅ BOM:
- useClubSubscription.ts
- useSessionProvider.ts
- useDiscordConnection.ts
- useUserProfile.ts

❌ RUIM:
- clubSubscription.ts
- sessionProvider.ts
- discord-connection.ts
```

### Utilitários e Funções

```
camelCase.ts

✅ BOM:
- formatDate.ts
- validateEmail.ts
- calculateAge.ts
- normalizePhone.ts

❌ RUIM:
- FormatDate.ts
- validate_email.ts
- CalculateAge.ts
```

### Tipos e Interfaces

```
types.ts ou [nome].types.ts

✅ BOM:
- types.ts (tipos gerais)
- user.types.ts
- subscription.types.ts
- discord.types.ts

❌ RUIM:
- Types.ts
- user_types.ts
- subscriptionTypes.ts
```

### Testes

```
[arquivo].test.ts ou [arquivo].spec.ts

✅ BOM:
- getUserData.test.ts
- ClubSubscriptionWidget.spec.ts
- validateEmail.test.ts

❌ RUIM:
- test-getUserData.ts
- club_subscription_widget_test.ts
- validate-email.spec.ts
```

### Configurações

```
[nome].config.ts ou [nome].config.js

✅ BOM:
- tailwind.config.ts
- next.config.js
- vitest.config.ts
- eslint.config.js

❌ RUIM:
- tailwindConfig.ts
- nextConfig.js
- vitest_config.ts
```

### Pastas

```
lowercase ou kebab-case

✅ BOM:
- src/components/
- src/lib/
- src/hooks/
- src/app/api/
- src/lib/discord/
- src/lib/notifications/

❌ RUIM:
- src/Components/
- src/Lib/
- src/Hooks/
- src/lib/Discord/
- src/lib/Notifications/
```

## 🔤 Variáveis e Constantes

### Constantes

```
UPPER_SNAKE_CASE

✅ BOM:
- MAX_RETRIES = 3
- API_TIMEOUT = 5000
- DISCORD_GUILD_ID = 'xxx'
- SUBSCRIPTION_PRICE = 9.90
- DEFAULT_PAGE_SIZE = 20

❌ RUIM:
- maxRetries = 3
- api_timeout = 5000
- discordGuildId = 'xxx'
```

### Variáveis

```
camelCase

✅ BOM:
- const userName = 'Gabriel'
- let isLoading = false
- const userData = { ... }
- const subscriptionStatus = 'active'

❌ RUIM:
- const user_name = 'Gabriel'
- let IsLoading = false
- const UserData = { ... }
```

### Booleanos

```
isX, hasX, canX, shouldX, needsX

✅ BOM:
- const isLoading = true
- const hasError = false
- const canSubscribe = true
- const shouldRetry = false
- const needsReauth = true
- const isClubMember = true
- const hasDiscordConnection = false

❌ RUIM:
- const loading = true
- const error = false
- const subscribe = true
- const retry = false
```

### Arrays

```
Plural ou com sufixo 'List'

✅ BOM:
- const users = [...]
- const linkedAccounts = [...]
- const userList = [...]
- const messages = [...]
- const benefits = [...]

❌ RUIM:
- const user = [...]
- const linkedAccount = [...]
- const userarray = [...]
```

### Funções e Métodos

```
camelCase, começando com verbo

✅ BOM:
- function getUserData() { ... }
- function validateEmail() { ... }
- function calculateAge() { ... }
- function handleSubmit() { ... }
- function fetchUserProfile() { ... }
- async function createSubscription() { ... }

❌ RUIM:
- function get_user_data() { ... }
- function email_validation() { ... }
- function age() { ... }
- function submit() { ... }
```

### Callbacks

```
onX ou handleX

✅ BOM:
- const onClick = () => { ... }
- const onSubmit = (data) => { ... }
- const onError = (error) => { ... }
- const handleClick = () => { ... }
- const handleChange = (value) => { ... }
- const handleSuccess = (result) => { ... }

❌ RUIM:
- const click = () => { ... }
- const submit = (data) => { ... }
- const error = (error) => { ... }
```

### Getters/Setters

```
get/set + NomeDoValor

✅ BOM:
- function getDisplayName() { ... }
- function setUserData(data) { ... }
- function getUserRole() { ... }
- function setSubscriptionStatus(status) { ... }

❌ RUIM:
- function displayName() { ... }
- function userData(data) { ... }
- function role() { ... }
```

## 🏷️ Props de Componentes

```
camelCase

✅ BOM:
interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  isDisabled?: boolean
  variant?: 'primary' | 'secondary'
  onHover?: () => void
}

❌ RUIM:
interface ButtonProps {
  children: React.ReactNode
  on_click?: () => void
  IsDisabled?: boolean
  Variant?: 'primary' | 'secondary'
}
```

## 🔗 Git Branches

```
<type>/<scope>-<description>

Tipos:
- feat/     (nova feature)
- fix/      (bug fix)
- refactor/ (refatoração)
- docs/     (documentação)
- test/     (testes)
- chore/    (tarefas)
- perf/     (performance)

✅ BOM:
- feat/club-subscription
- fix/discord-sync-error
- refactor/payment-logic
- docs/api-endpoints
- test/user-validation
- chore/update-dependencies
- perf/optimize-queries

❌ RUIM:
- feature/club
- bugfix/discord
- refactoring/payment
- documentation/api
- testing/user
- update-deps
- optimize
```

## 📝 Commits

```
<type>(<scope>): <subject>

Tipos:
- feat:     Nova feature
- fix:      Bug fix
- docs:     Documentação
- style:    Formatação
- refactor: Refatoração
- perf:     Performance
- test:     Testes
- chore:    Tarefas

✅ BOM:
- feat(club): add subscription eligibility check
- fix(discord): resolve sync error on webhook
- docs(api): add endpoint documentation
- refactor(payment): simplify mercado pago logic
- test(auth): add login flow tests
- perf(queries): add database indexes

❌ RUIM:
- added club feature
- fixed discord
- updated docs
- refactored
- added tests
- optimized
```

## 🗂️ Estrutura de Pastas

### Componentes

```
src/components/
├── ui/                          # UI primitives
│   ├── button.tsx
│   ├── dialog.tsx
│   └── badge.tsx
├── ClubSubscriptionWidget.tsx   # Feature-specific
├── ClubOnboardingPopup.tsx
├── ProfileEditor.tsx
└── BenefitsPanel.tsx
```

### Lib

```
src/lib/
├── auth/
│   ├── session.ts
│   └── oauth.ts
├── supabase/
│   ├── server.ts
│   └── client.ts
├── discord/
│   ├── server.ts
│   └── lazy-check.ts
├── notifications/
│   ├── discord.ts
│   └── subscription.ts
├── benefits/
│   ├── index.ts
│   └── constants.ts
└── utils/
    ├── formatDate.ts
    └── validateEmail.ts
```

### API Routes

```
src/app/api/
├── auth/
│   ├── discord/route.ts
│   └── logout/route.ts
├── subscription/
│   ├── check-eligibility/route.ts
│   ├── create/route.ts
│   ├── sync/route.ts
│   └── webhook/route.ts
├── user/
│   └── profile/route.ts
└── me/
    ├── profile/route.ts
    └── check-moderator/route.ts
```

## 🎯 Tipos e Interfaces

```typescript
// ✅ BOM: Nomes descritivos
interface UserProfile {
  id: string
  email: string
  fullName: string | null
  birthDate: string | null
  subscriptionStatus: 'active' | 'inactive' | 'cancelled'
}

type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'expired'

interface ClubSubscriptionData {
  status: ClubStatus
  eligible: boolean
  missing: string[]
  isSubscriber: boolean
}

// ❌ RUIM: Nomes genéricos
interface User {
  id: string
  data: any
  status: string
}

type Status = string
```

## 📊 Enums

```typescript
// ✅ BOM: PascalCase para enum, UPPER_SNAKE_CASE para valores
enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user'
}

// ❌ RUIM
enum subscription_status {
  active = 'active',
  inactive = 'inactive'
}
```

## 🔐 Variáveis de Ambiente

```
UPPER_SNAKE_CASE com prefixo

✅ BOM:
- NEXT_PUBLIC_APP_URL
- DISCORD_BOT_TOKEN
- DISCORD_GUILD_ID
- MERCADOPAGO_ACCESS_TOKEN
- SUPABASE_URL
- SUPABASE_ANON_KEY
- DATABASE_URL

❌ RUIM:
- appUrl
- discord_token
- guildId
- mercadoPagoToken
- supabaseUrl
```

## 📌 Resumo Rápido

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componentes | PascalCase | `UserProfile.tsx` |
| Hooks | useNome | `useClubSubscription.ts` |
| Funções | camelCase | `getUserData()` |
| Constantes | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Variáveis | camelCase | `userName` |
| Booleanos | isX, hasX | `isLoading`, `hasError` |
| Arrays | plural | `users`, `messages` |
| Callbacks | onX, handleX | `onClick`, `handleSubmit` |
| Branches | type/scope | `feat/club-subscription` |
| Commits | type(scope): msg | `feat(club): add eligibility` |
| Pastas | lowercase | `src/components/` |
| Tipos | PascalCase | `interface UserProfile` |
| Enums | PascalCase | `enum SubscriptionStatus` |
| Env Vars | UPPER_SNAKE_CASE | `DISCORD_BOT_TOKEN` |
