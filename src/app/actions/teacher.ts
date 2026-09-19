'use server';

import { z } from 'zod';
import { getTranslations } from 'next-intl/server';
import { getLocaleDariCookie } from '@/i18n/locale';
import { revalidatePath } from 'next/cache';
import { db } from '@/prisma/db';
import { auth } from '@/lib/auth';
import { collect } from '@/lib/collect';
import { hariDariTanggal, dalamJendela7Hari, tanggalValid } from '@/lib/hari';
import { validateLaporanInput } from '@/lib/laporan-perkembangan';

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

// --- M2 catatan pertemuan (materi & PR) ---
export async function saveCatatanPertemuan(
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
  const materi = String(formData.get('materi') ?? '').trim();
  const pr = String(formData.get('pr') ?? '').trim();
  const aksi = String(formData.get('aksi') ?? 'draf');

  if (!Number.isInteger(kelasId) || !Number.isInteger(jadwalItemId))
    return { error: t("invalidParameters") };
  if (!tanggalValid(tanggal)) return { error: t("invalidDate") };

  if (aksi === 'terbitkan' && !materi) {
    return { error: t("materiRequiredToPublish") };
  }

  const result = await db.transaction(async (tx): Promise<GuruState> => {
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

    const [savedSession] = await collect(tx.query(
      db.raw.sql`select id, status_sesi as "statusSesi" from public.sesi_pertemuan
        where jadwal_item_id = ${jadwalItemId} and tanggal_pertemuan = ${tanggal} for update`
        .returnsRow({ id: 'pg/int4@1', statusSesi: 'pg/text@1' }).build(),
    ));
    if (!savedSession && hariDariTanggal(tanggal) !== item.hari)
      return { error: t("wrongWeekday", { day: t(`day_${item.hari}`) }) };
    if (savedSession?.statusSesi === 'dibatalkan')
      return { error: t("attendanceSessionCancelled") };

    let sesiPertemuanId = savedSession?.id;
    if (sesiPertemuanId === undefined) {
      const sesi = await tx.orm.public.SesiPertemuan.create({
        jadwalItemId,
        tanggalPertemuan: tanggal,
        jamMulai: item.jamMulai,
        jamSelesai: item.jamSelesai,
      });
      sesiPertemuanId = sesi.id;
    }

    const [existingCatatan] = await collect(
      tx.orm.public.CatatanPertemuan.where((c) => c.sesiId.eq(sesiPertemuanId)).all(),
    );

    const isDraf = aksi !== 'terbitkan';
    const diterbitkanPada = aksi === 'terbitkan'
      ? new Date().toISOString()
      : aksi === 'tarik'
        ? null
        : (existingCatatan?.diterbitkanPada ?? null);

    if (existingCatatan) {
      await tx.orm.public.CatatanPertemuan.where({ id: existingCatatan.id }).update({
        materi: materi || null,
        pr: pr || null,
        draf: isDraf,
        diterbitkanPada,
        dicatatOleh: guruId,
      });
    } else {
      await tx.orm.public.CatatanPertemuan.create({
        sesiId: sesiPertemuanId,
        materi: materi || null,
        pr: pr || null,
        draf: isDraf,
        diterbitkanPada,
        dicatatOleh: guruId,
      });
    }

    return { ok: true };
  });

  if (result.error) return result;

  revalidatePath('/[locale]/teacher/classes/[classId]/sessions/[date]/attendance', 'page');
  revalidatePath('/[locale]/schedule-attendance', 'page');
  return { ok: true };
}

// --- M2 pengajuan koreksi entri terkunci ---
export async function ajukanKoreksi(
  prevOrFormData: GuruState | FormData,
  maybeFormData?: FormData,
): Promise<GuruState> {
  const formData = (typeof FormData !== "undefined" && maybeFormData instanceof FormData)
    ? maybeFormData
    : (typeof FormData !== "undefined" && prevOrFormData instanceof FormData)
      ? prevOrFormData
      : (maybeFormData ?? prevOrFormData) as FormData;
  const locale = await getLocaleDariCookie();
  const t = await getTranslations({ locale, namespace: "teacher" });
  const guruId = await guardGuru();
  if (!guruId) return { error: t("sessionExpired") };

  const entitas = String(formData.get("entitas") ?? "");
  const entitasId = Number(formData.get("entitas_id"));
  const dataUsulan = String(formData.get("data_usulan") ?? "").trim();
  const alasan = String(formData.get("alasan") ?? "").trim();

  if (!["presensi", "nilai"].includes(entitas) || !Number.isInteger(entitasId) || entitasId <= 0) {
    return { error: t("invalidParameters") };
  }
  if (!dataUsulan) {
    return { error: t("dataUsulanRequired") };
  }
  if (!alasan || alasan.length < 5) {
    return { error: t("correctionReasonMin") };
  }

  let dataSebelum: string | null = null;
  if (entitas === "presensi") {
    const [p] = await collect(db.orm.public.Presensi.where({ id: entitasId }).all());
    if (!p) return { error: t("attendanceNotFound") };
    if (p.dicatatOleh !== guruId) return { error: t("notOwned") };
    dataSebelum = JSON.stringify({ status: p.status, catatan: p.catatan });
  } else if (entitas === "nilai") {
    const [n] = await collect(db.orm.public.NilaiProgres.where({ id: entitasId }).all());
    if (!n) return { error: t("gradeNotFound") };
    if (n.dicatatOleh !== guruId) return { error: t("notOwned") };
    dataSebelum = JSON.stringify({ nilaiKuantitatif: n.nilaiKuantitatif, catatanKualitatif: n.catatanKualitatif });
  }

  await db.transaction(async (tx) => {
    await tx.orm.public.PengajuanKoreksi.create({
      guruId,
      entitas,
      entitasId,
      status: "menunggu",
      dataSebelum,
      dataUsulan,
      alasan,
    });

    await tx.orm.public.AuditPerubahan.create({
      entitas,
      entitasId,
      aksi: "ajukan_koreksi",
      sebelum: dataSebelum,
      sesudah: dataUsulan,
      alasan,
      aktorId: guruId,
    });
  });

  revalidatePath("/[locale]/teacher/corrections", "page");
  revalidatePath("/[locale]/admin/corrections", "page");
  return { ok: true };
}

// --- M4 Penilaian kelas massal ---
export async function savePenilaianBatch(
  prevOrFormData: GuruState | FormData,
  maybeFormData?: FormData,
): Promise<GuruState> {
  const formData = (typeof FormData !== "undefined" && maybeFormData instanceof FormData)
    ? maybeFormData
    : (typeof FormData !== "undefined" && prevOrFormData instanceof FormData)
      ? prevOrFormData
      : (maybeFormData ?? prevOrFormData) as FormData;
  const locale = await getLocaleDariCookie();
  const t = await getTranslations({ locale, namespace: "teacher" });
  const guruId = await guardGuru();
  if (!guruId) return { error: t("sessionExpired") };

  const kelasId = Number(formData.get("kelas_id"));
  const penilaianIdRaw = formData.get("penilaian_id");
  const penilaianId = penilaianIdRaw ? Number(penilaianIdRaw) : null;
  const nama = String(formData.get("nama") ?? "").trim();
  const tanggal = String(formData.get("tanggal") ?? "").trim();
  const nilaiMaksimumRaw = formData.get("nilai_maksimum");
  const nilaiMaksimum = nilaiMaksimumRaw ? Number(nilaiMaksimumRaw) : 100;
  const aksi = String(formData.get("aksi") ?? "simpan_draf"); // 'simpan_draf' | 'terbitkan'

  if (!Number.isInteger(kelasId) || kelasId <= 0) return { error: t("invalidParameters") };
  if (!nama) return { error: t("assessmentNameRequired") };
  if (!tanggalValid(tanggal)) return { error: t("invalidDate") };
  if (isNaN(nilaiMaksimum) || nilaiMaksimum <= 0) return { error: t("invalidMaxScore") };

  // Guard kepemilikan kelas & status
  const [kelas] = await collect(
    db.orm.public.Kelas.where({ id: kelasId, guruId }).all()
  );
  if (!kelas) return { error: t("notYourClass") };
  if (kelas.status === "dibatalkan") return { error: t("classCancelled") };

  // Validasi periode ajar kelas
  const [periode] = await collect(
    db.orm.public.PeriodePendaftaran.where({ id: kelas.periodeId }).all()
  );
  if (periode && (tanggal < periode.tanggalMulai || tanggal > periode.tanggalSelesai)) {
    return { error: t("dateOutsidePeriod") };
  }

  // Ambil peserta kelas
  const pendaftaran = await collect(
    db.orm.public.Pendaftaran.where({ kelasId }).all()
  );
  const activePendaftaran = pendaftaran.filter(
    (p) => p.status === "terdaftar" || p.status === "tertunggak"
  );

  const hasilItems: {
    pendaftaranId: number;
    statusHasil: "belum_dinilai" | "dinilai" | "tidak_ikut";
    nilai: number | null;
    catatan: string | null;
  }[] = [];

  for (const p of activePendaftaran) {
    const statusRaw = String(formData.get(`status_${p.id}`) ?? "belum_dinilai");
    let statusHasil: "belum_dinilai" | "dinilai" | "tidak_ikut" = ["belum_dinilai", "dinilai", "tidak_ikut"].includes(statusRaw)
      ? (statusRaw as "belum_dinilai" | "dinilai" | "tidak_ikut")
      : "belum_dinilai";
    const nilaiStr = formData.get(`nilai_${p.id}`);
    const catatanStr = String(formData.get(`catatan_${p.id}`) ?? "").trim();

    let nilaiNum: number | null = null;
    if (statusHasil === "dinilai") {
      if (nilaiStr === null || nilaiStr === undefined || String(nilaiStr).trim() === "") {
        statusHasil = "belum_dinilai";
      } else {
        nilaiNum = Number(nilaiStr);
        if (isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > nilaiMaksimum) {
          return { error: t("scoreOutOfRange", { max: nilaiMaksimum }) };
        }
      }
    }

    hasilItems.push({
      pendaftaranId: p.id,
      statusHasil,
      nilai: statusHasil === "dinilai" ? nilaiNum : null,
      catatan: catatanStr || null,
    });
  }

  const isDraf = aksi !== "terbitkan";
  const diterbitkanPada = !isDraf ? new Date().toISOString() : null;

  await db.transaction(async (tx) => {
    let currentPenilaianId = penilaianId;
    if (currentPenilaianId) {
      const [existing] = await collect(
        tx.orm.public.Penilaian.where({ id: currentPenilaianId, kelasId, dibuatOleh: guruId }).all()
      );
      if (!existing) throw new Error(t("assessmentNotFound"));

      await tx.orm.public.Penilaian.where({ id: currentPenilaianId }).update({
        nama,
        tanggal,
        nilaiMaksimum: String(nilaiMaksimum),
        draf: isDraf,
        diterbitkanPada: diterbitkanPada ?? existing.diterbitkanPada,
      });
    } else {
      const created = await tx.orm.public.Penilaian.create({
        kelasId,
        nama,
        tanggal,
        nilaiMaksimum: String(nilaiMaksimum),
        draf: isDraf,
        diterbitkanPada,
        dibuatOleh: guruId,
      });
      currentPenilaianId = created.id;
    }

    for (const h of hasilItems) {
      const [existingHasil] = await collect(
        tx.orm.public.HasilPenilaian.where({
          penilaianId: currentPenilaianId,
          pendaftaranId: h.pendaftaranId,
        }).all()
      );
      if (existingHasil) {
        await tx.orm.public.HasilPenilaian.where({ id: existingHasil.id }).update({
          statusHasil: h.statusHasil,
          nilai: h.nilai !== null ? String(h.nilai) : null,
          catatan: h.catatan,
        });
      } else {
        await tx.orm.public.HasilPenilaian.create({
          penilaianId: currentPenilaianId,
          pendaftaranId: h.pendaftaranId,
          statusHasil: h.statusHasil,
          nilai: h.nilai !== null ? String(h.nilai) : null,
          catatan: h.catatan,
        });
      }
    }
  });

  revalidatePath("/[locale]/teacher/grades", "page");
  revalidatePath("/[locale]/teacher/classes/[classId]", "page");
  revalidatePath("/[locale]/schedule-attendance", "page");
  return { ok: true };
}

export async function tarikPenilaian(
  prevOrFormData: GuruState | FormData,
  maybeFormData?: FormData,
): Promise<GuruState> {
  const formData = (typeof FormData !== "undefined" && maybeFormData instanceof FormData)
    ? maybeFormData
    : (typeof FormData !== "undefined" && prevOrFormData instanceof FormData)
      ? prevOrFormData
      : (maybeFormData ?? prevOrFormData) as FormData;
  const locale = await getLocaleDariCookie();
  const t = await getTranslations({ locale, namespace: "teacher" });
  const guruId = await guardGuru();
  if (!guruId) return { error: t("sessionExpired") };

  const penilaianId = Number(formData.get("penilaian_id"));
  if (!Number.isInteger(penilaianId) || penilaianId <= 0) return { error: t("invalidParameters") };

  const [p] = await collect(
    db.orm.public.Penilaian.where({ id: penilaianId, dibuatOleh: guruId }).all()
  );
  if (!p) return { error: t("assessmentNotFound") };

  await db.orm.public.Penilaian.where({ id: penilaianId }).update({
    draf: true,
    diterbitkanPada: null,
  });

  revalidatePath("/[locale]/teacher/grades", "page");
  revalidatePath("/[locale]/teacher/classes/[classId]", "page");
  revalidatePath("/[locale]/schedule-attendance", "page");
  return { ok: true };
}

// --- M5 Perkembangan murid: pemisahan catatan internal vs laporan orang tua ---

export async function saveLaporanPerkembangan(
  prevOrFormData: GuruState | FormData | Record<string, unknown>,
  maybeFormData?: FormData,
): Promise<GuruState> {
  const isDirectObject = typeof FormData !== "undefined" && !(prevOrFormData instanceof FormData) && !(maybeFormData instanceof FormData);
  let pendaftaranId: number;
  let laporanId: number | null = null;
  let tanggal: string;
  let judul: string;
  let catatanInternal: string | null = null;
  let laporanOrtu: string | null = null;
  let isDraf = true;

  if (isDirectObject) {
    const obj = prevOrFormData as Record<string, unknown>;
    pendaftaranId = Number(obj.pendaftaranId);
    laporanId = obj.laporanId ? Number(obj.laporanId) : null;
    tanggal = String(obj.tanggal ?? "").trim();
    judul = String(obj.judul ?? "Laporan Perkembangan").trim();
    catatanInternal = obj.catatanInternal ? String(obj.catatanInternal).trim() : null;
    laporanOrtu = obj.laporanOrtu ? String(obj.laporanOrtu).trim() : null;
    isDraf = obj.draf !== false;
  } else {
    const formData = (typeof FormData !== "undefined" && maybeFormData instanceof FormData)
      ? maybeFormData
      : (prevOrFormData as FormData);
    pendaftaranId = Number(formData.get("pendaftaran_id"));
    const lidRaw = formData.get("laporan_id");
    laporanId = lidRaw ? Number(lidRaw) : null;
    tanggal = String(formData.get("tanggal") ?? "").trim();
    judul = String(formData.get("judul") ?? "Laporan Perkembangan").trim();
    const ciRaw = formData.get("catatan_internal");
    catatanInternal = ciRaw ? String(ciRaw).trim() : null;
    const loRaw = formData.get("laporan_ortu");
    laporanOrtu = loRaw ? String(loRaw).trim() : null;
    const aksi = String(formData.get("aksi") ?? "draf");
    isDraf = aksi === "draf";
  }

  const locale = await getLocaleDariCookie();
  const t = await getTranslations({ locale, namespace: "teacher" });
  const guruId = await guardGuru();
  if (!guruId) return { error: t("sessionExpired") };

  if (!Number.isInteger(pendaftaranId) || pendaftaranId <= 0) {
    return { error: t("invalidParameters") };
  }
  if (!tanggalValid(tanggal)) return { error: t("invalidDate") };

  const validationError = validateLaporanInput({
    tanggal,
    catatanInternal,
    laporanOrtu,
    draf: isDraf,
  });
  if (validationError) return { error: validationError };

  // Guard kepemilikan kelas via pendaftaran
  const [pendaftaran] = await collect(
    db.orm.public.Pendaftaran.where({ id: pendaftaranId }).all()
  );
  if (!pendaftaran) return { error: t("enrollmentNotFound") };

  const [kelas] = await collect(
    db.orm.public.Kelas.where({ id: pendaftaran.kelasId, guruId }).all()
  );
  if (!kelas) return { error: t("notYourClass") };
  if (kelas.status === "dibatalkan") return { error: t("classCancelled") };

  // Guard periode pendaftaran
  const [periode] = await collect(
    db.orm.public.PeriodePendaftaran.where({ id: kelas.periodeId }).all()
  );
  if (periode && (tanggal < periode.tanggalMulai || tanggal > periode.tanggalSelesai)) {
    return { error: t("dateOutsidePeriod") };
  }

  const nowIso = new Date().toISOString();
  if (laporanId) {
    const [existing] = await collect(
      db.orm.public.LaporanPerkembangan.where({ id: laporanId, dicatatOleh: guruId }).all()
    );
    if (!existing) return { error: t("entryNotFound") };

    await db.orm.public.LaporanPerkembangan.where({ id: laporanId }).update({
      tanggal,
      judul,
      catatanInternal,
      laporanOrtu,
      draf: isDraf,
      diterbitkanPada: isDraf ? null : (existing.diterbitkanPada ?? nowIso),
      updatedAt: nowIso,
    });

    await db.orm.public.AuditPerubahan.create({
      entitas: "laporan_perkembangan",
      entitasId: laporanId,
      aksi: isDraf ? "update_draf" : "terbitkan",
      sebelum: JSON.stringify({ draf: existing.draf, tanggal: existing.tanggal }),
      sesudah: JSON.stringify({ draf: isDraf, tanggal }),
      alasan: isDraf ? "Pembaruan draf laporan" : "Penerbitan laporan perkembangan",
      aktorId: guruId,
      createdAt: nowIso,
    });
  } else {
    const created = await db.orm.public.LaporanPerkembangan.create({
      pendaftaranId,
      dicatatOleh: guruId,
      tanggal,
      judul,
      catatanInternal,
      laporanOrtu,
      draf: isDraf,
      diterbitkanPada: isDraf ? null : nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    await db.orm.public.AuditPerubahan.create({
      entitas: "laporan_perkembangan",
      entitasId: created.id,
      aksi: isDraf ? "buat_draf" : "terbitkan",
      sebelum: null,
      sesudah: JSON.stringify({ draf: isDraf, tanggal }),
      alasan: isDraf ? "Pembuatan draf laporan" : "Penerbitan laporan perkembangan",
      aktorId: guruId,
      createdAt: nowIso,
    });
  }

  revalidatePath("/[locale]/teacher/grades", "page");
  revalidatePath("/[locale]/teacher/classes/[classId]", "page");
  revalidatePath("/[locale]/schedule-attendance", "page");
  return { ok: true };
}

export async function tarikLaporanPerkembangan(
  prevOrFormData: GuruState | FormData | Record<string, unknown>,
  maybeFormData?: FormData,
): Promise<GuruState> {
  const isDirectObject = typeof FormData !== "undefined" && !(prevOrFormData instanceof FormData) && !(maybeFormData instanceof FormData);
  let laporanId: number;

  if (isDirectObject) {
    const obj = prevOrFormData as Record<string, unknown>;
    laporanId = Number(obj.laporanId);
  } else {
    const formData = (typeof FormData !== "undefined" && maybeFormData instanceof FormData)
      ? maybeFormData
      : (prevOrFormData as FormData);
    laporanId = Number(formData.get("laporan_id"));
  }

  const locale = await getLocaleDariCookie();
  const t = await getTranslations({ locale, namespace: "teacher" });
  const guruId = await guardGuru();
  if (!guruId) return { error: t("sessionExpired") };

  if (!Number.isInteger(laporanId) || laporanId <= 0) {
    return { error: t("invalidParameters") };
  }

  const [existing] = await collect(
    db.orm.public.LaporanPerkembangan.where({ id: laporanId, dicatatOleh: guruId }).all()
  );
  if (!existing) return { error: t("entryNotFound") };

  const nowIso = new Date().toISOString();
  await db.orm.public.LaporanPerkembangan.where({ id: laporanId }).update({
    draf: true,
    diterbitkanPada: null,
    updatedAt: nowIso,
  });

  await db.orm.public.AuditPerubahan.create({
    entitas: "laporan_perkembangan",
    entitasId: laporanId,
    aksi: "tarik_ke_draf",
    sebelum: JSON.stringify({ draf: existing.draf }),
    sesudah: JSON.stringify({ draf: true }),
    alasan: "Penarikan laporan dari orang tua kembali ke draf",
    aktorId: guruId,
    createdAt: nowIso,
  });

  revalidatePath("/[locale]/teacher/grades", "page");
  revalidatePath("/[locale]/teacher/classes/[classId]", "page");
  revalidatePath("/[locale]/schedule-attendance", "page");
  return { ok: true };
}

// --- M6 & M7 Status Pembelajaran: teks dan foto dokumentasi ---

export async function bagikanStatusPembelajaran(
  prevOrFormData: GuruState | FormData | Record<string, unknown>,
  maybeFormData?: FormData,
): Promise<GuruState> {
  const isDirectObject = typeof FormData !== "undefined" && !(prevOrFormData instanceof FormData) && !(maybeFormData instanceof FormData);
  let kelasId: number;
  let kontenTeks: string;
  let mediaUrls: string[] = [];
  let penerimaPendaftaranIds: number[] = [];

  if (isDirectObject) {
    const obj = prevOrFormData as Record<string, unknown>;
    kelasId = Number(obj.kelasId);
    kontenTeks = String(obj.kontenTeks ?? "").trim();
    mediaUrls = Array.isArray(obj.mediaUrls) ? obj.mediaUrls.map(String) : [];
    penerimaPendaftaranIds = Array.isArray(obj.penerimaPendaftaranIds)
      ? obj.penerimaPendaftaranIds.map(Number)
      : [];
  } else {
    const formData = (typeof FormData !== "undefined" && maybeFormData instanceof FormData)
      ? maybeFormData
      : (prevOrFormData as FormData);
    kelasId = Number(formData.get("kelas_id"));
    kontenTeks = String(formData.get("konten_teks") ?? "").trim();
    const mediaUrlsRaw = formData.get("media_urls");
    if (mediaUrlsRaw) {
      try {
        mediaUrls = JSON.parse(String(mediaUrlsRaw));
      } catch {
        mediaUrls = [];
      }
    }
    const penerimaRaw = formData.getAll("penerima_ids");
    penerimaPendaftaranIds = penerimaRaw.map(Number).filter(Boolean);
  }

  const locale = await getLocaleDariCookie();
  const t = await getTranslations({ locale, namespace: "teacher" });
  const guruId = await guardGuru();
  if (!guruId) return { error: t("sessionExpired") };

  if (!Number.isInteger(kelasId) || kelasId <= 0) {
    return { error: t("invalidParameters") };
  }

  if (mediaUrls.length === 0 && !kontenTeks) {
    return { error: "Konten teks status tidak boleh kosong jika tidak ada foto" };
  }

  if (mediaUrls.length > 5) {
    return { error: "Maksimal 5 foto per unggahan status pembelajaran" };
  }

  if (penerimaPendaftaranIds.length === 0) {
    return { error: "Pilih minimal satu murid penerima status pembelajaran" };
  }

  const [kelas] = await collect(
    db.orm.public.Kelas.where({ id: kelasId, guruId }).all()
  );
  if (!kelas) return { error: t("notYourClass") };
  if (kelas.status === "dibatalkan") return { error: t("classCancelled") };

  const roster = await collect(
    db.orm.public.Pendaftaran.where({ kelasId })
      .where((p) => p.status.in(["terdaftar", "tertunggak"]))
      .all()
  );
  const rosterMap = new Map(roster.map((r) => [r.id, r]));

  for (const pid of penerimaPendaftaranIds) {
    if (!rosterMap.has(pid)) {
      return { error: "Terdapat penerima yang bukan peserta aktif kelas ini" };
    }
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const kadaluarsaDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const kadaluarsaIso = kadaluarsaDate.toISOString();

  const statusRecord = await db.orm.public.StatusPembelajaran.create({
    kelasId,
    dibuatOleh: guruId,
    kontenTeks,
    mediaUrls: mediaUrls.length > 0 ? JSON.stringify(mediaUrls) : null,
    status: "aktif",
    diterbitkanPada: nowIso,
    kadaluarsaPada: kadaluarsaIso,
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  for (const pid of penerimaPendaftaranIds) {
    const pend = rosterMap.get(pid)!;
    await db.orm.public.StatusPembelajaranPenerima.create({
      statusId: statusRecord.id,
      pendaftaranId: pid,
      anakId: pend.anakId,
      createdAt: nowIso,
    });
  }

  await db.orm.public.AuditPerubahan.create({
    entitas: "status_pembelajaran",
    entitasId: statusRecord.id,
    aksi: "bagikan_status",
    sebelum: null,
    sesudah: JSON.stringify({
      kelasId,
      penerimaCount: penerimaPendaftaranIds.length,
      fotoCount: mediaUrls.length,
      kadaluarsaPada: kadaluarsaIso,
    }),
    alasan: "Unggah status pembelajaran untuk peserta kelas",
    aktorId: guruId,
    createdAt: nowIso,
  });

  revalidatePath("/[locale]/teacher/status", "page");
  revalidatePath("/[locale]/teacher/classes/[classId]", "page");
  revalidatePath("/[locale]/home", "page");
  revalidatePath("/[locale]/schedule-attendance", "page");
  return { ok: true };
}

export async function hapusStatusPembelajaran(
  prevOrFormData: GuruState | FormData | Record<string, unknown>,
  maybeFormData?: FormData,
): Promise<GuruState> {
  const isDirectObject = typeof FormData !== "undefined" && !(prevOrFormData instanceof FormData) && !(maybeFormData instanceof FormData);
  let statusId: number;

  if (isDirectObject) {
    const obj = prevOrFormData as Record<string, unknown>;
    statusId = Number(obj.statusId);
  } else {
    const formData = (typeof FormData !== "undefined" && maybeFormData instanceof FormData)
      ? maybeFormData
      : (prevOrFormData as FormData);
    statusId = Number(formData.get("status_id"));
  }

  const locale = await getLocaleDariCookie();
  const t = await getTranslations({ locale, namespace: "teacher" });
  const guruId = await guardGuru();
  if (!guruId) return { error: t("sessionExpired") };

  if (!Number.isInteger(statusId) || statusId <= 0) {
    return { error: t("invalidParameters") };
  }

  const [existing] = await collect(
    db.orm.public.StatusPembelajaran.where({ id: statusId, dibuatOleh: guruId }).all()
  );
  if (!existing) return { error: t("entryNotFound") };

  const nowIso = new Date().toISOString();
  await db.orm.public.StatusPembelajaran.where({ id: statusId }).update({
    status: "dihapus_guru",
    updatedAt: nowIso,
  });

  await db.orm.public.AuditPerubahan.create({
    entitas: "status_pembelajaran",
    entitasId: statusId,
    aksi: "hapus_status_guru",
    sebelum: JSON.stringify({ status: existing.status }),
    sesudah: JSON.stringify({ status: "dihapus_guru" }),
    alasan: "Guru menghapus status pembelajaran miliknya",
    aktorId: guruId,
    createdAt: nowIso,
  });

  revalidatePath("/[locale]/teacher/status", "page");
  revalidatePath("/[locale]/home", "page");
  revalidatePath("/[locale]/schedule-attendance", "page");
  return { ok: true };
}

async function guardUser(): Promise<{ id: number; role: string } | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: Number(session.user.id), role: session.user.role };
}

export async function laporkanFotoStatus(
  prevOrFormData: { statusId: number; alasan: string; catatan?: string } | FormData | Record<string, unknown>,
  maybeFormData?: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  const isDirectObject = typeof FormData !== "undefined" && !(prevOrFormData instanceof FormData) && !(maybeFormData instanceof FormData);
  let statusId: number;
  let alasan: string;
  let catatan: string = "";

  if (isDirectObject) {
    const obj = prevOrFormData as Record<string, unknown>;
    statusId = Number(obj.statusId);
    alasan = String(obj.alasan ?? "").trim();
    catatan = String(obj.catatan ?? "").trim();
  } else {
    const formData = (typeof FormData !== "undefined" && maybeFormData instanceof FormData)
      ? maybeFormData
      : (prevOrFormData as FormData);
    statusId = Number(formData.get("status_id"));
    alasan = String(formData.get("alasan") ?? "").trim();
    catatan = String(formData.get("catatan") ?? "").trim();
  }

  const user = await guardUser();
  if (!user) return { error: "Sesi telah berakhir" };

  if (!Number.isInteger(statusId) || statusId <= 0) {
    return { error: "ID status tidak valid" };
  }
  if (!alasan) {
    return { error: "Alasan pelaporan foto wajib diisi" };
  }

  if (user.role === "orang_tua") {
    const children = await collect(
      db.orm.public.Anak.where({ orangTuaId: user.id }).all()
    );
    const childIds = new Set(children.map((c) => c.id));
    const recipients = await collect(
      db.orm.public.StatusPembelajaranPenerima.where({ statusId }).all()
    );
    const isRecipient = recipients.some((r) => childIds.has(r.anakId));
    if (!isRecipient) {
      return { error: "Akses ditolak: Anda bukan penerima status pembelajaran ini" };
    }
  }

  const nowIso = new Date().toISOString();
  await db.orm.public.LaporanFotoStatus.create({
    statusId,
    pelaporId: user.id,
    alasan,
    catatan: catatan || null,
    createdAt: nowIso,
  });

  await db.orm.public.AuditPerubahan.create({
    entitas: "laporan_foto_status",
    entitasId: statusId,
    aksi: "lapor_foto",
    sebelum: null,
    sesudah: JSON.stringify({ alasan, catatan }),
    alasan: "Orang tua mengajukan laporan foto pembelajaran privat",
    aktorId: user.id,
    createdAt: nowIso,
  });

  revalidatePath("/[locale]/home", "page");
  revalidatePath("/[locale]/schedule-attendance", "page");
  return { ok: true };
}

export async function updatePersetujuanFoto(
  prevOrFormData: { anakId: number; persetujuan: boolean; alasan?: string } | FormData | Record<string, unknown>,
  maybeFormData?: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  const isDirectObject = typeof FormData !== "undefined" && !(prevOrFormData instanceof FormData) && !(maybeFormData instanceof FormData);
  let anakId: number;
  let persetujuan: boolean;
  let alasan: string = "";

  if (isDirectObject) {
    const obj = prevOrFormData as Record<string, unknown>;
    anakId = Number(obj.anakId);
    persetujuan = Boolean(obj.persetujuan);
    alasan = String(obj.alasan ?? "").trim();
  } else {
    const formData = (typeof FormData !== "undefined" && maybeFormData instanceof FormData)
      ? maybeFormData
      : (prevOrFormData as FormData);
    anakId = Number(formData.get("anak_id"));
    persetujuan = formData.get("persetujuan") === "true";
    alasan = String(formData.get("alasan") ?? "").trim();
  }

  const user = await guardUser();
  if (!user) return { error: "Sesi telah berakhir" };

  if (!Number.isInteger(anakId) || anakId <= 0) {
    return { error: "ID anak tidak valid" };
  }

  const [anak] = await collect(
    db.orm.public.Anak.where({ id: anakId }).all()
  );
  if (!anak) return { error: "Data anak tidak ditemukan" };

  if (user.role !== "admin" && anak.orangTuaId !== user.id) {
    return { error: "Akses ditolak: bukan data anak Anda" };
  }

  const nowIso = new Date().toISOString();
  await db.orm.public.Anak.where({ id: anakId }).update({
    persetujuanFoto: persetujuan,
  });

  await db.orm.public.AuditPerubahan.create({
    entitas: "anak_persetujuan_foto",
    entitasId: anakId,
    aksi: "update_persetujuan_foto",
    sebelum: JSON.stringify({ persetujuanFoto: anak.persetujuanFoto }),
    sesudah: JSON.stringify({ persetujuanFoto: persetujuan }),
    alasan: alasan || "Pembaruan persetujuan foto anak",
    aktorId: user.id,
    createdAt: nowIso,
  });

  revalidatePath("/[locale]/child-info", "page");
  revalidatePath("/[locale]/teacher/status", "page");
  return { ok: true };
}

export async function bersihkanRetensiStatus({
  referensiWaktuIso,
}: {
  referensiWaktuIso?: string;
} = {}): Promise<{ ok: boolean; countArchived: number; countPurged: number }> {
  const now = referensiWaktuIso ? new Date(referensiWaktuIso) : new Date();
  const nowIso = now.toISOString();

  const expiredActive = await collect(
    db.orm.public.StatusPembelajaran.where({ status: "aktif" }).all()
  );
  let countArchived = 0;
  for (const s of expiredActive) {
    if (s.kadaluarsaPada <= nowIso) {
      await db.orm.public.StatusPembelajaran.where({ id: s.id }).update({
        status: "diarsipkan",
        updatedAt: nowIso,
      });
      countArchived++;
    }
  }

  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const retentionCutoffIso = new Date(now.getTime() - ninetyDaysMs).toISOString();

  const archivedStatuses = await collect(
    db.orm.public.StatusPembelajaran.where({ status: "diarsipkan" }).all()
  );
  let countPurged = 0;
  for (const s of archivedStatuses) {
    if (s.diterbitkanPada <= retentionCutoffIso && s.mediaUrls !== null) {
      await db.orm.public.StatusPembelajaran.where({ id: s.id }).update({
        mediaUrls: null,
        updatedAt: nowIso,
      });
      countPurged++;
    }
  }

  return { ok: true, countArchived, countPurged };
}






