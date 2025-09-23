
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth-middleware';

// Define paths that are public and don't require authentication
const publicPaths = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If the path is public, let the request through
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // For all other paths, check for an authenticated user
  const { user } = await getAuthenticatedUser(request);

  if (!user) {
    // If no user, redirect to the login page, preserving the original URL as a query param
    const url = request.nextUrl.clone();
    if (pathname !== '/') {
        url.searchParams.set('next', pathname);
    }
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }


  // If the user is authenticated, proceed with the request
  return NextResponse.next();
}

// Configure the middleware to run on all paths except for API routes,
// Next.js specific paths, and static files.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
