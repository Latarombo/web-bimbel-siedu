'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/prisma/db';
import { auth } from '@/lib/auth';

const schema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter'),
  alamat: z.string().trim().max(500).optional().or(z.literal('')),
  nomor_telepon: z.string().trim().max(30).optional().or(z.literal('')),
  // Consent PRD F1/BR#25 — wajib HANYA jika belum pernah disetujui
  // (akun Google melewati step 1, jadi consent ditagih di sini).
  consent_privasi: z.boolean().optional(),
  consent_wali: z.boolean().optional(),
});

export type AccountInfoState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  name?: string;
};

// BR#25 — lengkapi users.name (Nama Lengkap asli, menimpa nama sementara dari
// prefix email / nama profil Google), users.alamat & users.nomor_telepon.
export async function saveAccountInfo(
  _prev: AccountInfoState,
  formData: FormData,
): Promise<AccountInfoState> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'orang_tua')
    return { error: 'Sesi berakhir. Masuk ulang.' };

  const parent = await db.orm.public.User
    .where({ id: Number(session.user.id) })
    .first();
  if (!parent) return { error: 'Sesi berakhir. Masuk ulang.' };

  // Akun Google (dan akun lama) belum punya cap consent → consent ditagih di step 2.
  const needsConsent = !parent.privasiDisetujuiAt || !parent.waliDisetujuiAt;

  const nameKetik = String(formData.get('name') ?? '');
  const parsed = schema.safeParse({
    name: nameKetik,
    alamat: String(formData.get('alamat') ?? ''),
    nomor_telepon: String(formData.get('nomor_telepon') ?? ''),
    consent_privasi: formData.get('consent_privasi') === 'on',
    consent_wali: formData.get('consent_wali') === 'on',
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: 'Periksa lagi isian formulir.', fieldErrors, name: nameKetik };
  }
  const { name, alamat, nomor_telepon, consent_privasi, consent_wali } = parsed.data;

  const fieldErrors: Record<string, string> = {};
  if (needsConsent) {
    if (!consent_privasi) fieldErrors['consent_privasi'] = 'Setujui Kebijakan Privasi';
    if (!consent_wali) fieldErrors['consent_wali'] = 'Konfirmasi wali sah wajib dicentang';
  }
  if (Object.keys(fieldErrors).length > 0)
    return { error: 'Periksa lagi isian formulir.', fieldErrors, name: nameKetik };

  const now = new Date().toISOString();
  await db.orm.public.User.where({ id: Number(session.user.id) }).update({
    name,
    alamat: alamat || null,
    nomorTelepon: nomor_telepon || null,
    ...(needsConsent ? { privasiDisetujuiAt: now, waliDisetujuiAt: now } : {}),
  });
  redirect('/register/child-info');
}
