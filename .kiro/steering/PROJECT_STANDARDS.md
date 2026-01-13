---
inclusion: always
---

# 📋 Project Standards

Padrões técnicos e organizacionais do projeto WaveIGL.

## 🏗️ Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboard pages
│   ├── checkout/          # Checkout pages
│   └── auth/              # Auth pages
├── components/            # React Components
│   ├── ui/               # UI primitives (shadcn/ui)
│   └── [Feature]/        # Feature-specific components
├── hooks/                # Custom React Hooks
├── lib/                  # Utilities & Libraries
│   ├── auth/            # Authentication
│   ├── supabase/        # Database
│   ├── discord/         # Discord integration
│   ├── notifications/   # Notifications
│   ├── benefits/        # Subscription benefits
│   └── chat/            # Chat system
├── types/               # TypeScript types
└── middleware.ts        # Next.js middleware

tests/
├── unit/                # Unit tests
├── integration/         # Integration tests
└── e2e/                 # End-to-end tests
```

## 🔧 Stack Tecnológico

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Auth**: Custom OAuth + Supabase Auth
- **Testing**: Vitest + Playwright
- **Linting**: ESLint
- **Formatting**: Prettier

## 📦 Dependências Principais

```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.0.0",
  "@supabase/supabase-js": "^2.0.0",
  "mercadopago": "^2.0.0",
  "discord.js": "^14.0.0",
  "vitest": "^1.0.0",
  "playwright": "^1.40.0"
}
```

## 🎯 Padrões de Código

### TypeScript

- Sempre usar tipos explícitos
- Evitar `any` - usar `unknown` se necessário
- Usar interfaces para objetos públicos
- Usar types para tipos utilitários

```typescript
// ✅ BOM
interface User {
  id: string
  email: string
  name: string | null
}

type UserRole = 'admin' | 'user' | 'moderator'

// ❌ RUIM
const user: any = { ... }
```

### React Components

- Usar functional components
- Usar hooks para state management
- Memoizar componentes pesados com `React.memo`
- Usar `'use client'` para client components

```typescript
// ✅ BOM
'use client'

import { FC, useState, useCallback } from 'react'

interface UserCardProps {
  userId: string
  onSelect?: (id: string) => void
}

const UserCard: FC<UserCardProps> = ({ userId, onSelect }) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = useCallback(() => {
    onSelect?.(userId)
  }, [userId, onSelect])

  return <div onClick={handleClick}>...</div>
}

export default UserCard
```

### API Routes

- Usar métodos HTTP corretos (GET, POST, PUT, DELETE)
- Validar entrada sempre
- Retornar status codes apropriados
- Implementar rate limiting

```typescript
// ✅ BOM
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Processar
    const result = await processData(body)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Database Queries

- Usar Supabase client
- Sempre tratar erros
- Usar tipos para resultados
- Adicionar índices em campos consultados frequentemente

```typescript
// ✅ BOM
const { data, error } = await supabase
  .from('users')
  .select('id, email, name')
  .eq('id', userId)
  .single()

if (error) {
  console.error('[DB] Error:', error)
  throw new Error('Failed to fetch user')
}

return data as User
```

## 🧪 Testes

### Estrutura de Testes

```typescript
describe('Feature Name', () => {
  describe('Happy Path', () => {
    it('deve fazer X quando Y', () => {
      // Arrange
      const input = { ... }
      
      // Act
      const result = functionX(input)
      
      // Assert
      expect(result).toEqual(expected)
    })
  })

  describe('Error Cases', () => {
    it('deve lançar erro quando dados inválidos', () => {
      expect(() => functionX(invalid)).toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('deve lidar com valores nulos', () => {
      const result = functionX(null)
      expect(result).toBeNull()
    })
  })
})
```

### Cobertura de Testes

- Mínimo 80% de cobertura
- 100% para funções críticas (auth, payments)
- Testar happy path, error cases e edge cases

## 🔐 Segurança

### Autenticação

- Usar JWT tokens com expiração
- Validar tokens em cada request
- Implementar refresh tokens
- Usar HTTPS em produção

### Dados Sensíveis

- Nunca logar senhas ou tokens
- Usar variáveis de ambiente
- Sanitizar entrada do usuário
- Usar prepared statements para queries

### CORS

- Configurar CORS apenas para domínios permitidos
- Usar credenciais apenas quando necessário

## 📊 Logging

### Níveis de Log

- **DEBUG**: Informações detalhadas para debugging
- **INFO**: Eventos importantes (login, pagamento)
- **WARN**: Situações anormais mas recuperáveis
- **ERROR**: Erros que precisam atenção
- **CRITICAL**: Erros que afetam sistema inteiro

### Formato

```typescript
// ✅ BOM
console.log('[FeatureName] User logged in:', { userId, timestamp, ip })
console.error('[FeatureName] Payment failed:', { error, userId, amount })

// ❌ RUIM
console.log('ok')
console.error('error')
```

## 🚀 Performance

### Frontend

- Code splitting automático do Next.js
- Lazy load componentes pesados
- Usar `Image` component do Next.js
- Memoizar callbacks e valores

### Backend

- Usar índices no banco de dados
- Implementar caching quando apropriado
- Otimizar queries (evitar N+1)
- Usar connection pooling

### Monitoramento

- Rastrear Core Web Vitals
- Monitorar tempo de resposta das APIs
- Alertar sobre erros em produção

## 📝 Commits

### Formato de Commit

```
<type>(<scope>): <subject>

<body>

<footer>
```

Exemplo:
```
feat(club): add subscription eligibility check

- Verify Discord connection
- Check birth date requirement
- Validate personal data

Closes #123
```

### Tipos de Commit

- `feat`: Nova feature
- `fix`: Bug fix
- `docs`: Documentação
- `style`: Formatação (sem mudança de lógica)
- `refactor`: Refatoração
- `perf`: Melhoria de performance
- `test`: Testes
- `chore`: Tarefas (deps, config)

## 🔄 Versionamento

Seguir Semantic Versioning:

- **MAJOR**: Mudanças incompatíveis
- **MINOR**: Novas features compatíveis
- **PATCH**: Bug fixes

Atualizar:
- `package.json` (version)
- `CHANGELOG.md` (com data e descrição)
- Git tag: `v1.2.3`

## 📚 Documentação

### README

- Instruções de setup
- Como rodar testes
- Como fazer deploy
- Variáveis de ambiente necessárias

### JSDoc

```typescript
/**
 * Busca dados do usuário
 * @param userId - ID do usuário
 * @returns Dados do usuário ou null
 * @throws Error se houver problema na conexão
 * @example
 * const user = await getUserData('user-123')
 */
export async function getUserData(userId: string): Promise<User | null> {
  // ...
}
```

### Componentes

```typescript
interface ButtonProps {
  /** Texto do botão */
  children: React.ReactNode
  /** Variante visual */
  variant?: 'primary' | 'secondary'
  /** Callback ao clicar */
  onClick?: () => void
  /** Desabilitar botão */
  disabled?: boolean
}

/**
 * Componente de botão reutilizável
 */
export const Button: FC<ButtonProps> = ({ ... }) => {
  // ...
}
```

## 🎨 Estilo de Código

### Formatação

- Usar Prettier (configurado em `.prettierrc`)
- Linha máxima: 100 caracteres
- Indentação: 2 espaços
- Usar single quotes em strings

### Imports

```typescript
// ✅ BOM: Organizado
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { getUserData } from '@/lib/users'
import type { User } from '@/types'

// ❌ RUIM: Desorganizado
import type { User } from '@/types'
import { getUserData } from '@/lib/users'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
```

## 🔍 Code Review

Checklist para code review:

- [ ] Código segue padrões do projeto
- [ ] Testes inclusos e passando
- [ ] Sem console.log ou debug code
- [ ] Tipos TypeScript corretos
- [ ] Tratamento de erros implementado
- [ ] Documentação atualizada
- [ ] Performance considerada
- [ ] Sem secrets ou dados sensíveis
