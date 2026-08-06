import { describe, it, expect } from 'vitest'
import { parseUserAgent } from '@/lib/short-links/user-agent'

describe('parseUserAgent', () => {
  it('detects desktop + Windows + Chrome', () => {
    const parsed = parseUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
    )
    expect(parsed.deviceType).toBe('desktop')
    expect(parsed.os).toBe('Windows')
    expect(parsed.browser).toBe('Chrome')
  })

  it('detects mobile + iOS + Safari (iPhone)', () => {
    const parsed = parseUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Version/17.2 Mobile/15E148 Safari/604.1'
    )
    expect(parsed.deviceType).toBe('mobile')
    expect(parsed.os).toBe('iOS')
    expect(parsed.browser).toBe('Safari')
  })

  it('detects mobile + Android + Chrome', () => {
    const parsed = parseUserAgent(
      'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36'
    )
    expect(parsed.deviceType).toBe('mobile')
    expect(parsed.os).toBe('Android')
    expect(parsed.browser).toBe('Chrome')
  })

  it('detects tablet + iOS + Safari (iPad)', () => {
    const parsed = parseUserAgent(
      'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Version/17.2 Mobile/15E148 Safari/604.1'
    )
    expect(parsed.deviceType).toBe('tablet')
    expect(parsed.os).toBe('iOS')
    expect(parsed.browser).toBe('Safari')
  })

  it('detects macOS desktop (Mac)', () => {
    const parsed = parseUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.4 Safari/605.1.15'
    )
    expect(parsed.deviceType).toBe('desktop')
    expect(parsed.os).toBe('macOS')
    expect(parsed.browser).toBe('Safari')
  })

  it('detects Edge correctly (Edge contains Chrome)', () => {
    const parsed = parseUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 Edg/126.0'
    )
    expect(parsed.browser).toBe('Edge')
  })

  it('detects Firefox', () => {
    const parsed = parseUserAgent(
      'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0'
    )
    expect(parsed.deviceType).toBe('desktop')
    expect(parsed.os).toBe('Linux')
    expect(parsed.browser).toBe('Firefox')
  })

  it('handles unknown user agent gracefully', () => {
    const parsed = parseUserAgent('')
    expect(parsed.deviceType).toBe('desktop')
    expect(parsed.os).toBe('Desconhecido')
    expect(parsed.browser).toBe('Desconhecido')
  })
})
