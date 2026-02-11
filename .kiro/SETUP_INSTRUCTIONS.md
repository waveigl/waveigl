# 🚀 Setup Instructions - WaveIGL AI Guidelines

## ✅ What Was Created

A complete system of rules and standards for the WaveIGL project, compatible with multiple AIs:

### 📁 Files Created

```
.kiro/steering/
├── README.md                    # 📚 Index and quick start
├── AI_GUIDELINES.md            # 🤖 Guidelines for AIs
├── PROJECT_STANDARDS.md        # 📋 Technical standards
├── NAMING_CONVENTIONS.md       # 📝 Naming conventions
├── ERROR_HANDLING.md           # 🚨 Error handling
├── ARCHITECTURE.md             # 🏗️ System architecture
└── AUTOMATION.md               # ⚙️ Automation and CI/CD
```

## 🎯 Main Features

### 1. ✅ Automatic Testing
- Mandatory unit tests
- E2E tests for critical flows
- Minimum 80% coverage
- Structure in `tests/` with examples

### 2. 🔔 Discord Notifications
- Critical errors notify Discord
- Different levels (INFO, WARNING, ERROR, CRITICAL)
- Complete context (userId, timestamp, stack trace)
- Configurable webhooks via `.env`

### 3. 📝 Standardized Naming
- Components: `PascalCase.tsx`
- Hooks: `useNomeDoHook.ts`
- Functions: `camelCase()`
- Constants: `UPPER_SNAKE_CASE`
- Branches: `feat/description`, `fix/description`
- Commits: `feat(scope): message`

### 4. 🏗️ Documented Architecture
- Clear folder structure
- Main flows explained
- Integrations mapped
- Database documented

### 5. ⚙️ Complete Automation
- Automatic execution without approval
- Tests on each commit
- Linting and type checking
- Automatic build and deployment
- Automatic rollback if fails

### 6. 🚨 Robust Error Handling
- Try-catch patterns
- Retry with exponential backoff
- Structured logging
- Discord notifications

## 🚀 How to Use

### For AIs (Claude, Gemini, Grok, etc.)

1. **First time?**
   - Read `.kiro/steering/README.md`
   - Read `.kiro/steering/AI_GUIDELINES.md`
   - Consult other files as needed

2. **Before making changes:**
   ```
   ✓ Read AI_GUIDELINES.md (development flow)
   ✓ Consult NAMING_CONVENTIONS.md
   ✓ Review ARCHITECTURE.md if new feature
   ```

3. **During development:**
   ```
   ✓ Follow PROJECT_STANDARDS.md
   ✓ Implement tests
   ✓ Handle errors per ERROR_HANDLING.md
   ✓ Use correct naming conventions
   ```

4. **After implementation:**
   ```
   ✓ npm run test
   ✓ npm run lint
   ✓ npm run type-check
   ✓ Update CHANGELOG.md
   ✓ Commit with standard message
   ```

### For Developers

1. **Read documentation:**
   - Start with `.kiro/steering/README.md`
   - Consult specific files as needed

2. **Configure environment:**
   ```bash
   # Instalar dependências
   npm install

   # Configurar variáveis de ambiente
   cp .env.example .env.local
   # Adicionar webhooks Discord
   ```

3. **Executar testes:**
   ```bash
   npm run test
   npm run test:e2e
   npm run lint
   npm run type-check
   ```

4. **Fazer mudanças:**
   - Seguir padrões em `.kiro/steering/`
   - Criar testes para cada mudança
   - Atualizar CHANGELOG.md

## 📊 Estrutura de Regras

### Hierarquia de Documentos

```
README.md (Índice e Quick Start)
    ↓
AI_GUIDELINES.md (Diretrizes principais)
    ↓
PROJECT_STANDARDS.md (Padrões técnicos)
    ↓
NAMING_CONVENTIONS.md (Nomenclaturas)
ERROR_HANDLING.md (Tratamento de erros)
ARCHITECTURE.md (Arquitetura)
AUTOMATION.md (Automação)
```

### Quando Consultar Cada Arquivo

| Situação | Arquivo |
|----------|---------|
| Primeira vez no projeto | README.md |
| Dúvida sobre padrões | PROJECT_STANDARDS.md |
| Como nomear algo | NAMING_CONVENTIONS.md |
| Tratamento de erro | ERROR_HANDLING.md |
| Entender arquitetura | ARCHITECTURE.md |
| Configurar automação | AUTOMATION.md |
| Diretrizes gerais | AI_GUIDELINES.md |

## 🔧 Configuração Necessária

### 1. Variáveis de Ambiente

```bash
# .env.local
DISCORD_ERROR_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_INFO_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_CRITICAL_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### 2. Scripts npm

Adicionar em `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "lint": "eslint src --max-warnings 0",
    "lint:fix": "eslint src --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

### 3. Hooks Git

Configurar pre-commit e pre-push para executar testes automaticamente.

## 📈 Benefícios

### Para Desenvolvedores
- ✅ Código consistente e padronizado
- ✅ Menos bugs e erros
- ✅ Melhor documentação
- ✅ Fácil onboarding
- ✅ Automação de testes

### Para IAs
- ✅ Diretrizes claras
- ✅ Padrões bem definidos
- ✅ Exemplos de código
- ✅ Fluxos documentados
- ✅ Compatibilidade garantida

### Para o Projeto
- ✅ Qualidade de código
- ✅ Segurança melhorada
- ✅ Performance otimizada
- ✅ Manutenibilidade
- ✅ Escalabilidade

## 🎓 Exemplos de Uso

### Exemplo 1: Criar Novo Componente

```typescript
// 1. Ler NAMING_CONVENTIONS.md → Componentes: PascalCase.tsx
// 2. Ler PROJECT_STANDARDS.md → Padrões de React
// 3. Criar arquivo: src/components/MyComponent.tsx

'use client'

import { FC } from 'react'

interface MyComponentProps {
  /** Descrição da prop */
  title: string
  /** Callback ao clicar */
  onClick?: () => void
}

/**
 * Descrição do componente
 * @example
 * <MyComponent title="Hello" onClick={() => console.log('clicked')} />
 */
const MyComponent: FC<MyComponentProps> = ({ title, onClick }) => {
  return <div onClick={onClick}>{title}</div>
}

export default MyComponent

// 4. Criar testes: tests/unit/components/MyComponent.test.ts
// 5. Executar: npm run test
// 6. Atualizar CHANGELOG.md
// 7. Fazer commit: feat(components): add MyComponent
```

### Exemplo 2: Tratar Erro em API

```typescript
// 1. Ler ERROR_HANDLING.md
// 2. Implementar tratamento

import { handleError } from '@/lib/notifications/error-handler'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const result = await processData(body)
    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    await handleError({
      level: 'error',
      title: 'API Error: POST /api/endpoint',
      message,
      context: { endpoint: '/api/endpoint' }
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 3. Criar testes
// 4. Executar: npm run test
```

## 🔄 Fluxo Completo

```
1. IA recebe tarefa
   ↓
2. Lê .kiro/steering/README.md
   ↓
3. Consulta arquivos relevantes
   ↓
4. Implementa seguindo padrões
   ↓
5. Cria testes
   ↓
6. Executa: npm run test, lint, type-check
   ↓
7. Se erro → Notifica Discord
   ↓
8. Se sucesso → Atualiza CHANGELOG.md
   ↓
9. Faz commit com mensagem padrão
   ↓
10. Push automático com testes
```

## 📞 Suporte

### Dúvidas?

1. **Padrões gerais**: `.kiro/steering/PROJECT_STANDARDS.md`
2. **Nomenclatura**: `.kiro/steering/NAMING_CONVENTIONS.md`
3. **Erros**: `.kiro/steering/ERROR_HANDLING.md`
4. **Arquitetura**: `.kiro/steering/ARCHITECTURE.md`
5. **Automação**: `.kiro/steering/AUTOMATION.md`
6. **Diretrizes IA**: `.kiro/steering/AI_GUIDELINES.md`

## ✨ Próximos Passos

1. ✅ Revisar todos os arquivos em `.kiro/steering/`
2. ✅ Configurar variáveis de ambiente
3. ✅ Adicionar scripts npm
4. ✅ Configurar hooks Git
5. ✅ Começar a usar as regras em novos desenvolvimentos
6. ✅ Refatorar código existente conforme padrões

## 📝 Versão

- **Versão**: 1.0.0
- **Data**: 2024-01-13
- **Compatível com**: Claude, Gemini, Grok, Cursor Composer, ChatGPT, modelos locais
- **Status**: ✅ Pronto para uso

---

**Criado em**: 2024-01-13
**Última atualização**: 2024-01-13

Para sugestões ou melhorias, consulte os arquivos em `.kiro/steering/`
