-- Adiciona campo de telefone no perfil
-- Pode ser alterado apenas 1 vez a cada 30 dias

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS last_phone_edit_at TIMESTAMPTZ;

-- Índice para busca por telefone (para futuras funcionalidades de WhatsApp)
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number) WHERE phone_number IS NOT NULL;

