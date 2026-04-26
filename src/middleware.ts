import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/* ─────────────────────────────────────────────────────────
   MIDDLEWARE — Route protection and session refresh.

   Protected:  /dashboard/*, /editor/*, /settings/*
   Auth-only:  /auth/login, /auth/signup (redirect if logged in)
   Public:     everything else (/, /p/*, /pricing, etc.)

   Session refresh happens on every request — keeps tokens
   valid without user noticing.
   ───────────────────────────────────────────────────────── */

const PROTECTED_PREFIXES = ['/dashboard', '/editor', '/settings']
const AUTH_ROUTES        = ['/auth/login', '/auth/signup', '/onboarding']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session on every request
  const { data: { user } } = await supabase.auth.getUser()

  // Protected route + no user → login with redirect param
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  if (isProtected && !user) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Already logged in + hitting auth route → dashboard
  const isAuthRoute = AUTH_ROUTES.includes(pathname)
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/editor/:path*',
    '/settings/:path*',
    '/auth/login',
    '/auth/signup',
    '/onboarding',
  ],
}
