'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/prisma/db';
import { auth } from '@/lib/auth';
import { collect } from '@/lib/collect';
import { hariDariTanggal, dalamJendela7Hari } from '@/lib/hari';

export type GuruState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

async function guardGuru(): Promise<number | null> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'guru') return null;
  return Number(session.user.id);
}

// --- D7 profil guru ---
const profilSchema = z.object({
  nama: z.string().trim().min(2, 'Nama minimal 2 karakter'),
  alamat: z.string().trim().max(255).optional().or(z.literal('')),
  nomor_telepon: z.string().trim().max(30).optional().or(z.literal('')),
});

export async function updateGuruProfile(
  _prev: GuruState,
  formData: FormData,
): Promise<GuruState> {
  const guruId = await guardGuru();
  if (!guruId) return { error: 'Sesi berakhir. Masuk ulang.' };

  const parsed = profilSchema.safeParse({
    nama: formData.get('nama'),
    alamat: formData.get('alamat') ?? '',
    nomor_telepon: formData.get('nomor_telepon') ?? '',
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: 'Periksa lagi isian.', fieldErrors };
  }
  const d = parsed.data;

  await db.orm.public.User.where({ id: guruId }).update({
    name: d.nama,
    alamat: d.alamat || null,
    nomorTelepon: d.nomor_telepon || null,
  });
  revalidatePath('/teacher/profile');
  return { ok: true };
}

// --- D3 presensi (BR#18: edit bebas 7 hari sejak input pertama) ---
const STATUS_PRESENSI = ['hadir', 'izin', 'sakit', 'alpa'] as const;

export async function savePresensi(
  _prev: GuruState,
  formData: FormData,
): Promise<GuruState> {
  const guruId = await guardGuru();
  if (!guruId) return { error: 'Sesi berakhir. Masuk ulang.' };

  const kelasId = Number(formData.get('kelas_id'));
  const jadwalItemId = Number(formData.get('jadwal_item_id'));
  const tanggal = String(formData.get('tanggal') ?? '');
  if (!Number.isInteger(kelasId) || !Number.isInteger(jadwalItemId))
    return { error: 'Parameter tidak valid.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return { error: 'Tanggal tidak valid.' };

  // Kelas harus diampu guru ini, dan jadwal item milik kelas itu.
  const [kelas] = await collect(
    db.orm.public.Kelas.where((k) => k.id.eq(kelasId))
      .where((k) => k.guruId.eq(guruId))
      .all(),
  );
  if (!kelas) return { error: 'Kelas tidak ditemukan / bukan kelas Anda.' };

  const jadwal = await collect(
    db.orm.public.JadwalItem.where((j) => j.kelasId.eq(kelasId)).all(),
  );
  const item = jadwal.find((j) => j.id === jadwalItemId);
  if (!item) return { error: 'Sesi jadwal tidak valid.' };
  if (hariDariTanggal(tanggal) !== item.hari)
    return { error: `Tanggal tidak jatuh pada hari ${item.hari}.` };

  // Siswa terdaftar (terdaftar + tertunggak masih ikut kelas).
  const siswa = await collect(
    db.orm.public.Pendaftaran.where((p) => p.kelasId.eq(kelasId))
      .where((p) => p.status.in(['terdaftar', 'tertunggak']))
      .all(),
  );
  const siswaIds = new Set(siswa.map((s) => s.id));

  const existing = await collect(
    db.orm.public.Presensi.where((x) => x.jadwalItemId.eq(jadwalItemId))
      .where((x) => x.tanggalPertemuan.eq(tanggal))
      .all(),
  );
  const existingMap = new Map(existing.map((e) => [e.pendaftaranId, e]));

  let ditolak = 0;
  for (const s of siswa) {
    const status = formData.get(`presensi_${s.id}`);
    if (typeof status !== 'string' || !STATUS_PRESENSI.includes(status as never)) continue;
    if (!siswaIds.has(s.id)) continue;

    const catatan = String(formData.get(`catatan_${s.id}`) ?? '').trim() || null;
    const lama = existingMap.get(s.id);

    if (lama) {
      if (!dalamJendela7Hari(lama.createdAt)) {
        ditolak += 1;
        continue; // BR#18 — terkunci, lewat pengajuan koreksi admin.
      }
      await db.orm.public.Presensi.where({ id: lama.id }).update({
        status: status as (typeof STATUS_PRESENSI)[number],
        catatan,
        dicatatOleh: guruId,
      });
    } else {
      await db.orm.public.Presensi.create({
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
      error: `${ditolak} entri tidak diubah — sudah lewat 7 hari sejak input pertama (BR#18), koreksi lewat admin.`,
    };

  revalidatePath(`/teacher/classes/${kelasId}/sessions/${tanggal}/attendance`);
  return { ok: true };
}

// --- D5 nilai (BR#18 sama) ---
const nilaiSchema = z.object({
  pendaftaran_id: z.coerce.number().int().positive(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi'),
  nilai: z.coerce.number().min(0, 'Nilai 0-100').max(100, 'Nilai 0-100').optional(),
  catatan: z.string().trim().max(1000).optional().or(z.literal('')),
});

export async function saveNilai(_prev: GuruState, formData: FormData): Promise<GuruState> {
  const guruId = await guardGuru();
  if (!guruId) return { error: 'Sesi berakhir. Masuk ulang.' };

  const parsed = nilaiSchema.safeParse({
    pendaftaran_id: formData.get('pendaftaran_id'),
    tanggal: formData.get('tanggal'),
    nilai: formData.get('nilai') || undefined,
    catatan: formData.get('catatan') ?? '',
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: 'Periksa lagi isian nilai.', fieldErrors };
  }
  const d = parsed.data;
  if (d.nilai == null && !d.catatan)
    return { error: 'Isi nilai kuantitatif atau catatan kualitatif.' };

  // Pendaftaran harus di kelas yang diampu guru ini.
  const [p] = await collect(
    db.orm.public.Pendaftaran.where((x) => x.id.eq(d.pendaftaran_id)).all(),
  );
  if (!p) return { error: 'Pendaftaran tidak ditemukan.' };
  const [k] = await collect(
    db.orm.public.Kelas.where((x) => x.id.eq(p.kelasId))
      .where((x) => x.guruId.eq(guruId))
      .all(),
  );
  if (!k) return { error: 'Bukan siswa kelas Anda.' };

  const nilaiId = Number(formData.get('nilai_id') ?? 0);
  if (Number.isInteger(nilaiId) && nilaiId > 0) {
    const [lama] = await collect(
      db.orm.public.NilaiProgres.where((x) => x.id.eq(nilaiId)).all(),
    );
    if (!lama || lama.pendaftaranId !== d.pendaftaran_id)
      return { error: 'Entri nilai tidak ditemukan.' };
    if (!dalamJendela7Hari(lama.createdAt))
      return {
        error:
          'Sudah lewat 7 hari sejak input pertama (BR#18) — koreksi lewat pengajuan ke admin.',
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
  revalidatePath(`/teacher/grades/${d.pendaftaran_id}`);
  return { ok: true };
}
