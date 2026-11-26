import { getLocale } from 'next-intl/server';
import { redirect, getPathname } from '@/i18n/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/prisma/db';
import { collect } from '@/lib/collect';
import {
    AdminScheduleView,
    type AdminScheduleRow,
} from '@/components/admin/views/schedule-view';

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

export default async function AdminSchedulePage() {
    const locale = await getLocale();
    const session = await auth();
    if (!session?.user) {
        return redirect({
            href: {
                pathname: '/login',
                query: { next: getPathname({ href: '/admin/schedule', locale }) },
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

    const [jadwalList, kelasList, guruList] = await Promise.all([
        collect(db.orm.public.JadwalItem.all()),
        collect(db.orm.public.Kelas.all()),
        collect(db.orm.public.User.where((u) => u.role.eq('guru')).all()),
    ]);

    const kelasById = new Map(kelasList.map((k) => [k.id, k]));
    const guruById = new Map(guruList.map((g) => [g.id, g]));

    const schedules: AdminScheduleRow[] = jadwalList
        .slice()
        .sort((a, b) => {
            const da = URUTAN_HARI[String(a.hari)] ?? 99;
            const dbHari = URUTAN_HARI[String(b.hari)] ?? 99;
            return da !== dbHari ? da - dbHari : a.jamMulai.localeCompare(b.jamMulai);
        })
        .map((j) => {
            const kelas = kelasById.get(j.kelasId);
            const guru = kelas ? guruById.get(kelas.guruId) : undefined;
            return {
                id: j.id,
                kelasId: j.kelasId,
                kelasNama: kelas?.nama ?? '—',
                kelasMapel: kelas?.mapel ?? '—',
                jenjang: kelas ? String(kelas.jenjang) : '—',
                guruNama: guru?.name ?? '—',
                hari: String(j.hari),
                jamMulai: j.jamMulai.slice(0, 5),
                jamSelesai: j.jamSelesai.slice(0, 5),
                tempat: j.tempat ?? kelas?.ruangan ?? '',
                kuotaTerisi: kelas?.kuotaTerisi ?? 0,
                kuotaMaksimum: kelas?.kuotaMaksimum ?? 0,
            };
        });

    const classOptions = kelasList
        .filter((k) => k.status === 'aktif')
        .slice()
        .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
        .map((k) => {
            const guru = guruById.get(k.guruId);
            return {
                id: k.id,
                label: `${k.nama} (${k.mapel} · ${guru?.name ?? '—'})`,
            };
        });

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <AdminScheduleView
                schedules={schedules}
                classOptions={classOptions}
            />
        </div>
    );
}
