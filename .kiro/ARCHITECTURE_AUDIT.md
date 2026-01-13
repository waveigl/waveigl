# 🏗️ Architecture Audit & SaaS Readiness Report

**Data**: 2024-01-13
**Status**: ⚠️ Requer Refatoração para SaaS
**Readiness Score**: 4/10

## 📊 Executive Summary

O projeto WaveIGL segue **parcialmente** os padrões definidos em `.kiro/steering/`. Enquanto a organização de código e type safety são excelentes, a arquitetura atual é **single-tenant** e precisa de refatoração significativa para suportar múltiplos clientes (SaaS).

### Readiness Breakdown

| Aspecto | Score | Status |
|---------|-------|--------|
| Organização de Código | 8/10 | ✅ Excelente |
| Type Safety | 9/10 | ✅ Excelente |
| Design de Banco de Dados | 5/10 | ⚠️ Precisa Refatoração |
| Autenticação | 6/10 | ⚠️ Parcial |
| Autorização | 4/10 | ❌ Crítico |
| Configuração | 3/10 | ❌ Crítico |
| Design de API | 5/10 | ⚠️ Precisa Refatoração |
| Testes | 6/10 | ⚠️ Parcial |

## ✅ O que Está Bem

### 1. Organização de Código
```
✅ Estrutura modular em src/lib/
✅ Separação clara de responsabilidades
✅ Componentes bem organizados
✅ Hooks customizados bem estruturados
✅ API routes bem nomeadas
```

### 2. Type Safety
```
✅ TypeScript forte em todo o projeto
✅ Interfaces bem definidas
✅ Tipos explícitos (sem any)
✅ Validação com Zod
✅ Props documentadas
```

### 3. Database Design
```
✅ Schema normalizado
✅ Constraints apropriados
✅ Relacionamentos bem definidos
✅ RLS policies implementadas
✅ Índices em campos críticos
```

### 4. Padrões de Código
```
✅ Nomenclaturas seguem convenções
✅ Tratamento de erros implementado
✅ Logs estruturados
✅ Componentes React bem estruturados
✅ API routes com validação
```

## ⚠️ O que Precisa Refatoração

### 1. **CRÍTICO: Isolamento de Tenant**

**Problema Atual:**
```typescript
// src/lib/permissions.ts - Hardcoded IDs
export const OWNER_ACCOUNT_IDS: Record<string, string> = {
  twitch: '173162545',      // waveigl
  youtube: 'waveigl',
  kick: '54454625'
}

export const ADMIN_ACCOUNT_IDS: Record<string, string> = {
  twitch: '129980106',      // ogabrieltoth
  youtube: 'OGabrielToth',
  kick: '4053403'
}
```

**Impacto SaaS:**
- ❌ Não suporta múltiplos streamers
- ❌ Permissões hardcoded
- ❌ Sem isolamento de dados
- ❌ Sem multi-tenancy

**Solução Necessária:**
```typescript
// Novo: src/lib/tenant/context.ts
interface TenantContext {
  tenantId: string
  organizationId: string
  ownerId: string
  ownerAccounts: Record<string, string>
  adminAccounts: Record<string, string>
}

// Middleware para extrair tenant
export async function getTenantContext(request: NextRequest): Promise<TenantContext> {
  // Extrair tenant_id da URL, header ou session
  // Validar acesso
  // Retornar contexto
}
```

### 2. **CRÍTICO: Schema de Banco de Dados**

**Problema Atual:**
```sql
-- Sem tenant_id em nenhuma tabela
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  -- ... sem tenant_id
);
```

**Impacto SaaS:**
- ❌ Sem isolamento de dados
- ❌ Sem suporte a múltiplos clientes
- ❌ Risco de data leakage

**Solução Necessária:**
```sql
-- Adicionar tenant_id a todas as tabelas
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT,
  -- ... resto dos campos
  CONSTRAINT unique_org_email UNIQUE(organization_id, email)
);

-- Aplicar a TODAS as tabelas
-- linked_accounts, moderation_actions, chat_messages, etc.
```

### 3. **CRÍTICO: Contexto de Tenant em APIs**

**Problema Atual:**
```typescript
// src/app/api/subscription/check-eligibility/route.ts
export async function GET(request: NextRequest) {
  const session = await parseSessionCookie(cookieHeader)
  // ❌ Sem validação de tenant
  // ❌ Sem isolamento de dados
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.userId)
    .single()
}
```

**Impacto SaaS:**
- ❌ Sem validação de acesso cross-tenant
- ❌ Sem isolamento de dados
- ❌ Risco de segurança

**Solução Necessária:**
```typescript
// Novo: src/lib/middleware/tenant.ts
export async function withTenantContext(
  request: NextRequest,
  handler: (req: NextRequest, tenant: TenantContext) => Promise<Response>
): Promise<Response> {
  const tenant = await getTenantContext(request)
  if (!tenant) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return handler(request, tenant)
}

// Uso em API routes
export async function GET(request: NextRequest) {
  return withTenantContext(request, async (req, tenant) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', tenant.organizationId)
      .eq('id', session.userId)
      .single()
    
    return NextResponse.json({ profile })
  })
}
```

### 4. **IMPORTANTE: Roteamento de Tenant**

**Problema Atual:**
```
/api/subscription/check-eligibility
/api/me/profile
/api/discord/sync-roles
```

**Impacto SaaS:**
- ❌ Sem suporte a múltiplos tenants
- ❌ Sem isolamento de URL
- ❌ Sem routing dinâmico

**Solução Necessária:**
```
/api/tenants/:tenantId/subscription/check-eligibility
/api/tenants/:tenantId/me/profile
/api/tenants/:tenantId/discord/sync-roles

OU (mais moderno):

/api/v1/subscription/check-eligibility (com tenant no header/session)
/api/v1/me/profile
/api/v1/discord/sync-roles
```

### 5. **IMPORTANTE: Configuração por Tenant**

**Problema Atual:**
```typescript
// Hardcoded em .env
DISCORD_GUILD_ID=123456789
DISCORD_BOT_TOKEN=xxx
MERCADOPAGO_ACCESS_TOKEN=xxx
```

**Impacto SaaS:**
- ❌ Uma configuração para todos
- ❌ Sem suporte a múltiplos Discord bots
- ❌ Sem suporte a múltiplos Mercado Pago

**Solução Necessária:**
```typescript
// Novo: src/lib/config/tenant-config.ts
interface TenantConfig {
  discordGuildId: string
  discordBotToken: string
  mercadoPagoToken: string
  ownerAccounts: Record<string, string>
  adminAccounts: Record<string, string>
  // ... outras configs
}

export async function getTenantConfig(tenantId: string): Promise<TenantConfig> {
  // Buscar do banco de dados
  const { data: config } = await supabase
    .from('tenant_settings')
    .select('*')
    .eq('organization_id', tenantId)
    .single()
  
  return config
}
```

### 6. **IMPORTANTE: Autenticação Multi-Tenant**

**Problema Atual:**
```typescript
// Session contém apenas userId
type SessionPayload = {
  userId: string
  exp: number
}
```

**Impacto SaaS:**
- ❌ Sem contexto de tenant
- ❌ Sem validação de acesso
- ❌ Sem isolamento

**Solução Necessária:**
```typescript
// Novo: Session com tenant
type SessionPayload = {
  userId: string
  organizationId: string
  tenantId: string
  role: 'owner' | 'admin' | 'moderator' | 'user'
  exp: number
}
```

## 🔄 Plano de Refatoração

### Fase 1: Foundation (2-3 semanas)

**Objetivo**: Preparar base para multi-tenancy

```
1. Criar tabela organizations
   - id, name, slug, owner_id, created_at, updated_at
   
2. Adicionar organization_id a todas as tabelas
   - profiles
   - linked_accounts
   - moderation_actions
   - active_timeouts
   - chat_messages
   - subscriber_benefits
   - discord_connections
   
3. Criar tenant_settings table
   - organization_id, key, value, created_at, updated_at
   
4. Atualizar RLS policies
   - Adicionar verificação de organization_id
   - Garantir isolamento de dados
   
5. Criar tenant context middleware
   - Extrair tenant_id da request
   - Validar acesso
   - Passar para handlers
```

**Arquivos a Criar:**
- `src/lib/tenant/context.ts` - Tenant context
- `src/lib/tenant/middleware.ts` - Middleware
- `src/lib/tenant/config.ts` - Configuração
- `supabase/migrations/001_add_multi_tenancy.sql` - Migração

**Arquivos a Modificar:**
- `src/lib/permissions.ts` - Remover hardcoded IDs
- `src/lib/auth/session.ts` - Adicionar tenant ao session
- Todas as API routes - Adicionar tenant context

### Fase 2: Isolation (2-3 semanas)

**Objetivo**: Implementar isolamento de dados

```
1. Atualizar todas as queries
   - Adicionar filtro organization_id
   - Validar tenant em cada query
   
2. Implementar tenant routing
   - Adicionar /api/tenants/:tenantId/ ou header
   - Validar tenant em middleware
   
3. Atualizar componentes
   - Passar tenant context
   - Validar acesso
   
4. Criar tenant management API
   - GET /api/tenants
   - POST /api/tenants
   - PUT /api/tenants/:id
   - DELETE /api/tenants/:id
```

### Fase 3: Configuration (1-2 semanas)

**Objetivo**: Suportar configuração por tenant

```
1. Implementar tenant settings
   - Discord guild ID
   - Discord bot token
   - Mercado Pago token
   - Owner/admin accounts
   
2. Criar admin panel
   - Gerenciar tenants
   - Configurar settings
   - Gerenciar usuários
   
3. Implementar credential encryption
   - Criptografar tokens
   - Gerenciar chaves
```

### Fase 4: Integration (2-3 semanas)

**Objetivo**: Suportar múltiplas integrações por tenant

```
1. Múltiplos Discord bots
   - Um bot por tenant
   - Gerenciar tokens
   
2. Múltiplos Mercado Pago
   - Uma conta por tenant
   - Gerenciar credenciais
   
3. Múltiplos OAuth
   - Credenciais por tenant
   - Gerenciar tokens
```

### Fase 5: Testing & Hardening (2-3 weeks)

**Objetivo**: Garantir segurança e performance

```
1. Testes de isolamento
   - Tenant A não acessa dados de B
   - Validar em todas as APIs
   
2. Testes de segurança
   - Cross-tenant access prevention
   - Credential isolation
   - API key management
   
3. Testes de performance
   - Múltiplos tenants simultâneos
   - Query optimization
   - Caching strategy
```

## 📋 Checklist de Conformidade

### Padrões Definidos vs Realidade

| Padrão | Definido | Atual | Status |
|--------|----------|-------|--------|
| Estrutura de Pastas | ✅ | ✅ | ✅ Conforme |
| Nomenclaturas | ✅ | ✅ | ✅ Conforme |
| Type Safety | ✅ | ✅ | ✅ Conforme |
| Tratamento de Erros | ✅ | ✅ | ✅ Conforme |
| Logs Estruturados | ✅ | ✅ | ✅ Conforme |
| Testes | ✅ | ⚠️ | ⚠️ Parcial |
| Notificações Discord | ✅ | ⚠️ | ⚠️ Parcial |
| Multi-Tenancy | ✅ | ❌ | ❌ Não Implementado |
| Isolamento de Dados | ✅ | ❌ | ❌ Não Implementado |
| Configuração Dinâmica | ✅ | ❌ | ❌ Não Implementado |

## 🚀 Recomendações Imediatas

### 1. Curto Prazo (Próximas 2 semanas)

```
1. Criar documento de design para multi-tenancy
2. Planejar migração de banco de dados
3. Criar branch para refatoração
4. Começar Fase 1 (Foundation)
5. Adicionar testes para tenant isolation
```

### 2. Médio Prazo (Próximas 4-6 semanas)

```
1. Completar Fase 1 e 2
2. Implementar tenant routing
3. Atualizar todas as APIs
4. Criar tenant management API
5. Adicionar testes de segurança
```

### 3. Longo Prazo (Próximas 8-12 semanas)

```
1. Completar Fase 3, 4 e 5
2. Implementar admin panel
3. Suportar múltiplas integrações
4. Testes de performance
5. Documentação completa
6. Lançar como SaaS
```

## 🔐 Considerações de Segurança

### Crítico

```
1. Tenant Isolation
   - Validar organization_id em TODAS as queries
   - RLS policies em TODAS as tabelas
   - Testes de cross-tenant access
   
2. Credential Management
   - Criptografar tokens
   - Gerenciar chaves de criptografia
   - Rotação de credenciais
   
3. API Security
   - Rate limiting por tenant
   - API key authentication
   - Audit logging
```

### Importante

```
1. Data Residency
   - Considerar requisitos por país
   - Backup por tenant
   
2. Compliance
   - GDPR (se EU)
   - LGPD (se Brasil)
   - SOC 2 (se necessário)
```

## 📊 Impacto de Não Refatorar

Se não refatorar para multi-tenancy:

```
❌ Não pode ter múltiplos clientes
❌ Não pode escalar como SaaS
❌ Risco de data leakage
❌ Impossível gerenciar múltiplas configurações
❌ Não pode ter múltiplas integrações
❌ Difícil de manter com crescimento
```

## ✅ Próximos Passos

1. **Revisar este documento** com o time
2. **Decidir sobre timeline** de refatoração
3. **Criar design document** detalhado
4. **Começar Fase 1** (Foundation)
5. **Adicionar testes** para tenant isolation
6. **Documentar mudanças** em CHANGELOG.md

---

**Conclusão**: O projeto tem uma **base sólida** mas precisa de **refatoração significativa** para suportar SaaS. A refatoração é **viável** e pode ser feita em **8-12 semanas** com planejamento adequado.
