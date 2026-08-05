/**
 * Testes para funções de proteção por senha do painel admin
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  getAccountLockStatus,
  calculateLockoutTime,
  PASSWORD_CONFIG
} from '@/lib/admin/password'

describe('Admin Password Security', () => {
  describe('hashPassword', () => {
    it('deve gerar hash argon2 válido', async () => {
      const password = 'SecurePass123!@#'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(20) // Argon2 hash é longo
      expect(hash.startsWith('$argon2id$')).toBe(true) // Argon2id começa com $argon2id$
    })

    it('deve lançar erro se senha for muito curta', async () => {
      const password = 'Short1!'
      await expect(hashPassword(password)).rejects.toThrow('no mínimo 8 caracteres')
    })

    it('deve lançar erro se senha for vazia', async () => {
      await expect(hashPassword('')).rejects.toThrow()
    })

    it('deve gerar hashes diferentes para mesma senha', async () => {
      const password = 'SecurePass123!@#'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2) // Argon2 usa salt aleatório
    })
  })

  describe('verifyPassword', () => {
    it('deve verificar senha correta', async () => {
      const password = 'SecurePass123!@#'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(password, hash)

      expect(isValid).toBe(true)
    })

    it('deve rejeitar senha incorreta', async () => {
      const password = 'SecurePass123!@#'
      const wrongPassword = 'WrongPass123!@#'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(wrongPassword, hash)

      expect(isValid).toBe(false)
    })

    it('deve retornar false se senha for vazia', async () => {
      const hash = await hashPassword('SecurePass123!@#')
      const isValid = await verifyPassword('', hash)

      expect(isValid).toBe(false)
    })

    it('deve retornar false se hash for vazio', async () => {
      const isValid = await verifyPassword('SecurePass123!@#', '')

      expect(isValid).toBe(false)
    })

    it('deve ser case-sensitive', async () => {
      const password = 'SecurePass123!@#'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword('securepass123!@#', hash)

      expect(isValid).toBe(false)
    })
  })

  describe('validatePasswordStrength', () => {
    it('deve aceitar senha forte', () => {
      const result = validatePasswordStrength('SecurePass123!@#')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('deve rejeitar senha muito curta', () => {
      const result = validatePasswordStrength('Short1!')

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('m')
    })

    it('deve rejeitar senha sem maiúscula', () => {
      const result = validatePasswordStrength('securepass123!@#')

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('mai')
    })

    it('deve rejeitar senha sem minúscula', () => {
      const result = validatePasswordStrength('SECUREPASS123!@#')

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('min')
    })

    it('deve rejeitar senha sem número', () => {
      const result = validatePasswordStrength('SecurePass!@#')

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('n')
    })

    it('deve rejeitar senha sem caractere especial', () => {
      const result = validatePasswordStrength('SecurePass123')

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('especial')
    })

    it('deve rejeitar senha vazia', () => {
      const result = validatePasswordStrength('')

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('obrigat')
    })

    it('deve aceitar vários caracteres especiais', () => {
      const passwords = [
        'SecurePass123!',
        'SecurePass123@',
        'SecurePass123#',
        'SecurePass123$',
        'SecurePass123%',
        'SecurePass123^',
        'SecurePass123&',
        'SecurePass123*'
      ]

      passwords.forEach(password => {
        const result = validatePasswordStrength(password)
        expect(result.isValid).toBe(true)
      })
    })
  })

  describe('getAccountLockStatus', () => {
    it('deve retornar desbloqueado se não houver lockedUntil', () => {
      const status = getAccountLockStatus(3, null)

      expect(status.isLocked).toBe(false)
      expect(status.remainingTime).toBe(0)
      expect(status.message).toBe('')
    })

    it('deve retornar bloqueado se ainda estiver no período de bloqueio', () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutos no futuro
      const status = getAccountLockStatus(5, futureTime)

      expect(status.isLocked).toBe(true)
      expect(status.remainingTime).toBeGreaterThan(0)
      expect(status.message).toContain('bloqueada')
    })

    it('deve retornar desbloqueado se período de bloqueio expirou', () => {
      const pastTime = new Date(Date.now() - 1000).toISOString() // 1 segundo no passado
      const status = getAccountLockStatus(5, pastTime)

      expect(status.isLocked).toBe(false)
      expect(status.remainingTime).toBe(0)
    })

    it('deve calcular tempo restante corretamente', () => {
      const futureTime = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutos
      const status = getAccountLockStatus(5, futureTime)

      expect(status.remainingTime).toBeGreaterThan(4 * 60 * 1000) // Mais de 4 minutos
      expect(status.remainingTime).toBeLessThanOrEqual(5 * 60 * 1000) // Menos ou igual a 5 minutos
    })
  })

  describe('calculateLockoutTime', () => {
    it('deve retornar timestamp no futuro', () => {
      const lockoutTime = calculateLockoutTime()
      const lockoutDate = new Date(lockoutTime)
      const now = new Date()

      expect(lockoutDate.getTime()).toBeGreaterThan(now.getTime())
    })

    it('deve bloquear por 15 minutos', () => {
      const lockoutTime = calculateLockoutTime()
      const lockoutDate = new Date(lockoutTime)
      const now = new Date()
      const diffMs = lockoutDate.getTime() - now.getTime()
      const diffMinutes = diffMs / (60 * 1000)

      expect(diffMinutes).toBeGreaterThanOrEqual(14.9) // Aproximadamente 15 minutos
      expect(diffMinutes).toBeLessThanOrEqual(15.1)
    })

    it('deve retornar string ISO válida', () => {
      const lockoutTime = calculateLockoutTime()

      expect(typeof lockoutTime).toBe('string')
      expect(lockoutTime).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })
  })

  describe('PASSWORD_CONFIG', () => {
    it('deve ter configurações corretas', () => {
      expect(PASSWORD_CONFIG.MEMORY_COST).toBe(65536)
      expect(PASSWORD_CONFIG.TIME_COST).toBe(3)
      expect(PASSWORD_CONFIG.PARALLELISM).toBe(4)
      expect(PASSWORD_CONFIG.MAX_FAILED_ATTEMPTS).toBe(5)
      expect(PASSWORD_CONFIG.LOCKOUT_DURATION_MS).toBe(15 * 60 * 1000)
      expect(PASSWORD_CONFIG.MIN_LENGTH).toBe(8)
    })

    it('deve ter requisitos de senha definidos', () => {
      expect(PASSWORD_CONFIG.REQUIREMENTS.uppercase).toBe(true)
      expect(PASSWORD_CONFIG.REQUIREMENTS.lowercase).toBe(true)
      expect(PASSWORD_CONFIG.REQUIREMENTS.numbers).toBe(true)
      expect(PASSWORD_CONFIG.REQUIREMENTS.specialChars).toBe(true)
    })
  })

  describe('Integração', () => {
    it('deve funcionar fluxo completo: hash -> verify -> validate', async () => {
      const password = 'SecurePass123!@#'

      // 1. Validar força
      const validation = validatePasswordStrength(password)
      expect(validation.isValid).toBe(true)

      // 2. Gerar hash
      const hash = await hashPassword(password)
      expect(hash).toBeDefined()

      // 3. Verificar senha correta
      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)

      // 4. Verificar senha incorreta
      const isInvalid = await verifyPassword('WrongPass123!@#', hash)
      expect(isInvalid).toBe(false)
    })

    it('deve simular bloqueio por tentativas excessivas', () => {
      let failedAttempts = 0
      let lockedUntil: string | null = null

      // Simular 5 tentativas falhadas
      for (let i = 0; i < 5; i++) {
        failedAttempts++
        if (failedAttempts >= 5) {
          lockedUntil = calculateLockoutTime()
        }
      }

      // Verificar que está bloqueado
      const status = getAccountLockStatus(failedAttempts, lockedUntil)
      expect(status.isLocked).toBe(true)

      // Simular reset após sucesso
      failedAttempts = 0
      lockedUntil = null

      // Verificar que está desbloqueado
      const statusAfterReset = getAccountLockStatus(failedAttempts, lockedUntil)
      expect(statusAfterReset.isLocked).toBe(false)
    })
  })
})
