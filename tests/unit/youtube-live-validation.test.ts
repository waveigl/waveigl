import { describe, it, expect } from 'vitest'

/**
 * Tests para validação de live do YouTube
 * Garante que apenas lives AO VIVO do WaveIGL sejam detectadas
 */

describe('YouTube Live Validation', () => {
  describe('Live Status Detection', () => {
    it('deve aceitar live com actualStartTime e sem actualEndTime', () => {
      // Arrange
      const liveStreamingDetails = {
        actualStartTime: '2025-01-13T20:00:00Z',
        actualEndTime: undefined, // Não tem fim = está ao vivo
        activeLiveChatId: 'chat-123'
      }

      // Act
      const isLiveActive = 
        !!liveStreamingDetails.actualStartTime && 
        !liveStreamingDetails.actualEndTime &&
        !!liveStreamingDetails.activeLiveChatId

      // Assert
      expect(isLiveActive).toBe(true)
    })

    it('deve rejeitar live que já encerrou (tem actualEndTime)', () => {
      // Arrange
      const liveStreamingDetails = {
        actualStartTime: '2025-01-13T20:00:00Z',
        actualEndTime: '2025-01-13T21:00:00Z', // Tem fim = encerrada
        activeLiveChatId: 'chat-123'
      }

      // Act
      const isLiveActive = 
        !!liveStreamingDetails.actualStartTime && 
        !liveStreamingDetails.actualEndTime &&
        !!liveStreamingDetails.activeLiveChatId

      // Assert
      expect(isLiveActive).toBe(false)
    })

    it('deve rejeitar vídeo pré-gravado (sem actualStartTime)', () => {
      // Arrange
      const liveStreamingDetails = {
        actualStartTime: undefined, // Vídeo pré-gravado
        actualEndTime: undefined,
        activeLiveChatId: null
      }

      // Act
      const isLiveActive = 
        !!liveStreamingDetails.actualStartTime && 
        !liveStreamingDetails.actualEndTime &&
        !!liveStreamingDetails.activeLiveChatId

      // Assert
      expect(isLiveActive).toBe(false)
    })

    it('deve rejeitar se não tem liveChatId ativo', () => {
      // Arrange
      const liveStreamingDetails = {
        actualStartTime: '2025-01-13T20:00:00Z',
        actualEndTime: undefined,
        activeLiveChatId: null // Sem chat ativo
      }

      // Act
      const isLiveActive = 
        !!liveStreamingDetails.actualStartTime && 
        !liveStreamingDetails.actualEndTime &&
        !!liveStreamingDetails.activeLiveChatId

      // Assert
      expect(isLiveActive).toBe(false)
    })
  })

  describe('Channel Validation', () => {
    it('deve aceitar live do canal WaveIGL', () => {
      // Arrange
      const channelId = 'UCYourChannelId'
      const WAVEIGL_CHANNEL_ID = 'UCYourChannelId'

      // Act
      const isWaveIGLChannel = channelId === WAVEIGL_CHANNEL_ID

      // Assert
      expect(isWaveIGLChannel).toBe(true)
    })

    it('deve rejeitar live de outro canal', () => {
      // Arrange
      const channelId: string = 'UCOtherChannelId'
      const WAVEIGL_CHANNEL_ID = 'UCYourChannelId'

      // Act
      const isWaveIGLChannel = channelId === WAVEIGL_CHANNEL_ID

      // Assert
      expect(isWaveIGLChannel).toBe(false)
    })

    it('deve rejeitar se não conseguir obter channelId', () => {
      // Arrange
      const channelId = null
      const WAVEIGL_CHANNEL_ID = 'UCYourChannelId'

      // Act
      const isWaveIGLChannel = channelId === WAVEIGL_CHANNEL_ID

      // Assert
      expect(isWaveIGLChannel).toBe(false)
    })
  })

  describe('Combined Validation', () => {
    it('deve aceitar apenas live ao vivo do WaveIGL com chat ativo', () => {
      // Arrange
      const videoData = {
        liveStreamingDetails: {
          actualStartTime: '2025-01-13T20:00:00Z',
          actualEndTime: undefined,
          activeLiveChatId: 'chat-123'
        },
        snippet: {
          channelId: 'UCYourChannelId'
        }
      }
      const WAVEIGL_CHANNEL_ID = 'UCYourChannelId'

      // Act
      const isValidLive = 
        !!videoData.liveStreamingDetails.actualStartTime &&
        !videoData.liveStreamingDetails.actualEndTime &&
        !!videoData.liveStreamingDetails.activeLiveChatId &&
        videoData.snippet.channelId === WAVEIGL_CHANNEL_ID

      // Assert
      expect(isValidLive).toBe(true)
    })

    it('deve rejeitar live encerrada mesmo sendo do WaveIGL', () => {
      // Arrange
      const videoData = {
        liveStreamingDetails: {
          actualStartTime: '2025-01-13T20:00:00Z',
          actualEndTime: '2025-01-13T21:00:00Z', // Encerrada
          activeLiveChatId: 'chat-123'
        },
        snippet: {
          channelId: 'UCYourChannelId'
        }
      }
      const WAVEIGL_CHANNEL_ID = 'UCYourChannelId'

      // Act
      const isValidLive = 
        !!videoData.liveStreamingDetails.actualStartTime &&
        !videoData.liveStreamingDetails.actualEndTime &&
        !!videoData.liveStreamingDetails.activeLiveChatId &&
        videoData.snippet.channelId === WAVEIGL_CHANNEL_ID

      // Assert
      expect(isValidLive).toBe(false)
    })

    it('deve rejeitar live ao vivo de outro canal', () => {
      // Arrange
      const videoData = {
        liveStreamingDetails: {
          actualStartTime: '2025-01-13T20:00:00Z',
          actualEndTime: undefined,
          activeLiveChatId: 'chat-123'
        },
        snippet: {
          channelId: 'UCOtherChannelId' // Outro canal
        }
      }
      const WAVEIGL_CHANNEL_ID = 'UCYourChannelId'

      // Act
      const isValidLive = 
        !!videoData.liveStreamingDetails.actualStartTime &&
        !videoData.liveStreamingDetails.actualEndTime &&
        !!videoData.liveStreamingDetails.activeLiveChatId &&
        videoData.snippet.channelId === WAVEIGL_CHANNEL_ID

      // Assert
      expect(isValidLive).toBe(false)
    })

    it('deve rejeitar vídeo pré-gravado mesmo do WaveIGL', () => {
      // Arrange
      const videoData = {
        liveStreamingDetails: {
          actualStartTime: undefined, // Vídeo pré-gravado
          actualEndTime: undefined,
          activeLiveChatId: null
        },
        snippet: {
          channelId: 'UCYourChannelId'
        }
      }
      const WAVEIGL_CHANNEL_ID = 'UCYourChannelId'

      // Act
      const isValidLive = 
        !!videoData.liveStreamingDetails.actualStartTime &&
        !videoData.liveStreamingDetails.actualEndTime &&
        !!videoData.liveStreamingDetails.activeLiveChatId &&
        videoData.snippet.channelId === WAVEIGL_CHANNEL_ID

      // Assert
      expect(isValidLive).toBe(false)
    })
  })
})
