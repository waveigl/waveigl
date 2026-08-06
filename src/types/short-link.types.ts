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
