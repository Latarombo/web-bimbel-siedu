'use server';
import { getTranslations } from 'next-intl/server';
import { getLocaleDariCookie } from '@/i18n/locale';

import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/prisma/db';
import { validateIndonesianPhone, getPhoneLookupVariants } from '@/lib/phone';

const schema = (t: Awaited<ReturnType<typeof getTranslations<'auth'>>>) => z.object({
  name: z.string({error: t('invalidField')}).trim().min(2, t('nameMin')),
  alamat: z.string({error: t('invalidField')}).trim().min(5, t('streetAddressRequired')).max(500, t('addressMax')),
  nomor_telepon: z
    .string({error: t('invalidField')})
    .trim()
    .min(10, t('phoneMinDigits'))
    .max(20, t('phoneMax')),
});

export type ProfileState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  name?: string;
  alamat?: string;
  nomor_telepon?: string;
};

// C12 — Edit Account Profile. Email TIDAK bisa diubah di sini (butuh alur verifikasi
// email yang belum ada); tampil read-only di form.
export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const locale = await getLocaleDariCookie();
  const t = await getTranslations({locale, namespace: 'auth'});
  const session = await auth();
  if (!session?.user || session.user.role !== 'orang_tua')
    return { error: t('sessionExpired') };

  const raw = {
    name: String(formData.get('name') ?? ''),
    alamat: String(formData.get('alamat') ?? ''),
    nomor_telepon: String(formData.get('nomor_telepon') ?? ''),
  };
  const parsed = schema(t).safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: t('checkProfile'), fieldErrors, ...raw };
  }

  const phoneRes = validateIndonesianPhone(parsed.data.nomor_telepon);
  if (!phoneRes.valid) {
    return {
      error: t('checkProfile'),
      fieldErrors: { nomor_telepon: t(phoneRes.errorKey ?? 'phoneCharacters') },
      ...raw,
    };
  }

  const normalizedPhone = phoneRes.normalized!;
  const lookupVariants = getPhoneLookupVariants(normalizedPhone);
  const existingUser = await db.orm.public.User.where((u) => u.nomorTelepon.in(lookupVariants)).first();
  if (existingUser && existingUser.id !== Number(session.user.id)) {
    return {
      error: t('checkProfile'),
      fieldErrors: { nomor_telepon: t('phoneAlreadyUsed') },
      ...raw,
    };
  }

  await db.orm.public.User.where({ id: Number(session.user.id) }).update({
    name: parsed.data.name,
    alamat: parsed.data.alamat || null,
    nomorTelepon: normalizedPhone,
  });
  return { ok: true, name: parsed.data.name, alamat: raw.alamat, nomor_telepon: normalizedPhone };
}
