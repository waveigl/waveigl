/**
 * API Routes for Discount Links
 * POST /api/discounts/links - Generate discount link
 * GET /api/discounts/links - List all discount links
 * GET /api/discounts/links/:id - Get specific link
 * GET /api/discounts/links/validate/:token - Validate link token
 * DELETE /api/discounts/links/:id - Delete link
 */

import { NextRequest, NextResponse } from 'next/server'
import { DiscountLinkService } from '@/lib/discounts/discount-link.service'
import { DiscountValidator } from '@/lib/discounts/validator'
import { notifyDiscord } from '@/lib/notifications/discord'
import type { DiscountFilters } from '@/types/discount.types'

/**
 * POST /api/discounts/links
 * Generate a new discount link
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { discountPrice, maxRedemptions, expirationDate, description, createdBy } = body

    if (!discountPrice || !maxRedemptions || !expirationDate || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: discountPrice, maxRedemptions, expirationDate, createdBy' },
        { status: 400 }
      )
    }

    DiscountValidator.validatePrice(discountPrice)
    DiscountValidator.validateMaxRedemptions(maxRedemptions)
    DiscountValidator.validateExpirationDate(expirationDate)
    DiscountValidator.validateUUID(createdBy)
    if (description) DiscountValidator.validateDescription(description)

    const link = await DiscountLinkService.generateLink(
      {
        discountPrice,
        maxRedemptions,
        expirationDate,
        description,
      },
      createdBy
    )

    console.log('[DiscountLink] Generated:', { discountPrice, maxRedemptions, createdBy })

    return NextResponse.json({ success: true, data: link }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[DiscountLink] Error generating link:', message)

    await notifyDiscord({
      level: 'error',
      title: 'Discount Link Generation Failed',
      message,
      context: { endpoint: 'POST /api/discounts/links' },
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * GET /api/discounts/links
 * List all discount links with optional filters
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

    const links = await DiscountLinkService.listLinks(filters)

    console.log('[DiscountLink] Listed:', { count: links.length })

    return NextResponse.json({ success: true, data: links }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[DiscountLink] Error listing links:', message)

    await notifyDiscord({
      level: 'error',
      title: 'Discount Link Listing Failed',
      message,
      context: { endpoint: 'GET /api/discounts/links' },
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/discounts/links/:id
 * Delete a discount link (soft delete)
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

    await DiscountLinkService.deleteLink(id, deletedBy)

    console.log('[DiscountLink] Deleted:', { id })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[DiscountLink] Error deleting link:', message)

    await notifyDiscord({
      level: 'error',
      title: 'Discount Link Deletion Failed',
      message,
      context: { endpoint: 'DELETE /api/discounts/links/:id' },
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
