---
inclusion: always
---

# 📚 WaveIGL Development Guidelines

Bem-vindo ao sistema de regras e padrões do projeto WaveIGL! Este diretório contém toda a documentação necessária para manter o código consistente, seguro e de alta qualidade.

## 📖 Índice de Documentos

### 🤖 [AI_GUIDELINES.md](./AI_GUIDELINES.md)
Diretrizes para IAs (Claude, Gemini, Grok, Cursor Composer, ChatGPT, modelos locais).

**Tópicos:**
- Princípios fundamentais
- Fluxo de desenvolvimento
- Testes obrigatórios
- Nomenclatura
- Tratamento de erros
- Logs estruturados
- Notificações Discord
- Versionamento
- Segurança
- Documentação
- Performance
- CI/CD

**Quando usar:** Sempre! Este é o guia principal para qualquer IA trabalhando no projeto.

---

### 📋 [PROJECT_STANDARDS.md](./PROJECT_STANDARDS.md)
Padrões técnicos e organizacionais do projeto.

**Tópicos:**
- Estrutura de pastas
- Stack tecnológico
- Dependências principais
- Padrões de código (TypeScript, React, API Routes, Database)
- Testes
- Segurança
- Logging
- Performance
- Commits
- Versionamento
- Documentação
- Estilo de código
- Code review

**Quando usar:** Ao iniciar novo desenvolvimento ou revisar código.

---

### 📝 [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md)
Convenções de nomenclatura para todo o projeto.

**Tópicos:**
- Arquivos e pastas
- Variáveis e constantes
- Booleanos
- Arrays
- Funções e métodos
- Callbacks
- Getters/Setters
- Props de componentes
- Git branches
- Commits
- Estrutura de pastas
- Tipos e interfaces
- Enums
- Variáveis de ambiente

**Quando usar:** Ao nomear qualquer coisa no projeto.

---

### 🚨 [ERROR_HANDLING.md](./ERROR_HANDLING.md)
Guia completo para tratamento de erros e notificações em produção.

**Tópicos:**
- Níveis de erro (CRITICAL, ERROR, WARNING, INFO)
- Sistema de notificações Discord
- Padrões de tratamento
- Casos de uso específicos
- Logging estruturado
- Retry logic
- Boas práticas
- Monitoramento
- Segurança

**Quando usar:** Ao implementar tratamento de erros ou integrar com Discord.

---

### 🏗️ [ARCHITECTURE.md](./ARCHITECTURE.md)
Arquitetura e design do sistema WaveIGL.

**Tópicos:**
- Visão geral
- Stack tecnológico
- Fluxo de dados
- Estrutura de pastas
- Fluxos principais
- Segurança
- Banco de dados
- Integrações
- Performance
- Testes
- Escalabilidade
- CI/CD

**Quando usar:** Para entender a estrutura geral do projeto.

---

### ⚙️ [AUTOMATION.md](./AUTOMATION.md)
Configuração de automação e CI/CD do projeto.

**Tópicos:**
- Execução automática
- Fluxo de desenvolvimento
- Testes
- Linting e type checking
- Build
- Deploy
- Notificações Discord
- Monitoramento
- Versionamento
- CHANGELOG
- Segurança
- Dependências
- Hooks Git
- Scripts npm
- Troubleshooting

**Quando usar:** Ao configurar automação ou entender o fluxo de CI/CD.

---

## 🚀 Quick Start para IAs

### 1️⃣ Primeira Vez?
Leia nesta ordem:
1. Este README
2. [AI_GUIDELINES.md](./AI_GUIDELINES.md)
3. [PROJECT_STANDARDS.md](./PROJECT_STANDARDS.md)
4. [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md)

### 2️⃣ Antes de Fazer Mudanças
- [ ] Ler [AI_GUIDELINES.md](./AI_GUIDELINES.md) - Fluxo de Desenvolvimento
- [ ] Consultar [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md)
- [ ] Revisar [ARCHITECTURE.md](./ARCHITECTURE.md) se for nova feature

### 3️⃣ Durante o Desenvolvimento
- [ ] Seguir [PROJECT_STANDARDS.md](./PROJECT_STANDARDS.md)
- [ ] Implementar testes conforme [AUTOMATION.md](./AUTOMATION.md)
- [ ] Tratar erros conforme [ERROR_HANDLING.md](./ERROR_HANDLING.md)

### 4️⃣ Após Implementação
- [ ] Executar testes: `npm run test`
- [ ] Executar linting: `npm run lint`
- [ ] Executar type check: `npm run type-check`
- [ ] Atualizar CHANGELOG.md
- [ ] Fazer commit conforme [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md)

## 🎯 Princípios Fundamentais

### 1. Sempre Executar Testes
```bash
npm run test
npm run test:e2e
npm run lint
npm run type-check
```

### 2. Notificar Discord em Erros
```typescript
await notifyDiscord({
  level: 'error',
  title: 'Something Failed',
  message: error.message,
  context: { userId, timestamp: new Date() }
})
```

### 3. Seguir Nomenclaturas
- Componentes: `PascalCase.tsx`
- Hooks: `useNomeDoHook.ts`
- Funções: `camelCase()`
- Constantes: `UPPER_SNAKE_CASE`

### 4. Manter Compatibilidade
- Testar em múltiplas plataformas
- Verificar tipos TypeScript
- Validar entrada do usuário

### 5. Documentar Mudanças
- Atualizar CHANGELOG.md
- Adicionar JSDoc em funções públicas
- Documentar componentes

### 6. Executar Automaticamente
- Sem aguardar aprovação
- Testes obrigatórios
- Notificações Discord
- Rollback automático se falhar

## 📊 Estrutura de Pastas

```
.kiro/steering/
├── README.md                    # Este arquivo
├── AI_GUIDELINES.md            # Diretrizes para IAs
├── PROJECT_STANDARDS.md        # Padrões técnicos
├── NAMING_CONVENTIONS.md       # Convenções de nome
├── ERROR_HANDLING.md           # Tratamento de erros
├── ARCHITECTURE.md             # Arquitetura do sistema
└── AUTOMATION.md               # Automação e CI/CD
```

## 🔄 Fluxo de Desenvolvimento

```
1. Ler diretrizes (AI_GUIDELINES.md)
   ↓
2. Entender arquitetura (ARCHITECTURE.md)
   ↓
3. Seguir padrões (PROJECT_STANDARDS.md)
   ↓
4. Usar nomenclaturas corretas (NAMING_CONVENTIONS.md)
   ↓
5. Implementar com testes
   ↓
6. Tratar erros (ERROR_HANDLING.md)
   ↓
7. Executar automação (AUTOMATION.md)
   ↓
8. Notificar Discord se houver erros
   ↓
9. Atualizar CHANGELOG.md
   ↓
10. Fazer commit e push
```

## 🧪 Checklist de Qualidade

Antes de fazer commit:

- [ ] Código segue padrões do projeto
- [ ] Testes inclusos e passando
- [ ] Sem console.log ou debug code
- [ ] Tipos TypeScript corretos
- [ ] Tratamento de erros implementado
- [ ] Documentação atualizada
- [ ] Performance considerada
- [ ] Sem secrets ou dados sensíveis
- [ ] CHANGELOG.md atualizado
- [ ] Commit message segue padrão

## 🚨 Erros Comuns

### ❌ Não fazer:
```typescript
// Sem testes
function getUserData() { ... }

// Sem tratamento de erro
const result = await riskyOperation()

// Sem logs estruturados
console.log('done')

// Sem tipos
const user: any = { ... }

// Sem documentação
export function complexFunction() { ... }
```

### ✅ Fazer:
```typescript
// Com testes
describe('getUserData', () => {
  it('deve retornar dados do usuário', () => { ... })
})

// Com tratamento de erro
try {
  const result = await riskyOperation()
} catch (error) {
  await handleError({ level: 'error', message: error.message })
}

// Com logs estruturados
console.log('[Feature] User data fetched:', { userId, timestamp })

// Com tipos
interface User { id: string; email: string }
const user: User = { ... }

// Com documentação
/**
 * Busca dados do usuário
 * @param userId - ID do usuário
 * @returns Dados do usuário
 */
export function getUserData(userId: string): User { ... }
```

## 📞 Suporte

### Dúvidas sobre:

- **Padrões gerais**: Consulte [PROJECT_STANDARDS.md](./PROJECT_STANDARDS.md)
- **Nomenclatura**: Consulte [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md)
- **Tratamento de erros**: Consulte [ERROR_HANDLING.md](./ERROR_HANDLING.md)
- **Arquitetura**: Consulte [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Automação**: Consulte [AUTOMATION.md](./AUTOMATION.md)
- **Diretrizes para IAs**: Consulte [AI_GUIDELINES.md](./AI_GUIDELINES.md)

## 🎓 Recursos Adicionais

### Documentação do Projeto
- `README.md` - Instruções de setup
- `CHANGELOG.md` - Histórico de mudanças
- `ATUALIZACOES.md` - Atualizações recentes

### Configurações
- `.eslintrc.json` - ESLint config
- `.prettierrc` - Prettier config
- `tsconfig.json` - TypeScript config
- `vitest.config.ts` - Vitest config
- `playwright.config.ts` - Playwright config

### Exemplos
- `src/` - Código-fonte com exemplos
- `tests/` - Testes como referência
- `e2e/` - Testes E2E como referência

## 🔐 Segurança

### Nunca:
- Commitar `.env` ou secrets
- Logar senhas ou tokens
- Expor detalhes internos em erros
- Usar `any` em TypeScript

### Sempre:
- Usar variáveis de ambiente
- Validar entrada do usuário
- Sanitizar dados
- Usar HTTPS em produção

## 📈 Performance

### Frontend:
- Code splitting automático
- Lazy loading de componentes
- Memoização de callbacks
- Otimização de imagens

### Backend:
- Índices no banco de dados
- Caching estratégico
- Connection pooling
- Lazy cleanup

## 🎯 Objetivos

Este sistema de regras foi criado para:

1. ✅ **Padronizar** o desenvolvimento
2. ✅ **Facilitar** colaboração entre IAs
3. ✅ **Melhorar** qualidade do código
4. ✅ **Prevenir** bugs e erros
5. ✅ **Automatizar** testes e deploy
6. ✅ **Notificar** erros em produção
7. ✅ **Documentar** mudanças
8. ✅ **Manter** compatibilidade

## 📝 Versão

- **Versão**: 1.0.0
- **Data**: 2024-01-13
- **Compatível com**: Claude, Gemini, Grok, Cursor Composer, ChatGPT, modelos locais

---

**Última atualização**: 2024-01-13

Para sugestões ou melhorias, abra uma issue ou PR no repositório.
