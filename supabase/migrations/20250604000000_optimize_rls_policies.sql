-- Otimização de Policies RLS para evitar chamada repetida de auth.uid() por linha
-- Substitui auth.uid() por (select auth.uid()) que é executado uma vez por query (STABLE)

-- 1. Profiles
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING ((select auth.uid()) = id);

-- 2. Linked Accounts
DROP POLICY IF EXISTS "Users view own linked" ON public.linked_accounts;
CREATE POLICY "Users view own linked" ON public.linked_accounts FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users insert own linked" ON public.linked_accounts;
CREATE POLICY "Users insert own linked" ON public.linked_accounts FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users update own linked" ON public.linked_accounts;
CREATE POLICY "Users update own linked" ON public.linked_accounts FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users delete own linked" ON public.linked_accounts;
CREATE POLICY "Users delete own linked" ON public.linked_accounts FOR DELETE USING ((select auth.uid()) = user_id);

-- 3. Pending Unlinks
DROP POLICY IF EXISTS "Users manage unlinks" ON public.pending_unlinks;
CREATE POLICY "Users manage unlinks" ON public.pending_unlinks FOR ALL USING ((select auth.uid()) = user_id);
