import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { type CookieOptions, createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  console.log('[AUTH_CALLBACK] Received request');
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/chat'
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin

  console.log(`[AUTH_CALLBACK] Code: ${code}, Next: ${next}, Origin: ${origin}`);

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            // @ts-ignore
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              // @ts-ignore
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              // @ts-ignore
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    console.log('[AUTH_CALLBACK] Attempting to exchange code for session...');
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const redirectUrl = `${origin}${next}`;
      console.log(`[AUTH_CALLBACK] Successfully exchanged code. Redirecting to: ${redirectUrl}`);
      return NextResponse.redirect(redirectUrl)
    }
    console.error('[AUTH_CALLBACK] Error exchanging code for session:', error);
  }

  console.error('[AUTH_CALLBACK] OAuth callback error or missing code. Redirecting to login with error.');
  return NextResponse.redirect(`${origin}/login?error=OAuthCallbackFailed`)
} 