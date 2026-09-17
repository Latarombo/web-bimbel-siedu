'use server';
import { getTranslations } from 'next-intl/server';
import { getLocaleDariCookie } from '@/i18n/locale';

import { redirect, getPathname } from '@/i18n/navigation';
import { z } from 'zod';
import { db } from '@/prisma/db';
import { auth, signIn, signOut } from '@/lib/auth';
import { homeUntukUser } from '@/lib/orang-tua-lengkap';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export type LoginState = { error?: string; email?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const locale = await getLocaleDariCookie();
  const t = await getTranslations({locale, namespace: 'auth'});
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  // Email dikirim balik supaya field tetap terisi saat gagal (password tidak pernah di-echo).
  const emailKetik = String(formData.get('email') ?? '');
  if (!parsed.success) return { error: t('invalidCredentials'), email: emailKetik };

  const next = String(formData.get('next') ?? '');
  const target =
    next.startsWith('/') && !next.startsWith('//')
      ? next.replace(/^\/(?:en|id)(?=\/(?!\/)|[?#]|$)/, '') || '/'
      : await homeFor(parsed.data.email);

  try {
    await signIn('credentials', { ...parsed.data, redirectTo: getPathname({href: target, locale}) });
  } catch (e) {
    const digest = (e as { digest?: string })?.digest ?? '';
    if (digest.startsWith('NEXT_REDIRECT')) throw e;
    return { error: t('invalidCredentials'), email: emailKetik };
  }
  return redirect({href: target, locale});
}

// Tanpa round-trip DB saat gagal; untuk sukses, redirectTo sudah ditentukan dari role.
// Orang tua yang wizard-nya belum tuntas diarahkan ke step 2, bukan /home —
// kalau tidak, layout gate langsung menendangnya balik (redirect terasa berputar).
async function homeFor(email: string): Promise<string> {
 const user = await db.orm.public.User.where((u) => u.email.eq(email)).first();
 if (!user) return '/login';
 return homeUntukUser({ id: user.id, role: user.role });
}

export async function logout() {
  const locale = await getLocaleDariCookie();
  await signOut({ redirectTo: getPathname({href: '/', locale}) });
}

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}
