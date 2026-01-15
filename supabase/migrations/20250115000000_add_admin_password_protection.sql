-- Tabela para armazenar configurações de segurança do admin
CREATE TABLE IF NOT EXISTS admin_security_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  last_password_change TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  failed_attempts INT DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_admin_user FOREIGN KEY (admin_user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela para auditoria de tentativas de acesso ao painel
CREATE TABLE IF NOT EXISTS admin_password_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  attempt_type VARCHAR(50) NOT NULL, -- 'success', 'failed', 'locked'
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_admin_user FOREIGN KEY (admin_user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_admin_security_config_user_id ON admin_security_config(admin_user_id);
CREATE INDEX idx_admin_password_audit_user_id ON admin_password_audit(admin_user_id);
CREATE INDEX idx_admin_password_audit_timestamp ON admin_password_audit(timestamp DESC);

-- RLS Policies
ALTER TABLE admin_security_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_password_audit ENABLE ROW LEVEL SECURITY;

-- Apenas o admin pode ver sua própria configuração de segurança
CREATE POLICY "admin_can_view_own_security_config" ON admin_security_config
  FOR SELECT
  USING (admin_user_id = auth.uid());

-- Apenas o admin pode atualizar sua própria configuração
CREATE POLICY "admin_can_update_own_security_config" ON admin_security_config
  FOR UPDATE
  USING (admin_user_id = auth.uid());

-- Apenas o admin pode ver seu próprio audit log
CREATE POLICY "admin_can_view_own_password_audit" ON admin_password_audit
  FOR SELECT
  USING (admin_user_id = auth.uid());

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_admin_security_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp
CREATE TRIGGER admin_security_config_updated_at
  BEFORE UPDATE ON admin_security_config
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_security_config_timestamp();

-- Comentários para documentação
COMMENT ON TABLE admin_security_config IS 'Armazena configurações de segurança do painel admin, incluindo hash da senha';
COMMENT ON TABLE admin_password_audit IS 'Auditoria de tentativas de acesso ao painel admin com proteção por senha';
COMMENT ON COLUMN admin_security_config.password_hash IS 'Hash bcrypt da senha (nunca armazenar senha em texto plano)';
COMMENT ON COLUMN admin_security_config.failed_attempts IS 'Contador de tentativas falhadas (reseta após sucesso)';
COMMENT ON COLUMN admin_security_config.locked_until IS 'Timestamp até quando a conta está bloqueada por tentativas excessivas';
