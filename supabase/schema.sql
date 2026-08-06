-- ============================================================================
-- SCHEMA CONSOLIDADO - WaveIGL Database
-- ============================================================================
-- Este arquivo representa o estado ATUAL do banco de dados
-- Útil para: documentação, setup rápido, referência
-- 
-- NOTA: Para produção, use as migrações incrementais em /migrations/
-- Este arquivo é apenas para referência e desenvolvimento
-- ============================================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABELAS
-- ============================================================================

-- 1. PROFILES
-- Estende auth.users do Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT,
  avatar_url TEXT,
  full_name TEXT,
  birth_date DATE,
  birth_date_edits INTEGER DEFAULT 0,
  phone_number TEXT,
  last_phone_edit_at TIMESTAMPTZ,
  last_profile_edit_at TIMESTAMPTZ,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'streamer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. LINKED_ACCOUNTS
-- Contas vinculadas das plataformas (Twitch, YouTube, Kick)
CREATE TABLE IF NOT EXISTS public.linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitch', 'youtube', 'kick')),
  platform_user_id TEXT NOT NULL,
  platform_username TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  authorized_scopes TEXT[],
  needs_reauth BOOLEAN DEFAULT false,
  is_moderator BOOLEAN DEFAULT false,
  unlinked_at TIMESTAMPTZ DEFAULT NULL,
  unlinked_by_user_id UUID REFERENCES public.profiles(id) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_platform_user UNIQUE(platform, platform_user_id),
  CONSTRAINT unique_user_platform_pair UNIQUE(user_id, platform)
);

-- 3. MODERATION_ACTIONS
-- Histórico de ações de moderação
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  moderator_id UUID REFERENCES public.profiles(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('timeout', 'ban', 'unban')),
  duration_seconds INTEGER,
  reason TEXT,
  expires_at TIMESTAMPTZ,
  platforms TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ACTIVE_TIMEOUTS
-- Timeouts ativos que precisam ser reaplicados periodicamente
CREATE TABLE IF NOT EXISTS public.active_timeouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderation_action_id UUID REFERENCES public.moderation_actions(id),
  user_id UUID REFERENCES public.profiles(id),
  platform TEXT NOT NULL CHECK (platform IN ('twitch', 'youtube', 'kick')),
  platform_user_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_applied_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CHAT_MESSAGES
-- Mensagens do chat unificado (cache/backup)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('twitch', 'youtube', 'kick')),
  username TEXT NOT NULL,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  badges TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PENDING_UNLINKS
-- Contas aguardando desvinculação (quarentena de 7 dias)
CREATE TABLE IF NOT EXISTS public.pending_unlinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitch', 'youtube', 'kick')),
  linked_account_id UUID REFERENCES public.linked_accounts(id) ON DELETE SET NULL,
  effective_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'skipped')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SUBSCRIBER_BENEFITS
-- Benefícios de assinantes (subs, gifts, etc.)
CREATE TABLE IF NOT EXISTS public.subscriber_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitch', 'kick', 'youtube')),
  tier TEXT NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_gift BOOLEAN DEFAULT FALSE,
  gifter_username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SHORT_LINKS
-- Encurtador de URLs (estilo bit.ly)
CREATE TABLE IF NOT EXISTS public.short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  description TEXT,
  clicks INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 9. SHORT_LINK_CLICKS
-- Analytics de cada clique em links curtos (dispositivo, localização e origem)
CREATE TABLE IF NOT EXISTS public.short_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.short_links(id) ON DELETE CASCADE,
  ip TEXT,
  user_agent TEXT,
  referrer TEXT,
  device_type TEXT,
  os TEXT,
  browser TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  utm_source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number) WHERE phone_number IS NOT NULL;

-- Linked Accounts
CREATE INDEX IF NOT EXISTS idx_linked_accounts_user_id ON public.linked_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_linked_accounts_needs_reauth ON public.linked_accounts(needs_reauth) WHERE needs_reauth = true;
CREATE INDEX IF NOT EXISTS idx_linked_accounts_unlinked_at ON public.linked_accounts(unlinked_at) WHERE unlinked_at IS NOT NULL;

-- Moderation
CREATE INDEX IF NOT EXISTS idx_active_timeouts_expires_at ON public.active_timeouts(expires_at);

-- Chat
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON public.chat_messages(timestamp DESC);

-- Unlinks
CREATE INDEX IF NOT EXISTS idx_pending_unlinks_effective_at ON public.pending_unlinks(effective_at);

-- Subscriber Benefits
CREATE INDEX IF NOT EXISTS idx_subscriber_benefits_user ON public.subscriber_benefits(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriber_benefits_platform ON public.subscriber_benefits(platform);
CREATE INDEX IF NOT EXISTS idx_subscriber_benefits_expires ON public.subscriber_benefits(expires_at);

-- Short Links
CREATE INDEX IF NOT EXISTS idx_short_links_token ON public.short_links(token);
CREATE INDEX IF NOT EXISTS idx_short_links_created_at ON public.short_links(created_at DESC) WHERE deleted_at IS NULL;

-- Short Link Clicks
CREATE INDEX IF NOT EXISTS idx_short_link_clicks_link ON public.short_link_clicks(link_id, created_at DESC);

-- ============================================================================
-- TRIGGERS E FUNCTIONS
-- ============================================================================

-- Função genérica para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funções específicas para updated_at (definir antes dos triggers)
CREATE OR REPLACE FUNCTION update_linked_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_subscriber_benefits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_linked_accounts_updated_at ON public.linked_accounts;
CREATE TRIGGER update_linked_accounts_updated_at 
  BEFORE UPDATE ON public.linked_accounts
  FOR EACH ROW EXECUTE FUNCTION update_linked_accounts_updated_at();

DROP TRIGGER IF EXISTS trigger_subscriber_benefits_updated_at ON public.subscriber_benefits;
CREATE TRIGGER trigger_subscriber_benefits_updated_at
  BEFORE UPDATE ON public.subscriber_benefits
  FOR EACH ROW EXECUTE FUNCTION update_subscriber_benefits_updated_at();

-- RPC para incrementar o contador de cliques de um link curto
CREATE OR REPLACE FUNCTION public.increment_clicks(link_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.short_links
  SET clicks = clicks + 1
  WHERE id = link_id;
END;
$$;

-- Trigger para criar perfil automaticamente quando usuário é criado no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = excluded.email,
    updated_at = now();
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linked_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_timeouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_unlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriber_benefits ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES RLS
-- ============================================================================

-- Profiles Policies
CREATE POLICY "Users view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Service Role Profiles" 
  ON public.profiles FOR ALL TO service_role 
  USING (true) WITH CHECK (true);

-- Linked Accounts Policies
CREATE POLICY "Users view own linked" 
  ON public.linked_accounts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own linked" 
  ON public.linked_accounts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own linked" 
  ON public.linked_accounts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own linked" 
  ON public.linked_accounts FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Service Role Linked" 
  ON public.linked_accounts FOR ALL TO service_role 
  USING (true) WITH CHECK (true);

-- Moderation Policies
CREATE POLICY "Moderators view actions" 
  ON public.moderation_actions FOR SELECT 
  USING (
    auth.uid() = moderator_id OR 
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.linked_accounts 
      WHERE user_id = auth.uid() AND is_moderator = true
    )
  );

-- Active Timeouts Policies
CREATE POLICY "Moderators view timeouts" 
  ON public.active_timeouts FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.linked_accounts 
      WHERE user_id = auth.uid() AND is_moderator = true
    )
  );

-- Chat Messages Policies
CREATE POLICY "Public read chat" 
  ON public.chat_messages FOR SELECT 
  USING (true);

CREATE POLICY "Auth insert chat" 
  ON public.chat_messages FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Pending Unlinks Policies
CREATE POLICY "Users manage unlinks" 
  ON public.pending_unlinks FOR ALL 
  USING (auth.uid() = user_id);

-- Subscriber Benefits Policies
CREATE POLICY "Users can view own benefits"
  ON public.subscriber_benefits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage benefits"
  ON public.subscriber_benefits FOR ALL
  USING (true)
  WITH CHECK (true);

-- Short Links Policies
CREATE POLICY "Public read active short links"
  ON public.short_links FOR SELECT
  USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Service role can manage short links"
  ON public.short_links FOR ALL
  USING (true)
  WITH CHECK (true);

-- Short Link Clicks Policies
CREATE POLICY "Service role can manage short link clicks"
  ON public.short_link_clicks FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON COLUMN public.profiles.role IS 'Cargo do usuário: user, moderator, admin, streamer';
COMMENT ON COLUMN public.linked_accounts.authorized_scopes IS 'Escopos OAuth autorizados pelo usuário';
COMMENT ON COLUMN public.linked_accounts.needs_reauth IS 'Indica se o usuário precisa reautenticar para novos escopos';
COMMENT ON COLUMN public.linked_accounts.unlinked_at IS 'Data/hora em que a conta foi desvinculada. NULL = conta ativa';
COMMENT ON COLUMN public.linked_accounts.unlinked_by_user_id IS 'ID do usuário que desvinculou a conta';
COMMENT ON COLUMN public.short_links.token IS 'Código curto do link (estilo bit.ly)';
COMMENT ON COLUMN public.short_links.original_url IS 'URL de destino que o link curto redireciona';
COMMENT ON COLUMN public.short_link_clicks.device_type IS 'Tipo de dispositivo do clique: mobile, tablet ou desktop';
COMMENT ON COLUMN public.short_link_clicks.country IS 'País de origem do clique (via headers da Vercel)';
COMMENT ON COLUMN public.short_link_clicks.referrer IS 'URL de referência de onde o clique veio';

-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================

