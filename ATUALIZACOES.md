# Atualizações de Dependências - WaveIGL v0.0.0

## 📦 Dependências Atualizadas

### Principais Mudanças

#### 1. **Supabase** - BREAKING CHANGE
- ❌ **Removido**: `@supabase/auth-helpers-nextjs@0.9.0` (deprecated)
- ✅ **Adicionado**: `@supabase/ssr@0.5.2` (novo pacote oficial)
- ✅ **Atualizado**: `@supabase/supabase-js@2.45.4` (era 2.39.0)

**Mudanças necessárias:**
- Criado `src/middleware.ts` para gerenciar sessões
- Atualizado `src/lib/supabase/client.ts` para usar `createBrowserClient`
- Atualizado `src/lib/supabase/server.ts` para usar `createServerClient` do SSR

#### 2. **Next.js**
- ✅ **Atualizado**: `next@15.0.3` (era 14.2.0)
- Removido `experimental.appDir` (agora é padrão)
- Atualizado `images.domains` para `images.remotePatterns` (formato recomendado)

#### 3. **ESLint**
- ✅ **Atualizado**: `eslint@9.14.0` (era 8.57.1)
- ✅ **Atualizado**: `eslint-config-next@15.0.3`

#### 4. **Outras Dependências Principais**

| Pacote | Versão Anterior | Versão Atual | Mudança |
|--------|----------------|--------------|---------|
| react | 18.3.0 | 18.3.1 | Patch |
| react-dom | 18.3.0 | 18.3.1 | Patch |
| typescript | 5.0.0 | 5.6.3 | Minor |
| tailwindcss | 3.4.0 | 3.4.14 | Patch |
| date-fns | 3.0.0 | 4.1.0 | Major ⚠️ |
| framer-motion | 11.0.0 | 11.11.17 | Minor |
| lucide-react | 0.400.0 | 0.454.0 | Minor |
| discord.js | 14.14.0 | 14.16.3 | Minor |
| mercadopago | 2.0.0 | 2.0.15 | Patch |
| zod | 3.22.0 | 3.23.8 | Minor |
| @types/node | 20.0.0 | 22.8.6 | Major ⚠️ |
| autoprefixer | 10.0.0 | 10.4.20 | Minor |
| postcss | 8.0.0 | 8.4.47 | Minor |

#### 5. **Novas Dependências**
- ✅ **Adicionado**: `@radix-ui/react-slot@1.1.0` (necessário para componentes UI)

## 🔧 Como Atualizar

### Passo 1: Limpar node_modules e package-lock.json

```bash
rm -rf node_modules package-lock.json
```

### Passo 2: Instalar as dependências atualizadas

```bash
npm install
```

### Passo 3: Verificar se tudo funciona

```bash
npm run dev
```

## ⚠️ Breaking Changes

### date-fns v3 → v4
Se você estiver usando funções específicas do date-fns, verifique a [documentação de migração](https://date-fns.org/docs/upgrading).

### @types/node v20 → v22
Algumas definições de tipos podem ter mudado. Se houver erros de tipo, verifique a documentação do Node.js.

### Supabase SSR
A maior mudança é na forma de criar clientes Supabase:

**Antes (deprecated):**
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
const supabase = createClientComponentClient()
```

**Agora:**
```typescript
import { createBrowserClient } from '@supabase/ssr'
const supabase = createBrowserClient(url, key)
```

## 📝 Notas Importantes

1. **Middleware**: O novo pacote `@supabase/ssr` requer um middleware para gerenciar sessões corretamente. Já está configurado em `src/middleware.ts`.

2. **ESLint 9**: A nova versão do ESLint pode ter mudanças no formato de configuração. Se houver problemas, consulte a [documentação oficial](https://eslint.org/docs/latest/use/migrate-to-9.0.0).

3. **Next.js 15**: Algumas APIs podem ter mudado. Consulte o [guia de atualização](https://nextjs.org/docs/app/building-your-application/upgrading/version-15) se encontrar problemas.

## ✅ Testes Recomendados

Após a atualização, teste:

- [ ] Autenticação (login/logout)
- [ ] Proteção de rotas (middleware)
- [ ] Build do projeto (`npm run build`)
- [ ] Linting (`npm run lint`)
- [ ] Integração com Supabase
- [ ] Deploy na Vercel

## 🐛 Problemas Comuns

### Erro: "Module not found: Can't resolve '@supabase/auth-helpers-nextjs'"
**Solução**: Execute `npm install` novamente. O pacote foi substituído por `@supabase/ssr`.

### Erro de tipos no TypeScript
**Solução**: Execute `npm run build` para regenerar os tipos do Next.js.

### Erro no ESLint
**Solução**: O ESLint 9 pode ter novas regras. Execute `npm run lint` para ver os erros específicos.

## 📚 Recursos

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [ESLint 9 Migration Guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0)

---

**Data da Atualização**: 21 de Outubro de 2025
**Versão do Projeto**: 0.0.0
