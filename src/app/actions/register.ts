'use server';
import { getTranslations } from 'next-intl/server';
import { getLocaleDariCookie } from '@/i18n/locale';

import { redirect, getPathname } from '@/i18n/navigation';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/prisma/db';
import { signIn } from '@/lib/auth';

// Consent (privasi + wali, PRD F1/BR#25) TIDAK ditagih di sini — dipindah
// seluruhnya ke step 2 (AccountInfoForm) yang menagih berdasar cap DB.

// Kebijakan kata sandi — hanya panjang minimal; UI (checklist RegisterForm)
// dan server harus menuntut hal yang sama.
const registerSchema = (t: Awaited<ReturnType<typeof getTranslations<'auth'>>>) => z.object({
  email: z.string({error: t('invalidField')}).trim().toLowerCase().email(t('invalidEmail')),
  password: z.string({error: t('invalidField')}).min(8, t('passwordMin')),
});

export type RegisterState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  email?: string;
};

// PRD F1 + BR#25. Verifikasi email DITUNDA (belum ada SMTP) — akun langsung aktif,
// email_verified_at tetap null sampai fitur email masuk.
//
// Nama Lengkap juga pindah ke step 2 (AccountInfoForm). Kolom users.name NOT NULL
// dan dipakai session/navbar sejak akun dibuat → step 1 mengisi nama sementara
// dari prefix email (mis. budi@email.com → "budi"); step 2 menimpanya dengan nama
// asli sekaligus mencatat cap consent.
export async function registerParent(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const locale = await getLocaleDariCookie();
  const t = await getTranslations({locale, namespace: 'auth'});
  const emailKetik = String(formData.get('email') ?? '');
  const parsed = registerSchema(t).safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: t('checkForm'), fieldErrors, email: emailKetik };
  }
  const { email, password } = parsed.data;

  const existing = await db.orm.public.User.where((u) => u.email.eq(email)).first();
  if (existing)
    return { error: t('emailRegistered'), fieldErrors: { email: t('emailTaken') }, email };

  await db.orm.public.User.create({
    role: 'orang_tua',
    name: email.split('@')[0],
    email,
    password: await bcrypt.hash(password, 10),
    // BR#32: kolom NOT NULL — placeholder sampai user mengisi Nomor HP di
    // step 2 (saveAccountInfo memvalidasi minimal 8 karakter).
    nomorTelepon: '',
    // privasiDisetujuiAt / waliDisetujuiAt sengaja TIDAK diisi di sini —
    // consent dicatat saat step 2 (saveAccountInfo) setelah diceklis user.
  });

  try {
    await signIn('credentials', { email, password, redirectTo: getPathname({href: '/register/account-info', locale}) });
  } catch (e) {
    const digest = (e as { digest?: string })?.digest ?? '';
    if (digest.startsWith('NEXT_REDIRECT')) throw e;
    return redirect({href: '/login', locale});
  }
  return redirect({href: '/register/account-info', locale});
}
