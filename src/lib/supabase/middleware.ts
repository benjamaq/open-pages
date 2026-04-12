import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { adminPanelAllowlistConfigured, isAdminPanelEmail } from '@/lib/adminPanelAllowlist'
import { Database } from '../types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  if (user && path.startsWith('/admin/login')) {
    if (isAdminPanelEmail(user.email)) {
      const nextRaw = request.nextUrl.searchParams.get('next')
      let target = '/admin/cohorts'
      if (
        nextRaw &&
        nextRaw.startsWith('/') &&
        !nextRaw.startsWith('//') &&
        nextRaw.startsWith('/admin')
      ) {
        target = nextRaw
      }
      const url = request.nextUrl.clone()
      url.pathname = target
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  if (
    user &&
    path.startsWith('/admin') &&
    !path.startsWith('/admin/login') &&
    adminPanelAllowlistConfigured() &&
    !isAdminPanelEmail(user.email)
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.search = ''
    url.searchParams.set('reason', 'forbidden')
    return NextResponse.redirect(url)
  }

  if (!user) {
    // NEW SYSTEM: allow public access to /new-login and /new-signup,
    // but protect /dashboard by redirecting to /login
    if (path.startsWith('/dashboard') || path.startsWith('/insights') || path.startsWith('/onboarding')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    if (
      path.startsWith('/login') ||
      path.startsWith('/signup') ||
      path.startsWith('/study') ||
      path.startsWith('/api/') ||
      path.startsWith('/cohorts') ||
      path.startsWith('/sleep') ||
      path.startsWith('/pricing') ||
      path.startsWith('/faq') ||
      path.startsWith('/contact') ||
      path.startsWith('/biostackr') ||
      path === '/check-in' ||
      path.startsWith('/check-in/') ||
      path.startsWith('/admin/login')
    ) {
      return supabaseResponse
    }

    if (path.startsWith('/admin')) {
      const isProd = process.env.NODE_ENV === 'production'
      if (!isProd) {
        return supabaseResponse
      }
      if (!adminPanelAllowlistConfigured()) {
        if (path === '/admin/cohorts' || path.startsWith('/admin/cohorts/')) {
          return supabaseResponse
        }
      }
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('next', `${path}${request.nextUrl.search}`)
      return NextResponse.redirect(url)
    }

    // EXISTING SYSTEM: original guard & redirects to /auth/signin
    // Allow remaining public landing pages without auth
    const publicPaths = ['/', '/u', '/checkin/quick-save', '/checkin/success', '/cohorts', '/study', '/sleep', '/sleep-v2', '/sleep-v3', '/pricing', '/faq', '/contact', '/biostackr']
    const isPublic = publicPaths.some((p) => path === p || path.startsWith(p + '/')) || path.startsWith('/auth') || path.startsWith('/u/')
    if (!isPublic) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/signin'
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}
