/**
 * Verificação de senha do painel admin no servidor
 * Implementa rate limiting e auditoria
 */

import { createClient } from '@supabase/supabase-js'
import { verifyPassword, getAccountLockStatus, calculateLockoutTime } from './password'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

interface VerifyPasswordResult {
  success: boolean
  message: string
  isLocked?: boolean
  remainingTime?: number
}

/**
 * Verifica a senha do painel admin
 * Implementa proteção contra força bruta
 */
export async function verifyAdminPassword(
  userId: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<VerifyPasswordResult> {
  try {
    // 1. Buscar configuração de segurança do admin
    const { data: securityConfig, error: configError } = await supabase
      .from('admin_security_config')
      .select('*')
      .eq('admin_user_id', userId)
      .single()

    if (configError || !securityConfig) {
      console.error('[AdminPassword] Erro ao buscar config:', configError)
      return {
        success: false,
        message: 'Configuração de segurança não encontrada'
      }
    }

    // 2. Verificar se a conta está bloqueada
    const lockStatus = getAccountLockStatus(
      securityConfig.failed_attempts,
      securityConfig.locked_until
    )

    if (lockStatus.isLocked) {
      // Registrar tentativa bloqueada
      await logPasswordAttempt(userId, 'locked', ipAddress, userAgent)

      return {
        success: false,
        message: lockStatus.message,
        isLocked: true,
        remainingTime: lockStatus.remainingTime
      }
    }

    // 3. Verificar a senha
    const isPasswordValid = await verifyPassword(password, securityConfig.password_hash)

    if (!isPasswordValid) {
      // Incrementar contador de tentativas falhadas
      const newFailedAttempts = securityConfig.failed_attempts + 1
      let updateData: any = {
        failed_attempts: newFailedAttempts
      }

      // Se atingiu o máximo de tentativas, bloquear a conta
      if (newFailedAttempts >= 5) {
        updateData.locked_until = calculateLockoutTime()
        console.warn('[AdminPassword] Conta bloqueada por tentativas excessivas:', {
          userId,
          attempts: newFailedAttempts
        })
      }

      await supabase
        .from('admin_security_config')
        .update(updateData)
        .eq('admin_user_id', userId)

      // Registrar tentativa falhada
      await logPasswordAttempt(userId, 'failed', ipAddress, userAgent)

      return {
        success: false,
        message: `Senha incorreta. Tentativas restantes: ${5 - newFailedAttempts}`
      }
    }

    // 4. Senha correta - resetar contador e desbloquear
    await supabase
      .from('admin_security_config')
      .update({
        failed_attempts: 0,
        locked_until: null
      })
      .eq('admin_user_id', userId)

    // Registrar tentativa bem-sucedida
    await logPasswordAttempt(userId, 'success', ipAddress, userAgent)

    console.log('[AdminPassword] Acesso ao painel concedido:', { userId })

    return {
      success: true,
      message: 'Acesso concedido'
    }
  } catch (error) {
    console.error('[AdminPassword] Erro ao verificar senha:', error)
    return {
      success: false,
      message: 'Erro ao processar solicitação'
    }
  }
}

/**
 * Registra tentativa de acesso no audit log
 */
async function logPasswordAttempt(
  userId: string,
  attemptType: 'success' | 'failed' | 'locked',
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await supabase.from('admin_password_audit').insert({
      admin_user_id: userId,
      attempt_type: attemptType,
      ip_address: ipAddress,
      user_agent: userAgent
    })
  } catch (error) {
    console.error('[AdminPassword] Erro ao registrar tentativa:', error)
  }
}

/**
 * Obtém o histórico de tentativas de acesso
 */
export async function getPasswordAuditLog(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('admin_password_audit')
      .select('*')
      .eq('admin_user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[AdminPassword] Erro ao buscar audit log:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[AdminPassword] Erro ao buscar audit log:', error)
    return []
  }
}

/**
 * Reseta o bloqueio de uma conta (para uso administrativo)
 */
export async function resetAccountLock(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('admin_security_config')
      .update({
        failed_attempts: 0,
        locked_until: null
      })
      .eq('admin_user_id', userId)

    if (error) {
      console.error('[AdminPassword] Erro ao resetar bloqueio:', error)
      return false
    }

    console.log('[AdminPassword] Bloqueio resetado:', { userId })
    return true
  } catch (error) {
    console.error('[AdminPassword] Erro ao resetar bloqueio:', error)
    return false
  }
}
