import { getSupabaseAdmin } from '@/lib/supabase/server'
import type { CouponCode, DiscountFilters } from '@/types/discount.types'
import { notifyDiscord } from '@/lib/notifications/discord'

export class CouponCodeService {
  static async createCoupon(data: {
    code: string
    discountPrice: number
    maxRedemptions: number
    expirationDate: string
    createdBy: string
  }): Promise<CouponCode> {
    const now = new Date().toISOString()

    const { data: coupon, error } = await getSupabaseAdmin()
      .from('coupon_codes')
      .insert({
        code: data.code.toUpperCase(),
        discount_price: data.discountPrice,
        max_redemptions: data.maxRedemptions,
        current_redemptions: 0,
        expiration_date: data.expirationDate,
        created_by: data.createdBy,
        created_at: now,
        updated_at: now,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    await notifyDiscord('coupon_created', { code: data.code, discountPrice: data.discountPrice })

    return this.mapFromDb(coupon)
  }

  static async listCoupons(filters?: DiscountFilters): Promise<CouponCode[]> {
    let query = getSupabaseAdmin()
      .from('coupon_codes')
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

  static async validateCode(code: string): Promise<{ isValid: boolean; discount?: CouponCode; error?: string }> {
    const { data: coupon, error } = await getSupabaseAdmin()
      .from('coupon_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .is('deleted_at', null)
      .single()

    if (error || !coupon) {
      return { isValid: false, error: 'Coupon not found' }
    }

    if (!coupon.is_active) {
      return { isValid: false, error: 'Coupon is inactive' }
    }

    if (coupon.current_redemptions >= coupon.max_redemptions) {
      return { isValid: false, error: 'Coupon has been exhausted' }
    }

    if (new Date(coupon.expiration_date) < new Date()) {
      return { isValid: false, error: 'Coupon has expired' }
    }

    return { isValid: true, discount: this.mapFromDb(coupon) }
  }

  static async updateCoupon(id: string, data: {
    discountPrice?: number
    maxRedemptions?: number
    expirationDate?: string
    isActive?: boolean
    updatedBy: string
  }): Promise<CouponCode> {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
      updated_by: data.updatedBy,
    }

    if (data.discountPrice !== undefined) updateData.discount_price = data.discountPrice
    if (data.maxRedemptions !== undefined) updateData.max_redemptions = data.maxRedemptions
    if (data.expirationDate !== undefined) updateData.expiration_date = data.expirationDate
    if (data.isActive !== undefined) updateData.is_active = data.isActive

    const { data: coupon, error } = await getSupabaseAdmin()
      .from('coupon_codes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return this.mapFromDb(coupon)
  }

  static async deleteCoupon(id: string, deletedBy: string): Promise<void> {
    const { error } = await getSupabaseAdmin()
      .from('coupon_codes')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        updated_by: deletedBy,
      })
      .eq('id', id)

    if (error) throw error

    await notifyDiscord('coupon_deleted', { id, deletedBy })
  }

  static async incrementRedemption(id: string): Promise<void> {
    const { error } = await getSupabaseAdmin()
      .rpc('increment_redemption', { coupon_id: id })

    if (error) throw error
  }

  private static mapFromDb(row: any): CouponCode {
    return {
      id: row.id,
      code: row.code,
      discountPrice: Number(row.discount_price),
      maxRedemptions: Number(row.max_redemptions),
      currentRedemptions: Number(row.current_redemptions),
      expirationDate: row.expiration_date,
      createdBy: row.created_by,
      createdAt: row.created_at,
      isActive: row.is_active,
      status: row.status || 'active',
      deletedAt: row.deleted_at,
    }
  }
}