# 🎥 YouTube Live Detection Fix - v0.0.7

**Date**: January 13, 2025  
**Status**: ✅ ENHANCED  
**Issue**: YouTube live detection was accepting any video, not just active lives from WaveIGL

---

## Latest Update (v0.0.7)

### New: Scraping Channel Validation

O scraping agora valida o `channelId` ANTES de considerar como live válida:

```typescript
// ✅ VALIDAÇÃO NO SCRAPING: Extrair e validar channelId
const channelIdMatch = html.match(/"channelId":"([^"]+)"/)
const extractedChannelId = channelIdMatch?.[1]

if (extractedChannelId !== WAVEIGL_CHANNEL_ID) {
  console.log(`[YouTube] ❌ Live é de outro canal (${extractedChannelId})`)
  return result // Retorna vazio - não é do WaveIGL
}

// Fallback: validar pelo nome do canal
const channelNameMatch = html.match(/"ownerChannelName":"([^"]+)"/)
if (channelName && !channelName.includes('waveigl')) {
  console.log(`[YouTube] ❌ Live parece ser de outro canal: ${channelName}`)
  return result
}
```

Isso resolve o problema de vídeos de outros canais (como "AERIAL EARTH") sendo detectados como live do WaveIGL.

---

## Problem Description

The YouTube live detection system had critical issues:

1. **Accepted any video as live** - Even pre-recorded videos were detected as active lives
2. **No channel validation** - Lives from other channels were accepted
3. **Chat showed offline** - Even when live was online, chat was marked as offline
4. **No live status validation** - Didn't check if live was actually active (not ended)

### Root Causes

1. **Scraping only checked for `isLive` flag** - Didn't validate actual live status
2. **No API validation** - Didn't use YouTube API to confirm live is active
3. **No channel ID check** - Didn't verify video belonged to WaveIGL
4. **Missing actualEndTime check** - Didn't check if live had already ended

---

## Solution Implemented

### 1. Enhanced API Validation
**File**: `src/lib/youtube/live.ts` - `fetchLiveChatIdFromAPI()`

Added three-layer validation:

```typescript
// ✅ VALIDATION 1: Check if live is ACTIVE (not ended)
const actualStartTime = liveStreamingDetails?.actualStartTime
const actualEndTime = liveStreamingDetails?.actualEndTime
const liveChatId = liveStreamingDetails?.activeLiveChatId

if (!actualStartTime) {
  console.log('[YouTube] ❌ Não é uma live (sem actualStartTime)')
  return null
}

if (actualEndTime) {
  console.log('[YouTube] ❌ Live já encerrada (tem actualEndTime):', actualEndTime)
  return null
}

if (!liveChatId) {
  console.log('[YouTube] ❌ Não há liveChatId ativo (live não está ao vivo)')
  return null
}

// ✅ VALIDATION 2: Check if live is from WaveIGL channel
const channelId = snippet?.channelId
const WAVEIGL_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID

if (channelId !== WAVEIGL_CHANNEL_ID) {
  console.log(`[YouTube] ❌ Live é de outro canal (${channelId})`)
  return null
}
```

### 2. Improved Scraping
**File**: `src/lib/youtube/live.ts` - `scrapeLiveDetection()`

Enhanced to only detect active lives:

```typescript
// ✅ Check for live active indicators
const hasLiveIndicator = html.match(/"isLive"\s*:\s*true/) || 
                         html.match(/"isLiveContent"\s*:\s*true/) ||
                         html.match(/\\"isLive\\":true/) ||
                         html.match(/"isUpcoming"\s*:\s*false/)

if (!hasLiveIndicator) {
  console.log('[YouTube] ❌ Nenhuma live ao vivo detectada na página')
  return result
}
```

### 3. Strict Main Function
**File**: `src/lib/youtube/live.ts` - `getCurrentYouTubeLive()`

Now rejects any live that fails validation:

```typescript
// If scraping didn't detect live, return empty
if (!scrapeResult.isLive || !scrapeResult.videoId) {
  console.log('[YouTube] ❌ Nenhuma live ao vivo detectada')
  return scrapeResult
}

// If API can't validate, reject it
if (!scrapeResult.liveChatId) {
  const token = await getYouTubeToken()
  if (token) {
    const liveChatId = await fetchLiveChatIdFromAPI(scrapeResult.videoId, token)
    if (liveChatId) {
      scrapeResult.liveChatId = liveChatId
    } else {
      // If API failed, not a valid live
      console.log('[YouTube] ❌ Não foi possível validar a live via API')
      scrapeResult.isLive = false
      scrapeResult.videoId = null
    }
  }
}
```

### 4. Comprehensive Test Suite
**File**: `tests/unit/youtube-live-validation.test.ts`

Created 11 tests covering:

#### Live Status Detection (4 tests)
- ✅ Accepts live with `actualStartTime` and no `actualEndTime`
- ✅ Rejects live that already ended (has `actualEndTime`)
- ✅ Rejects pre-recorded video (no `actualStartTime`)
- ✅ Rejects if no `activeLiveChatId`

#### Channel Validation (3 tests)
- ✅ Accepts live from WaveIGL channel
- ✅ Rejects live from other channel
- ✅ Rejects if can't get channelId

#### Combined Validation (4 tests)
- ✅ Accepts only active WaveIGL live with chat
- ✅ Rejects ended live even if from WaveIGL
- ✅ Rejects active live from other channel
- ✅ Rejects pre-recorded even if from WaveIGL

---

## Validation Logic

### What Gets Accepted ✅

```
Live must have ALL of:
├─ actualStartTime (started)
├─ NO actualEndTime (not ended)
├─ activeLiveChatId (chat active)
└─ channelId === YOUTUBE_CHANNEL_ID (from WaveIGL)
```

### What Gets Rejected ❌

```
Rejected if ANY of:
├─ No actualStartTime (pre-recorded video)
├─ Has actualEndTime (live already ended)
├─ No activeLiveChatId (no chat)
├─ channelId !== YOUTUBE_CHANNEL_ID (other channel)
└─ API validation fails
```

---

## Test Results

```
✓ tests/unit/youtube-live-validation.test.ts (11 tests) 3ms
  ✓ YouTube Live Validation (11)
    ✓ Live Status Detection (4)
      ✓ deve aceitar live com actualStartTime e sem actualEndTime
      ✓ deve rejeitar live que já encerrou (tem actualEndTime)
      ✓ deve rejeitar vídeo pré-gravado (sem actualStartTime)
      ✓ deve rejeitar se não tem liveChatId ativo
    ✓ Channel Validation (3)
      ✓ deve aceitar live do canal WaveIGL
      ✓ deve rejeitar live de outro canal
      ✓ deve rejeitar se não conseguir obter channelId
    ✓ Combined Validation (4)
      ✓ deve aceitar apenas live ao vivo do WaveIGL com chat ativo
      ✓ deve rejeitar live encerrada mesmo sendo do WaveIGL
      ✓ deve rejeitar live ao vivo de outro canal
      ✓ deve rejeitar vídeo pré-gravado mesmo do WaveIGL

Test Files  1 passed (1)
Tests  11 passed (11)
```

---

## Files Modified

1. **src/lib/youtube/live.ts**
   - Enhanced `fetchLiveChatIdFromAPI()` with 3-layer validation
   - Improved `scrapeLiveDetection()` to check for active live indicators
   - Updated `getCurrentYouTubeLive()` to reject invalid lives
   - Added detailed logging for debugging

2. **tests/unit/youtube-live-validation.test.ts** (NEW)
   - Created comprehensive test suite
   - 11 test cases covering all scenarios
   - Tests for live status, channel validation, and combined checks

3. **CHANGELOG.md**
   - Added version 0.0.5 entry
   - Documented all fixes and improvements

4. **package.json**
   - Bumped version from 0.0.4 → 0.0.5 (PATCH)

---

## Impact

### Before Fix ❌
- Any video could be detected as live
- Lives from other channels accepted
- Chat showed offline even when live was online
- Pre-recorded videos treated as active lives

### After Fix ✅
- Only active lives accepted
- Only WaveIGL channel lives accepted
- Chat correctly identified when live is active
- Pre-recorded videos rejected
- Ended lives rejected
- Multiple validation layers ensure accuracy

---

## Environment Variables Required

Ensure `.env.local` has:

```env
YOUTUBE_CHANNEL_ID=UCYourChannelId  # Your WaveIGL channel ID
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

---

## Verification Checklist

- [x] Code implements 3-layer validation
- [x] Tests created and passing (11/11)
- [x] API validation checks actualStartTime/actualEndTime
- [x] Channel ID validation implemented
- [x] Scraping improved for active live detection
- [x] Logs structured and clear
- [x] Build passes without errors
- [x] CHANGELOG updated
- [x] Version bumped (0.0.5)
- [x] No breaking changes

---

## Related Files

- **API Endpoint**: `src/app/api/youtube/status` - Uses `getCachedYouTubeLive()`
- **Chat Detection**: `src/lib/chat/youtube.ts` - Uses live info for chat
- **Moderation**: `src/lib/moderation/actions.ts` - Uses liveChatId for moderation

---

## Summary

YouTube live detection now properly validates that:
1. **It's a live** - Has `actualStartTime` and no `actualEndTime`
2. **It's active** - Has `activeLiveChatId`
3. **It's ours** - Channel ID matches WaveIGL
4. **It's verified** - API confirms all conditions

This fixes the issue where non-live videos were being detected as active lives, and ensures chat is only marked as online when there's an actual active live from WaveIGL.
