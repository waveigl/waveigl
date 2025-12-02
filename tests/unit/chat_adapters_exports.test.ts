import { describe, it, expect } from 'vitest'
import { startTwitchReader, sendTwitchMessage } from '@/lib/chat/twitch'
import { startYouTubeReader, sendYouTubeMessage } from '@/lib/chat/youtube'
import { startKickReader, sendKickMessage } from '@/lib/chat/kick'

describe('adapters exports', () => {
  it('twitch adapters exportam funções', () => {
    expect(typeof startTwitchReader).toBe('function')
    expect(typeof sendTwitchMessage).toBe('function')
  })
  it('youtube adapters exportam funções', () => {
    expect(typeof startYouTubeReader).toBe('function')
    expect(typeof sendYouTubeMessage).toBe('function')
  })
  it('kick adapters exportam funções', () => {
    expect(typeof startKickReader).toBe('function')
    expect(typeof sendKickMessage).toBe('function')
  })
})


