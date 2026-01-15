import { describe, it, expect } from 'vitest'
import { detectMessageType } from '@/lib/admin/chat-filter'

describe('Chat Filter', () => {
  describe('detectMessageType', () => {
    it('deve detectar inscrição por badge', () => {
      const result = detectMessageType('Obrigado pela inscrição!', ['subscriber'])
      expect(result).toBe('subscription')
    })

    it('deve detectar gift sub por badge e conteúdo', () => {
      const result = detectMessageType('Recebi um gift sub!', ['subscriber', 'gift'])
      expect(result).toBe('gift_subscription')
    })

    it('deve detectar raid', () => {
      const result = detectMessageType('Raid incoming!', [])
      expect(result).toBe('raid')
    })

    it('deve detectar follow', () => {
      const result = detectMessageType('Novo follow!', [])
      expect(result).toBe('follow')
    })

    it('deve detectar cheer', () => {
      const result = detectMessageType('Enviou 100 bits!', [])
      expect(result).toBe('cheer')
    })

    it('deve detectar host', () => {
      const result = detectMessageType('Hospedando o canal', [])
      expect(result).toBe('host')
    })

    it('deve detectar mensagem do sistema', () => {
      const result = detectMessageType('[System] Evento importante', ['system'])
      expect(result).toBe('system_message')
    })

    it('deve retornar null para mensagem comum', () => {
      const result = detectMessageType('Oi pessoal!', [])
      expect(result).toBeNull()
    })

    it('deve ser case-insensitive', () => {
      const result = detectMessageType('RAID INCOMING!', [])
      expect(result).toBe('raid')
    })
  })
})
