-- Adicionar coluna para rastrear expiração do token de acesso
ALTER TABLE public.linked_accounts 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Índice para busca rápida de tokens expirados
CREATE INDEX IF NOT EXISTS idx_linked_accounts_expires_at ON public.linked_accounts(expires_at) WHERE expires_at IS NOT NULL;
