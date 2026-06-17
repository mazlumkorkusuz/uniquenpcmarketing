import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  // If credentials aren't configured yet, let every request through
  // so the server doesn't crash-loop before .env is set on the host.
  if (!isValidUrl(supabaseUrl) || supabaseKey.length < 20) {
    return response
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()
    const { pathname } = request.nextUrl

    if (!user && pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user && pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  } catch {
    // Never crash the process — fail open so the app stays up
  }

  return response
}

export const config = {
  // Exclude: Next.js internals, static image optimisation, favicon,
  // and all common static file extensions served from /public
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot|otf|mp4|mp3|pdf)$).*)',
  ],
}
