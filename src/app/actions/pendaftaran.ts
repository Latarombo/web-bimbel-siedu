'use server';

import { z } from 'zod';
import { getTranslations } from 'next-intl/server';
import { getLocaleDariCookie } from '@/i18n/locale';
import { auth } from '@/lib/auth';
import { createPendaftaran } from '@/lib/services/pendaftaran';

export type DaftarState = { ok?: boolean; error?: string; pendaftaranId?: number };

const schema = z.object({
  anak_id: z.coerce.number().int().positive(),
  kelas_id: z.coerce.number().int().positive(),
  metode_bayar: z.enum(['lunas', 'dp_cicilan']),
  tenor_bulan: z.coerce.number().int().min(2).optional(),
});

// Allowlist only service-authored messages; unknown/user-provided text stays verbatim.
const serviceErrorKeys: Record<string, string> = {
  "Anak tidak ditemukan untuk akun ini.": "enrollment.childMissing",
  "Lengkapi jenjang anak di profil dulu.": "enrollment.childLevel",
  "Kelas tidak ditemukan.": "enrollment.classMissing",
  "Kelas tidak aktif.": "enrollment.inactive",
  "Jenjang kelas tidak sesuai jenjang anak.": "enrollment.levelMismatch",
  "Kuota kelas sudah penuh.": "enrollment.full",
  "Pendaftaran periode ini tidak dibuka.": "enrollment.periodClosed",
  "Pendaftaran semester ini tidak dibuka.": "enrollment.periodClosed",
  "Metode cicilan tidak tersedia untuk kelas ini.": "enrollment.installmentsUnavailable",
  "Tenor minimal 2 (DP + minimal 1 cicilan).": "enrollment.minTerm",
  "Tenor hanya untuk metode DP+Cicilan.": "enrollment.termMethod",
  "Jadwal bentrok dengan kelas aktif lain.": "enrollment.conflict",
  "Gagal membuat pendaftaran.": "enrollment.failed",
  "Anak sudah punya pendaftaran aktif di kelas ini.": "enrollment.duplicate",
};

export async function daftarKelas(
  _prev: DaftarState,
  formData: FormData,
): Promise<DaftarState> {
  const locale = await getLocaleDariCookie();
  const t = await getTranslations({ locale, namespace: 'adminForms' });
  const session = await auth();
  if (!session?.user || session.user.role !== 'orang_tua')
    return { error: t('validation.session') };

  const raw = {
    anak_id: formData.get('anak_id'),
    kelas_id: formData.get('kelas_id'),
    metode_bayar: formData.get('metode_bayar'),
    // Field tenor selalu ada di DOM; hanya bermakna saat DP+Cicilan.
    // Bug lama: tenor ikut terkirim saat metode lunas → server menolak.
    tenor_bulan:
      formData.get('metode_bayar') === 'dp_cicilan'
        ? formData.get('tenor_bulan') || undefined
        : undefined,
  };
  const parsed = schema.safeParse(raw, { error: () => t('validation.invalid') });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? t('validation.invalid') };

  const result = await createPendaftaran({
    orangTuaId: Number(session.user.id),
    anakId: parsed.data.anak_id,
    kelasId: parsed.data.kelas_id,
    metodeBayar: parsed.data.metode_bayar,
    tenorBulan: parsed.data.tenor_bulan,
  });

  if (!result.ok) {
    const key = Object.prototype.hasOwnProperty.call(serviceErrorKeys, result.error)
      ? serviceErrorKeys[result.error] : undefined;
    if (key) return { error: t(key) };
    // The only dynamic service message contains a database integer, never user text.
    const termLimit = /^Tenor melebihi batas kelas \((\d+) bulan\)\.$/.exec(result.error);
    if (termLimit) return { error: t('enrollment.tenorLimit', { months: Number(termLimit[1]) }) };
    return { error: result.error };
  }
  return { ok: true, pendaftaranId: result.value.pendaftaranId };
}
