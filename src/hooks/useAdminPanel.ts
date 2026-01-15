/**
 * Hook para gerenciar o painel admin
 * Apenas Gabriel Toth pode usar
 * Requer verificação de senha
 */

import { useState, useEffect, useCallback } from 'react'
import { AdminPanelState, ModuleName, MessageType } from '@/types/admin.types'

export function useAdminPanel() {
  const [state, setState] = useState<AdminPanelState>({
    modules: {
      chat_twitch: true,
      chat_kick: true,
      chat_youtube: true,
      internal_messages: true,
      video_player: true
    },
    messages: {
      subscription: { enabled: true, groupEnabled: true },
      gift_subscription: { enabled: true, groupEnabled: true },
      raid: { enabled: true, groupEnabled: true },
      follow: { enabled: true, groupEnabled: true },
      cheer: { enabled: true, groupEnabled: true },
      host: { enabled: true, groupEnabled: true },
      system_message: { enabled: true, groupEnabled: true },
      internal_notification: { enabled: true, groupEnabled: true }
    },
    loading: true,
    error: null
  })

  const [isAdmin, setIsAdmin] = useState(false)
  const [adminInfo, setAdminInfo] = useState<any>(null)
  const [isPasswordVerified, setIsPasswordVerified] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // Verificar se é admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/admin/verify')
        const data = await response.json()
        
        setIsAdmin(data.isAdmin)
        if (data.isAdmin) {
          setAdminInfo(data)
          // Se é admin, mostrar modal de senha
          setShowPasswordModal(true)
        }
      } catch (error) {
        console.error('[useAdminPanel] Erro ao verificar admin:', error)
        setIsAdmin(false)
      }
    }

    checkAdmin()
  }, [])

  // Carregar módulos
  const loadModules = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const response = await fetch('/api/admin/modules')
      const data = await response.json()

      if (data.success) {
        setState(prev => ({
          ...prev,
          modules: data.modules,
          messages: data.messages,
          loading: false
        }))
      } else {
        setState(prev => ({
          ...prev,
          error: data.error || 'Erro ao carregar módulos',
          loading: false
        }))
      }
    } catch (error) {
      console.error('[useAdminPanel] Erro ao carregar módulos:', error)
      setState(prev => ({
        ...prev,
        error: 'Erro ao carregar módulos',
        loading: false
      }))
    }
  }, [])

  // Alternar módulo
  const toggleModule = useCallback(async (moduleName: ModuleName, isEnabled: boolean) => {
    try {
      setState(prev => ({ ...prev, loading: true }))

      const response = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_module',
          target: moduleName,
          value: isEnabled
        })
      })

      const data = await response.json()

      if (data.success) {
        setState(prev => ({
          ...prev,
          modules: data.modules,
          messages: data.messages,
          loading: false
        }))
      } else {
        setState(prev => ({
          ...prev,
          error: data.error || 'Erro ao alternar módulo',
          loading: false
        }))
      }
    } catch (error) {
      console.error('[useAdminPanel] Erro ao alternar módulo:', error)
      setState(prev => ({
        ...prev,
        error: 'Erro ao alternar módulo',
        loading: false
      }))
    }
  }, [])

  // Alternar mensagem
  const toggleMessage = useCallback(async (messageType: MessageType, isEnabled: boolean) => {
    try {
      setState(prev => ({ ...prev, loading: true }))

      const response = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_message',
          target: messageType,
          value: isEnabled
        })
      })

      const data = await response.json()

      if (data.success) {
        setState(prev => ({
          ...prev,
          modules: data.modules,
          messages: data.messages,
          loading: false
        }))
      } else {
        setState(prev => ({
          ...prev,
          error: data.error || 'Erro ao alternar mensagem',
          loading: false
        }))
      }
    } catch (error) {
      console.error('[useAdminPanel] Erro ao alternar mensagem:', error)
      setState(prev => ({
        ...prev,
        error: 'Erro ao alternar mensagem',
        loading: false
      }))
    }
  }, [])

  // Alternar grupo de mensagens
  const toggleMessageGroup = useCallback(async (isEnabled: boolean) => {
    try {
      setState(prev => ({ ...prev, loading: true }))

      const response = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_group',
          target: 'all_messages',
          value: isEnabled
        })
      })

      const data = await response.json()

      if (data.success) {
        setState(prev => ({
          ...prev,
          modules: data.modules,
          messages: data.messages,
          loading: false
        }))
      } else {
        setState(prev => ({
          ...prev,
          error: data.error || 'Erro ao alternar grupo',
          loading: false
        }))
      }
    } catch (error) {
      console.error('[useAdminPanel] Erro ao alternar grupo:', error)
      setState(prev => ({
        ...prev,
        error: 'Erro ao alternar grupo',
        loading: false
      }))
    }
  }, [])

  return {
    isAdmin,
    adminInfo,
    state,
    isPasswordVerified,
    showPasswordModal,
    setShowPasswordModal,
    setIsPasswordVerified,
    loadModules,
    toggleModule,
    toggleMessage,
    toggleMessageGroup
  }
}
