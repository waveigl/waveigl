/**
 * Funções de proteção por senha do painel admin
 * Usa argon2 para hash seguro e implementa rate limiting
 */

import argon2 from 'argon2'

/**
 * Configurações de segurança de senha
 */
export const PASSWORD_CONFIG = {
  ARGON2_TYPE: 'argon2id',
  MEMORY_COST: 65536, // 64 MiB
  TIME_COST: 3,
  PARALLELISM: 4,
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutos
  MIN_LENGTH: 8,
  REQUIREMENTS: {
    uppercase: true,
    lowercase: true,
    numbers: true,
    specialChars: true,
  },
} as const

/**
 * Gera hash argon2 seguro da senha
 * @param password - Senha em texto plano
 * @returns Hash argon2 da senha
 * @throws Error se senha for inválida
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error('Senha é obrigatória')
  }

  if (password.length < PASSWORD_CONFIG.MIN_LENGTH) {
    throw new Error(`Senha deve ter no mínimo ${PASSWORD_CONFIG.MIN_LENGTH} caracteres`)
  }

  const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: PASSWORD_CONFIG.MEMORY_COST,
    timeCost: PASSWORD_CONFIG.TIME_COST,
    parallelism: PASSWORD_CONFIG.PARALLELISM,
  })
  return hash
}

/**
 * Verifica se a senha corresponde ao hash
 * @param password - Senha em texto plano
 * @param hash - Hash argon2 armazenado
 * @returns true se a senha está correta, false caso contrário
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false
  }

  try {
    const isValid = await argon2.verify(hash, password)
    return isValid
  } catch (error) {
    return false
  }
}

/**
 * Valida a força da senha
 * @param password - Senha a validar
 * @returns Objeto com isValid e lista de erros
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

  if (password.length < PASSWORD_CONFIG.MIN_LENGTH) {
    errors.push(`Senha deve ter no mínimo ${PASSWORD_CONFIG.MIN_LENGTH} caracteres`)
  }

  if (PASSWORD_CONFIG.REQUIREMENTS.uppercase && !/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula')
  }

  if (PASSWORD_CONFIG.REQUIREMENTS.lowercase && !/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula')
  }

  if (PASSWORD_CONFIG.REQUIREMENTS.numbers && !/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número')
  }

  if (PASSWORD_CONFIG.REQUIREMENTS.specialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial (!@#$%^&*)')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Calcula o tempo de bloqueio da conta (15 minutos no futuro)
 * @returns String ISO do timestamp de desbloqueio
 */
export function calculateLockoutTime(): string {
  const lockoutTime = new Date(Date.now() + PASSWORD_CONFIG.LOCKOUT_DURATION_MS)
  return lockoutTime.toISOString()
}

/**
 * Verifica o status de bloqueio da conta
 * @param failedAttempts - Número de tentativas falhadas
 * @param lockedUntil - Timestamp ISO até quando a conta está bloqueada
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
      message: '',
    }
  }

  const lockoutDate = new Date(lockedUntil)
  const now = new Date()
  const remainingTime = lockoutDate.getTime() - now.getTime()

  if (remainingTime <= 0) {
    return {
      isLocked: false,
      remainingTime: 0,
      message: '',
    }
  }

  const remainingMinutes = Math.ceil(remainingTime / (60 * 1000))

  return {
    isLocked: true,
    remainingTime,
    message: `Conta bloqueada por ${remainingMinutes} minuto(s) após ${failedAttempts} tentativas falhadas`,
  }
}
