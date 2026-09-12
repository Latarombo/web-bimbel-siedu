'use server';

import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/prisma/db';

const schema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter'),
  alamat: z.string().trim().max(500, 'Alamat maksimal 500 karakter').optional().or(z.literal('')),
  nomor_telepon: z
    .string()
    .trim()
    .max(30, 'Nomor maksimal 30 karakter')
    .regex(/^[0-9+\-\s()]*$/, 'Nomor hanya angka, spasi, + atau -')
    .optional()
    .or(z.literal('')),
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
  const session = await auth();
  if (!session?.user || session.user.role !== 'orang_tua')
    return { error: 'Sesi berakhir. Masuk ulang.' };

  const raw = {
    name: String(formData.get('name') ?? ''),
    alamat: String(formData.get('alamat') ?? ''),
    nomor_telepon: String(formData.get('nomor_telepon') ?? ''),
  };
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: 'Periksa lagi isian profil.', fieldErrors, ...raw };
  }

  await db.orm.public.User.where({ id: Number(session.user.id) }).update({
    name: parsed.data.name,
    alamat: parsed.data.alamat || null,
    nomorTelepon: parsed.data.nomor_telepon || null,
  });
  return { ok: true, name: parsed.data.name, alamat: raw.alamat, nomor_telepon: raw.nomor_telepon };
}
