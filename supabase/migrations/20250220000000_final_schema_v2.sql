-- Migration consolidada final v2 (Profiles + Auth Triggers)
-- Substitui todas as migrations anteriores

-- Reset total (simula um db reset)
DROP TABLE IF EXISTS public.pending_unlinks CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.active_timeouts CASCADE;
DROP TABLE IF EXISTS public.moderation_actions CASCADE;
DROP TABLE IF EXISTS public.linked_accounts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE; -- Caso ainda exista

-- Habilita extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabela de Perfis (antiga users)
-- Esta tabela estende a auth.users. Não deve ser inserida manualmente via API pública.
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT,
  avatar_url TEXT,
  full_name TEXT,
  birth_date DATE,
  birth_date_edits INTEGER DEFAULT 0,
  last_profile_edit_at TIMESTAMPTZ,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired')),
  subscription_id TEXT,
  discord_synced BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Contas vinculadas
-- Constraints:
-- - unique_platform_user: Garante que a mesma conta de plataforma não pode ser vinculada a múltiplos usuários
-- - unique_user_platform_pair: Garante que um usuário só pode ter uma conta por plataforma
CREATE TABLE public.linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitch', 'youtube', 'kick')),
  platform_user_id TEXT NOT NULL,
  platform_username TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  is_moderator BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_platform_user UNIQUE(platform, platform_user_id),
  CONSTRAINT unique_user_platform_pair UNIQUE(user_id, platform)
);

-- 3. Moderação
CREATE TABLE public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  moderator_id UUID REFERENCES public.profiles(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('timeout', 'ban', 'unban')),
  duration_seconds INTEGER,
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  platforms TEXT[]
);

-- 4. Timeouts ativos
CREATE TABLE public.active_timeouts (
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

-- 5. Chat
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('twitch', 'youtube', 'kick')),
  username TEXT NOT NULL,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  badges TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Unlinks pendentes
CREATE TABLE public.pending_unlinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitch', 'youtube', 'kick')),
  linked_account_id UUID REFERENCES public.linked_accounts(id) ON DELETE SET NULL,
  effective_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'skipped')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_linked_accounts_user_id ON public.linked_accounts(user_id);
CREATE INDEX idx_active_timeouts_expires_at ON public.active_timeouts(expires_at);
CREATE INDEX idx_chat_messages_timestamp ON public.chat_messages(timestamp DESC);
CREATE INDEX idx_pending_unlinks_effective_at ON public.pending_unlinks(effective_at);

-- Trigger update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linked_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_timeouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_unlinks ENABLE ROW LEVEL SECURITY;

-- Policies Profiles
-- Leitura: Usuário vê o próprio perfil
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
-- Update: Usuário atualiza o próprio perfil
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- Insert: Permitir via Trigger (Security Definer) ou Service Role. 
-- Não permitimos insert direto de authenticated/anon.

-- Policies Linked Accounts
CREATE POLICY "Users view own linked" ON public.linked_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own linked" ON public.linked_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own linked" ON public.linked_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own linked" ON public.linked_accounts FOR DELETE USING (auth.uid() = user_id);

-- Policies Moderation
CREATE POLICY "Moderators view actions" ON public.moderation_actions FOR SELECT USING (
  auth.uid() = moderator_id OR auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.linked_accounts WHERE user_id = auth.uid() AND is_moderator = true
  )
);

-- Policies Active Timeouts
CREATE POLICY "Moderators view timeouts" ON public.active_timeouts FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.linked_accounts WHERE user_id = auth.uid() AND is_moderator = true
  )
);

-- Policies Chat
CREATE POLICY "Public read chat" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Auth insert chat" ON public.chat_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies Unlinks
CREATE POLICY "Users manage unlinks" ON public.pending_unlinks FOR ALL USING (auth.uid() = user_id);

-- Service Role Access (Opcional, pois service_role já tem bypass, mas explícito ajuda em alguns casos)
CREATE POLICY "Service Role Profiles" ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Linked" ON public.linked_accounts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- TRIGGER PARA AUTH.USERS
-- Cria automaticamente o perfil quando um usuário é criado no Auth
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

-- Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
