"use server";

import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { getLocaleDariCookie } from "@/i18n/locale";

type Translator = Awaited<ReturnType<typeof getTranslations>>;
import { revalidatePath } from "next/cache";
import { db } from "@/prisma/db";
import { auth } from "@/lib/auth";
import { collect } from "@/lib/collect";
import bcrypt from "bcryptjs";

export type AdminState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function guardAdmin(): Promise<number | null> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") return null;
  return Number(session.user.id);
}

function fieldErr(parsed: {
  error: {
    issues: readonly { path: readonly PropertyKey[]; message: string }[];
  };
}, t: Translator): AdminState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues)
    fieldErrors[String(issue.path[0])] ??= issue.message;
  return { error: t("validation.checkFields"), fieldErrors };
}

// --- E2 Mata Pelajaran ---
const mapelSchema = (t: Translator) => z.object({
  nama: z.string().trim().min(2, t("validation.nameMin")).max(100, t("validation.nameMax")),
  deskripsi: z.string().trim().max(500, t("validation.descriptionMax")).optional().or(z.literal("")),
});

export async function saveMapel(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const locale = await getLocaleDariCookie();
  const t = await getTranslations({ locale, namespace: "adminForms" });
  if (!(await guardAdmin())) return { error: t("validation.session") };
  const parsed = mapelSchema(t).safeParse({
    nama: formData.get("nama"),
    deskripsi: formData.get("deskripsi") ?? "",
  }, { error: () => t("validation.invalid") });
  if (!parsed.success) return fieldErr(parsed, t);
  const mapelId = Number(formData.get("mapel_id") ?? 0);
  try {
    if (mapelId > 0) {
      await db.orm.public.MataPelajaran.where({ id: mapelId }).update({
        nama: parsed.data.nama,
        deskripsi: parsed.data.deskripsi || null,
      });
    } else {
      await db.orm.public.MataPelajaran.create({
        nama: parsed.data.nama,
        deskripsi: parsed.data.deskripsi || null,
      });
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("mata_pelajaran_nama_key"))
      return { error: t("validation.subjectDuplicate") };
    throw e;
  }
  revalidatePath("/admin/subjects");
  return { ok: true };
}

export async function hapusMapel(formData: FormData): Promise<void> {
  if (!(await guardAdmin())) return;
  const mapelId = Number(formData.get("mapel_id"));
  if (!Number.isInteger(mapelId)) return;
  try {
    await db.orm.public.MataPelajaran.where({ id: mapelId }).delete();
  } catch {
    return; // FK Restrict — masih dipakai kelas
  }
  revalidatePath("/admin/subjects");
}

// --- E3 Periode ---
const periodeSchema = (t: Translator) => z
  .object({
    nama: z.string().trim().min(2, t("validation.nameMin")).max(100, t("validation.nameMax")),
    tanggal_mulai: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, t("validation.dateRequired")),
    tanggal_selesai: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, t("validation.dateRequired")),
    tanggal_tutup_pendaftaran: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, t("validation.dateRequired")),
    status: z.enum(["dibuka", "ditutup", "selesai"], t("validation.invalid")),
  })
  .refine((d) => d.tanggal_mulai < d.tanggal_selesai, {
    message: t("validation.periodOrder"),
    path: ["tanggal_selesai"],
  })
  .refine((d) => d.tanggal_tutup_pendaftaran <= d.tanggal_selesai, {
    message: t("validation.closeOrder"),
    path: ["tanggal_tutup_pendaftaran"],
  });

export async function savePeriode(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const locale = await getLocaleDariCookie();
  const t = await getTranslations({ locale, namespace: "adminForms" });
  if (!(await guardAdmin())) return { error: t("validation.session") };
  const parsed = periodeSchema(t).safeParse({
    nama: formData.get("nama"),
    tanggal_mulai: formData.get("tanggal_mulai"),
    tanggal_selesai: formData.get("tanggal_selesai"),
    tanggal_tutup_pendaftaran: formData.get("tanggal_tutup_pendaftaran"),
    status: formData.get("status"),
  }, { error: () => t("validation.invalid") });
  if (!parsed.success) return fieldErr(parsed, t);
  const periodeId = Number(formData.get("periode_id") ?? 0);
  const d = parsed.data;
  const values = {
    nama: d.nama,
    tanggalMulai: d.tanggal_mulai,
    tanggalSelesai: d.tanggal_selesai,
    tanggalTutupPendaftaran: d.tanggal_tutup_pendaftaran,
    status: d.status,
  };
  if (periodeId > 0)
    await db.orm.public.PeriodePendaftaran.where({ id: periodeId }).update(
      values,
    );
  else await db.orm.public.PeriodePendaftaran.create(values);
  revalidatePath("/admin/periods");
  return { ok: true };
}

// --- E4 Guru ---
const guruSchema = (t: Translator) => z.object({
  nama: z.string().trim().min(2, t("validation.nameMin")).max(100, t("validation.nameMax")),
  email: z.string().trim().toLowerCase().email(t("validation.email")),
  password: z
    .string()
    .min(8, t("validation.passwordMin"))
    .optional()
    .or(z.literal("")),
  alamat: z.string().trim().max(255, t("validation.addressMax")).optional().or(z.literal("")),
  nomor_telepon: z
    .string()
    .trim()
    .min(8, t("validation.phoneMin"))
    .max(30, t("validation.phoneMax")),
});

export async function saveGuru(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const locale = await getLocaleDariCookie();
  const t = await getTranslations({ locale, namespace: "adminForms" });
  if (!(await guardAdmin())) return { error: t("validation.session") };
  const parsed = guruSchema(t).safeParse({
    nama: formData.get("nama"),
    email: formData.get("email"),
    password: formData.get("password") ?? "",
    alamat: formData.get("alamat") ?? "",
    nomor_telepon: formData.get("nomor_telepon") ?? "",
  }, { error: () => t("validation.invalid") });
  if (!parsed.success) return fieldErr(parsed, t);
  const { nama, email, password, alamat, nomor_telepon } = parsed.data;
  const guruId = Number(formData.get("guru_id") ?? 0);
  try {
    if (guruId > 0) {
      await db.orm.public.User.where({ id: guruId }).update({
        name: nama,
        email,
        alamat: alamat || null,
        nomorTelepon: nomor_telepon,
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      });
    } else {
      if (!password)
        return {
          error: t("validation.newTeacherPassword"),
          fieldErrors: { password: t("validation.required") },
        };
      await db.orm.public.User.create({
        role: "guru",
        name: nama,
        email,
        password: await bcrypt.hash(password, 10),
        alamat: alamat || null,
        nomorTelepon: nomor_telepon,
      });
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("duplicate key"))
      return { error: t("validation.emailDuplicate") };
    throw e;
  }
  revalidatePath("/admin/teachers");
  return { ok: true };
}

export async function hapusGuru(formData: FormData): Promise<void> {
  if (!(await guardAdmin())) return;
  const guruId = Number(formData.get("guru_id"));
  if (!Number.isInteger(guruId) || guruId <= 0) return;

  // FK Restrict di 4 tabel: tidak boleh ada kelas, pesan tidak langsung (tidak
  // ada kolom guru — diabaikan), presensi, atau nilai yang masih menunjuk akun
  // ini. Ditolak dengan pesan, bukan silent-fail: admin perlu tahu kenapa.
  const [kelasDipakai, presensiDipakai, nilaiDipakai] = await Promise.all([
    collect(db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).all()),
    collect(db.orm.public.Presensi.where((x) => x.dicatatOleh.eq(guruId)).all()),
    collect(db.orm.public.NilaiProgres.where((n) => n.dicatatOleh.eq(guruId)).all()),
  ]);
  if (kelasDipakai.length > 0 || presensiDipakai.length > 0 || nilaiDipakai.length > 0) return;

  try {
    await db.orm.public.User.where({ id: guruId, role: "guru" }).delete();
  } catch {
    return; // balapan: dependensi muncul di antara cek dan delete
  }
  revalidatePath("/admin/teachers");
}

// --- E5 Kelas + jadwal ---
const HARI = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
] as const;

const kelasSchema = (t: Translator) => z
  .object({
    mata_pelajaran_id: z.coerce.number().int().positive(t("validation.subject")),
    guru_id: z.coerce.number().int().positive(t("validation.teacher")),
    periode_id: z.coerce.number().int().positive(t("validation.period")),
    jenjang: z.enum(["TK", "SD", "SMP", "SMA"], t("validation.invalid")),
    tingkat: z.string().trim().max(30).optional().or(z.literal("")),
    ruangan: z.string().trim().max(100).optional().or(z.literal("")),
    kuota_maksimum: z.coerce.number().int().min(1, t("validation.minOne")).max(200, t("validation.maxQuota")),
    kuota_minimum: z.coerce.number().int().min(1, t("validation.minOne")).max(200, t("validation.maxQuota")),
    biaya_periode: z.coerce.number().positive(t("validation.positiveFee")),
    biaya_dp: z.coerce.number().positive().optional(),
    tenor_maksimum: z.coerce.number().int().min(2, t("validation.minTwo")).optional(),
    status: z.enum(["aktif", "dibatalkan"], t("validation.invalid")),
  })
  .refine((d) => d.kuota_minimum <= d.kuota_maksimum, {
    message: t("validation.quotaOrder"),
    path: ["kuota_minimum"],
  })
  .refine((d) => d.biaya_dp == null || d.biaya_dp < d.biaya_periode, {
    message: t("validation.depositOrder"),
    path: ["biaya_dp"],
  });

export async function saveKelas(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const locale = await getLocaleDariCookie();
  const t = await getTranslations({ locale, namespace: "adminForms" });
  if (!(await guardAdmin())) return { error: t("validation.session") };
  const parsed = kelasSchema(t).safeParse({
    mata_pelajaran_id: formData.get("mata_pelajaran_id"),
    guru_id: formData.get("guru_id"),
    periode_id: formData.get("periode_id"),
    jenjang: formData.get("jenjang"),
    tingkat: formData.get("tingkat") ?? "",
    ruangan: formData.get("ruangan") ?? "",
    kuota_maksimum: formData.get("kuota_maksimum"),
    kuota_minimum: formData.get("kuota_minimum"),
    biaya_periode: formData.get("biaya_periode"),
    biaya_dp: formData.get("biaya_dp") || undefined,
    tenor_maksimum: formData.get("tenor_maksimum") || undefined,
    status: formData.get("status"),
  }, { error: () => t("validation.invalid") });
  if (!parsed.success) return fieldErr(parsed, t);
  const d = parsed.data;
  // BR#12 dijaga CHECK DB: biaya_dp NULL ⇔ tenor_maksimum NULL
  if ((d.biaya_dp == null) !== (d.tenor_maksimum == null))
    return {
      error:
        t("validation.depositTerm"),
    };

  // BR#6: jadwal guru tidak boleh bentrok (periode sama, hari sama, jam beririsan) — level jadwal_item.
  const jadwalBaru: { hari: string; jamMulai: string; jamSelesai: string }[] =
    [];
  for (let i = 0; i < 3; i += 1) {
    const hari = String(formData.get(`jadwal_hari_${i}`) ?? "");
    const jamMulai = String(formData.get(`jadwal_mulai_${i}`) ?? "");
    const jamSelesai = String(formData.get(`jadwal_selesai_${i}`) ?? "");
    if (!hari && !jamMulai && !jamSelesai) continue;
    if (
      !HARI.includes(hari as never) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(jamMulai) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(jamSelesai)
    )
      return {
        error: t("validation.scheduleInvalid", { number: i + 1 }),
      };
    if (jamMulai >= jamSelesai)
      return {
        error: t("validation.scheduleOrder", { number: i + 1 }),
      };
    jadwalBaru.push({ hari, jamMulai, jamSelesai });
  }
  if (jadwalBaru.length === 0)
    return { error: t("validation.scheduleRequired") };

  // ponytail: cek bentrok BR#6 dibaca semua jadwal guru lalu dibanding di JS —
  // interval overlap SQL antar-baris baru+lama rumit; upgrade jadi satu SQL bila kelas >ratusan.
  const kelasGuru = await collect(
    db.orm.public.Kelas.where((k) => k.guruId.eq(d.guru_id))
      .where((k) => k.periodeId.eq(d.periode_id))
      .where((k) => k.status.eq("aktif"))
      .all(),
  );
  const kelasIds = new Set(kelasGuru.map((k) => k.id));
  const jadwalLama = await collect(db.orm.public.JadwalItem.all());
  const strip = (s: string) => s.slice(0, 5);
  for (const nl of jadwalBaru) {
    for (const ol of jadwalLama) {
      if (!kelasIds.has(ol.kelasId)) continue;
      if (ol.hari !== nl.hari) continue;
      if (
        strip(ol.jamMulai) < strip(nl.jamSelesai) &&
        strip(nl.jamMulai) < strip(ol.jamSelesai)
      )
        return {
          error: t("validation.scheduleConflict", { day: t(`days.${nl.hari}`), start: strip(ol.jamMulai), end: strip(ol.jamSelesai) }),
        };
    }
  }

  const values = {
    mataPelajaranId: d.mata_pelajaran_id,
    guruId: d.guru_id,
    periodeId: d.periode_id,
    jenjang: d.jenjang,
    tingkat: d.tingkat?.trim() ? d.tingkat.trim() : null,
    ruangan: d.ruangan?.trim() ? d.ruangan.trim() : null,
    kuotaMaksimum: d.kuota_maksimum,
    kuotaMinimum: d.kuota_minimum,
    biayaPeriode: String(d.biaya_periode),
    biayaDp: d.biaya_dp == null ? null : String(d.biaya_dp),
    tenorMaksimum: d.tenor_maksimum ?? null,
    status: d.status,
  };
  const kelasId = Number(formData.get("kelas_id") ?? 0);
  let id = kelasId;
  if (kelasId > 0) {
    await db.orm.public.Kelas.where({ id: kelasId }).update(values);
    await db.orm.public.JadwalItem.where((j) => j.kelasId.eq(kelasId)).delete();
  } else {
    const baru = await db.orm.public.Kelas.create(values);
    id = baru.id;
  }
  for (const j of jadwalBaru)
    await db.orm.public.JadwalItem.create({
      kelasId: id,
      hari: j.hari as never,
      jamMulai: j.jamMulai,
      jamSelesai: j.jamSelesai,
    });
  revalidatePath("/admin/classes");
  return { ok: true };
}

// --- E7 verifikasi refund (BR#19) ---
// Keputusan admin = catat status pengajuan EKSEKUSI pembatalan: Pendaftaran →
// 'dibatalkan_orang_tua' + kuota dilepas (satu transaction, pola
// processTimeouts). Uang kembali (refund) dieksekusi manual di luar sistem
// sesuai kategori BR#19 — 'lainnya' = DP hangus, tanpa refund.
export async function prosesPengajuan(formData: FormData): Promise<void> {
  const adminId = await guardAdmin();
  if (!adminId) return;
  const pengajuanId = Number(formData.get("pengajuan_id"));
  const keputusan = String(formData.get("keputusan") ?? "");
  if (!Number.isInteger(pengajuanId)) return;
  if (keputusan !== "disetujui" && keputusan !== "ditolak") return;

  const [pengajuan] = await collect(
    db.orm.public.PengajuanPembatalan.where((p) => p.id.eq(pengajuanId)).all(),
  );
  if (!pengajuan || pengajuan.status !== "menunggu") return;

  await db.transaction(async (tx) => {
    const catatan = String(formData.get("catatan_admin") ?? "").trim();
    await tx.execute(
      db.raw.sql`update pengajuan_pembatalan
 set status = ${keputusan}, diproses_oleh = ${adminId},
 catatan_admin = nullif(${catatan}, ''),
 diproses_pada = now(), updated_at = now()
 where id = ${pengajuanId} and status = 'menunggu'`
        .affectedCount()
        .build(),
    );
    if (keputusan !== "disetujui") return;
    const [p] = await collect(
      tx.query(
        db.raw
          .sql`select kelas_id, status from pendaftaran where id = ${pengajuan.pendaftaranId}`
          .returnsRow({ kelas_id: "pg/int4@1", status: "pg/text@1" })
          .build(),
      ),
    );
    // Hanya pendaftaran yang masih hidup yang bisa dibatalkan; timeout/tunggakan
    // yang sudah batal tidak boleh dihitung dua kali saat lepas kuota.
    if (
      !p ||
      !["menunggu_pembayaran", "terdaftar", "tertunggak"].includes(p.status)
    )
      return;
    await tx.execute(
      db.raw
        .sql`update pendaftaran set status = 'dibatalkan_orang_tua', updated_at = now()
 where id = ${pengajuan.pendaftaranId}`
        .affectedCount()
        .build(),
    );
    await tx.execute(
      db.raw
        .sql`update kelas set kuota_terisi = greatest(kuota_terisi - 1, 0), updated_at = now()
 where id = ${p.kelas_id}`
        .affectedCount()
        .build(),
    );
  });
  revalidatePath("/admin/refunds");
  revalidatePath("/home");
  revalidatePath("/payments");
}

// E11 — Pesan Kontak: admin menandai status pesan masuk dari formulir /contact.
export async function ubahStatusPesan(formData: FormData): Promise<void> {
 const adminId = await guardAdmin();
 if (!adminId) return;
 const id = Number(formData.get("pesan_id"));
 const status = String(formData.get("status") ?? "");
 if (!Number.isInteger(id) || !["baru", "diproses", "selesai"].includes(status)) return;
 await db.orm.public.PesanKontak.where((p) => p.id.eq(id)).update({
  status: status as "baru" | "diproses" | "selesai",
  updatedAt: new Date().toISOString(),
 });
 revalidatePath("/admin/messages");
 revalidatePath("/admin/dashboard");
}

export async function hapusPesan(formData: FormData): Promise<void> {
 if (!(await guardAdmin())) return;
 const id = Number(formData.get("pesan_id"));
 if (!Number.isInteger(id)) return;
 await db.orm.public.PesanKontak.where((p) => p.id.eq(id)).delete();
 revalidatePath("/admin/messages");
 revalidatePath("/admin/dashboard");
}

// --- M2 proses pengajuan koreksi (admin) ---
export async function prosesKoreksi(
  prevOrFormData: AdminState | FormData,
  maybeFormData?: FormData,
): Promise<AdminState> {
  const formData = (typeof FormData !== "undefined" && maybeFormData instanceof FormData)
    ? maybeFormData
    : (typeof FormData !== "undefined" && prevOrFormData instanceof FormData)
      ? prevOrFormData
      : (maybeFormData ?? prevOrFormData) as FormData;
  const adminId = await guardAdmin();
  if (!adminId) return { error: "Sesi admin berakhir." };

  const koreksiId = Number(formData.get("koreksi_id"));
  const keputusan = String(formData.get("keputusan") ?? ""); // 'setujui' | 'tolak'
  const catatanAdmin = String(formData.get("catatan_admin") ?? "").trim();

  if (!Number.isInteger(koreksiId) || !["setujui", "tolak"].includes(keputusan)) {
    return { error: "Parameter keputusan tidak valid." };
  }

  const [koreksi] = await collect(
    db.orm.public.PengajuanKoreksi.where({ id: koreksiId }).all(),
  );
  if (!koreksi) return { error: "Pengajuan koreksi tidak ditemukan." };
  if (koreksi.status !== "menunggu") {
    return { error: "Pengajuan koreksi sudah pernah diproses." };
  }

  await db.transaction(async (tx) => {
    if (keputusan === "setujui") {
      let usulan: Record<string, unknown> = {};
      try {
        usulan = JSON.parse(koreksi.dataUsulan);
      } catch {
        usulan = { status: koreksi.dataUsulan };
      }

      if (koreksi.entitas === "presensi") {
        const updateData: Record<string, unknown> = {};
        if (typeof usulan.status === "string") updateData.status = usulan.status;
        if (typeof usulan.catatan === "string") updateData.catatan = usulan.catatan;
        await tx.orm.public.Presensi.where({ id: koreksi.entitasId }).update(updateData);
      } else if (koreksi.entitas === "nilai") {
        const updateData: Record<string, unknown> = {};
        if (usulan.nilaiKuantitatif !== undefined) updateData.nilaiKuantitatif = String(usulan.nilaiKuantitatif);
        if (usulan.catatanKualitatif !== undefined) updateData.catatanKualitatif = String(usulan.catatanKualitatif);
        await tx.orm.public.NilaiProgres.where({ id: koreksi.entitasId }).update(updateData);
      }

      await tx.orm.public.PengajuanKoreksi.where({ id: koreksiId }).update({
        status: "disetujui",
        diprosesOleh: adminId,
        catatanAdmin: catatanAdmin || null,
      });

      await tx.orm.public.AuditPerubahan.create({
        entitas: koreksi.entitas,
        entitasId: koreksi.entitasId,
        aksi: "koreksi_disetujui",
        sebelum: koreksi.dataSebelum,
        sesudah: koreksi.dataUsulan,
        alasan: catatanAdmin || koreksi.alasan,
        aktorId: adminId,
      });
    } else {
      await tx.orm.public.PengajuanKoreksi.where({ id: koreksiId }).update({
        status: "ditolak",
        diprosesOleh: adminId,
        catatanAdmin: catatanAdmin || null,
      });

      await tx.orm.public.AuditPerubahan.create({
        entitas: koreksi.entitas,
        entitasId: koreksi.entitasId,
        aksi: "koreksi_ditolak",
        sebelum: koreksi.dataSebelum,
        sesudah: koreksi.dataUsulan,
        alasan: catatanAdmin || "Ditolak admin",
        aktorId: adminId,
      });
    }
  });

  revalidatePath("/[locale]/admin/corrections", "page");
  revalidatePath("/[locale]/teacher/corrections", "page");
  return { ok: true };
}

export async function prosesKoreksiAction(formData: FormData): Promise<void> {
  await prosesKoreksi(formData);
}

export async function tarikStatusPembelajaranAdmin(
  statusId: number,
  alasan: string = "Ditarik oleh admin"
): Promise<{ ok?: boolean; error?: string }> {
  const adminId = await guardAdmin();
  if (!adminId) return { error: "Sesi admin berakhir" };

  const [existing] = await collect(
    db.orm.public.StatusPembelajaran.where({ id: statusId }).all()
  );
  if (!existing) return { error: "Status pembelajaran tidak ditemukan" };

  const nowIso = new Date().toISOString();
  await db.orm.public.StatusPembelajaran.where({ id: statusId }).update({
    status: "ditarik_admin",
    updatedAt: nowIso,
  });

  await db.orm.public.AuditPerubahan.create({
    entitas: "status_pembelajaran",
    entitasId: statusId,
    aksi: "tarik_status_admin",
    sebelum: JSON.stringify({ status: existing.status }),
    sesudah: JSON.stringify({ status: "ditarik_admin" }),
    alasan,
    aktorId: adminId,
    createdAt: nowIso,
  });

  revalidatePath("/[locale]/teacher/status", "page");
  revalidatePath("/[locale]/home", "page");
  revalidatePath("/[locale]/schedule-attendance", "page");
  return { ok: true };
}



