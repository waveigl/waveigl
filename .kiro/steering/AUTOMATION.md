---
inclusion: always
---

# ⚙️ Automation & CI/CD

Configuration of automation and CI/CD for the project.

## 🤖 Automatic Execution

This project is configured to execute **EVERYTHING AUTOMATICALLY** without waiting for prior approval.

### Principles

1. **No Manual Approval**: All changes are executed automatically
2. **Mandatory Tests**: Each change passes tests before deploy
3. **Discord Notifications**: Errors are notified in real-time
4. **Automatic Rollback**: If tests fail, no deploy happens

## 🔄 Development Flow

```
Developer → Commit → Tests → Lint → Type Check → Build → Deploy
                       ↓
                    Fails?
                       ↓
                  Notify Discord
                       ↓
                  Automatic rollback
```

## 📋 Execution Checklist

Every change must pass:

- [ ] **Unit Tests** (`npm run test`)
- [ ] **E2E Tests** (`npm run test:e2e`)
- [ ] **Linting** (`npm run lint`)
- [ ] **Type Checking** (`npm run type-check`)
- [ ] **Build** (`npm run build`)
- [ ] **Deploy** (automatic if everything passes)

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Tests with coverage
npm run test:coverage

# Tests in watch mode (development)
npm run test:watch
```

### Test Structure

```
tests/
├── unit/
│   ├── lib/
│   │   ├── discord.test.ts
│   │   ├── benefits.test.ts
│   │   └── notifications.test.ts
│   ├── utils/
│   │   ├── formatDate.test.ts
│   │   └── validateEmail.test.ts
│   └── hooks/
│       └── useClubSubscription.test.ts
├── integration/
│   ├── api/
│   │   ├── subscription.test.ts
│   │   ├── auth.test.ts
│   │   └── discord.test.ts
│   └── database/
│       └── profiles.test.ts
└── e2e/
    ├── auth.spec.ts
    ├── subscription.spec.ts
    └── discord.spec.ts
```

### Test Example

```typescript
// tests/unit/lib/benefits.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createOrUpdateBenefit } from '@/lib/benefits'

describe('Benefits', () => {
  describe('createOrUpdateBenefit', () => {
    it('should create new benefit', async () => {
      // Arrange
      const userId = 'user-123'
      const platform = 'twitch'
      const tier = 'tier1'

      // Act
      const result = await createOrUpdateBenefit(userId, platform, tier)

      // Assert
      expect(result).toBeDefined()
      expect(result?.user_id).toBe(userId)
      expect(result?.platform).toBe(platform)
    })

    it('should throw error with invalid userId', async () => {
      // Arrange
      const userId = ''

      // Act & Assert
      expect(() => createOrUpdateBenefit(userId, 'twitch', 'tier1')).toThrow()
    })
  })
})
```

## 🔍 Linting and Type Checking

### Run Linting

```bash
# Check linting
npm run lint

# Fix automatically
npm run lint:fix
```

### Run Type Checking

```bash
# Check types
npm run type-check

# Or with tsc directly
npx tsc --noEmit
```

## 🏗️ Build

### Run Build

```bash
# Build for production
npm run build

# Build with analysis
npm run build:analyze
```

## 🚀 Deploy

### Environments

- **Development**: Local (`npm run dev`)
- **Staging**: Preview deployment (automatic on PR)
- **Production**: Live (automatic on merge to main)

### Automatic Deploy

```
main branch → Tests → Build → Deploy to Production
                ↓
             Fails? → Notify Discord → Rollback
```

## 🔔 Discord Notifications

### Configuration

```bash
# .env.local
DISCORD_ERROR_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_INFO_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_CRITICAL_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Notified Events

- ✅ Successful deploy
- ❌ Tests failed
- ⚠️ Build failed
- 🔴 Production error
- 📊 Performance metrics

### Notification Example

```
[CRITICAL] Payment Processing Failed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Error: Mercado Pago returned 401 Unauthorized
User: user-123
Amount: R$ 9.90
Timestamp: 2024-01-13 14:30:00
Environment: production
URL: https://waveigl.com

Action: Check Mercado Pago API credentials
```

## 📊 Monitoring

### Tracked Metrics

- Error rate per endpoint
- API response time
- Payment success/failure rate
- Unhandled errors
- Database performance

### Discord Dashboard

Create `#monitoring` channel with:
- Real-time alerts
- Daily metrics
- Error report
- System status

## 🔄 Automatic Versioning

### Semantic Versioning

```
MAJOR.MINOR.PATCH

- MAJOR: Incompatible changes
- MINOR: New features
- PATCH: Bug fixes
```

### Update Version

```bash
# Patch (bug fix)
npm version patch

# Minor (new feature)
npm version minor

# Major (incompatible change)
npm version major
```

This automatically:
1. Updates `package.json`
2. Creates git tag
3. Updates `CHANGELOG.md`
4. Commits and pushes

## 📝 CHANGELOG

### Format

```markdown
## [1.2.3] - 2024-01-13

### Added
- New feature X
- New component Y

### Fixed
- Bug in Z
- Discord sync error

### Changed
- Refactoring of A
- Optimization of B

### Security
- Fixed XSS in C
- Improved validation in D
```

### Update CHANGELOG

```bash
# Add entry manually
# Or use automatic script
npm run changelog:add
```

## 🔐 Security

### Secrets Management

```bash
# Environment variables
.env.local (don't commit)
.env.example (commit with dummy values)
```

### Security Checks

- Scan for vulnerable dependencies
- Check for secrets in commits
- SAST (Static Application Security Testing)

```bash
# Check vulnerabilities
npm audit

# Fix automatically
npm audit fix
```

## 📦 Dependencies

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update everything
npm update

# Update major versions
npm install -g npm-check-updates
ncu -u
npm install
```

### Update Policy

- **Patch**: Update automatically
- **Minor**: Update with tests
- **Major**: Review breaking changes

## 🎯 Git Hooks

### Pre-commit

```bash
# Executed before each commit
- Lint
- Type check
- Format code
```

### Pre-push

```bash
# Executed before push
- Tests
- Build
```

### Post-merge

```bash
# Executed after merge
- Install dependencies if package.json changed
- Run migrations if necessary
```

## 📋 npm Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint src --max-warnings 0",
    "lint:fix": "eslint src --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "changelog:add": "node scripts/changelog.js",
    "version:patch": "npm version patch",
    "version:minor": "npm version minor",
    "version:major": "npm version major"
  }
}
```

## 🚨 Troubleshooting

### Tests Failing

```bash
# Clear cache
npm run test -- --clearCache

# Run specific test
npm run test -- benefits.test.ts

# Debug mode
npm run test -- --inspect-brk
```

### Build Failing

```bash
# Clear build
rm -rf .next

# Rebuild
npm run build

# Check types
npm run type-check
```

### Deploy Failing

```bash
# Check logs
npm run build -- --debug

# Check environment variables
echo $DISCORD_ERROR_WEBHOOK_URL

# Manual rollback
git revert <commit-hash>
git push
```

## 📞 Support

Questions about automation?
- Check `PROJECT_STANDARDS.md`
- Review scripts in `package.json`
- See configurations in `.github/workflows/`

## 🤖 Execução Automática

Este projeto está configurado para executar **TUDO AUTOMATICAMENTE** sem aguardar aprovação prévia.

### Princípios

1. **Sem Aprovação Manual**: Todas as mudanças são executadas automaticamente
2. **Testes Obrigatórios**: Cada mudança passa por testes antes de deploy
3. **Notificações Discord**: Erros são notificados em tempo real
4. **Rollback Automático**: Se testes falham, não faz deploy

## 🔄 Fluxo de Desenvolvimento

```
Developer → Commit → Tests → Lint → Type Check → Build → Deploy
                       ↓
                    Falha?
                       ↓
                  Notifica Discord
                       ↓
                  Rollback automático
```

## 📋 Checklist de Execução

Toda mudança deve passar por:

- [ ] **Testes Unitários** (`npm run test`)
- [ ] **Testes E2E** (`npm run test:e2e`)
- [ ] **Linting** (`npm run lint`)
- [ ] **Type Checking** (`npm run type-check`)
- [ ] **Build** (`npm run build`)
- [ ] **Deploy** (automático se tudo passar)

## 🧪 Testes

### Executar Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Testes com cobertura
npm run test:coverage

# Testes em watch mode (desenvolvimento)
npm run test:watch
```

### Estrutura de Testes

```
tests/
├── unit/
│   ├── lib/
│   │   ├── discord.test.ts
│   │   ├── benefits.test.ts
│   │   └── notifications.test.ts
│   ├── utils/
│   │   ├── formatDate.test.ts
│   │   └── validateEmail.test.ts
│   └── hooks/
│       └── useClubSubscription.test.ts
├── integration/
│   ├── api/
│   │   ├── subscription.test.ts
│   │   ├── auth.test.ts
│   │   └── discord.test.ts
│   └── database/
│       └── profiles.test.ts
└── e2e/
    ├── auth.spec.ts
    ├── subscription.spec.ts
    └── discord.spec.ts
```

### Exemplo de Teste

```typescript
// tests/unit/lib/benefits.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createOrUpdateBenefit } from '@/lib/benefits'

describe('Benefits', () => {
  describe('createOrUpdateBenefit', () => {
    it('deve criar novo benefício', async () => {
      // Arrange
      const userId = 'user-123'
      const platform = 'twitch'
      const tier = 'tier1'

      // Act
      const result = await createOrUpdateBenefit(userId, platform, tier)

      // Assert
      expect(result).toBeDefined()
      expect(result?.user_id).toBe(userId)
      expect(result?.platform).toBe(platform)
    })

    it('deve lançar erro com userId inválido', async () => {
      // Arrange
      const userId = ''

      // Act & Assert
      expect(() => createOrUpdateBenefit(userId, 'twitch', 'tier1')).toThrow()
    })
  })
})
```

## 🔍 Linting e Type Checking

### Executar Linting

```bash
# Verificar linting
npm run lint

# Corrigir automaticamente
npm run lint:fix
```

### Executar Type Checking

```bash
# Verificar tipos
npm run type-check

# Ou com tsc diretamente
npx tsc --noEmit
```

## 🏗️ Build

### Executar Build

```bash
# Build para produção
npm run build

# Build com análise
npm run build:analyze
```

## 🚀 Deploy

### Ambientes

- **Development**: Local (`npm run dev`)
- **Staging**: Preview deployment (automático em PR)
- **Production**: Live (automático em merge para main)

### Deploy Automático

```
main branch → Tests → Build → Deploy to Production
                ↓
             Falha? → Notifica Discord → Rollback
```

## 🔔 Notificações Discord

### Configuração

```bash
# .env.local
DISCORD_ERROR_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_INFO_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_CRITICAL_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Eventos Notificados

- ✅ Deploy bem-sucedido
- ❌ Testes falharam
- ⚠️ Build falhou
- 🔴 Erro em produção
- 📊 Métricas de performance

### Exemplo de Notificação

```
[CRITICAL] Payment Processing Failed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Error: Mercado Pago returned 401 Unauthorized
User: user-123
Amount: R$ 9.90
Timestamp: 2024-01-13 14:30:00
Environment: production
URL: https://waveigl.com

Action: Check Mercado Pago API credentials
```

## 📊 Monitoramento

### Métricas Rastreadas

- Taxa de erro por endpoint
- Tempo de resposta das APIs
- Taxa de sucesso/falha de pagamentos
- Erros não tratados
- Performance do banco de dados

### Dashboard Discord

Criar canal `#monitoring` com:
- Alertas em tempo real
- Métricas diárias
- Relatório de erros
- Status do sistema

## 🔄 Versionamento Automático

### Semantic Versioning

```
MAJOR.MINOR.PATCH

- MAJOR: Mudanças incompatíveis
- MINOR: Novas features
- PATCH: Bug fixes
```

### Atualizar Versão

```bash
# Patch (bug fix)
npm version patch

# Minor (nova feature)
npm version minor

# Major (mudança incompatível)
npm version major
```

Isso automaticamente:
1. Atualiza `package.json`
2. Cria git tag
3. Atualiza `CHANGELOG.md`
4. Faz commit e push

## 📝 CHANGELOG

### Formato

```markdown
## [1.2.3] - 2024-01-13

### Added
- Nova feature X
- Novo componente Y

### Fixed
- Bug em Z
- Erro de sincronização Discord

### Changed
- Refatoração de A
- Otimização de B

### Security
- Corrigido XSS em C
- Validação melhorada em D
```

### Atualizar CHANGELOG

```bash
# Adicionar entrada manualmente
# Ou usar script automático
npm run changelog:add
```

## 🔐 Segurança

### Secrets Management

```bash
# Variáveis de ambiente
.env.local (não commitar)
.env.example (commitar com valores dummy)
```

### Verificações de Segurança

- Scan de dependências vulneráveis
- Verificação de secrets em commits
- SAST (Static Application Security Testing)

```bash
# Verificar vulnerabilidades
npm audit

# Corrigir automaticamente
npm audit fix
```

## 📦 Dependências

### Atualizar Dependências

```bash
# Verificar atualizações
npm outdated

# Atualizar tudo
npm update

# Atualizar major versions
npm install -g npm-check-updates
ncu -u
npm install
```

### Política de Atualização

- **Patch**: Atualizar automaticamente
- **Minor**: Atualizar com testes
- **Major**: Revisar breaking changes

## 🎯 Hooks Git

### Pre-commit

```bash
# Executado antes de cada commit
- Lint
- Type check
- Format code
```

### Pre-push

```bash
# Executado antes de push
- Testes
- Build
```

### Post-merge

```bash
# Executado após merge
- Instalar dependências se package.json mudou
- Executar migrations se necessário
```

## 📋 Scripts npm

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint src --max-warnings 0",
    "lint:fix": "eslint src --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "changelog:add": "node scripts/changelog.js",
    "version:patch": "npm version patch",
    "version:minor": "npm version minor",
    "version:major": "npm version major"
  }
}
```

## 🚨 Troubleshooting

### Testes Falhando

```bash
# Limpar cache
npm run test -- --clearCache

# Rodar teste específico
npm run test -- benefits.test.ts

# Debug mode
npm run test -- --inspect-brk
```

### Build Falhando

```bash
# Limpar build
rm -rf .next

# Rebuild
npm run build

# Verificar tipos
npm run type-check
```

### Deploy Falhando

```bash
# Verificar logs
npm run build -- --debug

# Verificar variáveis de ambiente
echo $DISCORD_ERROR_WEBHOOK_URL

# Rollback manual
git revert <commit-hash>
git push
```

## 📞 Suporte

Dúvidas sobre automação?
- Consulte `PROJECT_STANDARDS.md`
- Revise scripts em `package.json`
- Veja configurações em `.github/workflows/`
