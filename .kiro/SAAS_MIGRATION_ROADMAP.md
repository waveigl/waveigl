# 🗺️ SaaS Migration Roadmap

**Status**: 📋 Planejamento
**Duração Estimada**: 8-12 semanas
**Complexidade**: Alta
**Risco**: Médio (com planejamento adequado)

## 🎯 Visão Geral

Transformar WaveIGL de uma **plataforma single-tenant** para uma **plataforma SaaS multi-tenant** que suporte múltiplos streamers/organizações.

## 📊 Timeline Visual

```
Semana 1-2: Foundation
├── Criar schema multi-tenant
├── Adicionar tenant context
└── Implementar middleware

Semana 3-4: Isolation
├── Atualizar todas as queries
├── Implementar tenant routing
└── Validar isolamento

Semana 5-6: Configuration
├── Criar tenant settings
├── Implementar credential management
└── Criar admin panel

Semana 7-8: Integration
├── Múltiplos Discord bots
├── Múltiplos Mercado Pago
└── Múltiplos OAuth

Semana 9-12: Testing & Hardening
├── Testes de segurança
├── Testes de performance
├── Documentação
└── Deploy
```

## 📋 Fase 1: Foundation (Semanas 1-2)

### Objetivo
Preparar a base do banco de dados e contexto para multi-tenancy.

### Tarefas

#### 1.1 Criar Schema Multi-Tenant
**Arquivo**: `supabase/migrations/001_add_multi_tenancy.sql`

```sql
-- Criar tabela organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela tenant_settings
CREATE TABLE tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_org_key UNIQUE(organization_id, key)
);

-- Criar tabela tenant_members
CREATE TABLE tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'moderator', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_org_user UNIQUE(organization_id, user_id)
);

-- Adicionar organization_id a profiles
ALTER TABLE profiles ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE profiles ADD CONSTRAINT unique_org_email UNIQUE(organization_id, email);

-- Adicionar organization_id a outras tabelas
ALTER TABLE linked_accounts ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE moderation_actions ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE active_timeouts ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE chat_messages ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE subscriber_benefits ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE discord_connections ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Criar índices
CREATE INDEX idx_organizations_owner ON organizations(owner_id);
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_tenant_settings_org ON tenant_settings(organization_id);
CREATE INDEX idx_tenant_members_org ON tenant_members(organization_id);
CREATE INDEX idx_profiles_org ON profiles(organization_id);
CREATE INDEX idx_linked_accounts_org ON linked_accounts(organization_id);
```

**Checklist:**
- [ ] Criar arquivo de migração
- [ ] Testar migração em desenvolvimento
- [ ] Validar índices
- [ ] Documentar schema

#### 1.2 Criar Tenant Context
**Arquivo**: `src/lib/tenant/context.ts`

```typescript
import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export interface TenantContext {
  organizationId: string
  tenantId: string
  userId: string
  role: 'owner' | 'admin' | 'moderator' | 'user'
  plan: 'free' | 'pro' | 'enterprise'
}

export async function getTenantContext(
  request: NextRequest,
  userId: string
): Promise<TenantContext | null> {
  // Extrair tenant_id da URL, header ou session
  const tenantId = request.headers.get('x-tenant-id') || 
                   new URL(request.url).searchParams.get('tenant_id')
  
  if (!tenantId) return null
  
  const supabase = getSupabaseAdmin()
  
  // Validar acesso do usuário ao tenant
  const { data: member } = await supabase
    .from('tenant_members')
    .select('role, organizations(plan)')
    .eq('organization_id', tenantId)
    .eq('user_id', userId)
    .single()
  
  if (!member) return null
  
  return {
    organizationId: tenantId,
    tenantId,
    userId,
    role: member.role,
    plan: member.organizations.plan
  }
}
```

**Checklist:**
- [ ] Criar arquivo
- [ ] Implementar extração de tenant
- [ ] Implementar validação de acesso
- [ ] Adicionar testes

#### 1.3 Criar Middleware de Tenant
**Arquivo**: `src/lib/middleware/tenant.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, TenantContext } from '@/lib/tenant/context'
import { parseSessionCookie } from '@/lib/auth/session'

export async function withTenantContext(
  request: NextRequest,
  handler: (req: NextRequest, tenant: TenantContext) => Promise<Response>
): Promise<Response> {
  try {
    const cookieHeader = request.headers.get('cookie')
    const session = await parseSessionCookie(cookieHeader)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const tenant = await getTenantContext(request, session.userId)
    
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }
    
    return handler(request, tenant)
  } catch (error) {
    console.error('[Tenant Middleware] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Checklist:**
- [ ] Criar arquivo
- [ ] Implementar middleware
- [ ] Adicionar testes
- [ ] Documentar uso

#### 1.4 Atualizar Session
**Arquivo**: `src/lib/auth/session.ts`

```typescript
// Adicionar tenant ao session
type SessionPayload = {
  userId: string
  organizationId: string
  role: 'owner' | 'admin' | 'moderator' | 'user'
  exp: number
}
```

**Checklist:**
- [ ] Atualizar tipo SessionPayload
- [ ] Atualizar sign/verify functions
- [ ] Atualizar parseSessionCookie
- [ ] Adicionar testes

#### 1.5 Criar Testes de Isolamento
**Arquivo**: `tests/integration/tenant-isolation.test.ts`

```typescript
describe('Tenant Isolation', () => {
  it('deve impedir acesso cross-tenant', async () => {
    // Teste que valida isolamento
  })
  
  it('deve validar tenant em queries', async () => {
    // Teste que valida filtro organization_id
  })
})
```

**Checklist:**
- [ ] Criar arquivo de testes
- [ ] Implementar testes de isolamento
- [ ] Implementar testes de segurança
- [ ] Validar cobertura

### Deliverables Fase 1
- ✅ Schema multi-tenant no banco
- ✅ Tenant context implementado
- ✅ Middleware de tenant
- ✅ Session com tenant
- ✅ Testes de isolamento

---

## 📋 Fase 2: Isolation (Semanas 3-4)

### Objetivo
Implementar isolamento de dados em todas as APIs.

### Tarefas

#### 2.1 Atualizar Todas as Queries
**Padrão**:
```typescript
// Antes
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)

// Depois
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('organization_id', tenant.organizationId)
  .eq('id', userId)
```

**Arquivos a Atualizar:**
- [ ] `src/lib/benefits/index.ts`
- [ ] `src/lib/discord/server.ts`
- [ ] `src/lib/notifications/subscription.ts`
- [ ] Todas as API routes em `src/app/api/`

#### 2.2 Implementar Tenant Routing
**Padrão**:
```
/api/tenants/:tenantId/subscription/check-eligibility
/api/tenants/:tenantId/me/profile
/api/tenants/:tenantId/discord/sync-roles
```

**Arquivos a Criar:**
- [ ] `src/app/api/tenants/[tenantId]/subscription/check-eligibility/route.ts`
- [ ] `src/app/api/tenants/[tenantId]/me/profile/route.ts`
- [ ] `src/app/api/tenants/[tenantId]/discord/sync-roles/route.ts`
- [ ] ... (todas as rotas)

#### 2.3 Atualizar RLS Policies
**Padrão**:
```sql
-- Antes
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Depois
CREATE POLICY "Users can read own profile in organization"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id AND
    organization_id IN (
      SELECT organization_id FROM tenant_members 
      WHERE user_id = auth.uid()
    )
  );
```

**Checklist:**
- [ ] Atualizar RLS para todas as tabelas
- [ ] Testar isolamento
- [ ] Validar performance

#### 2.4 Criar Tenant Management API
**Endpoints:**
```
GET /api/tenants - Listar tenants do usuário
POST /api/tenants - Criar novo tenant
GET /api/tenants/:id - Obter detalhes
PUT /api/tenants/:id - Atualizar tenant
DELETE /api/tenants/:id - Deletar tenant
```

**Checklist:**
- [ ] Criar endpoints
- [ ] Implementar validações
- [ ] Adicionar testes
- [ ] Documentar API

### Deliverables Fase 2
- ✅ Todas as queries com organization_id
- ✅ Tenant routing implementado
- ✅ RLS policies atualizadas
- ✅ Tenant management API
- ✅ Testes de isolamento passando

---

## 📋 Fase 3: Configuration (Semanas 5-6)

### Objetivo
Suportar configuração dinâmica por tenant.

### Tarefas

#### 3.1 Implementar Tenant Settings
**Arquivo**: `src/lib/tenant/config.ts`

```typescript
export interface TenantConfig {
  discordGuildId: string
  discordBotToken: string
  mercadoPagoToken: string
  ownerAccounts: Record<string, string>
  adminAccounts: Record<string, string>
}

export async function getTenantConfig(organizationId: string): Promise<TenantConfig> {
  // Buscar do banco de dados
}

export async function updateTenantConfig(
  organizationId: string,
  config: Partial<TenantConfig>
): Promise<void> {
  // Atualizar no banco de dados
}
```

**Checklist:**
- [ ] Criar arquivo
- [ ] Implementar get/update
- [ ] Adicionar caching
- [ ] Adicionar testes

#### 3.2 Implementar Credential Encryption
**Arquivo**: `src/lib/crypto/credentials.ts`

```typescript
export async function encryptCredential(value: string): Promise<string> {
  // Criptografar com chave do tenant
}

export async function decryptCredential(encrypted: string): Promise<string> {
  // Descriptografar com chave do tenant
}
```

**Checklist:**
- [ ] Implementar criptografia
- [ ] Gerenciar chaves
- [ ] Adicionar testes

#### 3.3 Criar Admin Panel
**Componentes:**
- [ ] `src/components/admin/TenantList.tsx`
- [ ] `src/components/admin/TenantForm.tsx`
- [ ] `src/components/admin/TenantSettings.tsx`
- [ ] `src/components/admin/MemberManagement.tsx`

**Checklist:**
- [ ] Criar componentes
- [ ] Implementar funcionalidades
- [ ] Adicionar validações
- [ ] Testar UX

### Deliverables Fase 3
- ✅ Tenant settings implementado
- ✅ Credential encryption
- ✅ Admin panel funcional
- ✅ Testes de configuração

---

## 📋 Fase 4: Integration (Semanas 7-8)

### Objetivo
Suportar múltiplas integrações por tenant.

### Tarefas

#### 4.1 Múltiplos Discord Bots
**Mudanças:**
- [ ] Armazenar Discord bot token por tenant
- [ ] Usar token correto em cada operação
- [ ] Suportar múltiplos guild IDs

#### 4.2 Múltiplos Mercado Pago
**Mudanças:**
- [ ] Armazenar MP token por tenant
- [ ] Usar token correto em cada operação
- [ ] Suportar múltiplas contas

#### 4.3 Múltiplos OAuth
**Mudanças:**
- [ ] Armazenar OAuth credentials por tenant
- [ ] Usar credentials corretos em cada operação
- [ ] Suportar múltiplas aplicações

### Deliverables Fase 4
- ✅ Múltiplos Discord bots funcionando
- ✅ Múltiplos Mercado Pago funcionando
- ✅ Múltiplos OAuth funcionando
- ✅ Testes de integração

---

## 📋 Fase 5: Testing & Hardening (Semanas 9-12)

### Objetivo
Garantir segurança, performance e confiabilidade.

### Tarefas

#### 5.1 Testes de Segurança
- [ ] Cross-tenant access prevention
- [ ] Credential isolation
- [ ] API key management
- [ ] Audit logging

#### 5.2 Testes de Performance
- [ ] Múltiplos tenants simultâneos
- [ ] Query optimization
- [ ] Caching strategy
- [ ] Load testing

#### 5.3 Documentação
- [ ] Arquitetura multi-tenant
- [ ] Guia de deployment
- [ ] Guia de operações
- [ ] Guia de segurança

#### 5.4 Deploy
- [ ] Staging deployment
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Rollback plan

### Deliverables Fase 5
- ✅ Testes de segurança passando
- ✅ Performance validada
- ✅ Documentação completa
- ✅ Deploy em produção

---

## 🎯 Métricas de Sucesso

### Fase 1
- ✅ Schema criado e testado
- ✅ Tenant context funcionando
- ✅ Testes de isolamento passando

### Fase 2
- ✅ Todas as APIs com isolamento
- ✅ Tenant routing funcionando
- ✅ RLS policies validadas

### Fase 3
- ✅ Configuração por tenant
- ✅ Credentials criptografados
- ✅ Admin panel funcional

### Fase 4
- ✅ Múltiplas integrações
- ✅ Testes de integração passando
- ✅ Documentação atualizada

### Fase 5
- ✅ Testes de segurança passando
- ✅ Performance validada
- ✅ Deploy em produção

---

## 🚨 Riscos e Mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|--------|-----------|
| Data leakage | Média | Crítico | Testes rigorosos de isolamento |
| Performance degradation | Média | Alto | Load testing e optimization |
| Breaking changes | Alta | Médio | Versioning de API |
| Downtime durante migração | Média | Alto | Blue-green deployment |
| Credential exposure | Baixa | Crítico | Encryption e audit logging |

---

## 📞 Próximos Passos

1. **Revisar roadmap** com o time
2. **Decidir timeline** de início
3. **Alocar recursos** para cada fase
4. **Criar branches** para desenvolvimento
5. **Começar Fase 1** (Foundation)

---

**Versão**: 1.0.0
**Data**: 2024-01-13
**Status**: 📋 Pronto para Implementação
