'use server';
import { getTranslations } from 'next-intl/server';
import { getLocaleDariCookie } from '@/i18n/locale';

import { z } from 'zod';
import { db } from '@/prisma/db';
import { SUBJEK } from '@/lib/kontak';

/*
 * A7 — Formulir Kontak publik (halaman /contact). Pesan non-registrasi
 * disimpan ke pesan_kontak, dibaca admin di /admin/messages.
 * ponytail: TANPA rate limit — belum ada infrastruktur; kalau spam mulai
 * masuk, tambahkan guard (ip cookie / caps) di sini, bukan di komponen.
 */

const schema = (t: Awaited<ReturnType<typeof getTranslations<'auth'>>>) => z.object({
 nama: z.string({error: t('invalidField')}).trim().min(2, t('nameMin')).max(100, t('nameMax')),
 telepon: z
  .string({error: t('invalidField')})
  .trim()
  .min(8, t('phoneMin'))
  .max(30, t('phoneMax'))
  .regex(/^[0-9+\-\s()]*$/, t('phoneCharacters')),
 email: z.string({error: t('invalidField')}).trim().toLowerCase().max(255, t('emailMax')).email(t('invalidEmail')),
 sekolah: z.string({error: t('invalidField')}).trim().max(150, t('schoolMax')).optional().or(z.literal('')),
 jenjang: z.union([z.enum(['TK', 'SD', 'SMP', 'SMA'], {error: t('invalidLevel')}).optional(), z.literal('')], {error: t('invalidLevel')}),
 subjek: z.enum(SUBJEK, { message: t('subjectRequired') }),
 pesan: z.string({error: t('invalidField')}).trim().min(10, t('messageMin')).max(2000, t('messageMax')),
});

export type KontakState = {
 ok?: boolean;
 error?: string;
 fieldErrors?: Record<string, string>;
 // Echo isian teks mentah saat gagal (React 19 me-reset form uncontrolled).
 nama?: string;
 telepon?: string;
 email?: string;
 sekolah?: string;
 jenjang?: string;
 subjek?: string;
 pesan?: string;
};

export async function kirimPesanKontak(_prev: KontakState, formData: FormData): Promise<KontakState> {
  const locale = await getLocaleDariCookie();
  const t = await getTranslations({locale, namespace: 'auth'});
 const raw = {
  nama: String(formData.get('nama') ?? ''),
  telepon: String(formData.get('telepon') ?? ''),
  email: String(formData.get('email') ?? ''),
  sekolah: String(formData.get('sekolah') ?? ''),
  jenjang: String(formData.get('jenjang') ?? ''),
  subjek: String(formData.get('subjek') ?? ''),
  pesan: String(formData.get('pesan') ?? ''),
 };
 const parsed = schema(t).safeParse(raw);
 if (!parsed.success) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  return { error: t('checkForm'), fieldErrors, ...raw };
 }

 const d = parsed.data;
 await db.orm.public.PesanKontak.create({
  nama: d.nama,
  telepon: d.telepon,
  email: d.email,
  sekolah: d.sekolah || null,
  jenjang: d.jenjang || null,
  subjek: d.subjek,
  pesan: d.pesan,
 });
 return { ok: true };
}
