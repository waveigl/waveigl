export type Platform = 'twitch' | 'youtube' | 'kick'

export type UserRole = 'owner' | 'admin' | 'moderator' | 'member'

export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'expired'

export type ModerationActionType = 'timeout' | 'ban' | 'unban'

export type TimeoutStatus = 'active' | 'completed'

export interface User {
  id: string
  email?: string
  subscription_status: SubscriptionStatus
  subscription_id?: string
  discord_synced: boolean
  created_at: string
  updated_at: string
}

export interface LinkedAccount {
  id: string
  user_id: string
  platform: Platform
  platform_user_id: string
  platform_username: string
  access_token?: string
  refresh_token?: string
  is_moderator: boolean
  created_at: string
}

export interface ModerationAction {
  id: string
  user_id: string
  moderator_id: string
  action_type: ModerationActionType
  duration_seconds?: number
  reason?: string
  expires_at?: string
  created_at: string
  platforms: Platform[]
}

export interface ActiveTimeout {
  id: string
  moderation_action_id: string
  user_id: string
  platform: Platform
  platform_user_id: string
  expires_at: string
  last_applied_at?: string
  status: TimeoutStatus
  created_at: string
}

export interface UnifiedMessage {
  id: string
  platform: Platform
  username: string
  userId: string
  message: string
  timestamp: number
  badges?: string[]
}

export interface ChatMessage {
  id: string
  platform: Platform
  username: string
  user_id: string
  message: string
  timestamp: string
  badges?: string[]
  created_at: string
}

export interface VideoPlayerProps {
  platform: Platform
  channelId?: string
  className?: string
}

export interface ModerationPanelProps {
  targetUserId: string
  targetUsername: string
  onAction: (action: ModerationActionType, duration?: number, reason?: string) => void
}

export interface PlatformSelectorProps {
  selectedPlatform: Platform
  onPlatformChange: (platform: Platform) => void
  availablePlatforms: Platform[]
}

export interface UnifiedChatProps {
  messages: UnifiedMessage[]
  onSendMessage: (message: string) => void
  isModerator: boolean
  onModerate: (userId: string, action: ModerationActionType, duration?: number, reason?: string) => void
}
