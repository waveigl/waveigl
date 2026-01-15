# 🚀 Setup com Supabase CLI - Automático

Se você quer automatizar tudo, use o Supabase CLI. É muito mais fácil!

## 📋 Pré-requisitos

- Node.js instalado
- npm ou yarn
- Conta no Supabase

## 🔧 Instalação (1 vez)

### Passo 1: Instalar Supabase CLI

```bash
npm install -g supabase
```

Ou com Homebrew (macOS):
```bash
brew install supabase/tap/supabase
```

### Passo 2: Fazer Login

```bash
supabase login
```

Isso abrirá uma página no navegador para você fazer login.

### Passo 3: Vincular Projeto

```bash
supabase link
```

Selecione seu projeto quando perguntado.

## 🚀 Executar Migração

### Windows (PowerShell)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/push-migration.ps1
```

### macOS / Linux (Bash)

```bash
bash scripts/push-migration.sh
```

### Ou manualmente

```bash
supabase db push
```

## ✅ Sucesso!

Se tudo funcionou, você verá:
```
✅ Migração enviada com sucesso!
```

As tabelas foram criadas automaticamente no seu banco de dados!

## 📝 Próximos Passos

1. **Acesse a página de setup:**
   ```
   https://seu-site.com/admin/setup
   ```

2. **Siga o assistente:**
   - Clique em "Começar"
   - Seu User ID será obtido automaticamente
   - Digite sua senha
   - Copie o comando SQL

3. **Execute o INSERT:**
   - Volte ao SQL Editor do Supabase
   - Cole o comando INSERT
   - Clique em "Run"

4. **Pronto!** 🎉
   - Sua senha está configurada
   - Você pode acessar o painel admin

## 🆘 Troubleshooting

### "supabase: command not found"

Instale o Supabase CLI:
```bash
npm install -g supabase
```

### "Not authenticated"

Faça login:
```bash
supabase login
```

### "Project not linked"

Vincule seu projeto:
```bash
supabase link
```

### "No migrations to push"

Verifique se o arquivo de migração existe:
```bash
ls supabase/migrations/
```

Deve haver um arquivo como:
```
20250115000000_add_admin_password_protection.sql
```

## 📚 Mais Informações

- Documentação Supabase CLI: https://supabase.com/docs/guides/cli
- Guia de Migrações: https://supabase.com/docs/guides/cli/local-development

## 🎯 Resumo

| Método | Dificuldade | Tempo |
|--------|-------------|-------|
| **CLI (Recomendado)** | ⭐ Fácil | 2 min |
| SQL Manual | ⭐⭐ Médio | 5 min |
| Web Setup | ⭐⭐⭐ Difícil | 10 min |

Use o CLI! É muito mais fácil! 🚀
