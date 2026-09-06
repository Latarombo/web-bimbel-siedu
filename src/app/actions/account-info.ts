'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/prisma/db';
import { auth } from '@/lib/auth';

const schema = z.object({
  alamat: z.string().trim().max(500).optional().or(z.literal('')),
  nomor_telepon: z.string().trim().max(30).optional().or(z.literal('')),
});

export type AccountInfoState = { error?: string };

// BR#25 — lengkapi users.alamat & users.nomor_telepon untuk orang tua yang login.
export async function saveAccountInfo(
  _prev: AccountInfoState,
  formData: FormData,
): Promise<AccountInfoState> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'orang_tua')
    return { error: 'Sesi berakhir. Masuk ulang.' };

  const parsed = schema.safeParse({
    alamat: String(formData.get('alamat') ?? ''),
    nomor_telepon: String(formData.get('nomor_telepon') ?? ''),
  });
  if (!parsed.success) return { error: 'Isian tidak valid.' };

  await db.orm.public.User.where({ id: Number(session.user.id) }).update({
    alamat: parsed.data.alamat || null,
    nomorTelepon: parsed.data.nomor_telepon || null,
  });
  redirect('/register/child-info');
}
