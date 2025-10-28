-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela principal de usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired')),
  subscription_id TEXT,
  discord_synced BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contas vinculadas (Twitch, YouTube, Kick)
CREATE TABLE linked_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitch', 'youtube', 'kick')),
  platform_user_id TEXT NOT NULL,
  platform_username TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  is_moderator BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, platform_user_id)
);

-- Sistema de moderação
CREATE TABLE moderation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  moderator_id UUID REFERENCES users(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('timeout', 'ban', 'unban')),
  duration_seconds INTEGER, -- null para ban permanente
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  platforms TEXT[] -- ['twitch', 'youtube', 'kick']
);

-- Timeouts ativos (para reaplicação automática)
CREATE TABLE active_timeouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  moderation_action_id UUID REFERENCES moderation_actions(id),
  user_id UUID REFERENCES users(id),
  platform TEXT NOT NULL CHECK (platform IN ('twitch', 'youtube', 'kick')),
  platform_user_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_applied_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mensagens do chat unificado
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL CHECK (platform IN ('twitch', 'youtube', 'kick')),
  username TEXT NOT NULL,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  badges TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_linked_accounts_user_id ON linked_accounts(user_id);
CREATE INDEX idx_linked_accounts_platform_user_id ON linked_accounts(platform, platform_user_id);
CREATE INDEX idx_active_timeouts_expires_at ON active_timeouts(expires_at);
CREATE INDEX idx_active_timeouts_status ON active_timeouts(status);
CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp DESC);
CREATE INDEX idx_chat_messages_platform ON chat_messages(platform);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE linked_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_timeouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para contas vinculadas
CREATE POLICY "Users can view own linked accounts" ON linked_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own linked accounts" ON linked_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own linked accounts" ON linked_accounts
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para mensagens do chat (todos podem ler, apenas autenticados podem inserir)
CREATE POLICY "Anyone can read chat messages" ON chat_messages
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert chat messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Políticas para ações de moderação (apenas moderadores, admins e owner)
CREATE POLICY "Moderators can view moderation actions" ON moderation_actions
    FOR SELECT USING (
        auth.uid() = moderator_id OR 
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM linked_accounts 
            WHERE user_id = auth.uid() 
            AND is_moderator = true
        )
    );

CREATE POLICY "Moderators can insert moderation actions" ON moderation_actions
    FOR INSERT WITH CHECK (
        auth.uid() = moderator_id AND
        EXISTS (
            SELECT 1 FROM linked_accounts 
            WHERE user_id = auth.uid() 
            AND is_moderator = true
        )
    );

-- Políticas para timeouts ativos
CREATE POLICY "Moderators can view active timeouts" ON active_timeouts
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM linked_accounts 
            WHERE user_id = auth.uid() 
            AND is_moderator = true
        )
    );

CREATE POLICY "Moderators can manage active timeouts" ON active_timeouts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM linked_accounts 
            WHERE user_id = auth.uid() 
            AND is_moderator = true
        )
    );
