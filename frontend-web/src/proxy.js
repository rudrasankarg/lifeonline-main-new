// Next.js 16 proxy (replaces middleware.js)
// Route protection is handled client-side by useAuth() + ProtectedRoute.
// This proxy only handles the /login redirect for already-authenticated users.
// Note: Firebase ID token verification server-side would require additional setup.

import { NextResponse } from 'next/server';

export function proxy(req) {
  // Allow all requests through – client-side Firebase auth handles protection.
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
