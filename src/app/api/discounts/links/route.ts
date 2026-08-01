import { NextRequest, NextResponse } from 'next/server'
import { getMockClient, isDevMode } from '@/lib/supabase/mock-db'
import type { DiscountLink, DiscountFilters } from '@/types/discount.types'

function mapFromDb(row: any): DiscountLink {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { discountPrice, maxRedemptions, expirationDate, description, createdBy } = body

    if (discountPrice === undefined || !maxRedemptions || !expirationDate || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (isDevMode()) {
      const supabase = getMockClient()
      const token = Array.from({ length: 64 }, () =>
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('')
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('discount_links')
        .insert({
          token,
          discount_price: discountPrice,
          max_redemptions: maxRedemptions,
          current_redemptions: 0,
          expiration_date: expirationDate,
          description: description || null,
          created_by: createdBy,
          created_at: now,
          updated_at: now,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, data: mapFromDb(data) }, { status: 201 })
    }

    return NextResponse.json(
      { success: false, error: 'POST not supported in production mode' },
      { status: 501 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sortBy') as any
    const sortOrder = searchParams.get('sortOrder') as any
    const status = searchParams.get('status') as any

    const filters: DiscountFilters = {
      sortBy,
      sortOrder,
      status: status || null,
    }

    if (isDevMode()) {
      const supabase = getMockClient()
      let query = supabase.from('discount_links').select('*').is('deleted_at', null)

      if (filters.sortBy) {
        const columnMap: Record<string, string> = {
          created_date: 'created_at',
          expiration_date: 'expiration_date',
          remaining_redemptions: 'max_redemptions',
          total_redeemed: 'current_redemptions',
        }
        const column = columnMap[filters.sortBy] || 'created_at'
        query = query.order(column, { ascending: filters.sortOrder === 'asc' })
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query

      if (error) throw error
      return NextResponse.json({ success: true, data: (data || []).map(mapFromDb) }, { status: 200 })
    }

    return NextResponse.json(
      { success: false, error: 'GET not supported in production mode' },
      { status: 501 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, deletedBy } = body

    if (!id || !deletedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (isDevMode()) {
      const supabase = getMockClient()
      const { error } = await supabase
        .from('discount_links')
        .update({
          deleted_at: new Date().toISOString(),
          is_active: false,
          updated_by: deletedBy,
        })
        .eq('id', id)

      if (error) throw error
      return NextResponse.json({ success: true }, { status: 200 })
    }

    return NextResponse.json(
      { success: false, error: 'DELETE not supported in production mode' },
      { status: 501 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}