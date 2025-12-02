-- Migration: Adicionar campos de quarentena para desvinculação
-- A conta desvinculada fica em quarentena por 7 dias

-- Adicionar campos na tabela linked_accounts
ALTER TABLE public.linked_accounts 
ADD COLUMN IF NOT EXISTS unlinked_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS unlinked_by_user_id UUID REFERENCES public.profiles(id) DEFAULT NULL;

-- Índice para buscar contas em quarentena
CREATE INDEX IF NOT EXISTS idx_linked_accounts_unlinked_at 
ON public.linked_accounts(unlinked_at) 
WHERE unlinked_at IS NOT NULL;

-- Comentários
COMMENT ON COLUMN public.linked_accounts.unlinked_at IS 'Data/hora em que a conta foi desvinculada. NULL = conta ativa';
COMMENT ON COLUMN public.linked_accounts.unlinked_by_user_id IS 'ID do usuário que desvinculou a conta';

