-- ============================================================================
-- TABELAS DE ADMIN - Módulos e Mensagens
-- ============================================================================

-- 1. admin_module_settings
CREATE TABLE IF NOT EXISTS public.admin_module_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. admin_message_settings
CREATE TABLE IF NOT EXISTS public.admin_message_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_type TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT true,
  group_enabled BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. admin_action_log
CREATE TABLE IF NOT EXISTS public.admin_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES public.profiles(id),
  action_type TEXT NOT NULL,
  target_name TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. admin_security_config
CREATE TABLE IF NOT EXISTS public.admin_security_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES public.profiles(id) UNIQUE,
  password_hash TEXT NOT NULL,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. admin_password_audit
CREATE TABLE IF NOT EXISTS public.admin_password_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES public.profiles(id),
  attempt_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INSERÇÃO DE DADOS INICIAIS
-- ============================================================================

-- Módulos
INSERT INTO public.admin_module_settings (module_name, description) VALUES
  ('chat_twitch', 'Controle das mensagens vindas da Twitch'),
  ('chat_kick', 'Controle das mensagens vindas da Kick'),
  ('chat_youtube', 'Controle das mensagens vindas do YouTube'),
  ('internal_messages', 'Controle das notificações internas do sistema'),
  ('video_player', 'Habilita/Desabilita o player de vídeo no dashboard')
ON CONFLICT (module_name) DO NOTHING;

-- Mensagens
INSERT INTO public.admin_message_settings (message_type, description) VALUES
  ('subscription', 'Alertas de novas inscrições'),
  ('gift_subscription', 'Alertas de subs de presente'),
  ('raid', 'Alertas de raids de outros canais'),
  ('follow', 'Alertas de novos seguidores'),
  ('cheer', 'Alertas de bits/cheers'),
  ('host', 'Alertas de hosts'),
  ('system_message', 'Mensagens automáticas do sistema'),
  ('internal_notification', 'Notificações para moderadores e admins')
ON CONFLICT (message_type) DO NOTHING;

-- RLS
ALTER TABLE public.admin_module_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_message_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_action_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_security_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_password_audit ENABLE ROW LEVEL SECURITY;

-- Polícias (Admin Only - assumindo role 'admin' no profile)
CREATE POLICY "Admins manage module settings" ON public.admin_module_settings
  FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins manage message settings" ON public.admin_message_settings
  FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins manage security config" ON public.admin_security_config
  FOR ALL TO authenticated USING (auth.uid() = admin_user_id);
