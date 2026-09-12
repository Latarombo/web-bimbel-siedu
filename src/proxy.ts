import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth.config';

// Next 16: middleware diganti nama proxy (lihat node_modules/next/dist/docs/.../proxy.md).
// Auth.js di sini hanya decode JWT (tanpa db/bcrypt — itu di auth.ts).
const { auth } = NextAuth(authConfig);

// Prefix halaman area Orang Tua (harus role orang_tua).
const PARENT_PREFIXES = ['/home', '/children', '/enrollments', '/payments', '/profile', '/schedule-attendance'];

// Dashboard sesuai role — dipakai buat menendang user yang masuk area bukan miliknya.
function homeFor(role: string): string {
  return role === 'admin' ? '/admin/dashboard' : role === 'guru' ? '/teacher/dashboard' : '/home';
}

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
  const home = homeFor(role);
  if (path.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL(home, nextUrl));
  }
  if (path.startsWith('/teacher') && role !== 'guru') {
    return NextResponse.redirect(new URL(home, nextUrl));
  }
  if (PARENT_PREFIXES.some((p) => path.startsWith(p)) && role !== 'orang_tua') {
    return NextResponse.redirect(new URL(home, nextUrl));
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
