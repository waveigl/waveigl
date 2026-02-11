---
inclusion: always
---

# 📋 Project Standards

Technical and organizational standards for the WaveIGL project.

## 🏗️ Project Structure

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

## 🔧 Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Auth**: Custom OAuth + Supabase Auth
- **Testing**: Vitest + Playwright
- **Linting**: ESLint
- **Formatting**: Prettier

## 📦 Main Dependencies

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

## 🎯 Code Standards

### TypeScript

- Always use explicit types
- Avoid `any` - use `unknown` if necessary
- Use interfaces for public objects
- Use types for utility types

```typescript
// ✅ GOOD
interface User {
  id: string
  email: string
  name: string | null
}

type UserRole = 'admin' | 'user' | 'moderator'

// ❌ BAD
const user: any = { ... }
```

### React Components

- Use functional components
- Use hooks for state management
- Memoize heavy components with `React.memo`
- Use `'use client'` for client components

```typescript
// ✅ GOOD
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

- Use correct HTTP methods (GET, POST, PUT, DELETE)
- Always validate input
- Return appropriate status codes
- Implement rate limiting

```typescript
// ✅ GOOD
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Process
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

- Use Supabase client
- Always handle errors
- Use types for results
- Add indexes on frequently queried fields

```typescript
// ✅ GOOD
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

## 🧪 Testing

### Test Structure

```typescript
describe('Feature Name', () => {
  describe('Happy Path', () => {
    it('should do X when Y', () => {
      // Arrange
      const input = { ... }
      
      // Act
      const result = functionX(input)
      
      // Assert
      expect(result).toEqual(expected)
    })
  })

  describe('Error Cases', () => {
    it('should throw error when invalid data', () => {
      expect(() => functionX(invalid)).toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const result = functionX(null)
      expect(result).toBeNull()
    })
  })
})
```

### Test Coverage

- Minimum 80% coverage
- 100% for critical functions (auth, payments)
- Test happy path, error cases, and edge cases

## 🔐 Security

### Authentication

- Use JWT tokens with expiration
- Validate tokens on each request
- Implement refresh tokens
- Use HTTPS in production

### Sensitive Data

- Never log passwords or tokens
- Use environment variables
- Sanitize user input
- Use prepared statements for queries

### CORS

- Configure CORS only for allowed domains
- Use credentials only when necessary

## 📊 Logging

### Log Levels

- **DEBUG**: Detailed information for debugging
- **INFO**: Important events (login, payment)
- **WARN**: Abnormal but recoverable situations
- **ERROR**: Errors that need attention
- **CRITICAL**: Errors affecting the entire system

### Format

```typescript
// ✅ GOOD
console.log('[FeatureName] User logged in:', { userId, timestamp, ip })
console.error('[FeatureName] Payment failed:', { error, userId, amount })

// ❌ BAD
console.log('ok')
console.error('error')
```

## 🚀 Performance

### Frontend

- Automatic code splitting with Next.js
- Lazy load heavy components
- Use Next.js `Image` component
- Memoize callbacks and values

### Backend

- Use database indexes
- Implement caching when appropriate
- Optimize queries (avoid N+1)
- Use connection pooling

### Monitoring

- Track Core Web Vitals
- Monitor API response times
- Alert on production errors

## 📝 Commits

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Example:
```
feat(club): add subscription eligibility check

- Verify Discord connection
- Check birth date requirement
- Validate personal data

Closes #123
```

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no logic change)
- `refactor`: Refactoring
- `perf`: Performance improvement
- `test`: Tests
- `chore`: Tasks (deps, config)

## 🔄 Versioning

Follow Semantic Versioning:

- **MAJOR**: Incompatible changes
- **MINOR**: Compatible new features
- **PATCH**: Bug fixes

Update:
- `package.json` (version)
- `CHANGELOG.md` (with date and description)
- Git tag: `v1.2.3`

## 📚 Documentation

### README

- Setup instructions
- How to run tests
- How to deploy
- Required environment variables

### JSDoc

```typescript
/**
 * Fetches user data
 * @param userId - User ID
 * @returns User data or null
 * @throws Error if connection fails
 * @example
 * const user = await getUserData('user-123')
 */
export async function getUserData(userId: string): Promise<User | null> {
  // ...
}
```

### Components

```typescript
interface ButtonProps {
  /** Button text */
  children: React.ReactNode
  /** Visual variant */
  variant?: 'primary' | 'secondary'
  /** Click callback */
  onClick?: () => void
  /** Disable button */
  disabled?: boolean
}

/**
 * Reusable button component
 */
export const Button: FC<ButtonProps> = ({ ... }) => {
  // ...
}
```

## 🎨 Code Style

### Formatting

- Use Prettier (configured in `.prettierrc`)
- Maximum line length: 100 characters
- Indentation: 2 spaces
- Use single quotes in strings

### Imports

```typescript
// ✅ GOOD: Organized
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { getUserData } from '@/lib/users'
import type { User } from '@/types'

// ❌ BAD: Disorganized
import type { User } from '@/types'
import { getUserData } from '@/lib/users'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
```

## 🔍 Code Review

Code review checklist:

- [ ] Code follows project standards
- [ ] Tests included and passing
- [ ] No console.log or debug code
- [ ] Correct TypeScript types
- [ ] Error handling implemented
- [ ] Documentation updated
- [ ] Performance considered
- [ ] No secrets or sensitive data
