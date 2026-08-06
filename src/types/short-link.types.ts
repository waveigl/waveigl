export interface ShortLink {
  id: string
  token: string
  originalUrl: string
  description?: string | null
  clicks: number
  createdBy: string
  createdAt: string
  isActive: boolean
  deletedAt?: string | null
}
