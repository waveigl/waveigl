/**
 * Funções utilitárias para gerenciamento de benefícios de subscribers
 * Este arquivo contém funções de servidor (usam Supabase Admin)
 */

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { addMemberToServer } from '@/lib/discord/server'

// Re-exportar tipos e constantes do arquivo de constantes
export * from './constants'

// Importar tipos localmente para uso nas funções
import type { SubscriberBenefit, DiscordConnection } from './constants'
import { generateWhatsAppCode, calculateExpiryDate } from './constants'

/**
 * Cria ou atualiza um benefício de subscriber
 */
export async function createOrUpdateBenefit(
  userId: string,
  platform: 'twitch' | 'kick' | 'youtube',
  tier: string,
  isGift: boolean = false,
  gifterUsername?: string
): Promise<SubscriberBenefit | null> {
  const db = getSupabaseAdmin()
  
  const now = new Date()
  const expiresAt = calculateExpiryDate(now)
  
  // Verificar se já existe um benefício ativo para este usuário/plataforma
  const { data: existing } = await db
    .from('subscriber_benefits')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', platform)
    .gte('expires_at', now.toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  
  if (existing) {
    // Atualizar expiração (renovação)
    const newExpiry = new Date(existing.expires_at)
    newExpiry.setDate(newExpiry.getDate() + 31)
    
    const { data: updated, error } = await db
      .from('subscriber_benefits')
      .update({
        tier,
        expires_at: newExpiry.toISOString(),
        is_gift: isGift,
        gifter_username: gifterUsername || null
      })
      .eq('id', existing.id)
      .select()
      .single()
    
    if (error) {
      console.error('[Benefits] Erro ao atualizar benefício:', error)
      return null
    }
    
    return updated
  }
  
  // Criar novo benefício
  const { data: created, error } = await db
    .from('subscriber_benefits')
    .insert({
      user_id: userId,
      platform,
      tier,
      subscribed_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      is_gift: isGift,
      gifter_username: gifterUsername || null,
      onboarding_step: 0
    })
    .select()
    .single()
  
  if (error) {
    console.error('[Benefits] Erro ao criar benefício:', error)
    return null
  }
  
  // Se o usuário tem Discord vinculado, adicionar ao servidor automaticamente
  const { data: discordConn } = await db
    .from('discord_connections')
    .select('discord_id')
    .eq('user_id', userId)
    .maybeSingle()
  
  if (discordConn?.discord_id) {
    console.log(`[Benefits] Usuário tem Discord vinculado, adicionando ao servidor...`)
    const addResult = await addMemberToServer(discordConn.discord_id)
    
    if (addResult.success) {
      console.log(`[Benefits] ✅ Usuário ${userId} adicionado ao servidor Clube do WaveIGL`)
      // Marcar Discord como vinculado no benefício
      await db
        .from('subscriber_benefits')
        .update({ 
          discord_linked: true,
          discord_claimed_at: new Date().toISOString()
        })
        .eq('id', created.id)
    } else {
      console.warn(`[Benefits] ⚠️ Não foi possível adicionar ao servidor: ${addResult.error}`)
    }
  }
  
  return created
}

/**
 * Busca benefícios ativos de um usuário
 */
export async function getUserBenefits(userId: string): Promise<SubscriberBenefit[]> {
  const db = getSupabaseAdmin()
  
  const { data, error } = await db
    .from('subscriber_benefits')
    .select('*')
    .eq('user_id', userId)
    .gte('expires_at', new Date().toISOString())
    .order('subscribed_at', { ascending: false })
  
  if (error) {
    console.error('[Benefits] Erro ao buscar benefícios:', error)
    return []
  }
  
  return data || []
}

/**
 * Verifica se o usuário tem algum benefício ativo
 */
export async function hasActiveBenefit(userId: string): Promise<boolean> {
  const benefits = await getUserBenefits(userId)
  return benefits.length > 0
}

/**
 * Gera código WhatsApp para um benefício
 */
export async function generateAndSaveWhatsAppCode(benefitId: string): Promise<string | null> {
  const db = getSupabaseAdmin()
  
  // Gerar código único (com retry em caso de colisão)
  let attempts = 0
  while (attempts < 5) {
    const code = generateWhatsAppCode()
    
    const { data, error } = await db
      .from('subscriber_benefits')
      .update({
        whatsapp_code: code,
        whatsapp_claimed_at: new Date().toISOString()
      })
      .eq('id', benefitId)
      .select('whatsapp_code')
      .single()
    
    if (!error && data) {
      return data.whatsapp_code
    }
    
    // Se erro for de unique constraint, tentar novamente
    if (error?.code === '23505') {
      attempts++
      continue
    }
    
    console.error('[Benefits] Erro ao gerar código WhatsApp:', error)
    return null
  }
  
  return null
}

/**
 * Atualiza o passo do onboarding
 */
export async function updateOnboardingStep(
  benefitId: string,
  step: number
): Promise<boolean> {
  const db = getSupabaseAdmin()
  
  const { error } = await db
    .from('subscriber_benefits')
    .update({ onboarding_step: step })
    .eq('id', benefitId)
  
  if (error) {
    console.error('[Benefits] Erro ao atualizar onboarding step:', error)
    return false
  }
  
  return true
}

/**
 * Marca o onboarding como dispensado (lembrar depois)
 */
export async function dismissOnboarding(benefitId: string): Promise<boolean> {
  const db = getSupabaseAdmin()
  
  const { error } = await db
    .from('subscriber_benefits')
    .update({ onboarding_dismissed_at: new Date().toISOString() })
    .eq('id', benefitId)
  
  if (error) {
    console.error('[Benefits] Erro ao dispensar onboarding:', error)
    return false
  }
  
  return true
}

/**
 * Busca conexão Discord de um usuário
 */
export async function getDiscordConnection(userId: string): Promise<DiscordConnection | null> {
  const db = getSupabaseAdmin()
  
  const { data, error } = await db
    .from('discord_connections')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  
  if (error) {
    console.error('[Benefits] Erro ao buscar conexão Discord:', error)
    return null
  }
  
  return data
}
