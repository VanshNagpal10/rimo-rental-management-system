/**
 * Next.js Middleware
 * Handles authentication and role-based access control
 */
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Customer routes - require customer role
    if (pathname.startsWith('/shop') || 
        pathname.startsWith('/cart') || 
        pathname.startsWith('/checkout') || 
        pathname.startsWith('/orders') ||
        pathname.startsWith('/wishlist') ||
        pathname.startsWith('/profile')) {
      
      if (!token || token.role !== 'customer') {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', request.url);
        return NextResponse.redirect(loginUrl);
      }
    }

    // End user routes - require enduser role
    if (pathname.startsWith('/enduser')) {
      if (!token || token.role !== 'enduser') {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', request.url);
        return NextResponse.redirect(loginUrl);
      }
    }

    // Redirect root to appropriate dashboard based on role
    if (pathname === '/') {
      if (token) {
        if (token.role === 'customer') {
          return NextResponse.redirect(new URL('/shop', request.url));
        } else if (token.role === 'enduser') {
          return NextResponse.redirect(new URL('/enduser', request.url));
        }
      }
      // If no token, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // Redirect to login on error
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login, register (auth pages)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|register).*)',
  ],
};

