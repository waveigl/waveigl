# 🔧 Setup da Migração - Criar Tabelas no Supabase

## ⚠️ Problema

Você recebeu este erro:
```
ERROR: 42P01: relation "admin_security_config" does not exist
```

Isso significa que as tabelas ainda não foram criadas no banco de dados.

## ✅ Solução (3 Passos Simples)

### Passo 1: Copiar o SQL

Abra o arquivo: `scripts/run-migration.sql`

Copie TODO o conteúdo (Ctrl+A, Ctrl+C)

### Passo 2: Acessar Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para: **SQL Editor** (no menu esquerdo)

### Passo 3: Executar a Migração

1. Cole o SQL no editor (Ctrl+V)
2. Clique em **"Run"** (botão verde no canto superior direito)
3. Aguarde a execução

## ✅ Sucesso!

Se não houver erros, você verá:
```
Query executed successfully
```

Agora as tabelas foram criadas e você pode:
1. Acessar `/admin/setup` no seu site
2. Configurar sua senha
3. Usar o painel admin

## 🆘 Se der erro

### Erro: "relation already exists"
Significa que as tabelas já foram criadas. Ignore e continue.

### Erro: "permission denied"
Você precisa estar logado como admin no Supabase. Verifique suas credenciais.

### Outro erro
Copie a mensagem de erro e procure na documentação do Supabase.

## 📝 Próximos Passos

Após executar a migração com sucesso:

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

## 🔐 Segurança

- ✅ As tabelas têm RLS (Row Level Security) ativado
- ✅ Apenas você pode ver sua própria configuração
- ✅ Senhas são armazenadas com hash bcrypt
- ✅ Todas as tentativas são auditadas

## 📞 Suporte

Se tiver dúvidas:
1. Verifique se está no projeto correto no Supabase
2. Verifique se está logado
3. Tente copiar e colar novamente
4. Consulte a documentação do Supabase
