'use server';

import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createPendaftaran } from '@/lib/services/pendaftaran';

export type DaftarState = { ok?: boolean; error?: string; pendaftaranId?: number };

const schema = z.object({
  anak_id: z.coerce.number().int().positive(),
  kelas_id: z.coerce.number().int().positive(),
  metode_bayar: z.enum(['lunas', 'dp_cicilan']),
  tenor_bulan: z.coerce.number().int().min(2).optional(),
});

export async function daftarKelas(
  _prev: DaftarState,
  formData: FormData,
): Promise<DaftarState> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'orang_tua')
    return { error: 'Sesi berakhir. Masuk ulang.' };

  const raw = {
    anak_id: formData.get('anak_id'),
    kelas_id: formData.get('kelas_id'),
    metode_bayar: formData.get('metode_bayar'),
    tenor_bulan: formData.get('tenor_bulan') || undefined,
  };
  const parsed = schema.safeParse(raw);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? 'Isian tidak valid.' };

  const result = await createPendaftaran({
    orangTuaId: Number(session.user.id),
    anakId: parsed.data.anak_id,
    kelasId: parsed.data.kelas_id,
    metodeBayar: parsed.data.metode_bayar,
    tenorBulan: parsed.data.tenor_bulan,
  });

  if (!result.ok) return { error: result.error };
  return { ok: true, pendaftaranId: result.value.pendaftaranId };
}
