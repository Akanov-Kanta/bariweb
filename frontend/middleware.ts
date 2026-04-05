import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Auth } from './lib/api/sdk.gen'; // Adjust path if needed

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDashboard = pathname.startsWith('/dashboard');
  const isPayment = pathname.startsWith('/payment');
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const accessToken = request.cookies.get('access_token')?.value;

  // Protect Dashboard and Payment routes
  if (isDashboard || isPayment) {
    if (!accessToken) {
      const loginUrl = new URL('/login', request.url);
      // For B2B flow, if trying to pay, redirect back after login
      if (isPayment) loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    try {
      // Must pass cookie manually in headers for Server-Side API calls
      const response = await Auth.verifyToken({
        headers: { Cookie: `access_token=${accessToken}` }
      });
      
      // If backend returns 401/403 or explicit error, clear cookie and login
      if (response.error) {
        const nextResponse = NextResponse.redirect(new URL('/login', request.url));
        nextResponse.cookies.delete('access_token');
        return nextResponse;
      }
      
      return NextResponse.next();
    } catch (e) {
      // Network error or breakdown, fallback safely
      return NextResponse.next();
    }
  }

  // Redirect logged in users away from auth pages
  if (isAuthPage && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*', '/payment', '/login', '/register'] };
