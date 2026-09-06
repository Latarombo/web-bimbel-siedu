import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/prisma/db';
import { authConfig } from '@/lib/auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
  ],
});
