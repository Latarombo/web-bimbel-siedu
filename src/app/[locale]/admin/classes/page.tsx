import { getLocale } from 'next-intl/server';
import { redirect, getPathname } from '@/i18n/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/prisma/db';
import { collect } from '@/lib/collect';
import {
    AdminClassesView,
    type AdminClassRow,
} from '@/components/admin/views/classes-view';

export const dynamic = 'force-dynamic';

const URUTAN_HARI: Record<string, number> = {
    Senin: 1,
    Selasa: 2,
    Rabu: 3,
    Kamis: 4,
    Jumat: 5,
    Sabtu: 6,
    Minggu: 7,
};

function parsePositiveInt(val?: string): number | undefined {
    if (!val) return undefined;
    const n = Number(val);
    return Number.isInteger(n) && n > 0 ? n : undefined;
}

export default async function AdminClassesPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; guruId?: string; periodeId?: string }>;
}) {
    const locale = await getLocale();
    const session = await auth();
    if (!session?.user) {
        return redirect({
            href: {
                pathname: '/login',
                query: { next: getPathname({ href: '/admin/classes', locale }) },
            },
            locale,
        });
    }
    if (session.user.role !== 'admin') {
        return redirect({
            href: session.user.role === 'guru' ? '/teacher/dashboard' : '/home',
            locale,
        });
    }

    const sp = await searchParams;

    const [kelasList, guruList, periodeList, jadwalList] = await Promise.all([
        collect(db.orm.public.Kelas.all()),
        collect(db.orm.public.User.where((u) => u.role.eq('guru')).all()),
        collect(db.orm.public.PeriodePendaftaran.all()),
        collect(db.orm.public.JadwalItem.all()),
    ]);

    const guruById = new Map(guruList.map((g) => [g.id, g]));
    const periodeById = new Map(periodeList.map((p) => [p.id, p]));
    const jadwalByKelas = new Map<number, typeof jadwalList>();
    for (const item of jadwalList) {
        const arr = jadwalByKelas.get(item.kelasId) ?? [];
        arr.push(item);
        jadwalByKelas.set(item.kelasId, arr);
    }

    const classes: AdminClassRow[] = kelasList
        .slice()
        .sort((a, b) => b.id - a.id)
        .map((k) => {
            const guru = guruById.get(k.guruId);
            const periode = periodeById.get(k.periodeId);
            const rawJadwal = (jadwalByKelas.get(k.id) ?? []).slice().sort((a, b) => {
                const da = URUTAN_HARI[a.hari] ?? 99;
                const dbHari = URUTAN_HARI[b.hari] ?? 99;
                return da !== dbHari ? da - dbHari : a.jamMulai.localeCompare(b.jamMulai);
            });
            const jadwal = rawJadwal.map((j) => ({
                hari: String(j.hari),
                jamMulai: j.jamMulai.slice(0, 5),
                jamSelesai: j.jamSelesai.slice(0, 5),
                tempat: j.tempat ?? null,
            }));
            const jadwalSummary =
                jadwal.length > 0
                    ? jadwal
                          .map((j) => `${j.hari} ${j.jamMulai}-${j.jamSelesai}`)
                          .join(', ')
                    : 'Belum dijadwalkan';

            return {
                id: k.id,
                nama: k.nama,
                mapel: k.mapel,
                guruId: k.guruId,
                guruNama: guru?.name ?? '—',
                periodeId: k.periodeId,
                periodeNama: periode?.nama ?? '—',
                jenjang: String(k.jenjang),
                tingkat: k.tingkat ?? null,
                ruangan: k.ruangan ?? null,
                kuotaTerisi: k.kuotaTerisi,
                kuotaMinimum: k.kuotaMinimum,
                kuotaMaksimum: k.kuotaMaksimum,
                biayaPeriode: String(k.biayaPeriode),
                biayaDp: k.biayaDp !== null && k.biayaDp !== undefined ? String(k.biayaDp) : null,
                tenorMaksimum: k.tenorMaksimum ?? null,
                status: String(k.status),
                jadwal,
                jadwalSummary,
            };
        });

    const guruOptions = guruList
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'id'))
        .map((g) => ({ id: g.id, nama: g.name }));

    const periodeOptions = periodeList
        .slice()
        .sort((a, b) => b.tanggalMulai.localeCompare(a.tanggalMulai))
        .map((p) => ({ id: p.id, nama: p.nama, status: String(p.status) }));

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <AdminClassesView
                classes={classes}
                guruOptions={guruOptions}
                periodeOptions={periodeOptions}
                initialStatusFilter={sp.status}
                initialGuruId={parsePositiveInt(sp.guruId)}
                initialPeriodeId={parsePositiveInt(sp.periodeId)}
            />
        </div>
    );
}
