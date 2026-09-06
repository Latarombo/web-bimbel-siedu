import type { NextAuthConfig } from 'next-auth';

// Config TANPA import db/bcrypt — dipakai proxy.ts (edge-ish CDN lane) dan auth.ts.
export const authConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'admin' | 'guru' | 'orang_tua';
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
