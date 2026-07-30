import { getSupabaseAdmin } from '@/lib/supabase/server'
import type { DiscountLink, DiscountFilters } from '@/types/discount.types'
import { notifyDiscord } from '@/lib/notifications/discord'

export class DiscountLinkService {
  static async generateLink(data: {
    discountPrice: number
    maxRedemptions: number
    expirationDate: string
    description?: string
    createdBy: string
  }): Promise<DiscountLink> {
    const token = this.generateToken()
    const now = new Date().toISOString()

    const { data: link, error } = await getSupabaseAdmin()
      .from('discount_links')
      .insert({
        token,
        discount_price: data.discountPrice,
        max_redemptions: data.maxRedemptions,
        current_redemptions: 0,
        expiration_date: data.expirationDate,
        description: data.description || null,
        created_by: data.createdBy,
        created_at: now,
        updated_at: now,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    await notifyDiscord('discount_link_created', { token, discountPrice: data.discountPrice })

    return this.mapFromDb(link)
  }

  static async listLinks(filters?: DiscountFilters): Promise<DiscountLink[]> {
    let query = getSupabaseAdmin()
      .from('discount_links')
      .select('*')
      .is('deleted_at', null)

    if (filters?.sortBy) {
      const columnMap: Record<string, string> = {
        created_date: 'created_at',
        expiration_date: 'expiration_date',
        remaining_redemptions: 'max_redemptions',
        total_redeemed: 'current_redemptions',
      }
      const column = columnMap[filters.sortBy] || 'created_at'
      query = query.order(column, { ascending: filters.sortOrder === 'asc' })
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map(this.mapFromDb)
  }

  static async validateToken(token: string): Promise<{ isValid: boolean; discount?: DiscountLink; error?: string }> {
    const { data: link, error } = await getSupabaseAdmin()
      .from('discount_links')
      .select('*')
      .eq('token', token)
      .is('deleted_at', null)
      .single()

    if (error || !link) {
      return { isValid: false, error: 'Link not found' }
    }

    if (!link.is_active) {
      return { isValid: false, error: 'Link is inactive' }
    }

    if (link.current_redemptions >= link.max_redemptions) {
      return { isValid: false, error: 'Link has been exhausted' }
    }

    if (new Date(link.expiration_date) < new Date()) {
      return { isValid: false, error: 'Link has expired' }
    }

    return { isValid: true, discount: this.mapFromDb(link) }
  }

  static async deleteLink(id: string, deletedBy: string): Promise<void> {
    const { error } = await getSupabaseAdmin()
      .from('discount_links')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        updated_by: deletedBy,
      })
      .eq('id', id)

    if (error) throw error

    await notifyDiscord('discount_link_deleted', { id, deletedBy })
  }

  static async incrementRedemption(id: string): Promise<void> {
    const { error } = await getSupabaseAdmin()
      .from('discount_links')
      .rpc('increment_redemption', { link_id: id })

    if (error) throw error
  }

  private static generateToken(): string {
    return Array.from({ length: 64 }, () =>
      '0123456789abcdef'[Math.floor(Math.random() * 16)]
    ).join('')
  }

  private static mapFromDb(row: any): DiscountLink {
    return {
      id: row.id,
      token: row.token,
      discountPrice: Number(row.discount_price),
      maxRedemptions: Number(row.max_redemptions),
      currentRedemptions: Number(row.current_redemptions),
      expirationDate: row.expiration_date,
      description: row.description,
      createdBy: row.created_by,
      createdAt: row.created_at,
      isActive: row.is_active,
      status: row.status || 'active',
      deletedAt: row.deleted_at,
    }
  }
}