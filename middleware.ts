import { updateSession } from '@/lib/supabase/proxy'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Check if it's a Server Action or RSC request
  const isServerAction = request.headers.has('next-action')
  const isRSC = request.headers.get('accept')?.includes('text/x-component')

  const response = await updateSession(request)

  // If the response is a redirect to login and it's a background request,
  // we return a 401 or a simple response to avoid the "unexpected response" error in the browser
  if ((isServerAction || isRSC) && response.status === 307 && response.headers.get('location')?.includes('/auth/login')) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized', message: 'Session expired' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    )
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
