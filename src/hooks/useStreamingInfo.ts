import { useState, useCallback } from 'react'
import { StreamingPlatform, StreamingInfoFormData } from '@/types/streaming.types'

interface UseStreamingInfoOptions {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function useStreamingInfo(options?: UseStreamingInfoOptions) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const updateStreamingInfo = useCallback(
    async (formData: StreamingInfoFormData) => {
      setIsLoading(true)
      setError(null)
      setSuccess(false)

      try {
        const res = await fetch('/api/streaming/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        const data = await res.json()

        if (!res.ok) {
          const errorMessage = data.error || 'Erro ao atualizar informações'
          setError(errorMessage)
          options?.onError?.(errorMessage)
          return { success: false, error: errorMessage }
        }

        setSuccess(true)
        options?.onSuccess?.()

        return {
          success: true,
          updated: data.updated,
          failed: data.failed,
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
        setError(errorMessage)
        options?.onError?.(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [options]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearSuccess = useCallback(() => {
    setSuccess(false)
  }, [])

  return {
    isLoading,
    error,
    success,
    updateStreamingInfo,
    clearError,
    clearSuccess,
  }
}
