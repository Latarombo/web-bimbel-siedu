'use server';

import { z } from 'zod';
import { getTranslations } from 'next-intl/server';
import { getLocaleDariCookie } from '@/i18n/locale';

type Translator = Awaited<ReturnType<typeof getTranslations>>;
import { revalidatePath } from 'next/cache';
import { db } from '@/prisma/db';
import { auth } from '@/lib/auth';
import { collect } from '@/lib/collect';
import bcrypt from 'bcryptjs';
import { validateIndonesianPhone } from '@/lib/format/phone';

export type AdminState = {
    ok?: boolean;
    error?: string;
    fieldErrors?: Record<string, string>;
};

async function guardAdmin(): Promise<number | null> {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') return null;
    return Number(session.user.id);
}

function fieldErr(
    parsed: {
        error: {
            issues: readonly {
                path: readonly PropertyKey[];
                message: string;
            }[];
        };
    },
    t: Translator,
): AdminState {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
        fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: t('validation.checkFields'), fieldErrors };
}

// --- E3 Periode ---
const periodeSchema = (t: Translator) =>
    z
        .object({
            nama: z
                .string()
                .trim()
                .min(2, t('validation.nameMin'))
                .max(100, t('validation.nameMax')),
            tanggal_mulai: z
                .string()
                .regex(/^\d{4}-\d{2}-\d{2}$/, t('validation.dateRequired')),
            tanggal_selesai: z
                .string()
                .regex(/^\d{4}-\d{2}-\d{2}$/, t('validation.dateRequired')),
            tanggal_tutup_pendaftaran: z
                .string()
                .regex(/^\d{4}-\d{2}-\d{2}$/, t('validation.dateRequired')),
            status: z.enum(
                ['dibuka', 'ditutup', 'selesai'],
                t('validation.invalid'),
            ),
        })
        .refine((d) => d.tanggal_mulai < d.tanggal_selesai, {
            message: t('validation.periodOrder'),
            path: ['tanggal_selesai'],
        })
        .refine((d) => d.tanggal_tutup_pendaftaran <= d.tanggal_selesai, {
            message: t('validation.closeOrder'),
            path: ['tanggal_tutup_pendaftaran'],
        });

export async function savePeriode(
    _prev: AdminState,
    formData: FormData,
): Promise<AdminState> {
    const locale = await getLocaleDariCookie();
    const t = await getTranslations({ locale, namespace: 'adminForms' });
    if (!(await guardAdmin())) return { error: t('validation.session') };
    const parsed = periodeSchema(t).safeParse(
        {
            nama: formData.get('nama'),
            tanggal_mulai: formData.get('tanggal_mulai'),
            tanggal_selesai: formData.get('tanggal_selesai'),
            tanggal_tutup_pendaftaran: formData.get(
                'tanggal_tutup_pendaftaran',
            ),
            status: formData.get('status'),
        },
        { error: () => t('validation.invalid') },
    );
    if (!parsed.success) return fieldErr(parsed, t);
    const periodeId = Number(formData.get('periode_id') ?? 0);
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
    revalidatePath('/admin/periods');
    return { ok: true };
}

export async function hapusPeriodeAction(periodeId: number): Promise<AdminState> {
    const adminId = await guardAdmin();
    if (!adminId) return { error: 'Sesi admin berakhir.' };
    if (!Number.isInteger(periodeId) || periodeId <= 0)
        return { error: 'ID semester tidak valid.' };

    const [kelasDipakai, pendaftaranDipakai] = await Promise.all([
        collect(db.orm.public.Kelas.where((k) => k.periodeId.eq(periodeId)).all()),
        collect(
            db.orm.public.Pendaftaran.where((p) =>
                p.periodeId.eq(periodeId),
            ).all(),
        ),
    ]);
    if (kelasDipakai.length > 0 || pendaftaranDipakai.length > 0) {
        return {
            error: 'Semester tidak dapat dihapus karena masih memiliki kelas atau pendaftaran terkait.',
        };
    }

    try {
        await db.orm.public.PeriodePendaftaran.where({ id: periodeId }).delete();
    } catch {
        return { error: 'Semester tidak dapat dihapus karena masih digunakan.' };
    }
    revalidatePath('/admin/periods');
    return { ok: true };
}

// --- E4 Guru ---
const guruSchema = (t: Translator) =>
    z.object({
        nama: z
            .string()
            .trim()
            .min(2, t('validation.nameMin'))
            .max(100, t('validation.nameMax')),
        email: z
            .string()
            .trim()
            .toLowerCase()
            .max(255)
            .email(t('validation.email')),
        password: z
            .string()
            .min(8, t('validation.passwordMin'))
            .max(72, t('validation.passwordMax'))
            .optional()
            .or(z.literal('')),
        alamat: z
            .string()
            .trim()
            .max(500, t('validation.addressMax'))
            .optional()
            .or(z.literal('')),
        nomor_telepon: z
            .string()
            .trim()
            .min(10, t('validation.phoneMin'))
            .max(20, t('validation.phoneMax')),
    });

export async function saveGuru(
    _prev: AdminState,
    formData: FormData,
): Promise<AdminState> {
    const locale = await getLocaleDariCookie();
    const t = await getTranslations({ locale, namespace: 'adminForms' });
    if (!(await guardAdmin())) return { error: t('validation.session') };
    const parsed = guruSchema(t).safeParse(
        {
            nama: formData.get('nama'),
            email: formData.get('email'),
            password: formData.get('password') ?? '',
            alamat: formData.get('alamat') ?? '',
            nomor_telepon: formData.get('nomor_telepon') ?? '',
        },
        { error: () => t('validation.invalid') },
    );
    if (!parsed.success) return fieldErr(parsed, t);
    const { nama, email, password, alamat, nomor_telepon } = parsed.data;
    const guruId = Number(formData.get('guru_id') ?? 0);
    try {
        if (guruId > 0) {
            await db.orm.public.User.where({ id: guruId, role: 'guru' }).update(
                {
                    name: nama,
                    email,
                    alamat: alamat || null,
                    nomorTelepon: nomor_telepon,
                    ...(password
                        ? { password: await bcrypt.hash(password, 10) }
                        : {}),
                },
            );
        } else {
            if (!password)
                return {
                    error: t('validation.newTeacherPassword'),
                    fieldErrors: { password: t('validation.required') },
                };
            await db.orm.public.User.create({
                role: 'guru',
                name: nama,
                email,
                password: await bcrypt.hash(password, 10),
                alamat: alamat || null,
                nomorTelepon: nomor_telepon,
            });
        }
    } catch (e) {
        if (e instanceof Error && e.message.includes('duplicate key'))
            return { error: t('validation.emailDuplicate') };
        throw e;
    }
    revalidatePath('/admin/teachers');
    return { ok: true };
}

export async function hapusGuru(formData: FormData): Promise<void> {
    if (!(await guardAdmin())) return;
    const guruId = Number(formData.get('guru_id'));
    if (!Number.isInteger(guruId) || guruId <= 0) return;

    // FK Restrict di 4 tabel: tidak boleh ada kelas, pesan tidak langsung (tidak
    // ada kolom guru — diabaikan), presensi, atau nilai yang masih menunjuk akun
    // ini. Ditolak dengan pesan, bukan silent-fail: admin perlu tahu kenapa.
    const [kelasDipakai, presensiDipakai, nilaiDipakai] = await Promise.all([
        collect(db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).all()),
        collect(
            db.orm.public.Presensi.where((x) => x.dicatatOleh.eq(guruId)).all(),
        ),
        collect(
            db.orm.public.Penilaian.where((p) => p.dibuatOleh.eq(guruId)).all(),
        ),
    ]);
    if (
        kelasDipakai.length > 0 ||
        presensiDipakai.length > 0 ||
        nilaiDipakai.length > 0
    )
        return;

    try {
        await db.orm.public.User.where({ id: guruId, role: 'guru' }).delete();
    } catch {
        return; // balapan: dependensi muncul di antara cek dan delete
    }
    revalidatePath('/admin/teachers');
}

export async function hapusGuruAction(guruId: number): Promise<AdminState> {
    if (!(await guardAdmin())) return { error: 'Sesi admin berakhir.' };
    if (!Number.isInteger(guruId) || guruId <= 0)
        return { error: 'ID guru tidak valid.' };

    const [kelasDipakai, presensiDipakai, nilaiDipakai] = await Promise.all([
        collect(db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).all()),
        collect(
            db.orm.public.Presensi.where((x) => x.dicatatOleh.eq(guruId)).all(),
        ),
        collect(
            db.orm.public.Penilaian.where((p) => p.dibuatOleh.eq(guruId)).all(),
        ),
    ]);
    if (
        kelasDipakai.length > 0 ||
        presensiDipakai.length > 0 ||
        nilaiDipakai.length > 0
    ) {
        return {
            error: 'Guru tidak dapat dihapus karena masih mengampu kelas atau memiliki riwayat presensi/penilaian.',
        };
    }

    try {
        await db.orm.public.User.where({ id: guruId, role: 'guru' }).delete();
    } catch {
        return { error: 'Gagal menghapus guru karena masih terikat data lain.' };
    }
    revalidatePath('/admin/teachers');
    return { ok: true };
}

// --- E5 Kelas + jadwal ---
const HARI = [
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
    'Minggu',
] as const;

const kelasSchema = (t: Translator) =>
    z
        .object({
            nama: z
                .string()
                .trim()
                .min(2, t('validation.nameMin'))
                .max(120, t('validation.nameMax')),
            mapel: z
                .string()
                .trim()
                .min(2, t('validation.nameMin'))
                .max(100, t('validation.nameMax')),
            guru_id: z.coerce.number().int().positive(t('validation.teacher')),
            periode_id: z.coerce
                .number()
                .int()
                .positive(t('validation.period')),
            jenjang: z.enum(
                ['TK', 'SD', 'SMP', 'SMA'],
                t('validation.invalid'),
            ),
            tingkat: z
                .string()
                .trim()
                .max(30, t('validation.gradeMax'))
                .optional()
                .or(z.literal('')),
            ruangan: z
                .string()
                .trim()
                .max(50, t('validation.roomMax'))
                .optional()
                .or(z.literal('')),
            kuota_maksimum: z.coerce
                .number()
                .int()
                .min(1, t('validation.minOne'))
                .max(200, t('validation.maxQuota')),
            kuota_minimum: z.coerce
                .number()
                .int()
                .min(1, t('validation.minOne'))
                .max(200, t('validation.maxQuota')),
            biaya_periode: z.coerce
                .number()
                .positive(t('validation.positiveFee')),
            biaya_dp: z.coerce.number().positive().optional(),
            tenor_maksimum: z.coerce
                .number()
                .int()
                .min(2, t('validation.minTwo'))
                .optional(),
            status: z.enum(['aktif', 'dibatalkan'], t('validation.invalid')),
        })
        .refine((d) => d.kuota_minimum <= d.kuota_maksimum, {
            message: t('validation.quotaOrder'),
            path: ['kuota_minimum'],
        })
        .refine((d) => d.biaya_dp == null || d.biaya_dp < d.biaya_periode, {
            message: t('validation.depositOrder'),
            path: ['biaya_dp'],
        });

export async function saveKelas(
    _prev: AdminState,
    formData: FormData,
): Promise<AdminState> {
    const locale = await getLocaleDariCookie();
    const t = await getTranslations({ locale, namespace: 'adminForms' });
    if (!(await guardAdmin())) return { error: t('validation.session') };
    const parsed = kelasSchema(t).safeParse(
        {
            nama: formData.get('nama'),
            mapel: formData.get('mapel'),
            guru_id: formData.get('guru_id'),
            periode_id: formData.get('periode_id'),
            jenjang: formData.get('jenjang'),
            tingkat: formData.get('tingkat') ?? '',
            ruangan: formData.get('ruangan') ?? '',
            kuota_maksimum: formData.get('kuota_maksimum'),
            kuota_minimum: formData.get('kuota_minimum'),
            biaya_periode: formData.get('biaya_periode'),
            biaya_dp: formData.get('biaya_dp') || undefined,
            tenor_maksimum: formData.get('tenor_maksimum') || undefined,
            status: formData.get('status'),
        },
        { error: () => t('validation.invalid') },
    );
    if (!parsed.success) return fieldErr(parsed, t);
    const d = parsed.data;
    // BR#12 dijaga CHECK DB: biaya_dp NULL ⇔ tenor_maksimum NULL
    if ((d.biaya_dp == null) !== (d.tenor_maksimum == null))
        return {
            error: t('validation.depositTerm'),
        };

    // BR#6: jadwal guru tidak boleh bentrok (periode sama, hari sama, jam beririsan) — level jadwal_item.
    const jadwalBaru: {
        hari: string;
        jamMulai: string;
        jamSelesai: string;
        tempat: string | null;
    }[] = [];
    for (let i = 0; i < 7; i += 1) {
        const hari = String(formData.get(`jadwal_hari_${i}`) ?? '');
        const jamMulai = String(formData.get(`jadwal_mulai_${i}`) ?? '');
        const jamSelesai = String(formData.get(`jadwal_selesai_${i}`) ?? '');
        const tempat = String(formData.get(`jadwal_tempat_${i}`) ?? '').trim();
        if (!hari && !jamMulai && !jamSelesai) continue;
        if (
            !HARI.includes(hari as never) ||
            !/^([01]\d|2[0-3]):[0-5]\d$/.test(jamMulai) ||
            !/^([01]\d|2[0-3]):[0-5]\d$/.test(jamSelesai)
        )
            return {
                error: t('validation.scheduleInvalid', { number: i + 1 }),
            };
        if (jamMulai >= jamSelesai)
            return {
                error: t('validation.scheduleOrder', { number: i + 1 }),
            };
        jadwalBaru.push({
            hari,
            jamMulai,
            jamSelesai,
            tempat: tempat || (d.ruangan?.trim() ? d.ruangan.trim() : null),
        });
    }
    if (jadwalBaru.length === 0)
        return { error: t('validation.scheduleRequired') };

    for (let a = 0; a < jadwalBaru.length; a += 1) {
        for (let b = a + 1; b < jadwalBaru.length; b += 1) {
            const sa = jadwalBaru[a];
            const sb = jadwalBaru[b];
            if (
                sa.hari === sb.hari &&
                sa.jamMulai < sb.jamSelesai &&
                sb.jamMulai < sa.jamSelesai
            ) {
                return {
                    error: `Jadwal bentrok di formulir: hari ${sa.hari} (${sa.jamMulai}–${sa.jamSelesai} bertabrakan dengan ${sb.jamMulai}–${sb.jamSelesai}).`,
                };
            }
        }
    }

    // ponytail: cek bentrok BR#6 dibaca semua jadwal guru lalu dibanding di JS —
    // interval overlap SQL antar-baris baru+lama rumit; upgrade jadi satu SQL bila kelas >ratusan.
    const kelasGuru = await collect(
        db.orm.public.Kelas.where((k) => k.guruId.eq(d.guru_id))
            .where((k) => k.periodeId.eq(d.periode_id))
            .where((k) => k.status.eq('aktif'))
            .all(),
    );
    const kelasId = Number(formData.get('kelas_id') ?? 0);
    const kelasIds = new Set(
        kelasGuru.map((k) => k.id).filter((cid) => cid !== kelasId),
    );
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
                    error: t('validation.scheduleConflict', {
                        day: t(`days.${nl.hari}`),
                        start: strip(ol.jamMulai),
                        end: strip(ol.jamSelesai),
                    }),
                };
        }
    }

    const values = {
        nama: d.nama,
        mapel: d.mapel,
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
    let id = kelasId;
    if (kelasId > 0) {
        const existingJadwal = jadwalLama.filter((j) => j.kelasId === kelasId);
        const existingIds = existingJadwal.map((j) => j.id);
        const [presensiAda, sesiAda] = existingIds.length
            ? await Promise.all([
                  collect(
                      db.orm.public.Presensi.where((p) =>
                          p.jadwalItemId.in(existingIds),
                      ).all(),
                  ),
                  collect(
                      db.orm.public.SesiPertemuan.where((s) =>
                          s.jadwalItemId.in(existingIds),
                      ).all(),
                  ),
              ])
            : [[], []];
        await db.orm.public.Kelas.where({ id: kelasId }).update(values);
        if (presensiAda.length === 0 && sesiAda.length === 0) {
            await db.orm.public.JadwalItem.where((j) =>
                j.kelasId.eq(kelasId),
            ).delete();
            for (const j of jadwalBaru) {
                await db.orm.public.JadwalItem.create({
                    kelasId: id,
                    hari: j.hari as never,
                    jamMulai: j.jamMulai,
                    jamSelesai: j.jamSelesai,
                    tempat: j.tempat,
                });
            }
        }
    } else {
        const baru = await db.orm.public.Kelas.create(values);
        id = baru.id;
        for (const j of jadwalBaru) {
            await db.orm.public.JadwalItem.create({
                kelasId: id,
                hari: j.hari as never,
                jamMulai: j.jamMulai,
                jamSelesai: j.jamSelesai,
                tempat: j.tempat,
            });
        }
    }
    revalidatePath('/admin/classes');
    revalidatePath('/admin/schedule');
    return { ok: true };
}

export async function hapusKelasAction(kelasId: number): Promise<AdminState> {
    const adminId = await guardAdmin();
    if (!adminId) return { error: 'Sesi admin berakhir.' };
    if (!Number.isInteger(kelasId) || kelasId <= 0)
        return { error: 'ID kelas tidak valid.' };

    const [pendaftaranDipakai, penilaianDipakai, statusDipakai, jadwalKelas] =
        await Promise.all([
            collect(
                db.orm.public.Pendaftaran.where((p) =>
                    p.kelasId.eq(kelasId),
                ).all(),
            ),
            collect(
                db.orm.public.Penilaian.where((p) =>
                    p.kelasId.eq(kelasId),
                ).all(),
            ),
            collect(
                db.orm.public.StatusPembelajaran.where((s) =>
                    s.kelasId.eq(kelasId),
                ).all(),
            ),
            collect(
                db.orm.public.JadwalItem.where((j) =>
                    j.kelasId.eq(kelasId),
                ).all(),
            ),
        ]);

    if (
        pendaftaranDipakai.length > 0 ||
        penilaianDipakai.length > 0 ||
        statusDipakai.length > 0
    ) {
        return {
            error: 'Kelas tidak dapat dihapus karena sudah memiliki data pendaftaran, penilaian, atau status pembelajaran terkait.',
        };
    }

    const jadwalIds = jadwalKelas.map((j) => j.id);
    if (jadwalIds.length > 0) {
        const [presensiDipakai, sesiDipakai] = await Promise.all([
            collect(
                db.orm.public.Presensi.where((p) =>
                    p.jadwalItemId.in(jadwalIds),
                ).all(),
            ),
            collect(
                db.orm.public.SesiPertemuan.where((s) =>
                    s.jadwalItemId.in(jadwalIds),
                ).all(),
            ),
        ]);
        if (presensiDipakai.length > 0 || sesiDipakai.length > 0) {
            return {
                error: 'Kelas tidak dapat dihapus karena jadwalnya sudah memiliki riwayat presensi atau sesi pertemuan.',
            };
        }
    }

    try {
        await db.orm.public.Kelas.where({ id: kelasId }).delete();
    } catch {
        return { error: 'Kelas tidak dapat dihapus karena masih terikat data lain.' };
    }
    revalidatePath('/admin/classes');
    revalidatePath('/admin/schedule');
    return { ok: true };
}

// E11 — Pesan Kontak: admin menandai status pesan masuk dari formulir /contact.
export async function ubahStatusPesan(formData: FormData): Promise<void> {
    const adminId = await guardAdmin();
    if (!adminId) return;
    const id = Number(formData.get('pesan_id'));
    const status = String(formData.get('status') ?? '');
    if (
        !Number.isInteger(id) ||
        !['baru', 'diproses', 'selesai'].includes(status)
    )
        return;
    await db.orm.public.PesanKontak.where((p) => p.id.eq(id)).update({
        status: status as 'baru' | 'diproses' | 'selesai',
        updatedAt: new Date().toISOString(),
    });
    revalidatePath('/admin/messages');
    revalidatePath('/admin/dashboard');
}

export async function hapusPesan(formData: FormData): Promise<void> {
    if (!(await guardAdmin())) return;
    const id = Number(formData.get('pesan_id'));
    if (!Number.isInteger(id)) return;
    await db.orm.public.PesanKontak.where((p) => p.id.eq(id)).delete();
    revalidatePath('/admin/messages');
    revalidatePath('/admin/dashboard');
}

// --- M2 proses pengajuan koreksi (admin) ---
export async function prosesKoreksi(
    prevOrFormData: AdminState | FormData,
    maybeFormData?: FormData,
): Promise<AdminState> {
    const formData =
        typeof FormData !== 'undefined' && maybeFormData instanceof FormData
            ? maybeFormData
            : typeof FormData !== 'undefined' &&
                prevOrFormData instanceof FormData
              ? prevOrFormData
              : ((maybeFormData ?? prevOrFormData) as FormData);
    const adminId = await guardAdmin();
    if (!adminId) return { error: 'Sesi admin berakhir.' };

    const koreksiId = Number(formData.get('koreksi_id'));
    const keputusan = String(formData.get('keputusan') ?? ''); // 'setujui' | 'tolak'
    const catatanAdmin = String(formData.get('catatan_admin') ?? '').trim();

    if (
        !Number.isInteger(koreksiId) ||
        !['setujui', 'tolak'].includes(keputusan)
    ) {
        return { error: 'Parameter keputusan tidak valid.' };
    }
    if (catatanAdmin.length > 1000) {
        return { error: 'Catatan admin maksimal 1000 karakter.' };
    }

    const [koreksi] = await collect(
        db.orm.public.PengajuanKoreksi.where({ id: koreksiId }).all(),
    );
    if (!koreksi) return { error: 'Pengajuan koreksi tidak ditemukan.' };
    if (koreksi.status !== 'menunggu') {
        return { error: 'Pengajuan koreksi sudah pernah diproses.' };
    }

    await db.transaction(async (tx) => {
        if (keputusan === 'setujui') {
            let usulan: Record<string, unknown> = {};
            try {
                usulan = JSON.parse(koreksi.dataUsulan);
            } catch {
                usulan = { status: koreksi.dataUsulan };
            }

            if (koreksi.entitas === 'presensi') {
                const updateData: Record<string, unknown> = {};
                if (typeof usulan.status === 'string')
                    updateData.status = usulan.status;
                if (typeof usulan.catatan === 'string')
                    updateData.catatan = usulan.catatan;
                await tx.orm.public.Presensi.where({
                    id: koreksi.entitasId,
                }).update(updateData);
            }

            await tx.orm.public.PengajuanKoreksi.where({
                id: koreksiId,
            }).update({
                status: 'disetujui',
                diprosesOleh: adminId,
                catatanAdmin: catatanAdmin || null,
            });

            await tx.orm.public.AuditPerubahan.create({
                entitas: koreksi.entitas,
                entitasId: koreksi.entitasId,
                aksi: 'koreksi_disetujui',
                sebelum: koreksi.dataSebelum,
                sesudah: koreksi.dataUsulan,
                alasan: catatanAdmin || koreksi.alasan,
                aktorId: adminId,
            });
        } else {
            await tx.orm.public.PengajuanKoreksi.where({
                id: koreksiId,
            }).update({
                status: 'ditolak',
                diprosesOleh: adminId,
                catatanAdmin: catatanAdmin || null,
            });

            await tx.orm.public.AuditPerubahan.create({
                entitas: koreksi.entitas,
                entitasId: koreksi.entitasId,
                aksi: 'koreksi_ditolak',
                sebelum: koreksi.dataSebelum,
                sesudah: koreksi.dataUsulan,
                alasan: catatanAdmin || 'Ditolak admin',
                aktorId: adminId,
            });
        }
    });

    revalidatePath('/[locale]/admin/corrections', 'page');
    revalidatePath('/[locale]/teacher/corrections', 'page');
    return { ok: true };
}

export async function prosesKoreksiAction(formData: FormData): Promise<void> {
    await prosesKoreksi(formData);
}

export async function tarikStatusPembelajaranAdmin(
    statusId: number,
    alasan: string = 'Ditarik oleh admin',
): Promise<{ ok?: boolean; error?: string }> {
    const adminId = await guardAdmin();
    if (!adminId) return { error: 'Sesi admin berakhir' };

    const [existing] = await collect(
        db.orm.public.StatusPembelajaran.where({ id: statusId }).all(),
    );
    if (!existing) return { error: 'Status pembelajaran tidak ditemukan' };

    const nowIso = new Date().toISOString();
    await db.orm.public.StatusPembelajaran.where({ id: statusId }).update({
        status: 'ditarik_admin',
        updatedAt: nowIso,
    });

    await db.orm.public.AuditPerubahan.create({
        entitas: 'status_pembelajaran',
        entitasId: statusId,
        aksi: 'tarik_status_admin',
        sebelum: JSON.stringify({ status: existing.status }),
        sesudah: JSON.stringify({ status: 'ditarik_admin' }),
        alasan,
        aktorId: adminId,
        createdAt: nowIso,
    });

    revalidatePath('/[locale]/teacher/status', 'page');
    revalidatePath('/[locale]/home', 'page');
    revalidatePath('/[locale]/schedule-attendance', 'page');
    return { ok: true };
}

export async function konfirmasiPembayaranManualAdmin(
    pembayaranId: number,
    catatan: string = 'Pembayaran manual dikonfirmasi oleh admin',
): Promise<{ ok?: boolean; error?: string }> {
    const adminId = await guardAdmin();
    if (!adminId) return { error: 'Sesi admin berakhir' };

    const [pembayaran] = await collect(
        db.orm.public.Pembayaran.where({ id: pembayaranId }).all(),
    );
    if (!pembayaran) return { error: 'Data pembayaran tidak ditemukan' };
    if (pembayaran.status === 'berhasil')
        return { error: 'Pembayaran sudah berstatus berhasil' };

    const nowIso = new Date().toISOString();
    const [pendaftaran] = await collect(
        db.orm.public.Pendaftaran.where({ id: pembayaran.pendaftaranId }).all(),
    );
    if (!pendaftaran) return { error: 'Data pendaftaran tidak ditemukan' };

    await db.transaction(async (tx) => {
        await tx.orm.public.Pembayaran.where({ id: pembayaranId }).update({
            status: 'berhasil',
            dibayarPada: nowIso,
            referensiGateway:
                pembayaran.referensiGateway || `MANUAL-${Date.now()}`,
            updatedAt: nowIso,
        });

        // Pulihkan pendaftaran ke status terdaftar jika sebelumnya menunggu atau tertunggak
        if (
            pendaftaran.status === 'menunggu_pembayaran' ||
            pendaftaran.status === 'tertunggak'
        ) {
            await tx.orm.public.Pendaftaran.where({ id: pendaftaran.id }).update({
                status: 'terdaftar',
                updatedAt: nowIso,
            });
        }

        await tx.orm.public.AuditPerubahan.create({
            entitas: 'pembayaran',
            entitasId: pembayaranId,
            aksi: 'konfirmasi_bayar_manual',
            sebelum: JSON.stringify({
                status: pembayaran.status,
                dibayarPada: pembayaran.dibayarPada,
            }),
            sesudah: JSON.stringify({
                status: 'berhasil',
                dibayarPada: nowIso,
            }),
            alasan: catatan,
            aktorId: adminId,
            createdAt: nowIso,
        });
    });

    revalidatePath('/[locale]/admin/enrollments', 'page');
    revalidatePath(`/[locale]/admin/enrollments/${pendaftaran.id}`, 'page');
    revalidatePath('/[locale]/admin/enrollments/flagged', 'page');
    revalidatePath('/[locale]/admin/payments', 'page');
    revalidatePath('/[locale]/admin/reports', 'page');
    revalidatePath('/[locale]/admin/dashboard', 'page');
    return { ok: true };
}

export async function updateKontakWaliAdmin(
    userId: number,
    nomorTelepon: string,
    alamat?: string,
): Promise<{ ok?: boolean; error?: string }> {
    const adminId = await guardAdmin();
    if (!adminId) return { error: 'Sesi admin berakhir' };

    const [user] = await collect(
        db.orm.public.User.where({ id: userId }).all(),
    );
    if (!user || user.role !== 'orang_tua')
        return { error: 'Data wali murid tidak ditemukan' };

    const nowIso = new Date().toISOString();
    await db.orm.public.User.where({ id: userId }).update({
        nomorTelepon,
        alamat: alamat || null,
        updatedAt: nowIso,
    });

    await db.orm.public.AuditPerubahan.create({
        entitas: 'user',
        entitasId: userId,
        aksi: 'update_kontak_wali',
        sebelum: JSON.stringify({
            nomorTelepon: user.nomorTelepon,
            alamat: user.alamat,
        }),
        sesudah: JSON.stringify({
            nomorTelepon,
            alamat: alamat || null,
        }),
        alasan: 'Pembaruan kontak darurat oleh admin',
        aktorId: adminId,
        createdAt: nowIso,
    });

    revalidatePath('/[locale]/admin/parents', 'page');
    return { ok: true };
}

// --- CRUD Orang Tua (Admin) ---
const orangTuaSchema = (t: Translator) =>
    z.object({
        nama: z
            .string()
            .trim()
            .min(2, t('validation.nameMin'))
            .max(100, t('validation.nameMax')),
        email: z
            .string()
            .trim()
            .toLowerCase()
            .max(255)
            .email(t('validation.email')),
        password: z
            .string()
            .min(8, t('validation.passwordMin'))
            .max(72, t('validation.passwordMax'))
            .optional()
            .or(z.literal('')),
        alamat: z
            .string()
            .trim()
            .max(500, t('validation.addressMax'))
            .optional()
            .or(z.literal('')),
        nomor_telepon: z
            .string()
            .trim()
            .min(10, t('validation.phoneMin'))
            .max(20, t('validation.phoneMax')),
    });

export async function saveOrangTuaAdmin(
    _prev: AdminState,
    formData: FormData,
): Promise<AdminState> {
    const locale = await getLocaleDariCookie();
    const t = await getTranslations({ locale, namespace: 'adminForms' });
    const adminId = await guardAdmin();
    if (!adminId) return { error: t('validation.session') };

    const parsed = orangTuaSchema(t).safeParse(
        {
            nama: formData.get('nama'),
            email: formData.get('email'),
            password: formData.get('password') ?? '',
            alamat: formData.get('alamat') ?? '',
            nomor_telepon: formData.get('nomor_telepon') ?? '',
        },
        { error: () => t('validation.invalid') },
    );
    if (!parsed.success) return fieldErr(parsed, t);

    const { nama, email, password, alamat, nomor_telepon } = parsed.data;
    const phoneCheck = validateIndonesianPhone(nomor_telepon);
    if (!phoneCheck.valid) {
        return {
            error: t('validation.checkFields'),
            fieldErrors: {
                nomor_telepon:
                    'Nomor telepon harus diawali 08 / +628 (10-13 digit).',
            },
        };
    }
    const normalizedPhone = phoneCheck.normalized!;
    const userId = Number(formData.get('user_id') ?? 0);
    const nowIso = new Date().toISOString();

    try {
        if (userId > 0) {
            const [existing] = await collect(
                db.orm.public.User.where({ id: userId, role: 'orang_tua' }).all(),
            );
            if (!existing) return { error: 'Data orang tua tidak ditemukan.' };
            await db.orm.public.User.where({
                id: userId,
                role: 'orang_tua',
            }).update({
                name: nama,
                email,
                alamat: alamat || null,
                nomorTelepon: normalizedPhone,
                updatedAt: nowIso,
                ...(password
                    ? { password: await bcrypt.hash(password, 10) }
                    : {}),
            });
            await db.orm.public.AuditPerubahan.create({
                entitas: 'user',
                entitasId: userId,
                aksi: 'update_orang_tua',
                sebelum: JSON.stringify({
                    name: existing.name,
                    email: existing.email,
                    nomorTelepon: existing.nomorTelepon,
                    alamat: existing.alamat,
                }),
                sesudah: JSON.stringify({
                    name: nama,
                    email,
                    nomorTelepon: normalizedPhone,
                    alamat: alamat || null,
                }),
                alasan: 'Pembaruan data orang tua oleh admin',
                aktorId: adminId,
                createdAt: nowIso,
            });
        } else {
            if (!password) {
                return {
                    error: 'Password wajib diisi untuk akun orang tua baru.',
                    fieldErrors: { password: t('validation.required') },
                };
            }
            const created = await db.orm.public.User.create({
                role: 'orang_tua',
                name: nama,
                email,
                password: await bcrypt.hash(password, 10),
                alamat: alamat || null,
                nomorTelepon: normalizedPhone,
            });
            await db.orm.public.AuditPerubahan.create({
                entitas: 'user',
                entitasId: created.id,
                aksi: 'create_orang_tua',
                sesudah: JSON.stringify({
                    name: nama,
                    email,
                    nomorTelepon: normalizedPhone,
                }),
                alasan: 'Penambahan akun orang tua oleh admin',
                aktorId: adminId,
                createdAt: nowIso,
            });
        }
    } catch (e) {
        if (e instanceof Error && e.message.includes('duplicate key')) {
            return {
                error: 'Email atau nomor telepon sudah digunakan akun lain.',
            };
        }
        throw e;
    }

    revalidatePath('/[locale]/admin/parents', 'page');
    revalidatePath('/[locale]/admin/students', 'page');
    return { ok: true };
}

export async function hapusOrangTuaAdmin(userId: number): Promise<AdminState> {
    const adminId = await guardAdmin();
    if (!adminId) return { error: 'Sesi admin berakhir.' };
    if (!Number.isInteger(userId) || userId <= 0)
        return { error: 'ID orang tua tidak valid.' };

    const [existing] = await collect(
        db.orm.public.User.where({ id: userId, role: 'orang_tua' }).all(),
    );
    if (!existing) return { error: 'Data orang tua tidak ditemukan.' };

    const anakList = await collect(
        db.orm.public.Anak.where((a) => a.orangTuaId.eq(userId)).all(),
    );
    if (anakList.length > 0) {
        const anakIds = anakList.map((a) => a.id);
        const pendaftaranAnak = await collect(
            db.orm.public.Pendaftaran.where((p) =>
                p.anakId.in(anakIds),
            ).all(),
        );
        if (pendaftaranAnak.length > 0) {
            return {
                error: 'Akun orang tua tidak dapat dihapus karena data anaknya sudah memiliki riwayat pendaftaran.',
            };
        }
        return {
            error: 'Akun orang tua masih memiliki data anak terkait. Hapus data anak terlebih dahulu.',
        };
    }

    try {
        await db.orm.public.User.where({
            id: userId,
            role: 'orang_tua',
        }).delete();
    } catch {
        return { error: 'Akun orang tua tidak dapat dihapus karena masih terikat data lain.' };
    }

    await db.orm.public.AuditPerubahan.create({
        entitas: 'user',
        entitasId: userId,
        aksi: 'hapus_orang_tua',
        sebelum: JSON.stringify({
            name: existing.name,
            email: existing.email,
            nomorTelepon: existing.nomorTelepon,
        }),
        alasan: 'Penghapusan akun orang tua oleh admin',
        aktorId: adminId,
        createdAt: new Date().toISOString(),
    });

    revalidatePath('/[locale]/admin/parents', 'page');
    revalidatePath('/[locale]/admin/students', 'page');
    return { ok: true };
}

// --- CRUD Anak (Admin) ---
const anakSchema = (t: Translator) =>
    z.object({
        orang_tua_id: z.coerce.number().int().positive('Pilih orang tua'),
        nama: z
            .string()
            .trim()
            .min(2, t('validation.nameMin'))
            .max(100, t('validation.nameMax')),
        tanggal_lahir: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, t('validation.dateRequired'))
            .refine((v) => new Date(v) <= new Date(), 'Tanggal lahir tidak boleh di masa depan'),
        jenjang_terakhir: z.enum(['TK', 'SD', 'SMP', 'SMA'], t('validation.invalid')),
        tingkat: z
            .string()
            .trim()
            .max(30, t('validation.gradeMax'))
            .optional()
            .or(z.literal('')),
        nomor_telepon: z
            .string()
            .trim()
            .max(20, t('validation.phoneMax'))
            .optional()
            .or(z.literal('')),
        email: z
            .string()
            .trim()
            .max(255, t('validation.email'))
            .email(t('validation.email'))
            .optional()
            .or(z.literal('')),
        alamat: z
            .string()
            .trim()
            .max(500, t('validation.addressMax'))
            .optional()
            .or(z.literal('')),
    });

export async function saveAnakAdmin(
    _prev: AdminState,
    formData: FormData,
): Promise<AdminState> {
    const locale = await getLocaleDariCookie();
    const t = await getTranslations({ locale, namespace: 'adminForms' });
    const adminId = await guardAdmin();
    if (!adminId) return { error: t('validation.session') };

    const parsed = anakSchema(t).safeParse(
        {
            orang_tua_id: formData.get('orang_tua_id'),
            nama: formData.get('nama'),
            tanggal_lahir: formData.get('tanggal_lahir'),
            jenjang_terakhir: formData.get('jenjang_terakhir'),
            tingkat: formData.get('tingkat') ?? '',
            nomor_telepon: formData.get('nomor_telepon') ?? '',
            email: formData.get('email') ?? '',
            alamat: formData.get('alamat') ?? '',
        },
        { error: () => t('validation.invalid') },
    );
    if (!parsed.success) return fieldErr(parsed, t);

    const d = parsed.data;
    let normalizedHp: string | null = null;
    if (d.nomor_telepon) {
        const phoneCheck = validateIndonesianPhone(d.nomor_telepon);
        if (!phoneCheck.valid) {
            return {
                error: t('validation.checkFields'),
                fieldErrors: {
                    nomor_telepon:
                        'Nomor telepon harus diawali 08 / +628 (10-13 digit).',
                },
            };
        }
        normalizedHp = phoneCheck.normalized!;
    }

    const anakId = Number(formData.get('anak_id') ?? 0);
    const nowIso = new Date().toISOString();

    // BR#16: cegah duplikat (nama + tanggal_lahir) dalam satu akun orang tua
    const siblingList = await collect(
        db.orm.public.Anak.where((a) => a.orangTuaId.eq(d.orang_tua_id)).all(),
    );
    const dup = siblingList.find(
        (s) =>
            s.id !== anakId &&
            s.nama.trim().toLowerCase() === d.nama.toLowerCase() &&
            s.tanggalLahir === d.tanggal_lahir,
    );
    if (dup) {
        return {
            error: 'Anak dengan nama dan tanggal lahir yang sama sudah terdaftar pada akun orang tua tersebut (BR#16).',
        };
    }

    if (anakId > 0) {
        const [existing] = await collect(
            db.orm.public.Anak.where({ id: anakId }).all(),
        );
        if (!existing) return { error: 'Data anak tidak ditemukan.' };
        await db.orm.public.Anak.where({ id: anakId }).update({
            orangTuaId: d.orang_tua_id,
            nama: d.nama,
            tanggalLahir: d.tanggal_lahir,
            jenjangTerakhir: d.jenjang_terakhir,
            tingkat: d.tingkat || null,
            nomorTelepon: normalizedHp,
            email: d.email || null,
            alamat: d.alamat || null,
            updatedAt: nowIso,
        });
        await db.orm.public.AuditPerubahan.create({
            entitas: 'anak',
            entitasId: anakId,
            aksi: 'update_anak_admin',
            sebelum: JSON.stringify({
                nama: existing.nama,
                jenjangTerakhir: existing.jenjangTerakhir,
                tingkat: existing.tingkat,
                email: existing.email,
                alamat: existing.alamat,
            }),
            sesudah: JSON.stringify({
                nama: d.nama,
                jenjangTerakhir: d.jenjang_terakhir,
                tingkat: d.tingkat || null,
                email: d.email || null,
                alamat: d.alamat || null,
            }),
            alasan: 'Pembaruan data anak oleh admin',
            aktorId: adminId,
            createdAt: nowIso,
        });
    } else {
        const created = await db.orm.public.Anak.create({
            orangTuaId: d.orang_tua_id,
            nama: d.nama,
            tanggalLahir: d.tanggal_lahir,
            jenjangTerakhir: d.jenjang_terakhir,
            tingkat: d.tingkat || null,
            nomorTelepon: normalizedHp,
            email: d.email || null,
            alamat: d.alamat || null,
        });
        await db.orm.public.AuditPerubahan.create({
            entitas: 'anak',
            entitasId: created.id,
            aksi: 'create_anak_admin',
            sesudah: JSON.stringify({
                orangTuaId: d.orang_tua_id,
                nama: d.nama,
                jenjangTerakhir: d.jenjang_terakhir,
            }),
            alasan: 'Penambahan data anak oleh admin',
            aktorId: adminId,
            createdAt: nowIso,
        });
    }

    revalidatePath('/[locale]/admin/students', 'page');
    revalidatePath('/[locale]/admin/parents', 'page');
    return { ok: true };
}

export async function hapusAnakAdmin(anakId: number): Promise<AdminState> {
    const adminId = await guardAdmin();
    if (!adminId) return { error: 'Sesi admin berakhir.' };
    if (!Number.isInteger(anakId) || anakId <= 0)
        return { error: 'ID anak tidak valid.' };

    const [existing] = await collect(
        db.orm.public.Anak.where({ id: anakId }).all(),
    );
    if (!existing) return { error: 'Data anak tidak ditemukan.' };

    const pendaftaranAda = await collect(
        db.orm.public.Pendaftaran.where((p) => p.anakId.eq(anakId)).all(),
    );
    if (pendaftaranAda.length > 0) {
        return {
            error: 'Data anak tidak dapat dihapus karena sudah memiliki riwayat pendaftaran kelas.',
        };
    }

    try {
        await db.orm.public.Anak.where({ id: anakId }).delete();
    } catch {
        return { error: 'Data anak tidak dapat dihapus karena masih terikat data lain.' };
    }

    await db.orm.public.AuditPerubahan.create({
        entitas: 'anak',
        entitasId: anakId,
        aksi: 'hapus_anak_admin',
        sebelum: JSON.stringify({
            nama: existing.nama,
            orangTuaId: existing.orangTuaId,
        }),
        alasan: 'Penghapusan data anak oleh admin',
        aktorId: adminId,
        createdAt: new Date().toISOString(),
    });

    revalidatePath('/[locale]/admin/students', 'page');
    revalidatePath('/[locale]/admin/parents', 'page');
    return { ok: true };
}

// --- CRUD JadwalItem (Admin) ---
const jadwalSchema = (t: Translator) =>
    z
        .object({
            kelas_id: z.coerce.number().int().positive('Pilih kelas'),
            hari: z.enum(HARI, t('validation.invalid')),
            jam_mulai: z
                .string()
                .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format jam mulai tidak valid'),
            jam_selesai: z
                .string()
                .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format jam selesai tidak valid'),
            tempat: z
                .string()
                .trim()
                .max(150, 'Tempat/alamat maksimal 150 karakter')
                .optional()
                .or(z.literal('')),
        })
        .refine((d) => d.jam_mulai < d.jam_selesai, {
            message: 'Jam mulai harus sebelum jam selesai.',
            path: ['jam_selesai'],
        });

export async function saveJadwalAdmin(
    _prev: AdminState,
    formData: FormData,
): Promise<AdminState> {
    const locale = await getLocaleDariCookie();
    const t = await getTranslations({ locale, namespace: 'adminForms' });
    const adminId = await guardAdmin();
    if (!adminId) return { error: t('validation.session') };

    const parsed = jadwalSchema(t).safeParse(
        {
            kelas_id: formData.get('kelas_id'),
            hari: formData.get('hari'),
            jam_mulai: String(formData.get('jam_mulai') ?? '').slice(0, 5),
            jam_selesai: String(formData.get('jam_selesai') ?? '').slice(0, 5),
            tempat: formData.get('tempat') ?? '',
        },
        { error: () => t('validation.invalid') },
    );
    if (!parsed.success) return fieldErr(parsed, t);

    const d = parsed.data;
    const jadwalId = Number(formData.get('jadwal_id') ?? 0);

    const [kelas] = await collect(
        db.orm.public.Kelas.where({ id: d.kelas_id }).all(),
    );
    if (!kelas) return { error: 'Kelas tidak ditemukan.' };

    // Cek bentrok BR#6 jika kelas aktif
    if (kelas.status === 'aktif') {
        const [kelasGuru, semuaJadwal] = await Promise.all([
            collect(
                db.orm.public.Kelas.where((k) => k.guruId.eq(kelas.guruId))
                    .where((k) => k.periodeId.eq(kelas.periodeId))
                    .where((k) => k.status.eq('aktif'))
                    .all(),
            ),
            collect(db.orm.public.JadwalItem.all()),
        ]);
        const kelasIds = new Set(kelasGuru.map((k) => k.id));
        const strip = (s: string) => s.slice(0, 5);
        for (const ol of semuaJadwal) {
            if (ol.id === jadwalId) continue;
            if (!kelasIds.has(ol.kelasId)) continue;
            if (ol.hari !== d.hari) continue;
            if (
                strip(ol.jamMulai) < d.jam_selesai &&
                d.jam_mulai < strip(ol.jamSelesai)
            ) {
                return {
                    error: t('validation.scheduleConflict', {
                        day: t(`days.${d.hari}`),
                        start: strip(ol.jamMulai),
                        end: strip(ol.jamSelesai),
                    }),
                };
            }
        }
    }

    try {
        if (jadwalId > 0) {
            await db.orm.public.JadwalItem.where({ id: jadwalId }).update({
                kelasId: d.kelas_id,
                hari: d.hari,
                jamMulai: d.jam_mulai,
                jamSelesai: d.jam_selesai,
                tempat: d.tempat || null,
            });
        } else {
            await db.orm.public.JadwalItem.create({
                kelasId: d.kelas_id,
                hari: d.hari,
                jamMulai: d.jam_mulai,
                jamSelesai: d.jam_selesai,
                tempat: d.tempat || null,
            });
        }
    } catch (e) {
        if (e instanceof Error && e.message.includes('duplicate key')) {
            return { error: 'Slot jadwal yang sama sudah ada pada kelas ini.' };
        }
        throw e;
    }

    revalidatePath('/[locale]/admin/schedule', 'page');
    revalidatePath('/[locale]/admin/classes', 'page');
    return { ok: true };
}

export async function hapusJadwalAdmin(jadwalId: number): Promise<AdminState> {
    const adminId = await guardAdmin();
    if (!adminId) return { error: 'Sesi admin berakhir.' };
    if (!Number.isInteger(jadwalId) || jadwalId <= 0)
        return { error: 'ID jadwal tidak valid.' };

    const [presensiAda, sesiAda] = await Promise.all([
        collect(
            db.orm.public.Presensi.where((p) =>
                p.jadwalItemId.eq(jadwalId),
            ).all(),
        ),
        collect(
            db.orm.public.SesiPertemuan.where((s) =>
                s.jadwalItemId.eq(jadwalId),
            ).all(),
        ),
    ]);
    if (presensiAda.length > 0 || sesiAda.length > 0) {
        return {
            error: 'Jadwal tidak dapat dihapus karena sudah memiliki catatan presensi atau sesi pertemuan.',
        };
    }

    try {
        await db.orm.public.JadwalItem.where({ id: jadwalId }).delete();
    } catch {
        return { error: 'Jadwal tidak dapat dihapus karena masih terikat data lain.' };
    }

    revalidatePath('/[locale]/admin/schedule', 'page');
    revalidatePath('/[locale]/admin/classes', 'page');
    return { ok: true };
}
