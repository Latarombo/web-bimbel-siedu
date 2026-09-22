import NextAuth from 'next-auth';
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth.config';
import { routing } from '@/i18n/routing';

// Next 16: middleware diganti nama proxy (lihat node_modules/next/dist/docs/.../proxy.md).
// Auth.js di sini hanya decode JWT (tanpa db/bcrypt — itu di auth.ts).
const { auth } = NextAuth(authConfig);

// Urutan di dalam callback: (1) guard memutuskan akses, (2) kalau lolos,
// response dari next-intl dikembalikan APA ADANYA — di situlah rewrite
// /home -> /id/home hidup. Kalau NextResponse.next() buatan sendiri yang
// dikembalikan, rewrite locale hilang dan rute di app/[locale] tidak match.
const intlMiddleware = createMiddleware(routing);

// Prefix halaman area Orang Tua (harus role orang_tua).
const PARENT_PREFIXES = ['/home', '/children', '/enrollments', '/payments', '/profile', '/schedule-attendance'];

// Halaman publik dan autentikasi
const PUBLIC_PREFIXES = ['/about', '/classes', '/contact', '/privacy-policy', '/terms'];
const AUTH_PREFIXES = ['/login', '/register', '/forgot-password', '/reset-password'];

function isPublic(base: string): boolean {
  if (base === '/') return true;
  return (
    PUBLIC_PREFIXES.some((p) => base === p || base.startsWith(`${p}/`)) ||
    AUTH_PREFIXES.some((p) => base === p || base.startsWith(`${p}/`))
  );
}

// Dashboard sesuai role — dipakai buat menendang user yang masuk area bukan miliknya.
function homeFor(role: string): string {
  return role === 'admin' ? '/admin/dashboard' : role === 'guru' ? '/teacher/dashboard' : '/home';
}

/** '/en/payments/x' -> { base: '/payments/x', prefix: '/en' }; id (tanpa prefix) -> prefix ''. */
function pisahkanLocale(pathname: string): { base: string; prefix: string } {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return { base: '/', prefix: `/${locale}` };
    if (pathname.startsWith(`/${locale}/`)) {
      return { base: pathname.slice(locale.length + 1), prefix: `/${locale}` };
    }
  }
  return { base: pathname, prefix: '' };
}

function isPrivat(base: string): boolean {
  return (
    base.startsWith('/admin') ||
    base.startsWith('/teacher') ||
    PARENT_PREFIXES.some((p) => base === p || base.startsWith(`${p}/`))
  );
}

export default auth((req) => {
  const { nextUrl } = req;
  const { base, prefix } = pisahkanLocale(nextUrl.pathname);
  const session = req.auth;

  // Tujuan redirect selalu dibangun ulang dengan prefix locale aktif, supaya
  // user English tidak dilempar ke halaman Indonesia.
  const ke = (path: string, query?: string) => {
    const url = new URL(prefix + path, nextUrl);
    if (query) url.search = query;
    return url;
  };

  let redirectRes: NextResponse | null = null;
  if (!session?.user) {
    if (isPrivat(base)) {
      const url = ke('/login');
      url.searchParams.set('next', prefix + base);
      redirectRes = NextResponse.redirect(url);
    }
  } else {
    const role = session.user.role;
    const home = homeFor(role);
    const diParent = PARENT_PREFIXES.some((p) => base === p || base.startsWith(`${p}/`));

    // Admin dan guru tidak boleh mengakses halaman public maupun auth
    if ((role === 'admin' || role === 'guru') && isPublic(base)) {
      redirectRes = NextResponse.redirect(ke(home));
    } else if (
      (base.startsWith('/admin') && role !== 'admin') ||
      (base.startsWith('/teacher') && role !== 'guru') ||
      (diParent && role !== 'orang_tua')
    ) {
      redirectRes = NextResponse.redirect(ke(home));
    }
  }

  if (redirectRes) return redirectRes;
  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Semua halaman, termasuk '/', perlu rewrite locale ke app/[locale].
    // API, internal Next.js, dan aset ber-ekstensi tidak ikut routing bahasa.
    '/((?!api(?:/|$)|_next(?:/|$)|_vercel(?:/|$)|.*\\..*).*)',
  ],
};
