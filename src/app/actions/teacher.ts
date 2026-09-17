'use server';

import { z } from 'zod';
import { getTranslations } from 'next-intl/server';
import { getLocaleDariCookie } from '@/i18n/locale';
import { revalidatePath } from 'next/cache';
import { db } from '@/prisma/db';
import { auth } from '@/lib/auth';
import { collect } from '@/lib/collect';
import { hariDariTanggal, dalamJendela7Hari, tanggalValid } from '@/lib/hari';

export type GuruState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

async function guardGuru(): Promise<number | null> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'guru') return null;
  return Number(session.user.id);
}

// --- D7 profil guru ---
export async function updateGuruProfile(
  _prev: GuruState,
  formData: FormData,
): Promise<GuruState> {
  const locale = await getLocaleDariCookie();
  const t = await getTranslations({ locale, namespace: "teacher" });
  const guruId = await guardGuru();
  if (!guruId) return { error: t("sessionExpired") };

  const profilSchema = z.object({
    nama: z.string({ error: t("invalidField") }).trim().min(2, t("nameMin")),
    alamat: z.string({ error: t("invalidField") }).trim().max(255, t("addressMax")).optional().or(z.literal('')),
    nomor_telepon: z
      .string({ error: t("invalidField") })
      .trim()
      .min(8, t("phoneRequired"))
      .max(30, t("phoneMax")),
  });

  const parsed = profilSchema.safeParse({
    nama: formData.get('nama'),
    alamat: formData.get('alamat') ?? '',
    nomor_telepon: formData.get('nomor_telepon') ?? '',
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      fieldErrors[String(issue.path[0])] ??= issue.code === 'invalid_union' ? t("invalidField") : issue.message;
    return { error: t("checkFields"), fieldErrors };
  }
  const d = parsed.data;

  await db.orm.public.User.where({ id: guruId }).update({
    name: d.nama,
    alamat: d.alamat || null,
    nomorTelepon: d.nomor_telepon,
  });
  revalidatePath('/[locale]/teacher/profile', 'page');
  return { ok: true };
}

// --- D3 presensi (BR#18: edit bebas 7 hari sejak input pertama) ---
const STATUS_PRESENSI = ['hadir', 'izin', 'sakit', 'alpa'] as const;

export async function savePresensi(
  _prev: GuruState,
  formData: FormData,
): Promise<GuruState> {
  const locale = await getLocaleDariCookie();
  const t = await getTranslations({ locale, namespace: "teacher" });
  const guruId = await guardGuru();
  if (!guruId) return { error: t("sessionExpired") };

  const kelasId = Number(formData.get('kelas_id'));
  const jadwalItemId = Number(formData.get('jadwal_item_id'));
  const tanggal = String(formData.get('tanggal') ?? '');
  if (!Number.isInteger(kelasId) || !Number.isInteger(jadwalItemId))
    return { error: t("invalidParameters") };
  if (!tanggalValid(tanggal)) return { error: t("invalidDate") };

  const result = await db.transaction(async (tx): Promise<GuruState> => {
    // Kelas harus diampu guru ini, dan jadwal item milik kelas itu.
    // Serialize this class with calendar syncs; recheck ownership under the lock.
    const [kelas] = await collect(tx.query(
      db.raw.sql`select id, periode_id as "periodeId", status from public.kelas
        where id = ${kelasId} and guru_id = ${guruId} for update`
        .returnsRow({ id: 'pg/int4@1', periodeId: 'pg/int4@1', status: 'pg/text@1' }).build(),
    ));
    if (!kelas) return { error: t("classNotOwned") };
    if (kelas.status === 'dibatalkan') return { error: t("attendanceClassCancelled") };

    const [periode] = await collect(
      tx.orm.public.PeriodePendaftaran.where((p) => p.id.eq(kelas.periodeId)).all(),
    );
    if (!periode || tanggal < periode.tanggalMulai || tanggal > periode.tanggalSelesai)
      return { error: t("attendanceOutsidePeriod") };

    const jadwal = await collect(
      tx.orm.public.JadwalItem.where((j) => j.kelasId.eq(kelasId)).all(),
    );
    const item = jadwal.find((j) => j.id === jadwalItemId);
    if (!item) return { error: t("invalidSession") };

    // Lock an existing occurrence too, so an admin cancellation cannot race a save.
    const [savedSession] = await collect(tx.query(
      db.raw.sql`select id, status_sesi as "statusSesi" from public.sesi_pertemuan
        where jadwal_item_id = ${jadwalItemId} and tanggal_pertemuan = ${tanggal} for update`
        .returnsRow({ id: 'pg/int4@1', statusSesi: 'pg/text@1' }).build(),
    ));
    if (!savedSession && hariDariTanggal(tanggal) !== item.hari)
      return { error: t("wrongWeekday", { day: t(`day_${item.hari}`) }) };
    if (savedSession?.statusSesi === 'dibatalkan')
      return { error: t("attendanceSessionCancelled") };
    // Create only the submitted occurrence, not future rosters or legacy history.
    let sesiPertemuanId = savedSession?.id;

    const existing = await collect(
      tx.orm.public.Presensi.where((x) => x.jadwalItemId.eq(jadwalItemId))
        .where((x) => x.tanggalPertemuan.eq(tanggal))
        .all(),
    );
    const existingMap = new Map(existing.map((e) => [e.pendaftaranId, e]));
    // Existing attendance is evidence for this occurrence, even after withdrawal.
    // Do not infer other past memberships from a current cancellation status.
    const pendaftaranKelas = await collect(
      tx.orm.public.Pendaftaran.where((p) => p.kelasId.eq(kelasId)).all(),
    );
    const siswa = pendaftaranKelas.filter((p) =>
      p.status === 'terdaftar' || p.status === 'tertunggak' || existingMap.has(p.id),
    );

    let ditolak = 0;
    for (const s of siswa) {
      const status = formData.get(`presensi_${s.id}`);
      if (typeof status !== 'string' || !STATUS_PRESENSI.includes(status as never)) continue;

      const catatan = String(formData.get(`catatan_${s.id}`) ?? '').trim() || null;
      const lama = existingMap.get(s.id);

      if (lama && !dalamJendela7Hari(lama.createdAt)) {
        ditolak += 1;
        continue; // Legacy per-row correction rule; session-level audit is a later step.
      }
      if (sesiPertemuanId === undefined) {
        const sesi = await tx.orm.public.SesiPertemuan.create({
          jadwalItemId,
          tanggalPertemuan: tanggal,
          jamMulai: item.jamMulai,
          jamSelesai: item.jamSelesai,
        });
        sesiPertemuanId = sesi.id;
      }
      if (lama) {
        await tx.orm.public.Presensi.where({ id: lama.id }).update({
          sesiPertemuanId,
          status: status as (typeof STATUS_PRESENSI)[number],
          catatan,
          dicatatOleh: guruId,
        });
      } else {
        await tx.orm.public.Presensi.create({
          sesiPertemuanId,
          pendaftaranId: s.id,
          jadwalItemId,
          dicatatOleh: guruId,
          tanggalPertemuan: tanggal,
          status: status as (typeof STATUS_PRESENSI)[number],
          catatan,
        });
      }
    }
    if (ditolak > 0)
      return {
        ok: true,
        error: t("lockedAttendanceError", { count: ditolak }),
      };
    return { ok: true };
  });
  if (result.error) return result;

  revalidatePath('/[locale]/teacher/classes/[classId]/sessions/[date]/attendance', 'page');
  return { ok: true };
}

// --- D5 nilai (BR#18 sama) ---
export async function saveNilai(_prev: GuruState, formData: FormData): Promise<GuruState> {
  const locale = await getLocaleDariCookie();
  const t = await getTranslations({ locale, namespace: "teacher" });
  const guruId = await guardGuru();
  if (!guruId) return { error: t("sessionExpired") };

  const nilaiSchema = z.object({
    pendaftaran_id: z.coerce.number({ error: t("invalidField") }).int(t("invalidParameters")).positive(t("invalidParameters")),
    tanggal: z.string({ error: t("invalidField") }).regex(/^\d{4}-\d{2}-\d{2}$/, t("dateRequired")),
    nilai: z.coerce.number({ error: t("invalidField") }).min(0, t("gradeRange")).max(100, t("gradeRange")).optional(),
    catatan: z.string({ error: t("invalidField") }).trim().max(1000, t("notesMax")).optional().or(z.literal('')),
  });

  const parsed = nilaiSchema.safeParse({
    pendaftaran_id: formData.get('pendaftaran_id'),
    tanggal: formData.get('tanggal'),
    nilai: formData.get('nilai') || undefined,
    catatan: formData.get('catatan') ?? '',
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      fieldErrors[String(issue.path[0])] ??= issue.code === 'invalid_union' ? t("invalidField") : issue.message;
    return { error: t("checkGradeFields"), fieldErrors };
  }
  const d = parsed.data;
  if (d.nilai == null && !d.catatan)
    return { error: t("gradeOrNotesRequired") };

  // Pendaftaran harus di kelas yang diampu guru ini.
  const [p] = await collect(
    db.orm.public.Pendaftaran.where((x) => x.id.eq(d.pendaftaran_id)).all(),
  );
  if (!p) return { error: t("enrollmentNotFound") };
  const [k] = await collect(
    db.orm.public.Kelas.where((x) => x.id.eq(p.kelasId))
      .where((x) => x.guruId.eq(guruId))
      .all(),
  );
  if (!k) return { error: t("studentNotOwned") };

  const nilaiId = Number(formData.get('nilai_id') ?? 0);
  if (Number.isInteger(nilaiId) && nilaiId > 0) {
    const [lama] = await collect(
      db.orm.public.NilaiProgres.where((x) => x.id.eq(nilaiId)).all(),
    );
    if (!lama || lama.pendaftaranId !== d.pendaftaran_id)
      return { error: t("gradeNotFound") };
    if (!dalamJendela7Hari(lama.createdAt))
      return {
        error:
          t("lockedGradeError"),
      };
    await db.orm.public.NilaiProgres.where({ id: nilaiId }).update({
      tanggal: d.tanggal,
      nilaiKuantitatif: d.nilai == null ? null : String(d.nilai),
      catatanKualitatif: d.catatan || null,
      dicatatOleh: guruId,
    });
  } else {
    await db.orm.public.NilaiProgres.create({
      pendaftaranId: d.pendaftaran_id,
      dicatatOleh: guruId,
      tanggal: d.tanggal,
      nilaiKuantitatif: d.nilai == null ? null : String(d.nilai),
      catatanKualitatif: d.catatan || null,
    });
  }
  revalidatePath('/[locale]/teacher/grades/[enrollmentId]', 'page');
  return { ok: true };
}
