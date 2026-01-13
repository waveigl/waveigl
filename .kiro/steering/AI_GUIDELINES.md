---
inclusion: always
---

# 🤖 AI Development Guidelines

Diretrizes para IAs (Claude, Gemini, Grok, Cursor Composer, ChatGPT, modelos locais) ao trabalhar neste projeto.

## 📋 Princípios Fundamentais

1. **Sempre executar testes** após qualquer mudança de código
2. **Notificar Discord** em caso de erros em produção
3. **Seguir nomenclaturas** padronizadas do projeto
4. **Manter compatibilidade** com todas as plataformas suportadas
5. **Documentar mudanças** em CHANGELOG.md
6. **Executar automaticamente** sem aguardar aprovação

## 🔄 Fluxo de Desenvolvimento

### 1. Antes de Fazer Mudanças
- [ ] Ler o arquivo `PROJECT_STANDARDS.md`
- [ ] Verificar `NAMING_CONVENTIONS.md`
- [ ] Consultar `ARCHITECTURE.md` para entender a estrutura
- [ ] Revisar `ERROR_HANDLING.md` para tratamento de erros

### 2. Durante o Desenvolvimento
- [ ] Seguir o padrão de nomenclatura
- [ ] Adicionar tipos TypeScript completos
- [ ] Implementar tratamento de erros
- [ ] Adicionar logs estruturados
- [ ] Criar testes unitários

### 3. Após Implementação
- [ ] Executar `npm run test` (testes unitários)
- [ ] Executar `npm run test:e2e` (testes E2E)
- [ ] Executar `npm run lint` (verificar código)
- [ ] Executar `npm run type-check` (verificar tipos)
- [ ] Atualizar `CHANGELOG.md`
- [ ] Notificar Discord se houver erros

## 🧪 Testes Obrigatórios

Toda mudança deve incluir testes:

```typescript
// ✅ BOM: Teste completo
describe('Feature X', () => {
  it('deve fazer Y quando Z', () => {
    // Arrange
    const input = { ... }
    
    // Act
    const result = functionX(input)
    
    // Assert
    expect(result).toEqual(expected)
  })
  
  it('deve lançar erro quando dados inválidos', () => {
    expect(() => functionX(invalid)).toThrow()
  })
})

// ❌ RUIM: Sem testes
function functionX() { ... }
```

## 📝 Nomenclatura

### Arquivos
- **Componentes React**: `PascalCase.tsx` (ex: `UserProfile.tsx`)
- **Hooks**: `useNomeDoHook.ts` (ex: `useClubSubscription.ts`)
- **Utilitários**: `camelCase.ts` (ex: `formatDate.ts`)
- **Tipos**: `types.ts` ou `[nome].types.ts`
- **Testes**: `[arquivo].test.ts` ou `[arquivo].spec.ts`

### Variáveis e Funções
- **Constantes**: `UPPER_SNAKE_CASE` (ex: `MAX_RETRIES`)
- **Funções**: `camelCase` (ex: `getUserData()`)
- **Booleanos**: `isX`, `hasX`, `canX` (ex: `isLoading`, `hasError`)
- **Callbacks**: `onX`, `handleX` (ex: `onClick`, `handleSubmit`)

### Branches Git
- **Feature**: `feat/descricao-curta` (ex: `feat/club-subscription`)
- **Bug**: `fix/descricao-curta` (ex: `fix/discord-sync-error`)
- **Refactor**: `refactor/descricao-curta`
- **Docs**: `docs/descricao-curta`

## 🚨 Tratamento de Erros

Sempre implementar tratamento de erros:

```typescript
// ✅ BOM
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

// ❌ RUIM
const result = await riskyOperation() // Sem try-catch
```

## 📊 Logs Estruturados

Use logs com contexto:

```typescript
// ✅ BOM
console.log('[FeatureName] User subscribed:', { userId, planId, timestamp })
console.error('[FeatureName] Payment failed:', { error, userId, amount })

// ❌ RUIM
console.log('done')
console.error('error')
```

## 🔔 Notificações Discord

Erros críticos devem notificar Discord:

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

## 📦 Versionamento

Seguir Semantic Versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Mudanças incompatíveis (ex: `1.0.0` → `2.0.0`)
- **MINOR**: Novas features compatíveis (ex: `1.0.0` → `1.1.0`)
- **PATCH**: Bug fixes (ex: `1.0.0` → `1.0.1`)

Atualizar em:
- `package.json` (version)
- `CHANGELOG.md` (com data e descrição)

## 🔐 Segurança

- Nunca commitar `.env` ou secrets
- Usar variáveis de ambiente para dados sensíveis
- Validar entrada do usuário sempre
- Sanitizar dados antes de usar em queries
- Usar HTTPS em produção

## 📚 Documentação

Documentar:
- Funções públicas com JSDoc
- Componentes com props documentation
- APIs com exemplos de uso
- Mudanças significativas em CHANGELOG.md

```typescript
/**
 * Busca dados do usuário
 * @param userId - ID do usuário
 * @returns Dados do usuário ou null se não encontrado
 * @throws Error se houver problema na conexão
 */
export async function getUserData(userId: string): Promise<User | null> {
  // ...
}
```

## ⚡ Performance

- Usar `useMemo` para cálculos pesados
- Usar `useCallback` para callbacks em listas
- Lazy load componentes quando possível
- Otimizar queries do banco de dados
- Usar índices em campos frequentemente consultados

## 🔄 CI/CD

O projeto roda automaticamente:
- Testes em cada commit
- Linting e type checking
- Build em staging
- Deploy em produção se tudo passar

Não aguarda aprovação manual.

## 📞 Suporte

Dúvidas sobre padrões? Consulte:
- `PROJECT_STANDARDS.md` - Padrões gerais
- `ARCHITECTURE.md` - Estrutura do projeto
- `ERROR_HANDLING.md` - Tratamento de erros
- `NAMING_CONVENTIONS.md` - Nomenclaturas
