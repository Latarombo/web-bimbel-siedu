'use server';
import { getTranslations } from 'next-intl/server';
import { getLocaleDariCookie } from '@/i18n/locale';

import { redirect } from '@/i18n/navigation';
import { z } from 'zod';
import { db } from '@/prisma/db';
import { auth } from '@/lib/auth';

const schema = (t: Awaited<ReturnType<typeof getTranslations<'auth'>>>) => z.object({
  name: z.string({error: t('invalidField')}).trim().min(2, t('nameMin')),
  alamat: z.string({error: t('invalidField')}).trim().max(500, t('addressMax')).optional().or(z.literal('')),
  nomor_telepon: z
    .string({error: t('invalidField')})
    .trim()
    .min(8, t('phoneMinDigits'))
    .max(30, t('phoneMax'))
    .regex(/^[0-9+\-\s()]*$/, t('phoneCharacters')),
  // Consent PRD F1/BR#25 — wajib HANYA jika belum pernah disetujui
  // (akun Google melewati step 1, jadi consent ditagih di sini).
  consent_privasi: z.boolean().optional(),
  consent_wali: z.boolean().optional(),
});

export type AccountInfoState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  name?: string;
  nomor_telepon?: string;
  alamat?: string;
};

// BR#25 — lengkapi users.name (Nama Lengkap asli, menimpa nama sementara dari
// prefix email / nama profil Google), users.alamat & users.nomor_telepon.
export async function saveAccountInfo(
  _prev: AccountInfoState,
  formData: FormData,
): Promise<AccountInfoState> {
  const locale = await getLocaleDariCookie();
  const t = await getTranslations({locale, namespace: 'auth'});
  const session = await auth();
  if (!session?.user || session.user.role !== 'orang_tua')
    return { error: t('sessionExpired') };

  const parent = await db.orm.public.User
    .where({ id: Number(session.user.id) })
    .first();
  if (!parent) return { error: t('sessionExpired') };

  // Akun Google (dan akun lama) belum punya cap consent → consent ditagih di step 2.
  const needsConsent = !parent.privasiDisetujuiAt || !parent.waliDisetujuiAt;

  const nameKetik = String(formData.get('name') ?? '');
  const teleponKetik = String(formData.get('nomor_telepon') ?? '');
  const alamatKetik = String(formData.get('alamat') ?? '');
  const parsed = schema(t).safeParse({
    name: nameKetik,
    alamat: alamatKetik,
    nomor_telepon: teleponKetik,
    consent_privasi: formData.get('consent_privasi') === 'on',
    consent_wali: formData.get('consent_wali') === 'on',
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      fieldErrors[String(issue.path[0])] ??= issue.message;
    return {
      error: t('checkForm'),
      fieldErrors,
      name: nameKetik,
      nomor_telepon: teleponKetik,
      alamat: alamatKetik,
    };
  }
  const { name, alamat, nomor_telepon, consent_privasi, consent_wali } = parsed.data;

  const fieldErrors: Record<string, string> = {};
  if (needsConsent) {
    if (!consent_privasi) fieldErrors['consent_privasi'] = t('privacyRequired');
    if (!consent_wali) fieldErrors['consent_wali'] = t('guardianRequired');
  }
  if (Object.keys(fieldErrors).length > 0)
    return {
      error: t('checkForm'),
      fieldErrors,
      name: nameKetik,
      nomor_telepon: teleponKetik,
      alamat: alamatKetik,
    };

  const now = new Date().toISOString();
  await db.orm.public.User.where({ id: Number(session.user.id) }).update({
    name,
    alamat: alamat || null,
    nomorTelepon: nomor_telepon,
    ...(needsConsent ? { privasiDisetujuiAt: now, waliDisetujuiAt: now } : {}),
  });
  return redirect({href: '/register/child-info', locale});
}
