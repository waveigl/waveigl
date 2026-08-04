/**
 * WhatsApp Group Sync — WaveIGL
 *
 * Script local (Node/TS) que gerencia o grupo "Clão do WaveIGL":
 *  - Conecta ao WhatsApp via Baileys (sessão persistida localmente)
 *  - Lê o banco Supabase de produção por subscribers ativos
 *  - Para cada sub ativo com telefone + consentimento:
 *      1. Cria/atualiza o contato no Google Contacts do admin
 *      2. Adiciona o número ao grupo (se ainda não estiver)
 *  - Remove do grupo quem não possui mais subscription ativa (expires_at vencido)
 *
 * Execução: npm run whatsapp:sync
 * Primeira execução exibe um QR Code para vincular o WhatsApp (Celular > Aparelhos conectados).
 *
 * IMPORTANTE: usa credenciais de PRODUÇÃO via .env.local. Não commitar .env.local.
 */

import 'dotenv/config'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })

import pino from 'pino'

import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, type WASocket } from '@whiskeysockets/baileys'
import qrcode from 'qrcode-terminal'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const AUTH_DIR = process.env.WHATSAPP_AUTH_DIR || '.dev/whatsapp-auth'

const GROUP_NAME = process.env.WHATSAPP_GROUP_NAME || 'Clão do WaveIGL'

// ---------------------------------------------------------------
// Supabase (produção)
// ---------------------------------------------------------------
function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes no .env.local')
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

interface Signup {
  user_id: string
  full_name: string | null
  display_name: string | null
  phone_number: string | null
  consent_google_contacts: boolean | null
  google_contact_id: string | null
  expires_at: string | null
  platform: string
}

// ---------------------------------------------------------------
// Utilitários de telefone
// ---------------------------------------------------------------
/** Normaliza um telefone para o formato internacional com DDI 55, apenas dígitos. */
function normalizePhone(p: string): string | null {
  const digits = p.replace(/\D/g, '')
  if (digits.length === 0) return null
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  if (digits.startsWith('55') && digits.length >= 12) return digits
  return digits
}

/** Monta o JID do WhatsApp a partir de um telefone normalizado (55 + dígitos). */
function phoneToJid(phone: string): string {
  const norm = normalizePhone(phone)!
  return `${norm}@s.whatsapp.net`
}

/** Extrai os dígitos do número de um JID. */
function jidToPhone(jid: string): string {
  return jid.split('@')[0].replace(/\D/g, '')
}

// ---------------------------------------------------------------
// Google Contacts (mesma lógica de src/lib/google/contacts.ts)
// ---------------------------------------------------------------
function formatPhoneForGoogle(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '')
  if (digits.length === 11 || digits.length === 10) return `+55${digits}`
  return digits.startsWith('+') ? digits : `+${digits}`
}

async function refreshAdminGoogleToken(refreshToken: string): Promise<string> {
  const clientId = process.env.ADMIN_GOOGLE_CLIENT_ID
  const clientSecret = process.env.ADMIN_GOOGLE_CLIENT_SECRET
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error_description || 'Erro ao renovar token do Google')
  return data.access_token
}

async function syncUserToGoogleContacts(supabase: SupabaseClient, signup: Signup): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!signup.phone_number) return { ok: false, error: 'Sem telefone' }
    if (signup.consent_google_contacts !== true) {
      return { ok: false, error: 'Sem consentimento' }
    }

    const { data: adminAccount, error: adminError } = await supabase
      .from('linked_accounts')
      .select('access_token, refresh_token')
      .eq('platform', 'google_contacts_admin')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (adminError || !adminAccount?.access_token) {
      return { ok: false, error: 'Conta google_contacts_admin não vinculada' }
    }

    const refreshToken = adminAccount.refresh_token
    const givenName = `${signup.display_name || signup.full_name || signup.user_id} (Wave)`
    const familyName = signup.full_name || ''
    const formattedPhone = formatPhoneForGoogle(signup.phone_number)
    const existingContactId = signup.google_contact_id || null

    const performRequest = async (token: string, isRetry = false): Promise<any> => {
      let url = 'https://people.googleapis.com/v1/people:createContact'
      let method = 'POST'
      const contactData: any = {
        names: [{ givenName, familyName }],
        phoneNumbers: [{ value: formattedPhone, type: 'mobile' }]
      }

      if (existingContactId) {
        const getRes = await fetch(`https://people.googleapis.com/v1/${existingContactId}?personFields=names,phoneNumbers`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (getRes.status === 401 && !isRetry && refreshToken) {
          const newToken = await refreshAdminGoogleToken(refreshToken)
          return performRequest(newToken, true)
        }
        if (getRes.ok) {
          const existingContact = await getRes.json()
          url = `https://people.googleapis.com/v1/${existingContactId}:updateContact?updatePersonFields=names,phoneNumbers`
          method = 'PATCH'
          contactData.etag = existingContact.etag
        }
      }

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      })
      if (response.status === 401 && !isRetry && refreshToken) {
        const newToken = await refreshAdminGoogleToken(refreshToken)
        return performRequest(newToken, true)
      }
      return response
    }

    const response = await performRequest(adminAccount.access_token)
    if (!response.ok) {
      const err = await response.json()
      return { ok: false, error: err.error?.message || 'Erro na API do Google' }
    }
    const result = await response.json()
    if (result.resourceName && result.resourceName !== existingContactId) {
      await supabase
        .from('profiles')
        .update({ google_contact_id: result.resourceName, updated_at: new Date().toISOString() })
        .eq('id', signup.user_id)
    }
    console.log(`  [Google] Contato OK para ${givenName}: ${result.resourceName}`)
    return { ok: true }
  } catch (error) {
    console.error('  [Google] Erro:', error)
    return { ok: false, error: 'Erro interno' }
  }
}

// ---------------------------------------------------------------
// Fluxo principal
// ---------------------------------------------------------------
async function findGroupId(sock: WASocket): Promise<string | null> {
  // Tentar pelo nome
  try {
    const groups = await sock.groupFetchAllParticipating()
    const match = Object.entries(groups).find(([, g]) => g.subject === GROUP_NAME)
    if (match) return match[0]
  } catch (e) {
    console.warn('Falha ao buscar grupos por nome:', e)
  }

  // Fallback: aceitar convite (se o admin for dono/participante do grupo)
  const invite = process.env.WHATSAPP_GROUP_INVITE
  if (invite) {
    const codeMatch = invite.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/)
    if (codeMatch) {
      try {
        const result = await sock.groupAcceptInvite(codeMatch[1])
        // Só retorna se o grupo não expulsar/re-criar o bot; ok para recuperar o id
        const groups = await sock.groupFetchAllParticipating()
        const match = Object.entries(groups).find(([, g]) => g.id === result || g.subject === GROUP_NAME)
        if (match) return match[0]
        if (result) return result
      } catch (e) {
        console.warn('Falha ao aceitar convite:', e)
      }
    }
  }
  return null
}

async function sync() {
  const supabase = getSupabase()
  console.log(`[WhatsApp Sync] Conectando (auth dir: ${AUTH_DIR})...`)

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
  const { version } = await fetchLatestBaileysVersion()

  const logger = pino({ level: 'warn' })

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    browser: ['WaveIGL', 'Chrome', 'Desktop'],
  })

  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) {
      console.log('\n[WhatsApp] Escaneie o QR Code abaixo no celular (WhatsApp > Aparelhos conectados):\n')
      qrcode.generate(qr, { small: true })
    }
    if (connection === 'open') {
      console.log('[WhatsApp] Conectado!')
    }
    if (connection === 'close') {
      const reason = (lastDisconnect?.error as any)?.output?.statusCode
      console.log(`[WhatsApp] Conexão fechada. Reason: ${reason} (${DisconnectReason[reason] || 'desconhecido'})`)
      // Não encerrar aqui se qr/reauth ainda pendente
    }
  })

  // Aguarda a conexão abrir (até 60s)
  const connected = new Promise<void>((resolve) => {
    const t = setTimeout(() => resolve(), 60000)
    sock.ev.on('connection.update', (u) => {
      if (u.connection === 'open') { clearTimeout(t); resolve() }
    })
  })
  await connected

  // Buscar subs ativos (expires_at no futuro) com telefone
  const now = new Date().toISOString()
  const { data: signups, error } = await supabase
    .from('subscriber_benefits')
    .select(`
      user_id,
      platform,
      expires_at,
      profiles ( full_name, display_name, phone_number, consent_google_contacts, google_contact_id )
    `)
    .gte('expires_at', now)
    .order('subscribed_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar subs ativos:', error)
    process.exit(1)
  }

  const active = (signups as any[] || [])
    .map((b) => {
      const p = b.profiles || {}
      return {
        user_id: b.user_id,
        platform: b.platform,
        expires_at: b.expires_at,
        full_name: p.full_name || null,
        display_name: p.display_name || null,
        phone_number: p.phone_number || null,
        consent_google_contacts: p.consent_google_contacts ?? false,
        google_contact_id: p.google_contact_id || null,
      } as Signup
    })
    .filter((s) => s.phone_number)

  console.log(`\n[Supabase] ${active.length} subscribers ativos com telefone encontrados.`)

  // Encontrar o grupo
  const groupId = await findGroupId(sock)
  if (!groupId) {
    console.error('Grupo não encontrado. Verifique WHATSAPP_GROUP_NAME / WHATSAPP_GROUP_INVITE.')
    process.exit(1)
  }
  console.log(`[Grupo] "${GROUP_NAME}" => ${groupId}`)

  const metadata = await sock.groupMetadata(groupId)
  const currentMembers = new Set<string>(metadata.participants.map((p) => jidToPhone(p.id)))
  console.log(`[Grupo] ${currentMembers.size} participantes atuais.`)

  // 1) Adicionar / atualizar contatos e garantir presença
  const activePhones = new Set<string>()
  for (const s of active) {
    const phone = normalizePhone(s.phone_number!)
    if (!phone) continue
    activePhones.add(phone)

    const alreadyMember = currentMembers.has(phone)
    if (!alreadyMember) {
      // Garantir contato no Google (se consentimento) e adicionar ao grupo
      if (s.consent_google_contacts === true) {
        const g = await syncUserToGoogleContacts(supabase, s)
        if (!g.ok) console.warn(`  [Google] Falha para ${phone}: ${g.error}`)
      }
      try {
        await sock.groupParticipantsUpdate(groupId, [phoneToJid(phone)], 'add')
        console.log(`  [+] Adicionado ao grupo: ${phone} (${s.display_name || s.full_name || ''})`)
      } catch (e) {
        console.warn(`  [!] Não foi possível adicionar ${phone}: ${e}`)
      }
    } else {
      // Já membro: apenas garantir/atualizar contato
      if (s.consent_google_contacts === true) {
        const g = await syncUserToGoogleContacts(supabase, s)
        if (!g.ok) console.warn(`  [Google] Falha para ${phone}: ${g.error}`)
      }
    }
  }

  // 2) Remover quem não possui mais sub ativa
  const toRemove = metadata.participants
    .map((p) => p.id)
    .filter((jid) => {
      const phone = jidToPhone(jid)
      // Nunca remover o próprio admin (conta que está logada no WhatsApp Web)
      const self = sock.user?.id ? jidToPhone(sock.user.id) : ''
      return !activePhones.has(phone) && phone !== self
    })

  if (toRemove.length > 0) {
    console.log(`\n[Grupo] Removendo ${toRemove.length} participante(s) sem sub ativa...`)
    for (const jid of toRemove) {
      try {
        await sock.groupParticipantsUpdate(groupId, [jid], 'remove')
        console.log(`  [-] Removido: ${jidToPhone(jid)}`)
      } catch (e) {
        console.warn(`  [!] Falha ao remover ${jid}: ${e}`)
      }
    }
  } else {
    console.log('\n[Grupo] Nenhum participante a remover.')
  }

  console.log('\n[WhatsApp Sync] Concluído.')
  // IMPORTANTE: apenas encerrar a conexão, NÃO deslogar (logout apagaria a sessão e forçaria novo QR a cada execução)
  sock.end(undefined)
  setTimeout(() => process.exit(0), 1000)
}

sync().catch((e) => {
  console.error('Erro fatal:', e)
  process.exit(1)
})