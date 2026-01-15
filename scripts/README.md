# 🔧 Scripts de Administração

Scripts auxiliares para configuração e manutenção do painel admin.

## 📋 Disponíveis

### `push-migration.ps1` (Windows) / `push-migration.sh` (macOS/Linux)

Faz push automático da migração para o Supabase usando CLI.

**Uso (Windows):**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/push-migration.ps1
```

**Uso (macOS/Linux):**
```bash
bash scripts/push-migration.sh
```

**O que faz:**
1. Verifica se Supabase CLI está instalado
2. Faz push da migração para o banco
3. Cria as tabelas automaticamente
4. Exibe instruções dos próximos passos

**Requisitos:**
- Supabase CLI instalado: `npm install -g supabase`
- Estar logado: `supabase login`
- Projeto vinculado: `supabase link`

### `setup-admin-password.js`

Gera o hash bcrypt da senha e exibe o comando SQL para inserir no banco.

**Uso:**
```bash
node scripts/setup-admin-password.js
```

**O que faz:**
1. Pede a senha via stdin (não fica no histórico)
2. Valida força da senha
3. Gera hash bcrypt com 12 rounds
4. Exibe comando SQL pronto para copiar

**Requisitos de Senha:**
- Mínimo 8 caracteres
- Maiúscula, minúscula, número e caractere especial

### `setup-admin-password-auto.js`

Script automático que busca seu User ID e gera o hash.

**Uso:**
```bash
node scripts/setup-admin-password-auto.js
```

**O que faz:**
1. Busca seu User ID automaticamente via API
2. Pede a senha via stdin
3. Gera hash bcrypt
4. Exibe comando SQL pronto

### `find-admin-user-id.sql`

Queries SQL para encontrar o User ID de Gabriel Toth.

**Como usar:**
1. Acesse: https://supabase.com/dashboard
2. Vá para: SQL Editor
3. Cole uma das queries do arquivo
4. Execute e copie o `user_id`

**Queries disponíveis:**
- Por email
- Por Twitch username
- Por Kick username

### `run-migration.sql`

SQL pronto para copiar/colar no Supabase SQL Editor.

**Como usar:**
1. Abra o arquivo
2. Copie TODO o conteúdo
3. Acesse Supabase SQL Editor
4. Cole e execute

## 🔐 Fluxo Completo de Setup

### Opção 1: CLI (Recomendado) ⭐

```bash
# 1. Instalar Supabase CLI (1 vez)
npm install -g supabase

# 2. Fazer login (1 vez)
supabase login

# 3. Vincular projeto (1 vez)
supabase link

# 4. Fazer push da migração
powershell -ExecutionPolicy Bypass -File scripts/push-migration.ps1
# ou
bash scripts/push-migration.sh

# 5. Acessar página de setup
# https://seu-site.com/admin/setup
```

### Opção 2: SQL Manual

```bash
# 1. Copiar SQL
# Abra: scripts/run-migration.sql

# 2. Executar no Supabase
# SQL Editor → Cole → Run

# 3. Acessar página de setup
# https://seu-site.com/admin/setup
```

### Opção 3: Web Setup

```bash
# 1. Acessar página de setup
# https://seu-site.com/admin/setup

# 2. Seguir o assistente
# Clique em "Começar"

# 3. Copiar comando SQL

# 4. Executar no Supabase
# SQL Editor → Cole → Run
```

## 🆘 Troubleshooting

### "relation does not exist"
A migração ainda não foi executada. Use um dos métodos acima.

### "Senha fraca"
Verifique se sua senha tem:
- Maiúscula (A-Z)
- Minúscula (a-z)
- Número (0-9)
- Caractere especial (!@#$%^&*)
- Mínimo 8 caracteres

### "Erro ao gerar hash"
Verifique se bcrypt está instalado:
```bash
npm install
```

### "User ID não encontrado"
Verifique se você está usando o email correto ou username correto no Supabase.

## 📚 Documentação

- `docs/SUPABASE_CLI_SETUP.md` - Guia completo do CLI
- `docs/SETUP_MIGRATION.md` - Guia de migração manual
- `docs/ADMIN_PASSWORD_SETUP.md` - Guia de setup da senha

