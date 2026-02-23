import { getSupabaseAdmin } from '@/lib/supabase/server'

interface GoogleContactUpdate {
    resourceName?: string
    etag?: string
    names?: any[]
    phoneNumbers?: any[]
}

/**
 * Normaliza o telefone para o formato internacional usado pelo Google Contacts
 */
function formatPhoneForGoogle(phoneNumber: string): string {
    const digits = phoneNumber.replace(/\D/g, '')
    if (digits.length === 11 || digits.length === 10) {
        return `+55${digits}`
    }
    return digits.startsWith('+') ? digits : `+${digits}`
}

/**
 * Renova o access_token do Google usando o refresh_token do Admin
 */
async function refreshAdminGoogleToken(refreshToken: string) {
    const clientId = process.env.ADMIN_GOOGLE_CLIENT_ID
    const clientSecret = process.env.ADMIN_GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
        throw new Error('ADMIN_GOOGLE_CLIENT_ID ou SECRET não configurados em .env.local')
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    })

    const data = await response.json()

    if (!response.ok) {
        console.error('[GoogleContacts] Erro ao renovar token:', data)
        throw new Error(data.error_description || 'Erro ao renovar token do Google')
    }

    return data.access_token
}

/**
 * Sincroniza um usuário do WaveIGL com os Contatos do Google do Admin (usando conta google_contacts_admin)
 */
export async function syncUserToGoogleContacts(userId: string) {
    try {
        const supabase = getSupabaseAdmin()

        // 1. Buscar dados do usuário e consentimento
        const { data: userProfile, error: userError } = await supabase
            .from('profiles')
            .select('full_name, display_name, phone_number, google_contact_id, consent_google_contacts')
            .eq('id', userId)
            .single()

        if (userError || !userProfile || !userProfile.phone_number) {
            return { success: false, error: 'Usuário sem telefone ou não encontrado' }
        }

        // VERIFICAÇÃO DE CONSENTIMENTO
        if (userProfile.consent_google_contacts !== true) {
            console.log(`[GoogleContacts] Sincronização pulada para ${userProfile.display_name}: Sem consentimento.`)
            return { success: false, error: 'Consentimento não concedido' }
        }

        // 2. Buscar token da conta especial de Admin
        const { data: adminAccount, error: adminError } = await supabase
            .from('linked_accounts')
            .select('access_token, refresh_token')
            .eq('platform', 'google_contacts_admin') // Plataforma dedicada
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (adminError || !adminAccount) {
            console.warn('[GoogleContacts] Conta google_contacts_admin não encontrada. O Admin precisa vincular em /api/auth/google-contacts')
            return { success: false, error: 'Conta de Admin não vinculada' }
        }

        let accessToken = adminAccount.access_token
        const refreshToken = adminAccount.refresh_token

        const givenName = `${userProfile.display_name} (Wave)`
        const familyName = userProfile.full_name || ''
        const formattedPhone = formatPhoneForGoogle(userProfile.phone_number)

        const performRequest = async (token: string, isRetry = false): Promise<any> => {
            let url = 'https://people.googleapis.com/v1/people:createContact'
            let method = 'POST'
            const contactData: GoogleContactUpdate = {
                names: [{ givenName, familyName }],
                phoneNumbers: [{ value: formattedPhone, type: 'mobile' }]
            }

            if (userProfile.google_contact_id) {
                // Primeiro buscar o ETag
                const getRes = await fetch(`https://people.googleapis.com/v1/${userProfile.google_contact_id}?personFields=names,phoneNumbers`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })

                if (getRes.status === 401 && !isRetry && refreshToken) {
                    console.log('[GoogleContacts] Token expirado, renovando...')
                    const newToken = await refreshAdminGoogleToken(refreshToken)

                    await supabase
                        .from('linked_accounts')
                        .update({ access_token: newToken, updated_at: new Date().toISOString() })
                        .eq('platform', 'google_contacts_admin')

                    return performRequest(newToken, true)
                }

                if (getRes.ok) {
                    const existingContact = await getRes.json()
                    url = `https://people.googleapis.com/v1/${userProfile.google_contact_id}:updateContact?updatePersonFields=names,phoneNumbers`
                    method = 'PATCH'
                    contactData.etag = existingContact.etag
                }
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactData)
            })

            if (response.status === 401 && !isRetry && refreshToken) {
                const newToken = await refreshAdminGoogleToken(refreshToken)
                await supabase
                    .from('linked_accounts')
                    .update({ access_token: newToken, updated_at: new Date().toISOString() })
                    .eq('platform', 'google_contacts_admin')
                return performRequest(newToken, true)
            }

            return response
        }

        const response = await performRequest(accessToken)

        if (!response.ok) {
            const errorData = await response.json()
            console.error('[GoogleContacts] Erro na API do Google:', errorData)
            return { success: false, error: errorData.error?.message || 'Erro na API do Google' }
        }

        const result = await response.json()
        const resourceName = result.resourceName

        // 3. Salvar o resourceName no perfil para futuras atualizações
        if (resourceName && resourceName !== userProfile.google_contact_id) {
            await supabase
                .from('profiles')
                .update({ google_contact_id: resourceName })
                .eq('id', userId)
        }

        console.log(`[GoogleContacts] Sincronização Admin concluída para ${userProfile.display_name}: ${resourceName}`)
        return { success: true, resourceName }

    } catch (error) {
        console.error('[GoogleContacts] Erro crítico na sincronização:', error)
        return { success: false, error: 'Erro interno' }
    }
}
