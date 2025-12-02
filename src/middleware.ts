import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { parseSessionCookie } from '@/lib/auth/session'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshing the auth token (se usarmos Supabase Auth futuramente)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Suporte a sessão custom via cookie assinado
  const session = await parseSessionCookie(request.headers.get('cookie'))
  const isLogged = Boolean(user) || Boolean(session)

  // Proteger rotas do dashboard
  if (request.nextUrl.pathname.startsWith('/dashboard') && !isLogged) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Redirecionar usuários autenticados da página de login
  if ((request.nextUrl.pathname.startsWith('/auth/login') || request.nextUrl.pathname === '/') && isLogged) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
