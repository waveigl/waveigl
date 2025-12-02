import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { z } from 'zod'

// Regex para validar número de telefone brasileiro (com ou sem código do país)
// Aceita: +5511999999999, 5511999999999, 11999999999, (11) 99999-9999, etc.
const phoneRegex = /^(\+?55)?[\s.-]?\(?[1-9]{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}$/

const profileSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido (YYYY-MM-DD)').optional(),
  phone_number: z.string().optional().refine(
    (val) => !val || phoneRegex.test(val.replace(/\s/g, '')),
    { message: 'Número de telefone inválido' }
  )
})

// Função para normalizar telefone (remove caracteres especiais, mantém apenas números)
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // Se não começar com 55, adiciona
  if (digits.length === 11 || digits.length === 10) {
    return `55${digits}`
  }
  return digits
}

export async function PUT(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = profileSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: result.error.flatten() }, { status: 400 })
    }

    const { full_name, birth_date, phone_number } = result.data
    
    // Buscar perfil atual
    const { data: profile, error: fetchError } = await getSupabaseAdmin()
      .from('profiles')
      .select('birth_date, birth_date_edits, last_profile_edit_at, phone_number, last_phone_edit_at')
      .eq('id', session.userId)
      .single()

    if (fetchError || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    const updates: any = {}
    const now = new Date()

    // Validação de 30 dias para full_name
    if (full_name !== undefined) {
      if (profile.last_profile_edit_at) {
        const lastEdit = new Date(profile.last_profile_edit_at)
        const diffDays = Math.floor((now.getTime() - lastEdit.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays < 30) {
          return NextResponse.json({ 
            error: `Aguarde ${30 - diffDays} dias para editar o nome novamente.` 
          }, { status: 400 })
        }
      }
      updates.full_name = full_name
      updates.last_profile_edit_at = now.toISOString()
    }

    // Validação de birth_date (max 2 edições)
    if (birth_date !== undefined) {
      // Se a data enviada for igual a atual, ignorar
      if (birth_date !== profile.birth_date) {
         if ((profile.birth_date_edits || 0) >= 2) {
            return NextResponse.json({ error: 'Limite de edições de data de nascimento atingido.' }, { status: 400 })
         }
         updates.birth_date = birth_date
         updates.birth_date_edits = (profile.birth_date_edits || 0) + 1
      }
    }

    // Validação de 30 dias para phone_number
    if (phone_number !== undefined) {
      const normalizedPhone = phone_number ? normalizePhone(phone_number) : null
      
      // Se o telefone enviado for igual ao atual (normalizado), ignorar
      const currentNormalized = profile.phone_number ? normalizePhone(profile.phone_number) : null
      
      if (normalizedPhone !== currentNormalized) {
        if (profile.last_phone_edit_at) {
          const lastEdit = new Date(profile.last_phone_edit_at)
          const diffDays = Math.floor((now.getTime() - lastEdit.getTime()) / (1000 * 60 * 60 * 24))
          if (diffDays < 30) {
            return NextResponse.json({ 
              error: `Aguarde ${30 - diffDays} dias para editar o telefone novamente.` 
            }, { status: 400 })
          }
        }
        updates.phone_number = normalizedPhone
        updates.last_phone_edit_at = now.toISOString()
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'Nenhuma alteração necessária' })
    }

    const { error: updateError } = await getSupabaseAdmin()
      .from('profiles')
      .update(updates)
      .eq('id', session.userId)

    if (updateError) {
      console.error('Erro update profile:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (e) {
    console.error('PUT /api/me/profile error', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
