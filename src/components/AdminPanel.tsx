'use client'

import { FC, useState, useEffect } from 'react'
import { useAdminPanel } from '@/hooks/useAdminPanel'
import { AdminPasswordModal } from '@/components/AdminPasswordModal'
import { ModuleName, MessageType } from '@/types/admin.types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AdminPanelProps {
  onClose?: () => void
}

/**
 * Painel de administração - Apenas Gabriel Toth pode acessar
 * Requer verificação de senha para segurança adicional
 * Controla módulos de chat, mensagens e player de vídeo
 */
export const AdminPanel: FC<AdminPanelProps> = ({ onClose }) => {
  const {
    isAdmin,
    adminInfo,
    state,
    isPasswordVerified,
    showPasswordModal,
    setShowPasswordModal,
    setIsPasswordVerified,
    toggleModule,
    toggleMessage,
    toggleMessageGroup
  } = useAdminPanel()
  const [activeTab, setActiveTab] = useState<'modules' | 'messages' | 'logs'>('modules')
  const [logs, setLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  // Se não é admin, não renderizar nada
  if (!isAdmin) {
    return null
  }

  // Se não verificou a senha, mostrar modal
  if (!isPasswordVerified) {
    return (
      <AdminPasswordModal
        isOpen={showPasswordModal}
        onSuccess={() => {
          setIsPasswordVerified(true)
          setShowPasswordModal(false)
          // Carregar módulos após verificação de senha
          loadModules()
        }}
        onCancel={() => {
          setShowPasswordModal(false)
          onClose?.()
        }}
      />
    )
  }

  // Carregar logs quando mudar para aba de logs
  useEffect(() => {
    if (activeTab === 'logs' && logs.length === 0) {
      loadLogs()
    }
  }, [activeTab])

  const loadLogs = async () => {
    try {
      setLogsLoading(true)
      const response = await fetch('/api/admin/logs?limit=50')
      const data = await response.json()
      if (data.success) {
        setLogs(data.logs)
      }
    } catch (error) {
      console.error('[AdminPanel] Erro ao carregar logs:', error)
    } finally {
      setLogsLoading(false)
    }
  }

  const loadModules = async () => {
    try {
      const response = await fetch('/api/admin/modules')
      const data = await response.json()
      if (data.success) {
        // Módulos carregados via hook
      }
    } catch (error) {
      console.error('[AdminPanel] Erro ao carregar módulos:', error)
    }
  }

  const handleToggleModule = async (moduleName: ModuleName) => {
    const currentState = state.modules[moduleName]
    await toggleModule(moduleName, !currentState)
  }

  const handleToggleMessage = async (messageType: MessageType) => {
    const currentState = state.messages[messageType]?.enabled
    await toggleMessage(messageType, !currentState)
  }

  const handleToggleGroup = async () => {
    // Verificar se o grupo está ativo (todos os group_enabled são true)
    const allGroupEnabled = Object.values(state.messages).every(m => m.groupEnabled)
    await toggleMessageGroup(!allGroupEnabled)
  }

  const getModuleLabel = (moduleName: ModuleName): string => {
    const labels: Record<ModuleName, string> = {
      chat_twitch: '💜 Chat Twitch',
      chat_kick: '🟢 Chat Kick',
      chat_youtube: '🔴 Chat YouTube',
      internal_messages: '📨 Mensagens Internas',
      video_player: '▶️ Player de Vídeo'
    }
    return labels[moduleName]
  }

  const getMessageLabel = (messageType: MessageType): string => {
    const labels: Record<MessageType, string> = {
      subscription: '🎉 Inscrição',
      gift_subscription: '🎁 Gift Sub',
      raid: '🚀 Raid',
      follow: '👥 Follow',
      cheer: '💰 Cheer',
      host: '🏠 Host',
      system_message: '⚙️ Mensagem do Sistema',
      internal_notification: '🔔 Notificação Interna'
    }
    return labels[messageType]
  }

  const isGroupEnabled = Object.values(state.messages).every(m => m.groupEnabled)

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">🔧 Painel Admin</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {adminInfo?.email || 'Gabriel Toth'}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <button
          onClick={() => setActiveTab('modules')}
          className={`px-3 py-1 rounded text-sm font-medium transition ${
            activeTab === 'modules'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
          }`}
        >
          Módulos
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`px-3 py-1 rounded text-sm font-medium transition ${
            activeTab === 'messages'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
          }`}
        >
          Mensagens
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-1 rounded text-sm font-medium transition ${
            activeTab === 'logs'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
          }`}
        >
          Logs
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {state.loading && (
          <div className="flex items-center justify-center h-32">
            <div className="text-slate-500 dark:text-slate-400">Carregando...</div>
          </div>
        )}

        {state.error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 text-sm text-red-700 dark:text-red-400">
            {state.error}
          </div>
        )}

        {/* Módulos Tab */}
        {activeTab === 'modules' && !state.loading && (
          <div className="space-y-2">
            {Object.entries(state.modules).map(([moduleName, isEnabled]) => (
              <div
                key={moduleName}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
              >
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {getModuleLabel(moduleName as ModuleName)}
                </span>
                <button
                  onClick={() => handleToggleModule(moduleName as ModuleName)}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    isEnabled
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {isEnabled ? '✓ Ativo' : '✕ Inativo'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Mensagens Tab */}
        {activeTab === 'messages' && !state.loading && (
          <div className="space-y-3">
            {/* Botão de Grupo */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-blue-900 dark:text-blue-300">
                  📋 Grupo de Mensagens
                </span>
                <button
                  onClick={handleToggleGroup}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    isGroupEnabled
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {isGroupEnabled ? '✓ Ativo' : '✕ Inativo'}
                </button>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                {isGroupEnabled
                  ? 'Desative para bloquear TODAS as mensagens'
                  : 'Reative para permitir mensagens individuais'}
              </p>
            </div>

            {/* Mensagens Individuais */}
            <div className="space-y-2">
              {Object.entries(state.messages).map(([messageType, settings]) => (
                <div
                  key={messageType}
                  className={`p-3 rounded border transition ${
                    !isGroupEnabled
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 opacity-50'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {getMessageLabel(messageType as MessageType)}
                    </span>
                    <button
                      onClick={() => handleToggleMessage(messageType as MessageType)}
                      disabled={!isGroupEnabled}
                      className={`px-3 py-1 rounded text-xs font-medium transition ${
                        !isGroupEnabled
                          ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                          : settings.enabled
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                    >
                      {settings.enabled ? '✓' : '✕'}
                    </button>
                  </div>
                  {!isGroupEnabled && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Ative o grupo para modificar
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-2">
            {logsLoading && (
              <div className="flex items-center justify-center h-32">
                <div className="text-slate-500 dark:text-slate-400">Carregando logs...</div>
              </div>
            )}

            {!logsLoading && logs.length === 0 && (
              <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                Nenhuma ação registrada
              </div>
            )}

            {!logsLoading && logs.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logs.map(log => (
                  <div
                    key={log.id}
                    className="p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs">
                        {log.action_type}
                      </Badge>
                      <span className="text-slate-500 dark:text-slate-400">
                        {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300">
                      <strong>{log.target_name}</strong>
                      {' → '}
                      <span className={log.new_value ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {log.new_value ? 'Ativado' : 'Desativado'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
