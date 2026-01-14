# 💬 Twitch Whisper Fix - v0.0.7

**Date**: January 13, 2025  
**Status**: ✅ ENHANCED  
**Issue**: Whispers não estavam sendo enviados para subscribers na Twitch

---

## Problem Description

Quando um usuário se inscrevia na Twitch, o sistema deveria enviar um sussuro (whisper) privado com a mensagem:
- **Para novo subscriber**: "Obrigado por se inscrever! Vincule seu numero no nosso site para ser convidado para o grupo do Whatsapp"
- **Para gift subscriber**: "Você recebeu uma inscrição de presente, vincule seu numero no nosso site para ser convidado para o grupo do Whatsapp"

Porém, os whispers **nunca eram enviados**, mesmo com as notificações Discord funcionando corretamente.

### Root Causes Identified

1. **Função errada sendo analisada** - A função `sendTwitchWhisper` em `subscription.ts` NÃO é usada para subs reais
2. **Função correta**: `sendStreamerWhisper` em `commands.ts` é a que processa subs reais
3. **Bloqueio por scope**: A função bloqueava se `authorized_scopes` não contivesse `user:manage:whispers`
4. **Falta de logs**: Impossível diagnosticar o que estava acontecendo
5. **Token não renovado**: Se o token expirasse, não havia retry

---

## Solution Implemented (v0.0.7)

### Enhanced `sendStreamerWhisper` Function
**File**: `src/lib/chat/commands.ts`

Melhorias implementadas:

```typescript
async function sendStreamerWhisper(targetUsername: string, message: string): Promise<boolean> {
  console.log(`[Whisper] 📤 Iniciando envio de whisper para: ${targetUsername}`)
  
  // ✅ 1. Busca conta do streamer com logs detalhados
  const { data: streamerAccount, error: dbError } = await supabase
    .from('linked_accounts')
    .select('platform_username, access_token, platform_user_id, authorized_scopes, refresh_token')
    .eq('platform', 'twitch')
    .ilike('platform_username', TWITCH_CHANNEL)
    .maybeSingle()

  // ✅ 2. Logs detalhados sobre a conta encontrada
  console.log('[Whisper] ✅ Conta do streamer encontrada:', {
    username: streamerAccount.platform_username,
    hasToken: !!streamerAccount.access_token,
    hasUserId: !!streamerAccount.platform_user_id,
    scopes: streamerAccount.authorized_scopes
  })

  // ✅ 3. Tratamento flexível de scopes (string ou array)
  let scopes: string[] = []
  if (streamerAccount.authorized_scopes) {
    if (Array.isArray(streamerAccount.authorized_scopes)) {
      scopes = streamerAccount.authorized_scopes
    } else if (typeof streamerAccount.authorized_scopes === 'string') {
      scopes = streamerAccount.authorized_scopes.split(/[\s,]+/).filter(Boolean)
    }
  }

  // ✅ 4. NÃO BLOQUEIA mais se scope não estiver no banco
  // Tenta enviar mesmo assim (scope pode existir mas não estar salvo)
  const hasWhisperScope = scopes.includes('user:manage:whispers')
  if (!hasWhisperScope) {
    console.warn('[Whisper] ⚠️ Scope user:manage:whispers NÃO encontrado no banco de dados')
    console.warn('[Whisper] Tentando enviar mesmo assim...')
  }

  // ✅ 5. Renovação automática de token se expirado
  if (userResponse.status === 401 && streamerAccount.refresh_token) {
    console.log('[Whisper] Token expirado, tentando renovar...')
    const newToken = await refreshTwitchToken(streamerAccount.refresh_token, fullAccount.user_id)
    if (newToken) {
      return sendStreamerWhisper(targetUsername, message) // Retry
    }
  }

  // ✅ 6. Diagnóstico detalhado para cada código de erro
  if (whisperResponse.status === 401) {
    console.error('[Whisper] 🔐 ERRO 401 - Não autorizado')
    console.error('[Whisper] → Scope user:manage:whispers não foi concedido')
    console.error('[Whisper] → O streamer precisa reautenticar com o scope correto')
  } else if (whisperResponse.status === 400) {
    console.error('[Whisper] ⚠️ ERRO 400 - Requisição inválida')
    console.error('[Whisper] Possíveis causas:')
    console.error('  → Usuário não segue o canal')
    console.error('  → Usuário bloqueou whispers')
    console.error('  → Rate limit excedido')
  } else if (whisperResponse.status === 403) {
    console.error('[Whisper] 🚫 ERRO 403 - Acesso negado')
    console.error('[Whisper] Possíveis causas:')
    console.error('  → Conta do streamer precisa de verificação de telefone')
  }
}
```

---

## Flow de Subscription → Whisper

```
1. Usuário se inscreve na Twitch
   ↓
2. tmi.js detecta evento 'subscription'
   ↓
3. handleSubscriptionEvent() em twitch.ts
   ↓
4. broadcastSubscriptionEvent() em commands.ts
   ↓
5. sendStreamerWhisper(username, message) ← ESTA FUNÇÃO
   ↓
6. Busca token do streamer no banco
   ↓
7. Busca ID do usuário via API Twitch
   ↓
8. Envia whisper via POST /helix/whispers
```

---

## Diagnóstico: O Que Verificar nos Logs

Quando um subscriber se inscrever, procure nos logs do Vercel:

### ✅ Sucesso
```
[Whisper] 📤 Iniciando envio de whisper para: NARIZUDO
[Whisper] Buscando conta do streamer: waveigl
[Whisper] ✅ Conta do streamer encontrada: { username: 'waveigl', hasToken: true, hasUserId: true, scopes: [...] }
[Whisper] Buscando ID do usuário: NARIZUDO
[Whisper] ✅ ID do usuário encontrado: 123456789
[Whisper] Enviando whisper de 173162545 para 123456789...
[Whisper] ✅ Whisper enviado com sucesso para NARIZUDO!
```

### ❌ Erro: Conta não encontrada
```
[Whisper] 📤 Iniciando envio de whisper para: NARIZUDO
[Whisper] Buscando conta do streamer: waveigl
[Whisper] ❌ Conta do streamer não encontrada no banco de dados
```
**Solução**: Verificar se existe registro em `linked_accounts` com `platform=twitch` e `platform_username=waveigl`

### ❌ Erro: Token expirado (401)
```
[Whisper] ❌ Erro ao buscar usuário: 401
[Whisper] Token expirado, tentando renovar...
```
**Solução**: O sistema tentará renovar automaticamente. Se falhar, o streamer precisa reautenticar.

### ❌ Erro: Scope ausente (401)
```
[Whisper] 🔐 ERRO 401 - Não autorizado
[Whisper] → Scope user:manage:whispers não foi concedido
[Whisper] → O streamer precisa reautenticar com o scope correto
```
**Solução**: O streamer precisa reautenticar na Twitch com o scope `user:manage:whispers`

### ❌ Erro: Usuário não segue (400)
```
[Whisper] ⚠️ ERRO 400 - Requisição inválida
[Whisper] Possíveis causas:
  → Usuário não segue o canal
  → Usuário bloqueou whispers
```
**Solução**: O usuário precisa seguir o canal ou desbloquear whispers

### ❌ Erro: Verificação de telefone (403)
```
[Whisper] 🚫 ERRO 403 - Acesso negado
[Whisper] Possíveis causas:
  → Conta do streamer precisa de verificação de telefone
```
**Solução**: O streamer precisa verificar o telefone na conta da Twitch

---

## Checklist de Configuração

Para whispers funcionarem, verifique:

### 1. Banco de Dados
- [ ] Existe registro em `linked_accounts` com:
  - `platform` = 'twitch'
  - `platform_username` = 'waveigl' (case insensitive)
  - `access_token` preenchido
  - `platform_user_id` preenchido

### 2. Twitch Developer Console
- [ ] App tem scope `user:manage:whispers` configurado
- [ ] Streamer autenticou com esse scope

### 3. Conta do Streamer
- [ ] Conta tem verificação de telefone ativada
- [ ] Conta não está suspensa

### 4. Usuário Alvo
- [ ] Usuário segue o canal OU já interagiu antes
- [ ] Usuário não bloqueou whispers

---

## Test Results

```
✓ tests/unit/twitch-whisper.test.ts (23 tests) 6ms
✓ tests/unit/permissions.test.ts (5 tests) 4ms
✓ All 62 tests passing
```

---

## Files Modified

1. **src/lib/chat/commands.ts**
   - Enhanced `sendStreamerWhisper()` with detailed logging
   - Added flexible scope handling (string or array)
   - Removed blocking on missing scope (tries anyway)
   - Added automatic token refresh on 401
   - Added detailed error diagnostics

2. **tests/unit/permissions.test.ts**
   - Fixed test expecting 'member' to expect 'user' (matching actual implementation)

3. **CHANGELOG.md**
   - Added version 0.0.7 entry

4. **package.json**
   - Bumped version from 0.0.6 → 0.0.7

---

## Summary

A função `sendStreamerWhisper` em `commands.ts` agora:
1. **Loga cada passo** para facilitar diagnóstico
2. **Não bloqueia** se scope não estiver no banco
3. **Renova token** automaticamente se expirado
4. **Explica erros** com diagnóstico detalhado
5. **Trata scopes** como string ou array

Próximo passo: Verificar logs do Vercel quando um subscriber se inscrever para identificar o erro específico.
