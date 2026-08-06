import { getSupabaseAdmin } from '@/lib/supabase/server'
import type { ShortLink, ShortLinkClick, ShortLinkStats } from '@/types/short-link.types'
import { notifyDiscord } from '@/lib/notifications/discord'

const TOKEN_LENGTH = 8
const TOKEN_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

export const SHORT_LINK_DUPLICATE_URL = 'SHORT_LINK_DUPLICATE_URL'

export class ShortLinkService {
  static async createLink(data: {
    originalUrl: string
    description?: string
    createdBy: string
  }): Promise<ShortLink> {
    await this.ensureOriginalUrlUnique(data.originalUrl)

    const token = this.generateToken()
    const now = new Date().toISOString()

    const { data: link, error } = await getSupabaseAdmin()
      .from('short_links')
      .insert({
        token,
        original_url: data.originalUrl,
        description: data.description || null,
        clicks: 0,
        created_by: data.createdBy,
        created_at: now,
        updated_at: now,
        updated_by: data.createdBy,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    await notifyDiscord('short_link_created', { token, originalUrl: data.originalUrl })

    return this.mapFromDb(link)
  }

  static async listLinks(): Promise<ShortLink[]> {
    const { data, error } = await getSupabaseAdmin()
      .from('short_links')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map(this.mapFromDb)
  }

  static async getLinkByToken(token: string): Promise<ShortLink | null> {
    const { data: link, error } = await getSupabaseAdmin()
      .from('short_links')
      .select('*')
      .eq('token', token)
      .is('deleted_at', null)
      .single()

    if (error || !link || !link.is_active) {
      return null
    }

    return this.mapFromDb(link)
  }

  static async updateLink(
    id: string,
    data: {
      originalUrl?: string
      description?: string | null
      updatedBy: string
    }
  ): Promise<ShortLink> {
    if (data.originalUrl !== undefined) {
      await this.ensureOriginalUrlUnique(data.originalUrl, id)
    }

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: data.updatedBy,
    }
    if (data.originalUrl !== undefined) patch.original_url = data.originalUrl
    if (data.description !== undefined) patch.description = data.description

    const { data: link, error } = await getSupabaseAdmin()
      .from('short_links')
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await notifyDiscord('short_link_updated', { id, originalUrl: data.originalUrl, description: data.description })

    return this.mapFromDb(link)
  }

  static async deleteLink(id: string, deletedBy: string): Promise<void> {
    const { error } = await getSupabaseAdmin()
      .from('short_links')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        updated_by: deletedBy,
      })
      .eq('id', id)

    if (error) throw error

    await notifyDiscord('short_link_deleted', { id, deletedBy })
  }

  static async incrementClicks(id: string): Promise<void> {
    const { error } = await getSupabaseAdmin()
      .rpc('increment_clicks', { link_id: id })

    if (error) throw error
  }

  static async recordClick(
    linkId: string,
    meta: {
      ip?: string | null
      userAgent?: string | null
      referrer?: string | null
      deviceType?: string | null
      os?: string | null
      browser?: string | null
      country?: string | null
      region?: string | null
      city?: string | null
      utmSource?: string | null
    }
  ): Promise<void> {
    const { error } = await getSupabaseAdmin()
      .from('short_link_clicks')
      .insert({
        link_id: linkId,
        ip: meta.ip || null,
        user_agent: meta.userAgent || null,
        referrer: meta.referrer || null,
        device_type: meta.deviceType || null,
        os: meta.os || null,
        browser: meta.browser || null,
        country: meta.country || null,
        region: meta.region || null,
        city: meta.city || null,
        utm_source: meta.utmSource || null,
        created_at: new Date().toISOString(),
      })

    if (error) throw error
  }

  static async getLinkStats(linkId: string): Promise<ShortLinkStats> {
    const { data, error } = await getSupabaseAdmin()
      .from('short_link_clicks')
      .select('*')
      .eq('link_id', linkId)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) throw error

    const rows: any[] = data || []
    const totalClicks = rows.length

    const groupBy = (key: string): Record<string, number> => {
      const result: Record<string, number> = {}
      for (const row of rows) {
        const value = (row[key] || 'Desconhecido').trim() || 'Desconhecido'
        result[value] = (result[value] || 0) + 1
      }
      return result
    }

    const referrerHost = (referrer?: string | null): string => {
      if (!referrer) return 'Direto/desconhecido'
      try {
        return new URL(referrer).hostname.replace(/^www\./, '') || 'Direto/desconhecido'
      } catch {
        return 'Direto/desconhecido'
      }
    }

    const clicksByReferrer: Record<string, number> = {}
    const clicksByUtm: Record<string, number> = {}
    for (const row of rows) {
      const host = referrerHost(row.referrer)
      clicksByReferrer[host] = (clicksByReferrer[host] || 0) + 1
      const utm = row.utm_source || 'Sem origem'
      clicksByUtm[utm] = (clicksByUtm[utm] || 0) + 1
    }

    return {
      totalClicks,
      clicksByDevice: groupBy('device_type'),
      clicksByOs: groupBy('os'),
      clicksByBrowser: groupBy('browser'),
      clicksByCountry: groupBy('country'),
      clicksByReferrer,
      clicksByUtm,
      recentClicks: rows.map(this.mapClickFromDb),
    }
  }

  private static mapClickFromDb(row: any): ShortLinkClick {
    return {
      id: row.id,
      linkId: row.link_id,
      ip: row.ip,
      userAgent: row.user_agent,
      referrer: row.referrer,
      deviceType: row.device_type,
      os: row.os,
      browser: row.browser,
      country: row.country,
      region: row.region,
      city: row.city,
      utmSource: row.utm_source,
      createdAt: row.created_at,
    }
  }

  private static async ensureOriginalUrlUnique(originalUrl: string, excludeId?: string): Promise<void> {
    let query = getSupabaseAdmin()
      .from('short_links')
      .select('id')
      .eq('original_url', originalUrl)
      .is('deleted_at', null)
    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query
    if (error) throw error

    if (data && data.length > 0) {
      const err: any = new Error('Já existe outro link curto apontando para essa URL')
      err.code = SHORT_LINK_DUPLICATE_URL
      throw err
    }
  }

  private static generateToken(): string {
    let token = ''
    for (let i = 0; i < TOKEN_LENGTH; i++) {
      token += TOKEN_CHARS[Math.floor(Math.random() * TOKEN_CHARS.length)]
    }
    return token
  }

  private static mapFromDb(row: any): ShortLink {
    return {
      id: row.id,
      token: row.token,
      originalUrl: row.original_url,
      description: row.description,
      clicks: Number(row.clicks || 0),
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      isActive: row.is_active,
      deletedAt: row.deleted_at,
    }
  }
}
