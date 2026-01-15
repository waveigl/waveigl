-- ============================================================================
-- MIGRATION: Admin Modules Control System
-- ============================================================================
-- Adiciona tabelas para controlar módulos de chat e mensagens do admin

-- 1. ADMIN_MODULE_SETTINGS
-- Configurações globais de módulos (chat, mensagens internas, etc)
CREATE TABLE IF NOT EXISTS public.admin_module_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name TEXT NOT NULL UNIQUE CHECK (module_name IN (
    'chat_twitch',
    'chat_kick', 
    'chat_youtube',
    'internal_messages',
    'video_player'
  )),
  is_enabled BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ADMIN_MESSAGE_SETTINGS
-- Configurações individuais de cada tipo de mensagem
CREATE TABLE IF NOT EXISTS public.admin_message_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_type TEXT NOT NULL UNIQUE CHECK (message_type IN (
    'subscription',
    'gift_subscription',
    'raid',
    'follow',
    'cheer',
    'host',
    'system_message',
    'internal_notification'
  )),
  is_enabled BOOLEAN DEFAULT true,
  group_enabled BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ADMIN_ACTION_LOG
-- Auditoria de todas as ações do admin
CREATE TABLE IF NOT EXISTS public.admin_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.profiles(id),
  action_type TEXT NOT NULL CHECK (action_type IN (
    'module_toggle',
    'message_toggle',
    'group_toggle',
    'video_player_toggle',
    'chat_offline_toggle'
  )),
  target_name TEXT NOT NULL,
  old_value BOOLEAN,
  new_value BOOLEAN,
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_admin_action_log_admin_user_id ON public.admin_action_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_log_created_at ON public.admin_action_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_message_settings_group ON public.admin_message_settings(group_enabled);

-- RLS Policies
ALTER TABLE public.admin_module_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_message_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_action_log ENABLE ROW LEVEL SECURITY;

-- Apenas admin (Gabriel Toth) pode ler/modificar
CREATE POLICY "admin_module_settings_read" ON public.admin_module_settings
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.linked_accounts 
      WHERE platform_user_id IN ('129980106', '4053403') -- Admin IDs
    )
  );

CREATE POLICY "admin_module_settings_write" ON public.admin_module_settings
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.linked_accounts 
      WHERE platform_user_id IN ('129980106', '4053403') -- Admin IDs
    )
  );

CREATE POLICY "admin_message_settings_read" ON public.admin_message_settings
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.linked_accounts 
      WHERE platform_user_id IN ('129980106', '4053403') -- Admin IDs
    )
  );

CREATE POLICY "admin_message_settings_write" ON public.admin_message_settings
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.linked_accounts 
      WHERE platform_user_id IN ('129980106', '4053403') -- Admin IDs
    )
  );

CREATE POLICY "admin_action_log_read" ON public.admin_action_log
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.linked_accounts 
      WHERE platform_user_id IN ('129980106', '4053403') -- Admin IDs
    )
  );

CREATE POLICY "admin_action_log_write" ON public.admin_action_log
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.linked_accounts 
      WHERE platform_user_id IN ('129980106', '4053403') -- Admin IDs
    )
  );

-- Inserir configurações padrão
INSERT INTO public.admin_module_settings (module_name, is_enabled, description) VALUES
  ('chat_twitch', true, 'Chat da Twitch'),
  ('chat_kick', true, 'Chat do Kick'),
  ('chat_youtube', true, 'Chat do YouTube'),
  ('internal_messages', true, 'Mensagens internas do sistema'),
  ('video_player', true, 'Player de vídeo do site')
ON CONFLICT (module_name) DO NOTHING;

INSERT INTO public.admin_message_settings (message_type, is_enabled, group_enabled, description) VALUES
  ('subscription', true, true, 'Notificações de inscrição'),
  ('gift_subscription', true, true, 'Notificações de gift sub'),
  ('raid', true, true, 'Notificações de raid'),
  ('follow', true, true, 'Notificações de follow'),
  ('cheer', true, true, 'Notificações de cheer'),
  ('host', true, true, 'Notificações de host'),
  ('system_message', true, true, 'Mensagens do sistema'),
  ('internal_notification', true, true, 'Notificações internas')
ON CONFLICT (message_type) DO NOTHING;
