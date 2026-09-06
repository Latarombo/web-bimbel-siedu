'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/prisma/db';
import { auth } from '@/lib/auth';
import { collect } from '@/lib/collect';
import bcrypt from 'bcryptjs';

export type AdminState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

async function guardAdmin(): Promise<number | null> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') return null;
  return Number(session.user.id);
}

function fieldErr(parsed: { error: { issues: readonly { path: readonly PropertyKey[]; message: string }[] } }): AdminState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues)
    fieldErrors[String(issue.path[0])] ??= issue.message;
  return { error: 'Periksa lagi isian.', fieldErrors };
}

// --- E2 Mata Pelajaran ---
const mapelSchema = z.object({ nama: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100), deskripsi: z.string().trim().max(500).optional().or(z.literal('')) });

export async function saveMapel(_prev: AdminState, formData: FormData): Promise<AdminState> {
  if (!(await guardAdmin())) return { error: 'Sesi berakhir. Masuk ulang.' };
  const parsed = mapelSchema.safeParse({ nama: formData.get('nama'), deskripsi: formData.get('deskripsi') ?? '' });
  if (!parsed.success) return fieldErr(parsed);
  const mapelId = Number(formData.get('mapel_id') ?? 0);
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
    if (e instanceof Error && e.message.includes('mata_pelajaran_nama_key'))
      return { error: 'Nama mata pelajaran sudah dipakai.' };
    throw e;
  }
  revalidatePath('/admin/subjects');
  return { ok: true };
}

export async function hapusMapel(formData: FormData): Promise<void> {
  if (!(await guardAdmin())) return;
  const mapelId = Number(formData.get('mapel_id'));
  if (!Number.isInteger(mapelId)) return;
  try {
    await db.orm.public.MataPelajaran.where({ id: mapelId }).delete();
  } catch {
    return; // FK Restrict — masih dipakai kelas
  }
  revalidatePath('/admin/subjects');
}

// --- E3 Periode ---
const periodeSchema = z
  .object({
    nama: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
    tanggal_mulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi'),
    tanggal_selesai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi'),
    tanggal_tutup_pendaftaran: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi'),
    status: z.enum(['dibuka', 'ditutup', 'selesai']),
  })
  .refine((d) => d.tanggal_mulai < d.tanggal_selesai, {
    message: 'Mulai harus sebelum selesai.',
    path: ['tanggal_selesai'],
  })
  .refine((d) => d.tanggal_tutup_pendaftaran <= d.tanggal_selesai, {
    message: 'Tutup pendaftaran tidak boleh lewat tanggal selesai.',
    path: ['tanggal_tutup_pendaftaran'],
  });

export async function savePeriode(_prev: AdminState, formData: FormData): Promise<AdminState> {
  if (!(await guardAdmin())) return { error: 'Sesi berakhir. Masuk ulang.' };
  const parsed = periodeSchema.safeParse({
    nama: formData.get('nama'),
    tanggal_mulai: formData.get('tanggal_mulai'),
    tanggal_selesai: formData.get('tanggal_selesai'),
    tanggal_tutup_pendaftaran: formData.get('tanggal_tutup_pendaftaran'),
    status: formData.get('status'),
  });
  if (!parsed.success) return fieldErr(parsed);
  const periodeId = Number(formData.get('periode_id') ?? 0);
  const d = parsed.data;
  const values = {
    nama: d.nama,
    tanggalMulai: d.tanggal_mulai,
    tanggalSelesai: d.tanggal_selesai,
    tanggalTutupPendaftaran: d.tanggal_tutup_pendaftaran,
    status: d.status,
  };
  if (periodeId > 0) await db.orm.public.PeriodePendaftaran.where({ id: periodeId }).update(values);
  else await db.orm.public.PeriodePendaftaran.create(values);
  revalidatePath('/admin/periods');
  return { ok: true };
}

// --- E4 Guru ---
const guruSchema = z.object({
  nama: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().trim().toLowerCase().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter').optional().or(z.literal('')),
  alamat: z.string().trim().max(255).optional().or(z.literal('')),
  nomor_telepon: z.string().trim().max(30).optional().or(z.literal('')),
});

export async function saveGuru(_prev: AdminState, formData: FormData): Promise<AdminState> {
  if (!(await guardAdmin())) return { error: 'Sesi berakhir. Masuk ulang.' };
  const parsed = guruSchema.safeParse({
    nama: formData.get('nama'),
    email: formData.get('email'),
    password: formData.get('password') ?? '',
    alamat: formData.get('alamat') ?? '',
    nomor_telepon: formData.get('nomor_telepon') ?? '',
  });
  if (!parsed.success) return fieldErr(parsed);
  const { nama, email, password, alamat, nomor_telepon } = parsed.data;
  const guruId = Number(formData.get('guru_id') ?? 0);
  try {
    if (guruId > 0) {
      await db.orm.public.User.where({ id: guruId }).update({
        name: nama,
        email,
        alamat: alamat || null,
        nomorTelepon: nomor_telepon || null,
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      });
    } else {
      if (!password) return { error: 'Password wajib untuk guru baru.', fieldErrors: { password: 'Wajib diisi' } };
      await db.orm.public.User.create({
        role: 'guru',
        name: nama,
        email,
        password: await bcrypt.hash(password, 10),
        alamat: alamat || null,
        nomorTelepon: nomor_telepon || null,
      });
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('duplicate key'))
      return { error: 'Email sudah dipakai akun lain.' };
    throw e;
  }
  revalidatePath('/admin/teachers');
  return { ok: true };
}

// --- E5 Kelas + jadwal ---
const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'] as const;

const kelasSchema = z
  .object({
    mata_pelajaran_id: z.coerce.number().int().positive('Pilih mata pelajaran'),
    guru_id: z.coerce.number().int().positive('Pilih guru'),
    periode_id: z.coerce.number().int().positive('Pilih periode'),
    jenjang: z.enum(['TK', 'SD', 'SMP', 'SMA']),
    kuota_maksimum: z.coerce.number().int().min(1, 'Minimal 1').max(200),
    kuota_minimum: z.coerce.number().int().min(1, 'Minimal 1').max(200),
    biaya_periode: z.coerce.number().positive('Biaya harus > 0'),
    biaya_dp: z.coerce.number().positive().optional(),
    tenor_maksimum: z.coerce.number().int().min(2, 'Minimal 2').optional(),
    status: z.enum(['aktif', 'dibatalkan']),
  })
  .refine((d) => d.kuota_minimum <= d.kuota_maksimum, {
    message: 'Kuota minimum tidak boleh lewat maksimum.',
    path: ['kuota_minimum'],
  })
  .refine((d) => d.biaya_dp == null || d.biaya_dp < d.biaya_periode, {
    message: 'DP harus lebih kecil dari biaya periode.',
    path: ['biaya_dp'],
  });

export async function saveKelas(_prev: AdminState, formData: FormData): Promise<AdminState> {
  if (!(await guardAdmin())) return { error: 'Sesi berakhir. Masuk ulang.' };
  const parsed = kelasSchema.safeParse({
    mata_pelajaran_id: formData.get('mata_pelajaran_id'),
    guru_id: formData.get('guru_id'),
    periode_id: formData.get('periode_id'),
    jenjang: formData.get('jenjang'),
    kuota_maksimum: formData.get('kuota_maksimum'),
    kuota_minimum: formData.get('kuota_minimum'),
    biaya_periode: formData.get('biaya_periode'),
    biaya_dp: formData.get('biaya_dp') || undefined,
    tenor_maksimum: formData.get('tenor_maksimum') || undefined,
    status: formData.get('status'),
  });
  if (!parsed.success) return fieldErr(parsed);
  const d = parsed.data;
  // BR#12 dijaga CHECK DB: biaya_dp NULL ⇔ tenor_maksimum NULL
  if (d.biaya_dp == null !== (d.tenor_maksimum == null))
    return { error: 'Kelas DP wajib punya tenor; kelas non-DP tidak boleh punya tenor (BR#12).' };

  // BR#6: jadwal guru tidak boleh bentrok (periode sama, hari sama, jam beririsan) — level jadwal_item.
  const jadwalBaru: { hari: string; jamMulai: string; jamSelesai: string }[] = [];
  for (let i = 0; i < 3; i += 1) {
    const hari = String(formData.get(`jadwal_hari_${i}`) ?? '');
    const jamMulai = String(formData.get(`jadwal_mulai_${i}`) ?? '');
    const jamSelesai = String(formData.get(`jadwal_selesai_${i}`) ?? '');
    if (!hari && !jamMulai && !jamSelesai) continue;
    if (!HARI.includes(hari as never) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(jamMulai) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(jamSelesai))
      return { error: `Baris jadwal ${i + 1} tidak lengkap/valid (hari, jam mulai, jam selesai).` };
    if (jamMulai >= jamSelesai)
      return { error: `Baris jadwal ${i + 1}: jam mulai harus sebelum jam selesai.` };
    jadwalBaru.push({ hari, jamMulai, jamSelesai });
  }
  if (jadwalBaru.length === 0) return { error: 'Minimal satu sesi jadwal per minggu.' };

  // ponytail: cek bentrok BR#6 dibaca semua jadwal guru lalu dibanding di JS —
  // interval overlap SQL antar-baris baru+lama rumit; upgrade jadi satu SQL bila kelas >ratusan.
  const kelasGuru = await collect(
    db.orm.public.Kelas.where((k) => k.guruId.eq(d.guru_id))
      .where((k) => k.periodeId.eq(d.periode_id))
      .where((k) => k.status.eq('aktif'))
      .all(),
  );
  const kelasIds = new Set(kelasGuru.map((k) => k.id));
  const jadwalLama = await collect(db.orm.public.JadwalItem.all());
  const strip = (s: string) => s.slice(0, 5);
  for (const nl of jadwalBaru) {
    for (const ol of jadwalLama) {
      if (!kelasIds.has(ol.kelasId)) continue;
      if (ol.hari !== nl.hari) continue;
      if (strip(ol.jamMulai) < strip(nl.jamSelesai) && strip(nl.jamMulai) < strip(ol.jamSelesai))
        return { error: `Jadwal bentrok: guru sudah mengajar ${nl.hari} ${strip(ol.jamMulai)}–${strip(ol.jamSelesai)} (BR#6).` };
    }
  }

  const values = {
    mataPelajaranId: d.mata_pelajaran_id,
    guruId: d.guru_id,
    periodeId: d.periode_id,
    jenjang: d.jenjang,
    kuotaMaksimum: d.kuota_maksimum,
    kuotaMinimum: d.kuota_minimum,
    biayaPeriode: String(d.biaya_periode),
    biayaDp: d.biaya_dp == null ? null : String(d.biaya_dp),
    tenorMaksimum: d.tenor_maksimum ?? null,
    status: d.status,
  };
  const kelasId = Number(formData.get('kelas_id') ?? 0);
  let id = kelasId;
  if (kelasId > 0) {
    await db.orm.public.Kelas.where({ id: kelasId }).update(values);
    await db.orm.public.JadwalItem.where((j) => j.kelasId.eq(kelasId)).delete();
  } else {
    const baru = await db.orm.public.Kelas.create(values);
    id = baru.id;
  }
  for (const j of jadwalBaru)
    await db.orm.public.JadwalItem.create({ kelasId: id, hari: j.hari as never, jamMulai: j.jamMulai, jamSelesai: j.jamSelesai });
  revalidatePath('/admin/classes');
  return { ok: true };
}

// --- E7 verifikasi refund (BR#19) ---
// Keputusan admin hanya mencatat status pengajuan. Pembatalan pendaftaran +
// pelepasan kuota + uang kembali tetap di alur pembatalan/payment (C7/C4-C6),
// jangan dobel di sini.
export async function prosesPengajuan(formData: FormData): Promise<void> {
  const adminId = await guardAdmin();
  if (!adminId) return;
  const pengajuanId = Number(formData.get('pengajuan_id'));
  const keputusan = String(formData.get('keputusan') ?? '');
  if (!Number.isInteger(pengajuanId)) return;
  if (keputusan !== 'disetujui' && keputusan !== 'ditolak') return;

  const [pengajuan] = await collect(
    db.orm.public.PengajuanPembatalan.where((p) => p.id.eq(pengajuanId)).all(),
  );
  if (!pengajuan || pengajuan.status !== 'menunggu') return;

  await db.orm.public.PengajuanPembatalan.where({ id: pengajuanId }).update({
    status: keputusan,
    diprosesOleh: adminId,
    diprosesPada: new Date().toISOString(),
    catatanAdmin: String(formData.get('catatan_admin') ?? '').trim() || null,
  });
  revalidatePath('/admin/refunds');
}
