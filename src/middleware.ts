import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // Extract hostname without port (e.g. 'alhikmah.localhost:3000' -> 'alhikmah.localhost')
  const hostname = host.split(':')[0].toLowerCase();

  let subdomain = '';

  // 1. Localhost development (e.g. 'alhikmah.localhost', 'darulquran.localhost')
  if (hostname.endsWith('.localhost')) {
    subdomain = hostname.replace('.localhost', '');
  }
  // 2. Local wildcard DNS (e.g. 'alhikmah.lvh.me')
  else if (hostname.endsWith('.lvh.me')) {
    subdomain = hostname.replace('.lvh.me', '');
  }
  // 3. Production domain (e.g. 'alhikmah.tahfidz.com')
  else {
    const parts = hostname.split('.');
    // At least 3 parts required for subdomain.domain.com
    if (parts.length > 2) {
      subdomain = parts[0];
    }
  }

  // Filter out system reserved words
  if (['www', 'api', 'admin', 'localhost', '127.0.0.1'].includes(subdomain)) {
    subdomain = '';
  }

  // Subdomain routing shortcut: If superadmin subdomain visits root, send to /superadmin/dashboard
  if (subdomain === 'superadmin' && pathname === '/') {
    return NextResponse.redirect(new URL('/superadmin/dashboard', request.url));
  }

  const requestHeaders = new Headers(request.headers);
  if (subdomain) {
    requestHeaders.set('x-tenant-subdomain', subdomain);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (subdomain) {
    response.headers.set('x-tenant-subdomain', subdomain);
    response.cookies.set('tenant_subdomain', subdomain, {
      path: '/',
      sameSite: 'lax',
      httpOnly: false, // Accessible by client-side React
    });
  } else {
    response.cookies.delete('tenant_subdomain');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets (.svg, .png, .jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
