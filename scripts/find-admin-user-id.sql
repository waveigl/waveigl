-- Script para encontrar o User ID de Gabriel Toth
-- Execute no Supabase SQL Editor

-- Opção 1: Buscar por email
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users 
WHERE email = 'gabrieltothgoncalves@gmail.com'
LIMIT 1;

-- Opção 2: Buscar por contas vinculadas (Twitch)
SELECT DISTINCT
  u.id as user_id,
  u.email,
  la.platform,
  la.platform_username,
  la.platform_user_id
FROM auth.users u
JOIN linked_accounts la ON u.id = la.user_id
WHERE la.platform = 'twitch' 
  AND la.platform_username = 'ogabrieltoth'
LIMIT 1;

-- Opção 3: Buscar por contas vinculadas (Kick)
SELECT DISTINCT
  u.id as user_id,
  u.email,
  la.platform,
  la.platform_username,
  la.platform_user_id
FROM auth.users u
JOIN linked_accounts la ON u.id = la.user_id
WHERE la.platform = 'kick' 
  AND la.platform_username = 'ogabrieltoth'
LIMIT 1;
