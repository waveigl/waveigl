import { getSupabaseAdmin } from '@/lib/supabase/server'
import type { DirectUserDiscount, DiscountFilters } from '@/types/discount.types'
import { notifyDiscord } from '@/lib/notifications/discord'

export class DirectUserDiscountService {
  static async createDiscount(data: {
    userId: string
    discountPrice: number
    createdBy: string
  }): Promise<DirectUserDiscount> {
    const now = new Date().toISOString()

    const { data: discount, error } = await getSupabaseAdmin()
      .from('direct_user_discounts')
      .insert({
        user_id: data.userId,
        discount_price: data.discountPrice,
        created_by: data.createdBy,
        created_at: now,
        updated_at: now,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    await notifyDiscord('direct_user_discount_created', { userId: data.userId, discountPrice: data.discountPrice })

    return this.mapFromDb(discount)
  }

  static async listDiscounts(filters?: DiscountFilters): Promise<DirectUserDiscount[]> {
    let query = getSupabaseAdmin()
      .from('direct_user_discounts')
      .select('*')
      .is('deleted_at', null)

    if (filters?.sortBy) {
      const columnMap: Record<string, string> = {
        created_date: 'created_at',
        expiration_date: 'created_at',
        remaining_redemptions: 'created_at',
        total_redeemed: 'created_at',
      }
      const column = columnMap[filters.sortBy] || 'created_at'
      query = query.order(column, { ascending: filters.sortOrder === 'asc' })
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map(this.mapFromDb)
  }

  static async getDiscount(id: string): Promise<DirectUserDiscount | null> {
    const { data, error } = await getSupabaseAdmin()
      .from('direct_user_discounts')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error || !data) {
      return null
    }

    return this.mapFromDb(data)
  }

  static async updateDiscount(id: string, data: {
    discountPrice?: number
    isActive?: boolean
    updatedBy: string
  }): Promise<DirectUserDiscount> {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
      updated_by: data.updatedBy,
    }

    if (data.discountPrice !== undefined) updateData.discount_price = data.discountPrice
    if (data.isActive !== undefined) updateData.is_active = data.isActive

    const { data: discount, error } = await getSupabaseAdmin()
      .from('direct_user_discounts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return this.mapFromDb(discount)
  }

  static async deleteDiscount(id: string, deletedBy: string): Promise<void> {
    const { error } = await getSupabaseAdmin()
      .from('direct_user_discounts')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        updated_by: deletedBy,
      })
      .eq('id', id)

    if (error) throw error

    await notifyDiscord('direct_user_discount_deleted', { id, deletedBy })
  }

  private static mapFromDb(row: any): DirectUserDiscount {
    return {
      id: row.id,
      userId: row.user_id,
      discountPrice: Number(row.discount_price),
      maxRedemptions: Number(row.max_redemptions ?? 1),
      currentRedemptions: Number(row.current_redemptions ?? 0),
      expirationDate: row.expiration_date || row.created_at,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isActive: row.is_active,
      status: row.status || 'active',
      deletedAt: row.deleted_at,
    }
  }
}