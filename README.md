# WaveIGL - Moderação Multi-Plataforma

Sistema de chat unificado multi-plataforma (Twitch, YouTube, Kick) com moderação cross-platform.

## 📋 Índice

- [Funcionalidades](#-funcionalidades)
- [Stack Tecnológica](#-stack-tecnológica)
- [Pré-requisitos](#-pré-requisitos)
- [Configuração](#-configuração)
- [Desenvolvimento](#-desenvolvimento)
- [Versionamento](#-versionamento)
- [Documentação](#-documentação)

## 🚀 Funcionalidades

- **Landing Page SEO Otimizada**: Página de conversão com metadata e schemas estruturados
- **Autenticação Multi-Plataforma**: Login com Twitch, YouTube e Kick
- **Vinculação de Contas**: Sistema para vincular múltiplas contas sem duplicatas
- **Chat Unificado**: Mensagens em tempo real de todas as plataformas
- **Sistema de Moderação**: Timeout e ban cross-platform com reaplicação automática
- **Sistema de Permissões**: Owner, Admin, Moderador com sync automático

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 16+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, PostgreSQL, Realtime)
- **Deploy**: Vercel (Serverless Functions + Cron Jobs)
- **Integrações**: Twitch API, YouTube API, Kick API
- **Testing**: Vitest, Playwright

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase
- Contas de desenvolvedor nas plataformas (Twitch, YouTube, Kick)

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

> ⚠️ **Nota sobre as dependências**: Todas as dependências foram atualizadas para as versões mais recentes. Consulte o arquivo `ATUALIZACOES.md` para detalhes sobre as mudanças importantes.

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env.local` e preencha as variáveis:

```bash
cp .env.example .env.local
```

Variáveis obrigatórias:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico

# Aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_SECRET=chave_secreta_minimo_32_caracteres

# Twitch
TWITCH_CLIENT_ID=seu_client_id
TWITCH_CLIENT_SECRET=seu_client_secret
TWITCH_BROADCASTER_ID=seu_broadcaster_id

# YouTube (Google OAuth)
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret

# Kick
KICK_CLIENT_ID=seu_client_id
KICK_CLIENT_SECRET=seu_client_secret


```

Veja `.env.example` para todas as variáveis disponíveis.

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
3. Configure OAuth 2.0 com os escopos necessários

#### Kick
1. Acesse [Kick Developer Portal](https://kick.com/developer)
2. Crie uma nova aplicação
3. Configure as URLs de callback



## 🚀 Deploy

### Vercel

1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente
3. Configure os Cron Jobs no `vercel.json`

```bash
# Deploy
vercel --prod
```

## 🔧 Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Start
npm start

# Lint
npm run lint

# Testes
npm run test              # Testes unitários (watch mode)
npm run test:unit         # Testes unitários (run once)
npm run test:integration  # Testes de integração
npm run test:e2e          # Testes E2E

# Database
npm run db:reset          # Reset do banco de dados
npm run db:push           # Push das migrations
```

## 📦 Versionamento

Este projeto segue **Semantic Versioning (MAJOR.MINOR.PATCH)**.

### Regras de Versionamento

- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (X.Y.0): Novas features compatíveis
- **PATCH** (X.Y.Z): Bug fixes

### Antes de Cada Commit

Toda mudança **DEVE** seguir este checklist:

- [ ] Código implementado e funcionando
- [ ] Testes criados/atualizados e passando
- [ ] Tipos TypeScript corretos (sem `any`)
- [ ] Tratamento de erros implementado
- [ ] Logs estruturados adicionados
- [ ] **CHANGELOG.md atualizado**
- [ ] **Versão atualizada em package.json**

### Atualizar Versão

```bash
# PATCH (bug fix)
npm version patch

# MINOR (nova feature)
npm version minor

# MAJOR (breaking change)
npm version major
```

Veja `.kiro/steering/VERSIONING.md` para detalhes completos.

## 📚 Documentação

### Arquivos de Referência

- **`.kiro/steering/README.md`** - Índice de documentação
- **`.kiro/steering/AI_GUIDELINES.md`** - Diretrizes para IAs
- **`.kiro/steering/PROJECT_STANDARDS.md`** - Padrões técnicos
- **`.kiro/steering/NAMING_CONVENTIONS.md`** - Convenções de nomenclatura
- **`.kiro/steering/ARCHITECTURE.md`** - Arquitetura do sistema
- **`.kiro/steering/ERROR_HANDLING.md`** - Tratamento de erros
- **`.kiro/steering/AUTOMATION.md`** - Automação e CI/CD
- **`.kiro/steering/VERSIONING.md`** - Regras de versionamento
- **`CHANGELOG.md`** - Histórico de mudanças
- **`ATUALIZACOES.md`** - Atualizações recentes

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

- `profiles`: Usuários do sistema
- `linked_accounts`: Contas vinculadas (Twitch, YouTube, Kick)
- `subscriber_benefits`: Benefícios de assinante
- `moderation_actions`: Ações de moderação
- `active_timeouts`: Timeouts ativos para reaplicação

## 📈 Monitoramento

### Logs
- Vercel Functions: Dashboard do Vercel
- Supabase: Dashboard do Supabase

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
- Variáveis de ambiente protegidas

## 💰 Custos

### Gratuito (Limites)
- **Vercel**: 100GB bandwidth/mês, 100 horas serverless
- **Supabase**: 500MB DB, 2GB storage, 50K MAU


### Com Custos

- **Domínio**: ~R$40/ano

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`feat/descricao`)
3. Commit suas mudanças (`git commit -m "feat: descrição"`)
4. Atualize a versão (`npm version patch|minor|major`)
5. Atualize o CHANGELOG.md
6. Push para a branch
7. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, abra uma issue no GitHub.

---

**Desenvolvido com ❤️ para a comunidade WaveIGL**