-- Consolidação de atualizações de moderação e sessões (2026-02-19)

-- 1. Atualização de Rastreamento de Moderação
ALTER TABLE public.moderation_actions 
ADD COLUMN IF NOT EXISTS target_user_id TEXT,
ADD COLUMN IF NOT EXISTS target_username TEXT,
ADD COLUMN IF NOT EXISTS platform TEXT;

CREATE INDEX IF NOT EXISTS idx_moderation_actions_target_platform ON public.moderation_actions(platform, target_user_id);

DROP POLICY IF EXISTS "Moderators view actions" ON public.moderation_actions;
CREATE POLICY "Moderators view actions" 
  ON public.moderation_actions FOR SELECT 
  USING (
    auth.uid() = moderator_id OR 
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.linked_accounts 
      WHERE user_id = auth.uid() AND (is_moderator = true OR platform_user_id IN ('173162545', '54454625'))
    )
  );

-- 2. Expiração de Tokens Kick
ALTER TABLE public.linked_accounts 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_linked_accounts_expires_at ON public.linked_accounts(expires_at) WHERE expires_at IS NOT NULL;

-- 3. Tabela de Sessões de Streaming
CREATE TABLE IF NOT EXISTS public.streaming_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    view_count INTEGER NOT NULL,
    platform_breakdown JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_streaming_sessions_created_at ON public.streaming_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_streaming_sessions_view_count ON public.streaming_sessions(view_count);

ALTER TABLE public.streaming_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read streaming_sessions" ON public.streaming_sessions;
CREATE POLICY "Public read streaming_sessions" ON public.streaming_sessions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role full access" ON public.streaming_sessions;
CREATE POLICY "Service role full access" ON public.streaming_sessions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.streaming_sessions IS 'Armazena histórico de visualizações agregadas de múltiplas plataformas';
