# 🔐 Configuração de Senha do Painel Admin

Guia para configurar a senha de proteção do painel admin.

## 📋 Visão Geral

O painel admin agora possui proteção adicional com senha bcrypt. Isso garante que mesmo que alguém consiga se passar por Gabriel Toth (ogabrieltoth), ainda precisará da senha para acessar o painel.

## 🔒 Segurança

- **Bcrypt com 12 rounds**: Muito mais seguro que base64
- **Rate limiting**: Máximo 5 tentativas antes de bloqueio de 15 minutos
- **Auditoria completa**: Todas as tentativas são registradas com IP e User-Agent
- **Validação de força**: Senha deve ter maiúscula, minúscula, número e caractere especial
- **Mínimo 8 caracteres**: Requisito obrigatório

## 🚀 Setup Inicial

### 1. Gerar Hash da Senha

Execute este comando Node.js para gerar o hash da sua senha:

```javascript
const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'SuaSenhaForte123!@#'; // Altere para sua senha
  const hash = await bcrypt.hash(password, 12);
  console.log('Hash:', hash);
}

generateHash();
```

### 2. Inserir no Banco de Dados

Após obter o hash, execute esta query SQL no Supabase:

```sql
-- Substitua os valores abaixo
INSERT INTO admin_security_config (
  admin_user_id,
  password_hash,
  password_salt
) VALUES (
  'SEU_USER_ID_AQUI', -- UUID do usuário Gabriel Toth
  'HASH_GERADO_ACIMA',
  'salt_value' -- Pode ser qualquer string
);
```

### 3. Encontrar o User ID

Para encontrar o user ID de Gabriel Toth:

```sql
SELECT id, email FROM auth.users WHERE email = 'gabrieltothgoncalves@gmail.com';
```

## 📝 Requisitos de Senha

A senha deve conter:

- ✅ Mínimo 8 caracteres
- ✅ Pelo menos uma letra maiúscula (A-Z)
- ✅ Pelo menos uma letra minúscula (a-z)
- ✅ Pelo menos um número (0-9)
- ✅ Pelo menos um caractere especial (!@#$%^&*)

### Exemplos de Senhas Válidas

```
✅ SecurePass123!
✅ MyAdmin@2025Pass
✅ Gabriel#Toth123
✅ WaveIGL$Admin2025
```

### Exemplos de Senhas Inválidas

```
❌ password123 (sem maiúscula e caractere especial)
❌ PASSWORD123! (sem minúscula)
❌ Pass123! (muito curta)
❌ SecurePass (sem número e caractere especial)
```

## 🔄 Fluxo de Autenticação

1. **Clique no badge de cargo** (Admin/Streamer) no dashboard
2. **Modal de senha aparece** com campo seguro
3. **Digite sua senha** (caracteres ocultos)
4. **Clique em "Acessar"**
5. **Painel admin abre** se senha correta

## 🚨 Proteção Contra Força Bruta

- **Máximo 5 tentativas**: Após 5 tentativas falhadas, conta é bloqueada
- **Bloqueio de 15 minutos**: Aguarde 15 minutos antes de tentar novamente
- **Auditoria**: Todas as tentativas são registradas

### Exemplo de Bloqueio

```
Tentativa 1: ❌ Senha incorreta
Tentativa 2: ❌ Senha incorreta
Tentativa 3: ❌ Senha incorreta
Tentativa 4: ❌ Senha incorreta
Tentativa 5: ❌ Senha incorreta
→ CONTA BLOQUEADA POR 15 MINUTOS
```

## 📊 Auditoria

Todas as tentativas de acesso são registradas na tabela `admin_password_audit`:

```sql
SELECT * FROM admin_password_audit 
WHERE admin_user_id = 'SEU_USER_ID'
ORDER BY timestamp DESC
LIMIT 50;
```

Informações registradas:
- `attempt_type`: 'success', 'failed', ou 'locked'
- `ip_address`: IP do cliente
- `user_agent`: Navegador e SO
- `timestamp`: Data e hora da tentativa

## 🔧 Resetar Bloqueio (Emergência)

Se a conta ficar bloqueada, execute esta query SQL:

```sql
UPDATE admin_security_config
SET failed_attempts = 0, locked_until = NULL
WHERE admin_user_id = 'SEU_USER_ID';
```

## 🔄 Alterar Senha

Para alterar a senha:

1. Gere um novo hash com a nova senha
2. Execute a query de atualização:

```sql
UPDATE admin_security_config
SET password_hash = 'NOVO_HASH_AQUI'
WHERE admin_user_id = 'SEU_USER_ID';
```

## 🛡️ Boas Práticas

1. **Use uma senha forte**: Combine maiúsculas, minúsculas, números e caracteres especiais
2. **Não compartilhe**: Nunca compartilhe sua senha com ninguém
3. **Mude regularmente**: Altere a senha a cada 3-6 meses
4. **Monitore auditoria**: Verifique regularmente o log de tentativas
5. **Use HTTPS**: Sempre acesse via HTTPS em produção

## 🆘 Troubleshooting

### "Conta bloqueada. Tente novamente em X minuto(s)"

A conta foi bloqueada por 5 tentativas falhadas. Aguarde 15 minutos e tente novamente.

### "Senha incorreta. Tentativas restantes: X"

Você digitou a senha errada. Verifique se:
- Caps Lock está desligado
- Você está usando a senha correta
- Não há espaços extras

### "Configuração de segurança não encontrada"

A senha não foi configurada no banco de dados. Siga o setup inicial acima.

## 📞 Suporte

Para dúvidas sobre segurança ou configuração, consulte:
- `CHANGELOG.md` - Histórico de mudanças
- `ERROR_HANDLING.md` - Tratamento de erros
- `PROJECT_STANDARDS.md` - Padrões do projeto
