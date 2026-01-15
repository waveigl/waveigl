/**
 * Tipos para o sistema de admin
 */

export type ModuleName = 
  | 'chat_twitch'
  | 'chat_kick'
  | 'chat_youtube'
  | 'internal_messages'
  | 'video_player'

export type MessageType =
  | 'subscription'
  | 'gift_subscription'
  | 'raid'
  | 'follow'
  | 'cheer'
  | 'host'
  | 'system_message'
  | 'internal_notification'

export type AdminActionType =
  | 'module_toggle'
  | 'message_toggle'
  | 'group_toggle'
  | 'video_player_toggle'
  | 'chat_offline_toggle'

export interface AdminModuleSetting {
  id: string
  module_name: ModuleName
  is_enabled: boolean
  description: string | null
  created_at: string
  updated_at: string
}

export interface AdminMessageSetting {
  id: string
  message_type: MessageType
  is_enabled: boolean
  group_enabled: boolean
  description: string | null
  created_at: string
  updated_at: string
}

export interface AdminActionLog {
  id: string
  admin_user_id: string
  action_type: AdminActionType
  target_name: string
  old_value: boolean | null
  new_value: boolean
  reason: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface AdminPanelState {
  modules: Record<ModuleName, boolean>
  messages: Record<MessageType, { enabled: boolean; groupEnabled: boolean }>
  loading: boolean
  error: string | null
}
