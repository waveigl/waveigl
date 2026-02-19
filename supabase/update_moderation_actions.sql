-- Adicionar colunas para rastrear usuários que não estão no sistema
-- target_user_id: ID do usuário na plataforma (Twitch ID, Kick ID, etc)
-- target_username: Nome de exibição na plataforma
-- platform: twitch, kick ou youtube
ALTER TABLE public.moderation_actions 
ADD COLUMN IF NOT EXISTS target_user_id TEXT,
ADD COLUMN IF NOT EXISTS target_username TEXT,
ADD COLUMN IF NOT EXISTS platform TEXT;

-- Índice para busca rápida nestes campos
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target_platform ON public.moderation_actions(platform, target_user_id);

-- Atualizar pollocks para permitir que modders vejam ações sem user_id vinculado
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
