-- Migration to create streaming_sessions table
-- Created at: 2026-02-18

CREATE TABLE IF NOT EXISTS public.streaming_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  view_count INTEGER DEFAULT 0,
  platform_breakdown JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_streaming_sessions_created_at ON public.streaming_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_streaming_sessions_view_count ON public.streaming_sessions(view_count);

-- RLS (Row Level Security)
ALTER TABLE public.streaming_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for stats display)
DROP POLICY IF EXISTS "Public read streaming_sessions" ON public.streaming_sessions;
CREATE POLICY "Public read streaming_sessions" ON public.streaming_sessions FOR SELECT USING (true);

-- Full access for service role (backend operations)
DROP POLICY IF EXISTS "Service Role full access" ON public.streaming_sessions;
CREATE POLICY "Service Role full access" ON public.streaming_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
