export interface ShortLink {
  id: string
  token: string
  originalUrl: string
  description?: string | null
  clicks: number
  createdBy: string
  createdAt: string
  updatedAt?: string | null
  updatedBy?: string | null
  isActive: boolean
  deletedAt?: string | null
}

export interface ShortLinkClick {
  id: string
  linkId: string
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
  createdAt: string
}

export interface ShortLinkStats {
  totalClicks: number
  clicksByDevice: Record<string, number>
  clicksByOs: Record<string, number>
  clicksByBrowser: Record<string, number>
  clicksByCountry: Record<string, number>
  clicksByReferrer: Record<string, number>
  clicksByUtm: Record<string, number>
  recentClicks: ShortLinkClick[]
}
