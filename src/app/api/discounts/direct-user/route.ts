/**
 * API Routes for Direct User Discounts
 * POST /api/discounts/direct-user - Create direct user discount
 * GET /api/discounts/direct-user - List all direct user discounts
 * GET /api/discounts/direct-user/:id - Get specific discount
 * PUT /api/discounts/direct-user/:id - Update discount
 * DELETE /api/discounts/direct-user/:id - Delete discount
 */

import { NextRequest, NextResponse } from 'next/server'
import { DirectUserDiscountService } from '@/lib/discounts/direct-user-discount.service'
import { DiscountValidator } from '@/lib/discounts/validator'
import { notifyDiscord } from '@/lib/notifications/discord'
import type { DirectUserDiscount, DiscountFilters } from '@/types/discount.types'

/**
 * POST /api/discounts/direct-user
 * Create a new direct user discount
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { userId, discountPrice, createdBy } = body

    // Validate inputs
    if (!userId || !discountPrice || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, discountPrice, createdBy' },
        { status: 400 }
      )
    }

    DiscountValidator.validateUUID(userId)
    DiscountValidator.validatePrice(discountPrice)
    DiscountValidator.validateUUID(createdBy)

    // Create discount
    const discount = await DirectUserDiscountService.createDiscount(
      userId,
      discountPrice,
      createdBy
    )

    console.log('[DirectUserDiscount] Created:', { userId, discountPrice, createdBy })

    return NextResponse.json({ success: true, data: discount }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[DirectUserDiscount] Error creating discount:', message)

    await notifyDiscord({
      level: 'error',
      title: 'Direct User Discount Creation Failed',
      message,
      context: { endpoint: 'POST /api/discounts/direct-user' },
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * GET /api/discounts/direct-user
 * List all direct user discounts with optional filters
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sortBy') as 'created_date' | 'expiration_date' | undefined
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | undefined
    const status = searchParams.get('status') as 'active' | 'exhausted' | 'expired' | 'inactive' | undefined

    const filters: DiscountFilters = {
      sortBy,
      sortOrder,
      status,
    }

    const discounts = await DirectUserDiscountService.listDiscounts(filters)

    console.log('[DirectUserDiscount] Listed:', { count: discounts.length })

    return NextResponse.json({ success: true, data: discounts }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[DirectUserDiscount] Error listing discounts:', message)

    await notifyDiscord({
      level: 'error',
      title: 'Direct User Discount Listing Failed',
      message,
      context: { endpoint: 'GET /api/discounts/direct-user' },
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PUT /api/discounts/direct-user/:id
 * Update a direct user discount
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { id, discountPrice, updatedBy } = body

    if (!id || !discountPrice || !updatedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: id, discountPrice, updatedBy' },
        { status: 400 }
      )
    }

    DiscountValidator.validateUUID(id)
    DiscountValidator.validatePrice(discountPrice)
    DiscountValidator.validateUUID(updatedBy)

    const discount = await DirectUserDiscountService.updateDiscount(id, {
      discountPrice,
    }, updatedBy)

    console.log('[DirectUserDiscount] Updated:', { id, discountPrice })

    return NextResponse.json({ success: true, data: discount }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[DirectUserDiscount] Error updating discount:', message)

    await notifyDiscord({
      level: 'error',
      title: 'Direct User Discount Update Failed',
      message,
      context: { endpoint: 'PUT /api/discounts/direct-user/:id' },
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/discounts/direct-user/:id
 * Delete a direct user discount (soft delete)
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { id, deletedBy } = body

    if (!id || !deletedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: id, deletedBy' },
        { status: 400 }
      )
    }

    DiscountValidator.validateUUID(id)
    DiscountValidator.validateUUID(deletedBy)

    await DirectUserDiscountService.deleteDiscount(id, deletedBy)

    console.log('[DirectUserDiscount] Deleted:', { id })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[DirectUserDiscount] Error deleting discount:', message)

    await notifyDiscord({
      level: 'error',
      title: 'Direct User Discount Deletion Failed',
      message,
      context: { endpoint: 'DELETE /api/discounts/direct-user/:id' },
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
