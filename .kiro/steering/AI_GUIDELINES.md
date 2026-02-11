---
inclusion: always
---

# 🤖 AI Development Guidelines

Guidelines for AIs (Claude, Gemini, Grok, Cursor Composer, ChatGPT, local models) working on this project.

## 📋 Fundamental Principles

1. **Always run tests** after any code changes
2. **Notify Discord** in case of production errors
3. **Follow naming conventions** standardized in the project
4. **Maintain compatibility** with all supported platforms
5. **Document changes** in CHANGELOG.md
6. **Execute automatically** without waiting for approval
7. **DO NOT create .md documentation files** automatically (see section below)

## 🚫 Documentation Files (.md)

**IMPORTANT RULE**: DO NOT create `.md` files automatically when making fixes or implementations.

### ❌ DO NOT:
- Create files like `FIX_NAME.md`, `IMPLEMENTATION.md`, `ANALYSIS.md`
- Create fix documentation in `.kiro/` or any other folder
- Create summaries or reports in markdown

### ✅ DO:
- Update only `CHANGELOG.md` with changes
- Create `.md` files **ONLY** when:
  - The user explicitly asks for it
  - There are specific instructions to create documentation
  - It's a steering file (in `.kiro/steering/`)

### Example:
```
# ❌ WRONG - Create automatically
Creating file .kiro/TWITCH_FIX.md to document...

# ✅ CORRECT - Only update CHANGELOG
Updating CHANGELOG.md with changes...
```

## 🚫 Important Rules

### DO NOT CREATE documentation files for fixes

When implementing fixes or improvements:

- ❌ **DO NOT** create files like `FIX_NAME.md`, `CORRECTION_X.md`, `SOLUTION_Y.md`
- ❌ **DO NOT** create files in `.kiro/` folder to document fixes
- ❌ **DO NOT** create specific READMEs for each fix
- ✅ **YES** document in `CHANGELOG.md` (mandatory)
- ✅ **YES** add comments in code when necessary
- ✅ **YES** use structured logs for debugging

Fix documentation should be done **only** in `CHANGELOG.md` following the standard format.

## 🔄 Development Workflow

### 1. Before Making Changes
- [ ] Read `PROJECT_STANDARDS.md`
- [ ] Check `NAMING_CONVENTIONS.md`
- [ ] Consult `ARCHITECTURE.md` to understand structure
- [ ] Review `ERROR_HANDLING.md` for error handling

### 2. During Development
- [ ] Follow naming standards
- [ ] Add complete TypeScript types
- [ ] Implement error handling
- [ ] Add structured logs
- [ ] Create unit tests

### 3. After Implementation
- [ ] Run `npm run test` (unit tests)
- [ ] Run `npm run test:e2e` (E2E tests)
- [ ] Run `npm run lint` (check code)
- [ ] Run `npm run type-check` (check types)
- [ ] Update `CHANGELOG.md`
- [ ] Notify Discord if there are errors

## 🧪 Mandatory Tests

Every change must include tests:

```typescript
// ✅ GOOD: Complete test
describe('Feature X', () => {
  it('should do Y when Z', () => {
    // Arrange
    const input = { ... }
    
    // Act
    const result = functionX(input)
    
    // Assert
    expect(result).toEqual(expected)
  })
  
  it('should throw error when invalid data', () => {
    expect(() => functionX(invalid)).toThrow()
  })
})

// ❌ BAD: Without tests
function functionX() { ... }
```

## 📝 Naming

### Files
- **React Components**: `PascalCase.tsx` (ex: `UserProfile.tsx`)
- **Hooks**: `useHookName.ts` (ex: `useClubSubscription.ts`)
- **Utilities**: `camelCase.ts` (ex: `formatDate.ts`)
- **Types**: `types.ts` or `[name].types.ts`
- **Tests**: `[file].test.ts` or `[file].spec.ts`

### Variables and Functions
- **Constants**: `UPPER_SNAKE_CASE` (ex: `MAX_RETRIES`)
- **Functions**: `camelCase` (ex: `getUserData()`)
- **Booleans**: `isX`, `hasX`, `canX` (ex: `isLoading`, `hasError`)
- **Callbacks**: `onX`, `handleX` (ex: `onClick`, `handleSubmit`)

### Git Branches
- **Feature**: `feat/short-description` (ex: `feat/club-subscription`)
- **Bug**: `fix/short-description` (ex: `fix/discord-sync-error`)
- **Refactor**: `refactor/short-description`
- **Docs**: `docs/short-description`

## 🚨 Error Handling

Always implement error handling:

```typescript
// ✅ GOOD
try {
  const result = await riskyOperation()
  return { success: true, data: result }
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  console.error('[FeatureName] Error:', message)
  await notifyDiscord({
    level: 'error',
    message: `Feature X failed: ${message}`,
    context: { userId, timestamp: new Date() }
  })
  return { success: false, error: message }
}

// ❌ BAD
const result = await riskyOperation() // Without try-catch
```

## 📊 Structured Logs

Use logs with context:

```typescript
// ✅ GOOD
console.log('[FeatureName] User subscribed:', { userId, planId, timestamp })
console.error('[FeatureName] Payment failed:', { error, userId, amount })

// ❌ BAD
console.log('done')
console.error('error')
```

## 🔔 Discord Notifications

Critical errors should notify Discord:

```typescript
import { notifyDiscord } from '@/lib/notifications/discord'

await notifyDiscord({
  level: 'error', // 'info', 'warning', 'error', 'critical'
  title: 'Payment Processing Failed',
  message: 'Mercado Pago webhook error',
  context: {
    userId: 'user-123',
    error: error.message,
    timestamp: new Date().toISOString()
  }
})
```

## 📦 Versioning

Follow Semantic Versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Incompatible changes (ex: `1.0.0` → `2.0.0`)
- **MINOR**: Compatible new features (ex: `1.0.0` → `1.1.0`)
- **PATCH**: Bug fixes (ex: `1.0.0` → `1.0.1`)

Update in:
- `package.json` (version)
- `CHANGELOG.md` (with date and description)

## 🔐 Security

- Never commit `.env` or secrets
- Use environment variables for sensitive data
- Always validate user input
- Sanitize data before using in queries
- Use HTTPS in production

## 📚 Documentation

Document:
- Public functions with JSDoc
- Components with props documentation
- APIs with usage examples
- Significant changes in CHANGELOG.md

```typescript
/**
 * Fetches user data
 * @param userId - User ID
 * @returns User data or null if not found
 * @throws Error if connection fails
 */
export async function getUserData(userId: string): Promise<User | null> {
  // ...
}
```

## ⚡ Performance

- Use `useMemo` for heavy calculations
- Use `useCallback` for callbacks in lists
- Lazy load components when possible
- Optimize database queries
- Use indexes on frequently queried fields

## 🔄 CI/CD

The project runs automatically:
- Tests on each commit
- Linting and type checking
- Build on staging
- Deploy to production if everything passes

No manual approval needed.

## 📞 Support

Questions about standards? Consult:
- `PROJECT_STANDARDS.md` - General standards
- `ARCHITECTURE.md` - Project structure
- `ERROR_HANDLING.md` - Error handling
- `NAMING_CONVENTIONS.md` - Naming conventions
