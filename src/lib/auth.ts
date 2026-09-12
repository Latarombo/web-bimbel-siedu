import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { db } from '@/prisma/db';
import { authConfig } from '@/lib/auth.config';
import { prismaNextAdapter } from '@/lib/auth-adapter';

// Google hanya aktif kalau kredensial OAuth tersedia — dev tanpa .env Google
// tetap jalan (tombol Google di UI membaca GOOGLE_ENABLED untuk fallback disabled).
const googleEnabled = Boolean(
  process.env['AUTH_GOOGLE_ID'] && process.env['AUTH_GOOGLE_SECRET'],
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Adapter hanya dipakai alur OAuth (cabang credentials TIDAK menyentuh
  // adapter — diverifikasi dari @auth/core/lib/actions/callback/index.js).
  adapter: googleEnabled ? prismaNextAdapter : undefined,
  pages: {
    ...authConfig.pages,
    // User Google PERTAMA kali: sesi sudah dibuat, dialihkan ke step 2 wizard
    // registrasi (step 1 kredensial dilewati). Redirect dari callback signIn
    // TIDAK dipakai — itu terjadi sebelum sesi dibuat (user nyasar tanpa login).
    newUser: '/register/account-info',
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        const email = String(creds?.email ?? '').trim().toLowerCase();
        const password = String(creds?.password ?? '');
        if (!email || !password) return null;
        const user = await db.orm.public.User.where((u) => u.email.eq(email)).first();
        if (!user) return null;
        if (!(await bcrypt.compare(password, user.password))) return null;
        return { id: String(user.id), role: user.role, name: user.name };
      },
    }),
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env['AUTH_GOOGLE_ID'],
            clientSecret: process.env['AUTH_GOOGLE_SECRET'],
            // JANGAN diaktifkan: auto-link akun Google ke akun password existing
            // dengan email sama = vektor takeover. Email bentrok ditolak core
            // dengan OAuthAccountNotLinked → user diarahkan login password.
            allowDangerousEmailAccountLinking: false,
          }),
        ]
      : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Profil AdapterUser (OAuth) TIDAK membawa role — tanpa ini JWT user Google
    // tanpa role selamanya, dan proxy menendangnya bolak-balik (redirect loop).
    // Role diambil dari DB hanya saat event sign-in; decode biasa (proxy) tidak
    // menyentuh DB karena cabang `if (user)` tidak jalan.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const withRole = user as { role?: string };
        if (withRole.role) {
          token.role = withRole.role as 'admin' | 'guru' | 'orang_tua';
        } else {
          const row = await db.orm.public.User.where({ id: Number(user.id) }).first();
          token.role = (row?.role as 'admin' | 'guru' | 'orang_tua') ?? 'orang_tua';
        }
      }
      return token;
    },
  },
});
