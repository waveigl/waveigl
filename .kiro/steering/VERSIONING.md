# 📦 Versionamento & Update Rules

Regras obrigatórias para versionamento e atualização de versão antes de cada commit.

## 🔢 Semantic Versioning

Seguir **Semantic Versioning (MAJOR.MINOR.PATCH)**:

```
MAJOR.MINOR.PATCH

Exemplo: 1.2.3
```

### Quando Incrementar

#### MAJOR (X.0.0)
Mudanças **incompatíveis** com versões anteriores:
- Remoção de features
- Mudanças em APIs públicas
- Alterações em estrutura de dados
- Breaking changes em banco de dados

**Exemplo**: `1.0.0` → `2.0.0`

#### MINOR (X.Y.0)
Novas **features compatíveis** com versões anteriores:
- Novas funcionalidades
- Novas APIs
- Melhorias em features existentes
- Novos endpoints

**Exemplo**: `1.0.0` → `1.1.0`

#### PATCH (X.Y.Z)
**Bug fixes** e correções:
- Correção de bugs
- Fixes de TypeScript
- Correção de UI
- Melhorias de performance
- Correção de testes

**Exemplo**: `1.0.0` → `1.0.1`

## 📋 Checklist Obrigatório Antes de Commit

Toda IA **DEVE** seguir este checklist antes de fazer commit:

- [ ] **Código implementado** e funcionando
- [ ] **Testes criados/atualizados** e passando
- [ ] **Tipos TypeScript** corretos (sem `any`)
- [ ] **Tratamento de erros** implementado
- [ ] **Logs estruturados** adicionados
- [ ] **CHANGELOG.md** atualizado
- [ ] **Versão atualizada** em `package.json`
- [ ] **Git tag** criada (opcional, automático em CI/CD)

## 🔄 Fluxo de Atualização de Versão

### 1. Determinar Tipo de Mudança

```
Pergunta: Qual tipo de mudança estou fazendo?

├─ Bug fix? → PATCH
├─ Nova feature? → MINOR
└─ Breaking change? → MAJOR
```

### 2. Atualizar Versão

**Opção A: Manual**

```bash
# Editar package.json
{
  "version": "0.0.3"  # Incrementar conforme tipo
}
```

**Opção B: Automático (recomendado)**

```bash
# PATCH (bug fix)
npm version patch

# MINOR (nova feature)
npm version minor

# MAJOR (breaking change)
npm version major
```

### 3. Atualizar CHANGELOG.md

Adicionar entrada no topo do arquivo:

```markdown
## [0.0.3] - 2025-01-13

### 🐛 Bug Fixes
- Fixed: Descrição do bug corrigido
- Fixed: Outro bug

### ✨ Features
- Added: Nova funcionalidade
- Added: Outra feature

### 🔧 Improvements
- Improved: Melhoria implementada
- Improved: Outra melhoria

### 📝 Documentation
- Updated: Documentação atualizada
```

### 4. Fazer Commit

```bash
git add .
git commit -m "chore(release): bump version to 0.0.3"
git push
```

## 📊 Exemplos de Versionamento

### Exemplo 1: Bug Fix
```
Versão atual: 0.0.2
Mudança: Corrigir ClubSubscriptionWidget
Tipo: PATCH (bug fix)
Nova versão: 0.0.3

Comando: npm version patch
```

### Exemplo 2: Nova Feature
```
Versão atual: 0.0.3
Mudança: Adicionar sistema de notificações
Tipo: MINOR (nova feature)
Nova versão: 0.1.0

Comando: npm version minor
```

### Exemplo 3: Breaking Change
```
Versão atual: 0.1.0
Mudança: Refatorar estrutura de banco de dados
Tipo: MAJOR (breaking change)
Nova versão: 1.0.0

Comando: npm version major
```

## 🚨 Regras Importantes

### ❌ NÃO fazer:
- Não fazer commit sem atualizar versão
- Não fazer commit sem atualizar CHANGELOG.md
- Não fazer commit com testes falhando
- Não fazer commit com TypeScript errors
- Não fazer commit sem documentação

### ✅ FAZER:
- Sempre atualizar versão antes de commit
- Sempre atualizar CHANGELOG.md
- Sempre rodar testes antes de commit
- Sempre verificar tipos TypeScript
- Sempre documentar mudanças significativas

## 📝 Formato de CHANGELOG

### Seções Obrigatórias

```markdown
## [VERSION] - YYYY-MM-DD

### ✨ Features
- Added: Descrição da feature

### 🐛 Bug Fixes
- Fixed: Descrição do bug corrigido

### 🔧 Improvements
- Improved: Descrição da melhoria

### 📝 Documentation
- Updated: Descrição da documentação

### 🔐 Security
- Security: Descrição da correção de segurança

### ⚠️ Breaking Changes
- Breaking: Descrição da mudança incompatível
```

### Exemplo Completo

```markdown
## [0.0.3] - 2025-01-13

### 🐛 Bug Fixes
- Fixed: ClubSubscriptionWidget não exibia "Clube Ativo" quando usuário já tinha assinatura
- Fixed: TypeScript error em useClubSubscription com notificationData

### ✨ Features
- Added: Comprehensive test suite para ClubSubscriptionWidget (11 tests)

### 📝 Documentation
- Updated: CHANGELOG.md com novo formato
- Updated: .env.example consolidado em um único arquivo

### 🔧 Improvements
- Improved: Type safety em testes com MockEligibilityData interface
```

## 🔗 Relacionado

- `CHANGELOG.md` - Histórico de mudanças
- `package.json` - Versão atual
- `AI_GUIDELINES.md` - Diretrizes gerais
- `PROJECT_STANDARDS.md` - Padrões do projeto

## 📞 Dúvidas?

Consulte:
- Semantic Versioning: https://semver.org/
- CHANGELOG format: https://keepachangelog.com/
- Git tagging: https://git-scm.com/book/en/v2/Git-Basics-Tagging
