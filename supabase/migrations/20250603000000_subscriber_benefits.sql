-- Tabela de benefícios do subscriber
CREATE TABLE IF NOT EXISTS subscriber_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitch', 'kick', 'youtube')),
  tier TEXT NOT NULL, -- Tier 1, Tier 2, Tier 3, Member
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Para controle de 31 dias
  
  -- Status dos benefícios
  whatsapp_code TEXT UNIQUE, -- Código único gerado (WAVE-XXXXXX)
  whatsapp_claimed_at TIMESTAMPTZ, -- Quando o código foi gerado
  whatsapp_joined_at TIMESTAMPTZ, -- Admin marca quando entrou no grupo
  discord_linked BOOLEAN DEFAULT FALSE,
  discord_claimed_at TIMESTAMPTZ, -- Quando verificou/vinculou discord
  
  -- Controle do popup de onboarding
  onboarding_step INTEGER DEFAULT 0, -- 0=não visto, 1=whatsapp, 2=discord, 3=completo
  onboarding_dismissed_at TIMESTAMPTZ, -- Se clicou em "lembrar depois"
  
  -- Tipo de assinatura
  is_gift BOOLEAN DEFAULT FALSE, -- Se foi um presente
  gifter_username TEXT, -- Quem deu o presente (se aplicável)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para vincular Discord (separada de linked_accounts pois não autentica)
CREATE TABLE IF NOT EXISTS discord_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  discord_id TEXT NOT NULL,
  discord_username TEXT NOT NULL,
  discord_discriminator TEXT, -- O #1234 antigo (pode ser null no novo sistema)
  discord_avatar TEXT, -- URL do avatar
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(discord_id)
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_subscriber_benefits_user ON subscriber_benefits(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriber_benefits_code ON subscriber_benefits(whatsapp_code);
CREATE INDEX IF NOT EXISTS idx_subscriber_benefits_platform ON subscriber_benefits(platform);
CREATE INDEX IF NOT EXISTS idx_subscriber_benefits_expires ON subscriber_benefits(expires_at);
CREATE INDEX IF NOT EXISTS idx_discord_connections_user ON discord_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_discord_connections_discord_id ON discord_connections(discord_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_subscriber_benefits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subscriber_benefits_updated_at
  BEFORE UPDATE ON subscriber_benefits
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriber_benefits_updated_at();

CREATE OR REPLACE FUNCTION update_discord_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_discord_connections_updated_at
  BEFORE UPDATE ON discord_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_discord_connections_updated_at();

-- Políticas RLS
ALTER TABLE subscriber_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_connections ENABLE ROW LEVEL SECURITY;

-- Permitir que usuários vejam seus próprios benefícios
CREATE POLICY "Users can view own benefits"
  ON subscriber_benefits FOR SELECT
  USING (auth.uid() = user_id);

-- Permitir que o sistema insira/atualize benefícios (via service role)
CREATE POLICY "Service role can manage benefits"
  ON subscriber_benefits FOR ALL
  USING (true)
  WITH CHECK (true);

-- Permitir que usuários vejam sua própria conexão Discord
CREATE POLICY "Users can view own discord connection"
  ON discord_connections FOR SELECT
  USING (auth.uid() = user_id);

-- Permitir que o sistema gerencie conexões Discord (via service role)
CREATE POLICY "Service role can manage discord connections"
  ON discord_connections FOR ALL
  USING (true)
  WITH CHECK (true);

