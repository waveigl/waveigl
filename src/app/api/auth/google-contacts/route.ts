import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { canManageModerators } from '@/lib/permissions'
import { getUserRole } from '@/lib/permissions'
import { LinkedAccount } from '@/types'

// Escopo específico para gerenciar contatos
const CONTACTS_SCOPE = 'https://www.googleapis.com/auth/contacts'

function getAppUrl(request: NextRequest): string {
    return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
}

/**
 * Rota de OAuth dedicada para o Admin vincular a conta de sincronização de contatos.
 * Usa ADMIN_GOOGLE_CLIENT_ID e ADMIN_GOOGLE_CLIENT_SECRET.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const appUrl = getAppUrl(request)

    // 1. Verificar se o usuário é Admin/Owner antes de permitir iniciar o flow
    const session = await parseSessionCookie(request.headers.get('cookie'))
    if (!session) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const { data: linkedAccounts } = await supabase
        .from('linked_accounts')
        .select('*')
        .eq('user_id', session.userId)

    const role = getUserRole((linkedAccounts || []) as LinkedAccount[])
    if (!canManageModerators(role)) {
        return NextResponse.json({ error: 'Apenas administradores podem configurar sincronização de contatos' }, { status: 403 })
    }

    const clientId = process.env.ADMIN_GOOGLE_CLIENT_ID
    const clientSecret = process.env.ADMIN_GOOGLE_CLIENT_SECRET
    const redirectUri = `${appUrl}/api/auth/google-contacts`

    if (!code) {
        // Iniciar OAuth flow do Google
        const state = Math.random().toString(36).substring(7)

        // Escopos: offline access é essencial para obter refresh_token
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=code&` +
            `scope=openid+email+profile+${encodeURIComponent(CONTACTS_SCOPE)}&` +
            `access_type=offline&` +
            `prompt=consent&` +
            `state=${state}`

        return NextResponse.redirect(authUrl)
    }

    try {
        // Trocar code por access/refresh tokens usando as credenciais do ADMIN
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId!,
                client_secret: clientSecret!,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            }),
        })

        const tokenData = await tokenResponse.json()
        if (!tokenData.access_token) {
            console.error('[GoogleContactsAuth] Erro ao obter tokens:', tokenData)
            throw new Error('Falha ao obter access token')
        }

        // Obter info do usuário Google para saber qual conta está sendo vinculada
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
        })
        const userData = await userResponse.json()

        // Upsert em linked_accounts com plataforma customizada
        // Isso evita conflito com o link padrão do YouTube
        const { error: upsertError } = await supabase
            .from('linked_accounts')
            .upsert({
                user_id: session.userId,
                platform: 'google_contacts_admin',
                platform_user_id: String(userData.id),
                platform_username: userData.email || userData.name,
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token || null,
                authorized_scopes: ['openid', 'email', 'profile', CONTACTS_SCOPE],
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,platform' })

        if (upsertError) throw upsertError

        return NextResponse.redirect(`${appUrl}/dashboard?success=google_contacts_linked`)

    } catch (error) {
        console.error('[GoogleContactsAuth] Erro na autenticação:', error)
        return NextResponse.redirect(`${appUrl}/dashboard?error=google_contacts_auth_failed`)
    }
}
