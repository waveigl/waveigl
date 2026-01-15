/**
 * Gerenciamento de módulos do admin
 * Controla quais módulos e mensagens estão ativas
 */

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { AdminModuleSetting, AdminMessageSetting, ModuleName, MessageType } from '@/types/admin.types'

// Cache global para evitar queries repetidas
declare global {
  // eslint-disable-next-line no-var
  var __adminModulesCache: {
    modules: Record<ModuleName, boolean>
    messages: Record<MessageType, { enabled: boolean; groupEnabled: boolean }>
    timestamp: number
  } | null
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

/**
 * Obtém todas as configurações de módulos
 */
export async function getModuleSettings(): Promise<AdminModuleSetting[]> {
  const db = getSupabaseAdmin()
  
  const { data, error } = await db
    .from('admin_module_settings')
    .select('*')
    .order('module_name')

  if (error) {
    console.error('[Admin] Erro ao buscar módulos:', error)
    return []
  }

  return data || []
}

/**
 * Obtém todas as configurações de mensagens
 */
export async function getMessageSettings(): Promise<AdminMessageSetting[]> {
  const db = getSupabaseAdmin()
  
  const { data, error } = await db
    .from('admin_message_settings')
    .select('*')
    .order('message_type')

  if (error) {
    console.error('[Admin] Erro ao buscar mensagens:', error)
    return []
  }

  return data || []
}

/**
 * Obtém estado em cache ou busca do banco
 */
export async function getCachedModuleState(): Promise<{
  modules: Record<ModuleName, boolean>
  messages: Record<MessageType, { enabled: boolean; groupEnabled: boolean }>
}> {
  const now = Date.now()
  
  // Usar cache se válido
  if (globalThis.__adminModulesCache && (now - globalThis.__adminModulesCache.timestamp) < CACHE_TTL) {
    return {
      modules: globalThis.__adminModulesCache.modules,
      messages: globalThis.__adminModulesCache.messages
    }
  }

  // Buscar do banco
  const [modules, messages] = await Promise.all([
    getModuleSettings(),
    getMessageSettings()
  ])

  // Construir objetos
  const modulesMap: Record<ModuleName, boolean> = {} as Record<ModuleName, boolean>
  const messagesMap: Record<MessageType, { enabled: boolean; groupEnabled: boolean }> = {} as Record<MessageType, { enabled: boolean; groupEnabled: boolean }>

  for (const module of modules) {
    modulesMap[module.module_name] = module.is_enabled
  }

  for (const message of messages) {
    messagesMap[message.message_type] = {
      enabled: message.is_enabled,
      groupEnabled: message.group_enabled
    }
  }

  // Atualizar cache
  globalThis.__adminModulesCache = {
    modules: modulesMap,
    messages: messagesMap,
    timestamp: now
  }

  return { modules: modulesMap, messages: messagesMap }
}

/**
 * Invalida o cache de módulos
 */
export function invalidateModuleCache(): void {
  globalThis.__adminModulesCache = null
}

/**
 * Verifica se um módulo está ativo
 */
export async function isModuleEnabled(moduleName: ModuleName): Promise<boolean> {
  const { modules } = await getCachedModuleState()
  return modules[moduleName] ?? true // Default: ativo
}

/**
 * Verifica se um tipo de mensagem está ativo
 */
export async function isMessageEnabled(messageType: MessageType): Promise<boolean> {
  const { messages } = await getCachedModuleState()
  const setting = messages[messageType]
  
  // Se o grupo está desabilitado, a mensagem está desabilitada
  if (!setting?.groupEnabled) {
    return false
  }
  
  // Caso contrário, verificar o status individual
  return setting?.enabled ?? true // Default: ativo
}

/**
 * Alterna um módulo
 */
export async function toggleModule(
  moduleName: ModuleName,
  isEnabled: boolean,
  adminUserId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getSupabaseAdmin()

    // Atualizar módulo
    const { error: updateError } = await db
      .from('admin_module_settings')
      .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
      .eq('module_name', moduleName)

    if (updateError) {
      console.error('[Admin] Erro ao atualizar módulo:', updateError)
      return { success: false, error: 'Erro ao atualizar módulo' }
    }

    // Registrar ação
    await db
      .from('admin_action_log')
      .insert({
        admin_user_id: adminUserId,
        action_type: 'module_toggle',
        target_name: moduleName,
        new_value: isEnabled,
        ip_address: ipAddress,
        user_agent: userAgent
      })

    // Invalidar cache
    invalidateModuleCache()

    console.log(`[Admin] Módulo ${moduleName} ${isEnabled ? 'ativado' : 'desativado'} por ${adminUserId}`)

    return { success: true }
  } catch (error) {
    console.error('[Admin] Erro ao alternar módulo:', error)
    return { success: false, error: 'Erro ao alternar módulo' }
  }
}

/**
 * Alterna uma mensagem individual
 */
export async function toggleMessage(
  messageType: MessageType,
  isEnabled: boolean,
  adminUserId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getSupabaseAdmin()

    // Buscar configuração atual
    const { data: current } = await db
      .from('admin_message_settings')
      .select('is_enabled, group_enabled')
      .eq('message_type', messageType)
      .single()

    // Atualizar mensagem
    const { error: updateError } = await db
      .from('admin_message_settings')
      .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
      .eq('message_type', messageType)

    if (updateError) {
      console.error('[Admin] Erro ao atualizar mensagem:', updateError)
      return { success: false, error: 'Erro ao atualizar mensagem' }
    }

    // Registrar ação
    await db
      .from('admin_action_log')
      .insert({
        admin_user_id: adminUserId,
        action_type: 'message_toggle',
        target_name: messageType,
        old_value: current?.is_enabled,
        new_value: isEnabled,
        ip_address: ipAddress,
        user_agent: userAgent
      })

    // Invalidar cache
    invalidateModuleCache()

    console.log(`[Admin] Mensagem ${messageType} ${isEnabled ? 'ativada' : 'desativada'} por ${adminUserId}`)

    return { success: true }
  } catch (error) {
    console.error('[Admin] Erro ao alternar mensagem:', error)
    return { success: false, error: 'Erro ao alternar mensagem' }
  }
}

/**
 * Alterna o grupo de mensagens (todas de uma vez)
 */
export async function toggleMessageGroup(
  isEnabled: boolean,
  adminUserId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getSupabaseAdmin()

    // Atualizar todas as mensagens
    const { error: updateError } = await db
      .from('admin_message_settings')
      .update({ group_enabled: isEnabled, updated_at: new Date().toISOString() })

    if (updateError) {
      console.error('[Admin] Erro ao atualizar grupo:', updateError)
      return { success: false, error: 'Erro ao atualizar grupo' }
    }

    // Registrar ação
    await db
      .from('admin_action_log')
      .insert({
        admin_user_id: adminUserId,
        action_type: 'group_toggle',
        target_name: 'all_messages',
        new_value: isEnabled,
        ip_address: ipAddress,
        user_agent: userAgent
      })

    // Invalidar cache
    invalidateModuleCache()

    console.log(`[Admin] Grupo de mensagens ${isEnabled ? 'ativado' : 'desativado'} por ${adminUserId}`)

    return { success: true }
  } catch (error) {
    console.error('[Admin] Erro ao alternar grupo:', error)
    return { success: false, error: 'Erro ao alternar grupo' }
  }
}

/**
 * Obtém o histórico de ações do admin
 */
export async function getAdminActionLog(limit: number = 50): Promise<any[]> {
  const db = getSupabaseAdmin()
  
  const { data, error } = await db
    .from('admin_action_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[Admin] Erro ao buscar log:', error)
    return []
  }

  return data || []
}
