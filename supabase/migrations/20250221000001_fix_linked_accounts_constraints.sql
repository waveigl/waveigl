-- Corrige as constraints da tabela linked_accounts
-- Esta migration garante que:
-- 1. A mesma conta de plataforma não pode ser vinculada a múltiplos usuários (unique_platform_user)
-- 2. Um usuário só pode ter uma conta por plataforma (unique_user_platform_pair)

-- Primeiro, remove constraints existentes (caso existam com nomes diferentes)
DO $$ 
BEGIN
    -- Remove constraint antiga se existir
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'linked_accounts_platform_platform_user_id_key'
    ) THEN
        ALTER TABLE public.linked_accounts 
        DROP CONSTRAINT linked_accounts_platform_platform_user_id_key;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'linked_accounts_user_id_platform_key'
    ) THEN
        ALTER TABLE public.linked_accounts 
        DROP CONSTRAINT linked_accounts_user_id_platform_key;
    END IF;
END $$;

-- Adiciona as constraints corretas (se não existirem)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_platform_user'
    ) THEN
        ALTER TABLE public.linked_accounts 
        ADD CONSTRAINT unique_platform_user UNIQUE(platform, platform_user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_user_platform_pair'
    ) THEN
        ALTER TABLE public.linked_accounts 
        ADD CONSTRAINT unique_user_platform_pair UNIQUE(user_id, platform);
    END IF;
END $$;

-- Adiciona coluna updated_at se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'linked_accounts' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.linked_accounts 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Cria trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_linked_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_linked_accounts_updated_at ON public.linked_accounts;
CREATE TRIGGER update_linked_accounts_updated_at 
    BEFORE UPDATE ON public.linked_accounts
    FOR EACH ROW EXECUTE FUNCTION update_linked_accounts_updated_at();

-- Atualiza RLS policies para garantir acesso correto via service_role
DROP POLICY IF EXISTS "Service Role Linked" ON public.linked_accounts;
CREATE POLICY "Service Role Linked" ON public.linked_accounts 
    FOR ALL TO service_role 
    USING (true) 
    WITH CHECK (true);

