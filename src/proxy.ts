import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth.config';

// Next 16: middleware diganti nama proxy (lihat node_modules/next/dist/docs/.../proxy.md).
// Auth.js di sini hanya decode JWT (tanpa db/bcrypt — itu di auth.ts).
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const session = req.auth;

  if (!session?.user) {
    const url = new URL('/login', nextUrl);
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }
  const role = session.user.role;
  if (path.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/home', nextUrl));
  }
  if (path.startsWith('/teacher') && role !== 'guru') {
    return NextResponse.redirect(new URL('/home', nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/home/:path*',
    '/children/:path*',
    '/enrollments/:path*',
    '/payments/:path*',
    '/profile/:path*',
    '/schedule-attendance/:path*',
    '/admin/:path*',
    '/teacher/:path*',
  ],
};
