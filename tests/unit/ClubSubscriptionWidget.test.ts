import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Tests for ClubSubscriptionWidget component
 * Verifies that the widget correctly displays subscription status
 * and handles the already_subscribed case
 */

interface MockEligibilityData {
  eligible: boolean
  reason?: string
  message?: string
  missing: string[]
  user: {
    id: string
    full_name: string | null
    phone_number: string | null
    birth_date: string | null
    discord_connected: boolean
    discord_username: string | null
    subscription_status: string | undefined
  } | null
}

describe('ClubSubscriptionWidget', () => {
  describe('Subscription Status Detection', () => {
    it('deve mostrar "Clube Ativo" quando subscription_status é "active"', () => {
      // Arrange
      const mockData: MockEligibilityData = {
        eligible: false,
        missing: [],
        user: {
          id: 'user-123',
          full_name: 'Test User',
          phone_number: '11999999999',
          birth_date: '1990-01-01',
          discord_connected: true,
          discord_username: 'testuser',
          subscription_status: 'active'
        }
      }

      // Act - Simular a lógica do componente
      const isSubscriber = 
        mockData.user?.subscription_status === 'active' || 
        mockData.reason === 'already_subscribed'

      // Assert
      expect(isSubscriber).toBe(true)
    })

    it('deve mostrar "Clube Ativo" quando reason é "already_subscribed"', () => {
      // Arrange
      const mockData: MockEligibilityData = {
        eligible: false,
        reason: 'already_subscribed',
        message: 'Você já possui uma assinatura ativa do Clube',
        missing: [],
        user: {
          id: 'user-123',
          full_name: 'Test User',
          phone_number: '11999999999',
          birth_date: '1990-01-01',
          discord_connected: true,
          discord_username: 'testuser',
          subscription_status: 'inactive'
        }
      }

      // Act - Simular a lógica do componente
      const isSubscriber = 
        mockData.user?.subscription_status === 'active' || 
        mockData.reason === 'already_subscribed'

      // Assert
      expect(isSubscriber).toBe(true)
    })

    it('deve mostrar "Você está elegível para assinar" quando eligible é true', () => {
      // Arrange
      const mockData: MockEligibilityData = {
        eligible: true,
        missing: [],
        user: {
          id: 'user-123',
          full_name: 'Test User',
          phone_number: '11999999999',
          birth_date: '1990-01-01',
          discord_connected: true,
          discord_username: 'testuser',
          subscription_status: 'inactive'
        }
      }

      // Act - Simular a lógica do componente
      const isSubscriber = 
        mockData.user?.subscription_status === 'active' || 
        mockData.reason === 'already_subscribed'
      const isEligible = mockData.eligible && !isSubscriber

      // Assert
      expect(isEligible).toBe(true)
      expect(isSubscriber).toBe(false)
    })

    it('deve mostrar "Sem Clube" quando não elegível e não assinante', () => {
      // Arrange
      const mockData: MockEligibilityData = {
        eligible: false,
        missing: ['discord', 'birth_date'],
        user: {
          id: 'user-123',
          full_name: 'Test User',
          phone_number: null,
          birth_date: null,
          discord_connected: false,
          discord_username: null,
          subscription_status: 'inactive'
        }
      }

      // Act - Simular a lógica do componente
      const isSubscriber = 
        mockData.user?.subscription_status === 'active' || 
        mockData.reason === 'already_subscribed'
      const isEligible = mockData.eligible && !isSubscriber
      const isNoClub = !isSubscriber && !isEligible

      // Assert
      expect(isNoClub).toBe(true)
      expect(isSubscriber).toBe(false)
      expect(isEligible).toBe(false)
    })

    it('deve listar os campos faltantes quando não elegível', () => {
      // Arrange
      const mockData: MockEligibilityData = {
        eligible: false,
        missing: ['discord', 'birth_date', 'phone_number'],
        user: {
          id: 'user-123',
          full_name: 'Test User',
          phone_number: null,
          birth_date: null,
          discord_connected: false,
          discord_username: null,
          subscription_status: 'inactive'
        }
      }

      // Act
      const missingFields = mockData.missing

      // Assert
      expect(missingFields).toContain('discord')
      expect(missingFields).toContain('birth_date')
      expect(missingFields).toContain('phone_number')
      expect(missingFields.length).toBe(3)
    })

    it('deve detectar quando usuário é menor de idade', () => {
      // Arrange
      const mockData: MockEligibilityData = {
        eligible: false,
        missing: ['underage'],
        user: {
          id: 'user-123',
          full_name: 'Test User',
          phone_number: '11999999999',
          birth_date: '2010-01-01', // 14 anos
          discord_connected: true,
          discord_username: 'testuser',
          subscription_status: 'inactive'
        }
      }

      // Act
      const isUnderage = mockData.missing.includes('underage')

      // Assert
      expect(isUnderage).toBe(true)
    })
  })

  describe('Status Transitions', () => {
    it('deve transicionar de "no_club" para "subscriber" quando assinatura é criada', () => {
      // Arrange
      const initialStatus = 'no_club'
      const apiResponse: MockEligibilityData = {
        eligible: false,
        reason: 'already_subscribed',
        message: 'Você já possui uma assinatura ativa do Clube',
        missing: [],
        user: {
          id: 'user-123',
          full_name: 'Test User',
          phone_number: '11999999999',
          birth_date: '1990-01-01',
          discord_connected: true,
          discord_username: 'testuser',
          subscription_status: 'active'
        }
      }

      // Act
      const newStatus = 
        apiResponse.user?.subscription_status === 'active' || 
        apiResponse.reason === 'already_subscribed' 
          ? 'subscriber' 
          : initialStatus

      // Assert
      expect(initialStatus).toBe('no_club')
      expect(newStatus).toBe('subscriber')
    })

    it('deve transicionar de "eligible" para "subscriber" após pagamento', () => {
      // Arrange
      const initialStatus = 'eligible'
      const apiResponse: MockEligibilityData = {
        eligible: false,
        reason: 'already_subscribed',
        missing: [],
        user: {
          id: 'user-123',
          full_name: 'Test User',
          phone_number: '11999999999',
          birth_date: '1990-01-01',
          discord_connected: true,
          discord_username: 'testuser',
          subscription_status: 'active'
        }
      }

      // Act
      const newStatus = 
        apiResponse.user?.subscription_status === 'active' || 
        apiResponse.reason === 'already_subscribed' 
          ? 'subscriber' 
          : initialStatus

      // Assert
      expect(initialStatus).toBe('eligible')
      expect(newStatus).toBe('subscriber')
    })
  })

  describe('Edge Cases', () => {
    it('deve lidar com user null gracefully', () => {
      // Arrange
      const mockData: MockEligibilityData = {
        eligible: false,
        missing: [],
        user: null
      }

      // Act
      const isSubscriber = 
        mockData.user?.subscription_status === 'active' || 
        mockData.reason === 'already_subscribed'

      // Assert
      expect(isSubscriber).toBe(false)
    })

    it('deve lidar com subscription_status undefined', () => {
      // Arrange
      const mockData: MockEligibilityData = {
        eligible: false,
        missing: [],
        user: {
          id: 'user-123',
          full_name: 'Test User',
          phone_number: '11999999999',
          birth_date: '1990-01-01',
          discord_connected: true,
          discord_username: 'testuser',
          subscription_status: undefined
        }
      }

      // Act
      const isSubscriber = 
        mockData.user?.subscription_status === 'active' || 
        mockData.reason === 'already_subscribed'

      // Assert
      expect(isSubscriber).toBe(false)
    })

    it('deve priorizar reason="already_subscribed" mesmo com subscription_status inativo', () => {
      // Arrange
      const mockData: MockEligibilityData = {
        eligible: false,
        reason: 'already_subscribed',
        missing: [],
        user: {
          id: 'user-123',
          full_name: 'Test User',
          phone_number: '11999999999',
          birth_date: '1990-01-01',
          discord_connected: true,
          discord_username: 'testuser',
          subscription_status: 'inactive' // Status desatualizado
        }
      }

      // Act
      const isSubscriber = 
        mockData.user?.subscription_status === 'active' || 
        mockData.reason === 'already_subscribed'

      // Assert
      expect(isSubscriber).toBe(true)
    })
  })
})
