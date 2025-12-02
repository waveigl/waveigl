import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = getSupabaseAdmin()
  const nowIso = new Date().toISOString()

  const { data: pendings, error } = await db
    .from('pending_unlinks')
    .select('id, user_id, platform, linked_account_id, effective_at, status')
    .eq('status', 'pending')
    .lte('effective_at', nowIso)
    .limit(100)

  if (error) {
    return NextResponse.json({ error: 'Erro ao listar pendências' }, { status: 500 })
  }

  let processed = 0
  for (const p of pendings || []) {
    // Remove da linked_accounts se ainda existir e pertence ao usuário
    if (p.linked_account_id) {
      await db.from('linked_accounts')
        .delete()
        .eq('id', p.linked_account_id)
        .eq('user_id', p.user_id)
        .eq('platform', p.platform)
    } else {
      await db.from('linked_accounts')
        .delete()
        .eq('user_id', p.user_id)
        .eq('platform', p.platform)
    }
    await db.from('pending_unlinks')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('id', p.id)
    processed++
  }

  return NextResponse.json({ processed }, { status: 200 })
}


