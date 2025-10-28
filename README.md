# WaveIGL - Clube Exclusivo

Sistema de clube de assinatura com chat unificado multi-plataforma (Twitch, YouTube, Kick) e sistema de moderação cross-platform.

## 🚀 Funcionalidades

- **Landing Page SEO Otimizada**: Página de conversão com metadata e schemas estruturados
- **Autenticação Multi-Plataforma**: Login com Twitch, YouTube e Kick
- **Vinculação de Contas**: Sistema para vincular múltiplas contas sem duplicatas
- **Chat Unificado**: Mensagens em tempo real de todas as plataformas
- **Sistema de Moderação**: Timeout e ban cross-platform com reaplicação automática
- **Assinatura Recorrente**: Integração com Mercado Pago (R$9,90/mês)
- **Integração Discord**: Cargos automáticos para membros completos
- **Sistema de Permissões**: Owner, Admin, Moderador com sync automático

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, PostgreSQL, Realtime)
- **Pagamentos**: Mercado Pago SDK
- **Deploy**: Vercel (Serverless Functions + Cron Jobs)
- **Integrações**: Twitch API, YouTube API, Kick API, Discord.js

## 📋 Pré-requisitos

- Node.js 18+
- Conta no Supabase
- Conta no Mercado Pago
- Contas de desenvolvedor nas plataformas (Twitch, YouTube, Kick)
- Bot Discord configurado

## ⚙️ Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/waveigl.git
cd waveigl
```

### 2. Instale as dependências

```bash
npm install
```

> ⚠️ **Nota sobre as dependências**: Todas as dependências foram atualizadas para as versões mais recentes (Outubro 2025). Consulte o arquivo `ATUALIZACOES.md` para detalhes sobre as mudanças importantes, especialmente a migração do `@supabase/auth-helpers-nextjs` (deprecated) para `@supabase/ssr`.

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env.local` e preencha as variáveis:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=seu_token_de_acesso
MERCADOPAGO_PUBLIC_KEY=sua_chave_publica

# Twitch
TWITCH_CLIENT_ID=seu_client_id
TWITCH_CLIENT_SECRET=seu_client_secret
TWITCH_REDIRECT_URI=http://localhost:3000/api/auth/twitch

# YouTube (Google OAuth)
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/youtube

# Kick
KICK_CLIENT_ID=seu_client_id
KICK_CLIENT_SECRET=seu_client_secret
KICK_REDIRECT_URI=http://localhost:3000/api/auth/kick

# Discord
DISCORD_BOT_TOKEN=seu_bot_token
DISCORD_GUILD_ID=id_do_servidor
DISCORD_CLIENT_ID=seu_client_id
DISCORD_CLIENT_SECRET=seu_client_secret

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configure o Supabase

1. Crie um novo projeto no [Supabase](https://supabase.com)
2. Execute as migrations:

```bash
# Instale o Supabase CLI
npm install -g supabase

# Inicialize o projeto
supabase init

# Execute as migrations
supabase db push
```

### 5. Configure as plataformas

#### Twitch
1. Acesse [Twitch Developer Console](https://dev.twitch.tv/console)
2. Crie uma nova aplicação
3. Configure as URLs de callback

#### YouTube
1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Ative a YouTube Data API v3 e a Live Streaming API
3. Configure OAuth 2.0 com os escopos: `openid`, `https://www.googleapis.com/auth/userinfo.email`, `https://www.googleapis.com/auth/userinfo.profile`, `https://www.googleapis.com/auth/youtube.readonly`

#### Kick
1. Acesse [Kick Developer Portal](https://kick.com/developer)
2. Crie uma nova aplicação
3. Configure as URLs de callback

#### Discord
1. Acesse [Discord Developer Portal](https://discord.com/developers/applications)
2. Crie um bot
3. Configure as permissões necessárias

### 6. Configure o Mercado Pago

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Crie uma aplicação
3. Configure os webhooks

## 🚀 Deploy

### Vercel

1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente
3. Configure os Cron Jobs no `vercel.json`

```bash
# Deploy
vercel --prod
```

### Configuração dos Cron Jobs

Os seguintes cron jobs são configurados automaticamente:

- **Reaplicação de Timeouts**: A cada 5 minutos (`*/5 * * * *`)
- **Polling do Chat**: A cada minuto (`*/1 * * * *`)

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

- `users`: Usuários do sistema
- `linked_accounts`: Contas vinculadas (Twitch, YouTube, Kick)
- `moderation_actions`: Ações de moderação
- `active_timeouts`: Timeouts ativos para reaplicação
- `chat_messages`: Mensagens do chat unificado

## 🔧 Desenvolvimento

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Start
npm start

# Lint
npm run lint
```

## 📈 Monitoramento

### Logs
- Vercel Functions: Dashboard do Vercel
- Supabase: Dashboard do Supabase
- Discord: Logs do bot

### Métricas
- Assinaturas ativas
- Mensagens do chat
- Ações de moderação
- Timeouts aplicados

## 🔒 Segurança

- RLS (Row Level Security) habilitado no Supabase
- Validação de permissões em todas as operações
- Rate limiting nas APIs
- Sanitização de inputs

## 💰 Custos

### Gratuito (Limites)
- **Vercel**: 100GB bandwidth/mês, 100 horas serverless
- **Supabase**: 500MB DB, 2GB storage, 50K MAU
- **Discord Bot**: Gratuito

### Com Custos
- **Mercado Pago**: ~4-5% por transação
- **Domínio**: ~R$40/ano

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato através do Discord do WaveIGL ou abra uma issue no GitHub.

---

**Desenvolvido com ❤️ para a comunidade WaveIGL**