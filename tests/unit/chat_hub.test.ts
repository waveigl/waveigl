import { describe, it, expect } from 'vitest'
import { chatHub } from '@/lib/chat/hub'

describe('chatHub', () => {
  it('publica eventos para assinantes', () => {
    const received: any[] = []
    const unsub = chatHub.subscribe((e) => received.push(e))
    chatHub.publish({ type: 'test', msg: 'hello' })
    unsub()
    expect(received).toHaveLength(1)
    expect(received[0]).toEqual({ type: 'test', msg: 'hello' })
  })
})


