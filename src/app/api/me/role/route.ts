import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { UserRole, hasRolePermission } from '@/lib/auth/scopes'

/**
 * Atualiza o cargo de um usuário
 * Apenas admins e streamers podem fazer isso
 */
export async function POST(request: NextRequest) {
  try {
    const session = await parseSessionCookie(request.headers.get('cookie'))
    
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { targetUserId, newRole } = await request.json()
    
    if (!targetUserId || !newRole) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }

    // Validar role
    const validRoles: UserRole[] = ['user', 'moderator', 'admin', 'streamer']
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Cargo inválido' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Verificar se o usuário atual tem permissão
    const { data: currentUser, error: currentUserError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.userId)
      .single()

    if (currentUserError || !currentUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const currentRole = (currentUser.role || 'user') as UserRole

    // Apenas admin ou streamer podem alterar cargos
    if (!hasRolePermission(currentRole, 'admin')) {
      return NextResponse.json({ error: 'Sem permissão para alterar cargos' }, { status: 403 })
    }

    // Streamer é o único que pode promover a admin
    if (newRole === 'admin' && currentRole !== 'streamer') {
      return NextResponse.json({ error: 'Apenas o streamer pode promover a admin' }, { status: 403 })
    }

    // Ninguém pode se promover a streamer (exceto o próprio sistema)
    if (newRole === 'streamer' && currentRole !== 'streamer') {
      return NextResponse.json({ error: 'Não é possível promover a streamer' }, { status: 403 })
    }

    // Não pode alterar o cargo de alguém com cargo igual ou superior
    const { data: targetUser, error: targetUserError } = await supabase
      .from('profiles')
      .select('role, username')
      .eq('id', targetUserId)
      .single()

    if (targetUserError || !targetUser) {
      return NextResponse.json({ error: 'Usuário alvo não encontrado' }, { status: 404 })
    }

    const targetCurrentRole = (targetUser.role || 'user') as UserRole

    // Não pode alterar cargo de alguém com cargo igual ou superior (exceto streamer)
    if (currentRole !== 'streamer' && hasRolePermission(targetCurrentRole, currentRole)) {
      return NextResponse.json({ error: 'Não pode alterar cargo de usuário com cargo igual ou superior' }, { status: 403 })
    }

    // Atualizar o cargo
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', targetUserId)

    if (updateError) {
      console.error('[API/role] Erro ao atualizar cargo:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar cargo' }, { status: 500 })
    }

    console.log(`[API/role] Cargo de ${targetUser.username} alterado de ${targetCurrentRole} para ${newRole} por ${session.userId}`)

    return NextResponse.json({ 
      success: true,
      message: `Cargo alterado para ${newRole}`
    })

  } catch (error) {
    console.error('[API/role] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

