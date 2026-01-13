# 🚀 Setup Instructions - WaveIGL AI Guidelines

## ✅ O que foi criado

Um sistema completo de regras e padrões para o projeto WaveIGL, compatível com múltiplas IAs:

### 📁 Arquivos Criados

```
.kiro/steering/
├── README.md                    # 📚 Índice e guia rápido
├── AI_GUIDELINES.md            # 🤖 Diretrizes para IAs
├── PROJECT_STANDARDS.md        # 📋 Padrões técnicos
├── NAMING_CONVENTIONS.md       # 📝 Convenções de nome
├── ERROR_HANDLING.md           # 🚨 Tratamento de erros
├── ARCHITECTURE.md             # 🏗️ Arquitetura do sistema
└── AUTOMATION.md               # ⚙️ Automação e CI/CD
```

## 🎯 Funcionalidades Principais

### 1. ✅ Testes Automáticos
- Testes unitários obrigatórios
- Testes E2E para fluxos críticos
- Cobertura mínima de 80%
- Estrutura em `tests/` com exemplos

### 2. 🔔 Notificações Discord
- Erros críticos notificam Discord
- Diferentes níveis (INFO, WARNING, ERROR, CRITICAL)
- Contexto completo (userId, timestamp, stack trace)
- Webhooks configuráveis via `.env`

### 3. 📝 Nomenclaturas Padronizadas
- Componentes: `PascalCase.tsx`
- Hooks: `useNomeDoHook.ts`
- Funções: `camelCase()`
- Constantes: `UPPER_SNAKE_CASE`
- Branches: `feat/descricao`, `fix/descricao`
- Commits: `feat(scope): message`

### 4. 🏗️ Arquitetura Documentada
- Estrutura clara de pastas
- Fluxos principais explicados
- Integrações mapeadas
- Banco de dados documentado

### 5. ⚙️ Automação Completa
- Execução automática sem aprovação
- Testes em cada commit
- Linting e type checking
- Build e deploy automáticos
- Rollback se falhar

### 6. 🚨 Tratamento de Erros Robusto
- Padrões de try-catch
- Retry com backoff exponencial
- Logs estruturados
- Notificações Discord

## 🚀 Como Usar

### Para IAs (Claude, Gemini, Grok, etc.)

1. **Primeira vez?**
   - Leia `.kiro/steering/README.md`
   - Leia `.kiro/steering/AI_GUIDELINES.md`
   - Consulte outros arquivos conforme necessário

2. **Antes de fazer mudanças:**
   ```
   ✓ Ler AI_GUIDELINES.md (fluxo de desenvolvimento)
   ✓ Consultar NAMING_CONVENTIONS.md
   ✓ Revisar ARCHITECTURE.md se for nova feature
   ```

3. **Durante desenvolvimento:**
   ```
   ✓ Seguir PROJECT_STANDARDS.md
   ✓ Implementar testes
   ✓ Tratar erros conforme ERROR_HANDLING.md
   ✓ Usar nomenclaturas corretas
   ```

4. **Após implementação:**
   ```
   ✓ npm run test
   ✓ npm run lint
   ✓ npm run type-check
   ✓ Atualizar CHANGELOG.md
   ✓ Fazer commit com mensagem padrão
   ```

### Para Desenvolvedores

1. **Ler documentação:**
   - Comece com `.kiro/steering/README.md`
   - Consulte arquivos específicos conforme necessário

2. **Configurar ambiente:**
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
