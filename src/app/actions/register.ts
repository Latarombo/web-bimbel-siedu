'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/prisma/db';
import { signIn } from '@/lib/auth';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter'),
  email: z.string().trim().toLowerCase().email('Email tidak valid'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Password harus punya 1 huruf besar')
    .regex(/[0-9]/, 'Password harus punya 1 angka'),
  privasi: z.literal(true, { error: 'Setujui Kebijakan Privasi' }),
  wali: z.literal(true, { error: 'Konfirmasi wali sah wajib dicentang' }),
});

export type RegisterState = { error?: string; fieldErrors?: Record<string, string> };

// PRD F1 + BR#25. Verifikasi email DITUNDA (belum ada SMTP) — akun langsung aktif,
// email_verified_at tetap null sampai fitur email masuk.
export async function registerParent(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    privasi: formData.get('privasi') === 'on',
    wali: formData.get('wali') === 'on',
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: 'Periksa lagi isian formulir.', fieldErrors };
  }
  const { name, email, password } = parsed.data;

  const existing = await db.orm.public.User.where((u) => u.email.eq(email)).first();
  if (existing) return { error: 'Email sudah terdaftar.', fieldErrors: { email: 'Sudah dipakai' } };

  const now = new Date().toISOString();
  await db.orm.public.User.create({
    role: 'orang_tua',
    name,
    email,
    password: await bcrypt.hash(password, 10),
    privasiDisetujuiAt: now,
    waliDisetujuiAt: now,
  });

  try {
    await signIn('credentials', { email, password, redirectTo: '/register/account-info' });
  } catch (e) {
    const digest = (e as { digest?: string })?.digest ?? '';
    if (digest.startsWith('NEXT_REDIRECT')) throw e;
    redirect('/login');
  }
  redirect('/register/account-info');
}
