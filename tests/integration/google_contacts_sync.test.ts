import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { syncUserToGoogleContacts } from '@/lib/google/contacts'
import { getSupabaseAdmin } from '@/lib/supabase/server'

// Mock de fetch global
const globalFetch = global.fetch

vi.mock('@/lib/supabase/server', () => ({
    getSupabaseAdmin: vi.fn()
}))

describe('Google Contacts Sync Logic', () => {
    const mockUserId = 'test-user-id'
    const mockAdminToken = 'mock-admin-token'

    beforeEach(() => {
        vi.clearAllMocks()
        global.fetch = vi.fn() as any
    })

    afterAll(() => {
        global.fetch = globalFetch
    })

    it('deve falhar se o usuário não deu consentimento', async () => {
        const mockSupabase = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: {
                    display_name: 'Test',
                    phone_number: '5511999999999',
                    consent_google_contacts: false
                },
                error: null
            })
        }
            ; (getSupabaseAdmin as any).mockReturnValue(mockSupabase)

        const result = await syncUserToGoogleContacts(mockUserId)
        expect(result.success).toBe(false)
        expect(result.error).toBe('Consentimento não concedido')
        expect(global.fetch).not.toHaveBeenCalled()
    })

    it('deve realizar a sincronização se houver consentimento e tokens de admin', async () => {
        const mockSupabase = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
                data: { access_token: mockAdminToken, refresh_token: 'refresh' },
                error: null
            }),
            single: vi.fn().mockResolvedValue({
                data: {
                    display_name: 'Test',
                    full_name: 'Test User',
                    phone_number: '5511999999999',
                    consent_google_contacts: true
                },
                error: null
            }),
            update: vi.fn().mockReturnThis(),
            resolvedValue: { error: null }
        }
            ; (getSupabaseAdmin as any).mockReturnValue(mockSupabase)

            ; (global.fetch as any).mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ resourceName: 'people/123' })
            })

        const result = await syncUserToGoogleContacts(mockUserId)
        expect(result.success).toBe(true)
        expect(result.resourceName).toBe('people/123')

        expect(global.fetch).toHaveBeenCalledWith(
            'https://people.googleapis.com/v1/people:createContact',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Authorization': `Bearer ${mockAdminToken}`
                })
            })
        )
    })
})
