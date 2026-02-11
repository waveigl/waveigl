---
inclusion: always
---

# 📝 Naming Conventions

Naming conventions for the WaveIGL project.

## 📁 Files and Folders

### React Components

```
PascalCase.tsx

✅ GOOD:
- UserProfile.tsx
- ClubSubscriptionWidget.tsx
- BenefitsPanel.tsx
- SubscriberBenefitsPopup.tsx

❌ BAD:
- userProfile.tsx
- club-subscription-widget.tsx
- benefits_panel.tsx
```

### Hooks

```
useHookName.ts

✅ GOOD:
- useClubSubscription.ts
- useSessionProvider.ts
- useDiscordConnection.ts
- useUserProfile.ts

❌ BAD:
- clubSubscription.ts
- sessionProvider.ts
- discord-connection.ts
```

### Utilities and Functions

```
camelCase.ts

✅ GOOD:
- formatDate.ts
- validateEmail.ts
- calculateAge.ts
- normalizePhone.ts

❌ BAD:
- FormatDate.ts
- validate_email.ts
- CalculateAge.ts
```

### Types and Interfaces

```
types.ts or [name].types.ts

✅ GOOD:
- types.ts (general types)
- user.types.ts
- subscription.types.ts
- discord.types.ts

❌ BAD:
- Types.ts
- user_types.ts
- subscriptionTypes.ts
```

### Tests

```
[file].test.ts or [file].spec.ts

✅ GOOD:
- getUserData.test.ts
- ClubSubscriptionWidget.spec.ts
- validateEmail.test.ts

❌ BAD:
- test-getUserData.ts
- club_subscription_widget_test.ts
- validate-email.spec.ts
```

### Configurations

```
[name].config.ts or [name].config.js

✅ GOOD:
- tailwind.config.ts
- next.config.js
- vitest.config.ts
- eslint.config.js

❌ BAD:
- tailwindConfig.ts
- nextConfig.js
- vitest_config.ts
```

### Folders

```
lowercase or kebab-case

✅ GOOD:
- src/components/
- src/lib/
- src/hooks/
- src/app/api/
- src/lib/discord/
- src/lib/notifications/

❌ BAD:
- src/Components/
- src/Lib/
- src/Hooks/
- src/lib/Discord/
- src/lib/Notifications/
```

## 🔤 Variables and Constants

### Constants

```
UPPER_SNAKE_CASE

✅ GOOD:
- MAX_RETRIES = 3
- API_TIMEOUT = 5000
- DISCORD_GUILD_ID = 'xxx'
- SUBSCRIPTION_PRICE = 9.90
- DEFAULT_PAGE_SIZE = 20

❌ BAD:
- maxRetries = 3
- api_timeout = 5000
- discordGuildId = 'xxx'
```

### Variables

```
camelCase

✅ GOOD:
- const userName = 'Gabriel'
- let isLoading = false
- const userData = { ... }
- const subscriptionStatus = 'active'

❌ BAD:
- const user_name = 'Gabriel'
- let IsLoading = false
- const UserData = { ... }
```

### Booleans

```
isX, hasX, canX, shouldX, needsX

✅ GOOD:
- const isLoading = true
- const hasError = false
- const canSubscribe = true
- const shouldRetry = false
- const needsReauth = true
- const isClubMember = true
- const hasDiscordConnection = false

❌ BAD:
- const loading = true
- const error = false
- const subscribe = true
- const retry = false
```

### Arrays

```
Plural or with 'List' suffix

✅ GOOD:
- const users = [...]
- const linkedAccounts = [...]
- const userList = [...]
- const messages = [...]
- const benefits = [...]

❌ BAD:
- const user = [...]
- const linkedAccount = [...]
- const userarray = [...]
```

### Functions and Methods

```
camelCase, starting with verb

✅ GOOD:
- function getUserData() { ... }
- function validateEmail() { ... }
- function calculateAge() { ... }
- function handleSubmit() { ... }
- function fetchUserProfile() { ... }
- async function createSubscription() { ... }

❌ BAD:
- function get_user_data() { ... }
- function email_validation() { ... }
- function age() { ... }
- function submit() { ... }
```

### Callbacks

```
onX or handleX

✅ GOOD:
- const onClick = () => { ... }
- const onSubmit = (data) => { ... }
- const onError = (error) => { ... }
- const handleClick = () => { ... }
- const handleChange = (value) => { ... }
- const handleSuccess = (result) => { ... }

❌ BAD:
- const click = () => { ... }
- const submit = (data) => { ... }
- const error = (error) => { ... }
```

### Getters/Setters

```
get/set + ValueName

✅ GOOD:
- function getDisplayName() { ... }
- function setUserData(data) { ... }
- function getUserRole() { ... }
- function setSubscriptionStatus(status) { ... }

❌ BAD:
- function displayName() { ... }
- function userData(data) { ... }
- function role() { ... }
```

## 🏷️ Component Props

```
camelCase

✅ GOOD:
interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  isDisabled?: boolean
  variant?: 'primary' | 'secondary'
  onHover?: () => void
}

❌ BAD:
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

Types:
- feat/     (new feature)
- fix/      (bug fix)
- refactor/ (refactoring)
- docs/     (documentation)
- test/     (tests)
- chore/    (tasks)
- perf/     (performance)

✅ GOOD:
- feat/club-subscription
- fix/discord-sync-error
- refactor/payment-logic
- docs/api-endpoints
- test/user-validation
- chore/update-dependencies
- perf/optimize-queries

❌ BAD:
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

Types:
- feat:     New feature
- fix:      Bug fix
- docs:     Documentation
- style:    Formatting
- refactor: Refactoring
- perf:     Performance
- test:     Tests
- chore:    Tasks

✅ GOOD:
- feat(club): add subscription eligibility check
- fix(discord): resolve sync error on webhook
- docs(api): add endpoint documentation
- refactor(payment): simplify mercado pago logic
- test(auth): add login flow tests
- perf(queries): add database indexes

❌ BAD:
- added club feature
- fixed discord
- updated docs
- refactored
- added tests
- optimized
```

## 🗂️ Folder Structure

### Components

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

## 🎯 Types and Interfaces

```typescript
// ✅ GOOD: Descriptive names
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

// ❌ BAD: Generic names
interface User {
  id: string
  data: any
  status: string
}

type Status = string
```

## 📊 Enums

```typescript
// ✅ GOOD: PascalCase for enum, UPPER_SNAKE_CASE for values
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

// ❌ BAD
enum subscription_status {
  active = 'active',
  inactive = 'inactive'
}
```

## 🔐 Environment Variables

```
UPPER_SNAKE_CASE with prefix

✅ GOOD:
- NEXT_PUBLIC_APP_URL
- DISCORD_BOT_TOKEN
- DISCORD_GUILD_ID
- MERCADOPAGO_ACCESS_TOKEN
- SUPABASE_URL
- SUPABASE_ANON_KEY
- DATABASE_URL

❌ BAD:
- appUrl
- discord_token
- guildId
- mercadoPagoToken
- supabaseUrl
```

## 📌 Quick Reference

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Hooks | useName | `useClubSubscription.ts` |
| Functions | camelCase | `getUserData()` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Variables | camelCase | `userName` |
| Booleans | isX, hasX | `isLoading`, `hasError` |
| Arrays | plural | `users`, `messages` |
| Callbacks | onX, handleX | `onClick`, `handleSubmit` |
| Branches | type/scope | `feat/club-subscription` |
| Commits | type(scope): msg | `feat(club): add eligibility` |
| Folders | lowercase | `src/components/` |
| Types | PascalCase | `interface UserProfile` |
| Enums | PascalCase | `enum SubscriptionStatus` |
| Env Vars | UPPER_SNAKE_CASE | `DISCORD_BOT_TOKEN` |
