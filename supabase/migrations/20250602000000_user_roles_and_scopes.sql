-- Adicionar campo de role ao perfil do usuário
-- Roles: 'user', 'moderator', 'admin', 'streamer'
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'streamer'));

-- Adicionar campo de escopos autorizados nas contas vinculadas
-- Armazena os escopos que o usuário autorizou para comparação futura
ALTER TABLE public.linked_accounts
ADD COLUMN IF NOT EXISTS authorized_scopes TEXT[];

-- Adicionar campo para indicar se precisa de reautenticação
ALTER TABLE public.linked_accounts
ADD COLUMN IF NOT EXISTS needs_reauth BOOLEAN DEFAULT false;

-- Criar índice para busca rápida por role
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Criar índice para busca de contas que precisam reautenticação
CREATE INDEX IF NOT EXISTS idx_linked_accounts_needs_reauth ON public.linked_accounts(needs_reauth) WHERE needs_reauth = true;

-- Comentários
COMMENT ON COLUMN public.profiles.role IS 'Cargo do usuário: user, moderator, admin, streamer';
COMMENT ON COLUMN public.linked_accounts.authorized_scopes IS 'Escopos OAuth autorizados pelo usuário';
COMMENT ON COLUMN public.linked_accounts.needs_reauth IS 'Indica se o usuário precisa reautenticar para novos escopos';

