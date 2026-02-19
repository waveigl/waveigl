-- Tabela para armazenar sessões de streaming e contagem de viewers
CREATE TABLE IF NOT EXISTS public.streaming_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    view_count INTEGER NOT NULL,
    platform_breakdown JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_streaming_sessions_created_at ON public.streaming_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_streaming_sessions_view_count ON public.streaming_sessions(view_count);

-- Habilitar RLS
ALTER TABLE public.streaming_sessions ENABLE ROW LEVEL SECURITY;

-- Permissões
-- 1. Qualquer um pode ler a contagem atual
DROP POLICY IF EXISTS "Public read streaming_sessions" ON public.streaming_sessions;
CREATE POLICY "Public read streaming_sessions" ON public.streaming_sessions
    FOR SELECT USING (true);

-- 2. Service role tem acesso total
DROP POLICY IF EXISTS "Service role full access" ON public.streaming_sessions;
CREATE POLICY "Service role full access" ON public.streaming_sessions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Comentário para documentação
COMMENT ON TABLE public.streaming_sessions IS 'Armazena histórico de visualizações agregadas de múltiplas plataformas';
