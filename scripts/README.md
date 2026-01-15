# 🔧 Scripts de Administração

Scripts auxiliares para configuração e manutenção do painel admin.

## 📋 Disponíveis

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

## 🔐 Fluxo Completo de Setup

1. **Encontrar User ID:**
   ```bash
   # Abra scripts/find-admin-user-id.sql
   # Execute uma das queries no Supabase
   # Copie o user_id
   ```

2. **Gerar Hash:**
   ```bash
   node scripts/setup-admin-password.js
   # Digite sua senha
   # Copie o comando SQL exibido
   ```

3. **Inserir no Banco:**
   ```bash
   # Acesse Supabase SQL Editor
   # Cole o comando SQL
   # Execute
   ```

4. **Testar:**
   - Acesse o dashboard
   - Clique no badge de cargo
   - Digite a senha
   - Painel deve abrir

## 🆘 Troubleshooting

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
