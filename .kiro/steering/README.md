---
inclusion: always
---

# 📚 WaveIGL Development Guidelines

Welcome to the WaveIGL project rules and standards system! This directory contains all the documentation needed to keep code consistent, secure, and high quality.

## 📖 Document Index

### 🤖 [AI_GUIDELINES.md](./AI_GUIDELINES.md)
Guidelines for AIs (Claude, Gemini, Grok, Cursor Composer, ChatGPT, local models).

**Topics:**
- Fundamental principles
- Development workflow
- Mandatory tests
- Naming conventions
- Error handling
- Structured logs
- Discord notifications
- Versioning
- Security
- Documentation
- Performance
- CI/CD

**When to use:** Always! This is the main guide for any AI working on the project.

---

### 📋 [PROJECT_STANDARDS.md](./PROJECT_STANDARDS.md)
Technical and organizational standards for the project.

**Topics:**
- Folder structure
- Technology stack
- Main dependencies
- Code standards (TypeScript, React, API Routes, Database)
- Testing
- Security
- Logging
- Performance
- Commits
- Versioning
- Documentation
- Code style
- Code review

**When to use:** When starting new development or reviewing code.

---

### 📝 [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md)
Naming conventions for the entire project.

**Topics:**
- Files and folders
- Variables and constants
- Booleans
- Arrays
- Functions and methods
- Callbacks
- Getters/Setters
- Component props
- Git branches
- Commits
- Folder structure
- Types and interfaces
- Enums
- Environment variables

**When to use:** When naming anything in the project.

---

### 🚨 [ERROR_HANDLING.md](./ERROR_HANDLING.md)
Complete guide for error handling and production notifications.

**Topics:**
- Error levels (CRITICAL, ERROR, WARNING, INFO)
- Discord notifications system
- Handling patterns
- Specific use cases
- Structured logging
- Retry logic
- Best practices
- Monitoring
- Security

**When to use:** When implementing error handling or integrating with Discord.

---

### 🏗️ [ARCHITECTURE.md](./ARCHITECTURE.md)
Architecture and design of the WaveIGL system.

**Topics:**
- Overview
- Technology stack
- Data flow
- Folder structure
- Main flows
- Security
- Database
- Integrations
- Performance
- Testing
- Scalability
- CI/CD

**When to use:** To understand the overall project structure.

---

### ⚙️ [AUTOMATION.md](./AUTOMATION.md)
Configuration of automation and CI/CD for the project.

**Topics:**
- Automatic execution
- Development flow
- Testing
- Linting and type checking
- Build
- Deploy
- Discord notifications
- Monitoring
- Versioning
- CHANGELOG
- Security
- Dependencies
- Git hooks
- npm scripts
- Troubleshooting

**When to use:** When setting up automation or understanding the CI/CD flow.

---

## 🚀 Quick Start for AIs

### 1️⃣ First Time?
Read in this order:
1. This README
2. [AI_GUIDELINES.md](./AI_GUIDELINES.md)
3. [PROJECT_STANDARDS.md](./PROJECT_STANDARDS.md)
4. [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md)

### 2️⃣ Before Making Changes
- [ ] Read [AI_GUIDELINES.md](./AI_GUIDELINES.md) - Development Workflow
- [ ] Check [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md)
- [ ] Review [ARCHITECTURE.md](./ARCHITECTURE.md) if it's a new feature

### 3️⃣ During Development
- [ ] Follow [PROJECT_STANDARDS.md](./PROJECT_STANDARDS.md)
- [ ] Implement tests according to [AUTOMATION.md](./AUTOMATION.md)
- [ ] Handle errors according to [ERROR_HANDLING.md](./ERROR_HANDLING.md)

### 4️⃣ After Implementation
- [ ] Run tests: `npm run test`
- [ ] Run linting: `npm run lint`
- [ ] Run type check: `npm run type-check`
- [ ] Update CHANGELOG.md
- [ ] Commit according to [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md)

## 🎯 Fundamental Principles

### 1. Always Run Tests
```bash
npm run test
npm run test:e2e
npm run lint
npm run type-check
```

### 2. Notify Discord on Errors
```typescript
await notifyDiscord({
  level: 'error',
  title: 'Something Failed',
  message: error.message,
  context: { userId, timestamp: new Date() }
})
```

### 3. Follow Naming Conventions
- Components: `PascalCase.tsx`
- Hooks: `useHookName.ts`
- Functions: `camelCase()`
- Constants: `UPPER_SNAKE_CASE`

### 4. Maintain Compatibility
- Test on multiple platforms
- Check TypeScript types
- Validate user input

### 5. Document Changes
- Update CHANGELOG.md
- Add JSDoc to public functions
- Document components

### 6. Execute Automatically
- Without waiting for approval
- Mandatory tests
- Discord notifications
- Automatic rollback if fails

## 📊 Folder Structure

```
.kiro/steering/
├── README.md                    # This file
├── AI_GUIDELINES.md            # Guidelines for AIs
├── PROJECT_STANDARDS.md        # Technical standards
├── NAMING_CONVENTIONS.md       # Naming conventions
├── ERROR_HANDLING.md           # Error handling
├── ARCHITECTURE.md             # System architecture
└── AUTOMATION.md               # Automation and CI/CD
```

## 🔄 Development Flow

```
1. Read guidelines (AI_GUIDELINES.md)
   ↓
2. Understand architecture (ARCHITECTURE.md)
   ↓
3. Follow standards (PROJECT_STANDARDS.md)
   ↓
4. Use correct naming (NAMING_CONVENTIONS.md)
   ↓
5. Implement with tests
   ↓
6. Handle errors (ERROR_HANDLING.md)
   ↓
7. Run automation (AUTOMATION.md)
   ↓
8. Notify Discord if there are errors
   ↓
9. Update CHANGELOG.md
   ↓
10. Commit and push
```

## 🧪 Quality Checklist

Before committing:

- [ ] Code follows project standards
- [ ] Tests included and passing
- [ ] No console.log or debug code
- [ ] Correct TypeScript types
- [ ] Error handling implemented
- [ ] Documentation updated
- [ ] Performance considered
- [ ] No secrets or sensitive data
- [ ] CHANGELOG.md updated
- [ ] Commit message follows standard

## 🚨 Common Mistakes

### ❌ Don't do:
```typescript
// Without tests
function getUserData() { ... }

// Without error handling
const result = await riskyOperation()

// Without structured logs
console.log('done')

// Without types
const user: any = { ... }

// Without documentation
export function complexFunction() { ... }
```

### ✅ Do:
```typescript
// With tests
describe('getUserData', () => {
  it('should return user data', () => { ... })
})

// With error handling
try {
  const result = await riskyOperation()
} catch (error) {
  await handleError({ level: 'error', message: error.message })
}

// With structured logs
console.log('[Feature] User data fetched:', { userId, timestamp })

// With types
interface User { id: string; email: string }
const user: User = { ... }

// With documentation
/**
 * Fetches user data
 * @param userId - User ID
 * @returns User data
 */
export function getUserData(userId: string): User { ... }
```

## 📞 Support

### Questions about:

- **General standards**: Check [PROJECT_STANDARDS.md](./PROJECT_STANDARDS.md)
- **Naming**: Check [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md)
- **Error handling**: Check [ERROR_HANDLING.md](./ERROR_HANDLING.md)
- **Architecture**: Check [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Automation**: Check [AUTOMATION.md](./AUTOMATION.md)
- **AI Guidelines**: Check [AI_GUIDELINES.md](./AI_GUIDELINES.md)

## 🎓 Additional Resources

### Project Documentation
- `README.md` - Setup instructions
- `CHANGELOG.md` - Change history
- `UPDATES.md` - Recent updates

### Configurations
- `.eslintrc.json` - ESLint config
- `.prettierrc` - Prettier config
- `tsconfig.json` - TypeScript config
- `vitest.config.ts` - Vitest config
- `playwright.config.ts` - Playwright config

### Examples
- `src/` - Source code with examples
- `tests/` - Tests as reference
- `e2e/` - E2E tests as reference

## 🔐 Security

### Never:
- Commit `.env` or secrets
- Log passwords or tokens
- Expose internal details in errors
- Use `any` in TypeScript

### Always:
- Use environment variables
- Validate user input
- Sanitize data
- Use HTTPS in production

## 📈 Performance

### Frontend:
- Automatic code splitting
- Lazy loading of components
- Callback memoization
- Image optimization

### Backend:
- Database indexes
- Strategic caching
- Connection pooling
- Lazy cleanup

## 🎯 Objectives

This rules system was created to:

1. ✅ **Standardize** development
2. ✅ **Facilitate** collaboration between AIs
3. ✅ **Improve** code quality
4. ✅ **Prevent** bugs and errors
5. ✅ **Automate** tests and deploy
6. ✅ **Notify** production errors
7. ✅ **Document** changes
8. ✅ **Maintain** compatibility

## 📝 Version

- **Version**: 1.0.0
- **Date**: 2024-01-13
- **Compatible with**: Claude, Gemini, Grok, Cursor Composer, ChatGPT, local models

---

**Last updated**: 2024-01-13

For suggestions or improvements, open an issue or PR on the repository.

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
