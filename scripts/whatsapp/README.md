# Automação do Grupo WhatsApp — WaveIGL

Script local (Node/TS, roda **neste PC Windows**) que gerencia o grupo **"Clão do WaveIGL"**:

- Conecta ao WhatsApp via **Baileys** (sessão persistida localmente, sem navegador).
- Lê o Supabase de **produção** por subscribers ativos (`subscriber_benefits.expires_at` no futuro).
- Para cada sub ativo com telefone e consentimento:
  1. Cria/atualiza o contato no **Google Contacts** do admin (conta `gabrieltothgoncalves@gmail.com`, projeto `waveigl-phone-contacts-to-toth`).
  2. Adiciona o número ao grupo, se ainda não for membro.
- Remove do grupo quem **não possui mais sub ativa** (expiração de `expires_at`). Nunca remove a própria conta do admin.

## Requisitos

- Node.js instalado e `npm` no PATH (`node --version`).
- As credenciais em `.env.local` (JÁ configuradas):

```env
# Supabase produção
NEXT_PUBLIC_SUPABASE_URL=https://htuohlztzosetdaponig.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>
SUPABASE_SERVICE_ROLE_KEY=<service_role>

# Google Contacts (projeto waveigl-phone-contacts-to-toth)
ADMIN_GOOGLE_CLIENT_ID=<client_id>
ADMIN_GOOGLE_CLIENT_SECRET=<client_secret>

# WhatsApp
WHATSAPP_GROUP_NAME=Clão do WaveIGL
WHATSAPP_GROUP_INVITE=https://chat.whatsapp.com/LCfCE0Y0Z52DxgmAlrnogU
```

> ⚠️ `.env.local` está no `.gitignore`. **Nunca** commitar essas chaves.

## Passo 1 — Primeira execução (vincular o WhatsApp)

```bash
npm install
npm run whatsapp:sync
```

Um **QR Code** aparece no terminal. No celular: **WhatsApp > Aparelhos conectados > Conectar um aparelho** e escaneie.
A sessão fica salva em `.dev/whatsapp-auth/` (gitignorado). Execuções futuras reutilizam a sessão — não pede QR novamente.

> O script fecha a conexão com `end()` (e **não** `logout()`), preservando a sessão entre execuções.

## Passo 2 — Vincular a conta Google Contacts (uma vez)

A sessão do Google do admin é criada via OAuth **no site de produção** (`https://www.waveigl.com`) — o site roda na Vercel, não neste PC:
1. Acesse `https://www.waveigl.com/login` e entre com a conta de **admin/owner** do WaveIGL (`csgoblackbelt@gmail.com`).
2. Acesse `https://www.waveigl.com/api/auth/google-contacts` — abre o fluxo OAuth do Google.
3. Na tela do Google, escolha **`gabrieltothgoncalves@gmail.com`** e autorize o acesso a contatos.
4. Voltará para `/dashboard?success=google_contacts_linked`. Os tokens ficam salvos no Supabase (`linked_accounts`, plataforma `google_contacts_admin`).

> Pré-requisito: a Vercel (produção) deve ter `ADMIN_GOOGLE_CLIENT_ID` / `ADMIN_GOOGLE_CLIENT_SECRET` apontando para o projeto **`waveigl-phone-contacts-to-toth`** (NÃO o client antigo do YouTube/csgoblackbelt). Confirmado e aplicado por CLI (ver seção abaixo).

> O projeto OAuth `waveigl-phone-contacts-to-toth` deve ter estas **redirect URIs autorizadas** no Google Cloud Console:
> - `https://www.waveigl.com/api/auth/google-contacts`
> - `http://localhost:3000/api/auth/google-contacts`
> - `http://localhost:3001/api/auth/google-contacts`

> A redirect URI é montada dinamicamente pelo app a partir da origin da requisição (`NEXT_PUBLIC_APP_URL` na Vercel = `https://www.waveigl.com`).

## Atualizar env vars de produção (Vercel CLI)

Para trocar as credenciais do Google Contacts na Vercel (quando mudar de projeto OAuth):

```bash
# requer login: vercel login  (ou token em VERCEL_TOKEN)
vercel link --yes --project waveigl
vercel env rm ADMIN_GOOGLE_CLIENT_ID production --yes
vercel env rm ADMIN_GOOGLE_CLIENT_SECRET production --yes
echo "SEU_CLIENT_ID" | vercel env add ADMIN_GOOGLE_CLIENT_ID production
echo "SEU_CLIENT_SECRET" | vercel env add ADMIN_GOOGLE_CLIENT_SECRET production
vercel --prod --yes   # redeploy para aplicar
```

## Execução manual

```bash
npm run whatsapp:sync         # executa a sincronização do grupo
```

## Agendamento no Windows (Task Scheduler)

Para rodar automaticamente (ex.: a cada 6 horas), crie uma tarefa:

1. Abra **Agendador de Tarefas** (Win+R → `taskschd.msc`).
2. **Criar Tarefa**:
   - **Geral**: dê um nome (ex.: "WaveIGL WhatsApp Sync").
   - **Disparadores**: Novo → "Diariamente", e marque **"Repetir a cada 6 horas"**, duração "Indefinidamente".
   - **Ações**: Novo →
     - Programa: `C:\Program Files\nodejs\node.exe` (ou caminho do seu Node, confira com `Get-Command node`)
     - Argumentos: `C:\Users\pentester-01\Documents\Github\waveigl\node_modules\tsx\dist\cli.mjs scripts\whatsapp\sync.mts`
     - Iniciar em: `C:\Users\pentester-01\Documents\Github\waveigl`
   - **Condições**: desmarque "Iniciar a tarefa somente se o computador estiver ligado na energia" (se quiser rodar no notebook).
   - **Configurações**: marque "Executar somente quando o usuário está conectado".

> A sessão do WhatsApp fica ativa enquanto o WhatsApp Web estiver registrado no aparelho. Se a conta deslogar (ex.: após troca de número), rode `npm run whatsapp:sync` manualmente para re-escannear o QR.

## Funcionamento da remoção

- `subscriber_benefits.expires_at` define até quando o benefício vale (gerado com +31 dias).
- Um participante é removido quando **nenhum** benefício seu está ativo (`expires_at` vencido).
- A própria conta do admin (conectada no WhatsApp) **nunca** é removida.