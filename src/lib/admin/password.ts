/**
 * Funções de segurança para proteção por senha do painel admin
 * Usa bcrypt para hash seguro da senha
 */

import bcrypt from 'bcrypt'

const SALT_ROUNDS = 12 // Rounds de bcrypt (mais seguro, mas mais lento)
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutos

/**
 * Gera hash bcrypt da senha
 * @param password - Senha em texto plano
 * @returns Hash bcrypt da senha
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Senha deve ter no mínimo 8 caracteres')
  }

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS)
    return hash
  } catch (error) {
    console.error('[AdminPassword] Erro ao gerar hash:', error)
    throw new Error('Erro ao processar senha')
  }
}

/**
 * Verifica se a senha corresponde ao hash
 * @param password - Senha em texto plano
 * @param hash - Hash bcrypt armazenado
 * @returns true se a senha está correta
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false
  }

  try {
    const isValid = await bcrypt.compare(password, hash)
    return isValid
  } catch (error) {
    console.error('[AdminPassword] Erro ao verificar senha:', error)
    return false
  }
}

/**
 * Valida força da senha
 * @param password - Senha a validar
 * @returns Objeto com validação e mensagens de erro
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!password) {
    errors.push('Senha é obrigatória')
    return { isValid: false, errors }
  }

  if (password.length < 8) {
    errors.push('Senha deve ter no mínimo 8 caracteres')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Senha deve conter pelo menos um número')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial (!@#$%^&*)')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Calcula se a conta está bloqueada por tentativas excessivas
 * @param failedAttempts - Número de tentativas falhadas
 * @param lockedUntil - Timestamp até quando está bloqueada
 * @returns Objeto com status de bloqueio
 */
export function getAccountLockStatus(
  failedAttempts: number,
  lockedUntil: string | null
): {
  isLocked: boolean
  remainingTime: number
  message: string
} {
  if (!lockedUntil) {
    return {
      isLocked: false,
      remainingTime: 0,
      message: ''
    }
  }

  const lockTime = new Date(lockedUntil).getTime()
  const now = Date.now()

  if (now < lockTime) {
    const remainingMs = lockTime - now
    const remainingMinutes = Math.ceil(remainingMs / 60000)

    return {
      isLocked: true,
      remainingTime: remainingMs,
      message: `Conta bloqueada. Tente novamente em ${remainingMinutes} minuto(s).`
    }
  }

  return {
    isLocked: false,
    remainingTime: 0,
    message: ''
  }
}

/**
 * Calcula o novo timestamp de bloqueio
 * @returns Timestamp para bloqueio de 15 minutos
 */
export function calculateLockoutTime(): string {
  const lockoutTime = new Date(Date.now() + LOCKOUT_DURATION_MS)
  return lockoutTime.toISOString()
}

export const PASSWORD_CONFIG = {
  SALT_ROUNDS,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  MIN_LENGTH: 8,
  REQUIREMENTS: {
    uppercase: true,
    lowercase: true,
    numbers: true,
    specialChars: true
  }
}
