'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/prisma/db';
import { auth, signIn, signOut } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: 'Email atau password salah.' };

  const next = String(formData.get('next') ?? '');
  const target =
    next.startsWith('/') && !next.startsWith('//')
      ? next
      : await homeFor(parsed.data.email);

  try {
    await signIn('credentials', { ...parsed.data, redirectTo: target });
  } catch (e) {
    const digest = (e as { digest?: string })?.digest ?? '';
    if (digest.startsWith('NEXT_REDIRECT')) throw e;
    return { error: 'Email atau password salah.' };
  }
  redirect(target);
}

// Tanpa round-trip DB saat gagal; untuk sukses, redirectTo sudah ditentukan dari role.
async function homeFor(email: string): Promise<string> {
  const user = await db.orm.public.User.where((u) => u.email.eq(email)).first();
  if (!user) return '/login';
  return user.role === 'admin' ? '/admin/dashboard' : user.role === 'guru' ? '/teacher/dashboard' : '/home';
}

export async function logout() {
  await signOut({ redirectTo: '/' });
}

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}
