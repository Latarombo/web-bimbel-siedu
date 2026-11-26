import { getLocale } from 'next-intl/server';
import { redirect, getPathname } from '@/i18n/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/prisma/db';
import { collect } from '@/lib/collect';
import { fmtTanggal } from '@/lib/format/format';
import {
    AdminPeriodsView,
    type AdminPeriodRow,
} from '@/components/admin/views/periods-view';

export const dynamic = 'force-dynamic';

export default async function AdminPeriodsPage() {
    const locale = await getLocale();
    const session = await auth();
    if (!session?.user) {
        return redirect({
            href: {
                pathname: '/login',
                query: { next: getPathname({ href: '/admin/periods', locale }) },
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

    const [periodeList, kelasList] = await Promise.all([
        collect(db.orm.public.PeriodePendaftaran.all()),
        collect(db.orm.public.Kelas.all()),
    ]);

    const kelasCountByPeriode = new Map<number, number>();
    for (const k of kelasList) {
        kelasCountByPeriode.set(
            k.periodeId,
            (kelasCountByPeriode.get(k.periodeId) ?? 0) + 1,
        );
    }

    const periods: AdminPeriodRow[] = periodeList
        .slice()
        .sort((a, b) => b.tanggalMulai.localeCompare(a.tanggalMulai) || b.id - a.id)
        .map((p) => ({
            id: p.id,
            nama: p.nama,
            status: String(p.status),
            tanggalMulai: p.tanggalMulai,
            tanggalMulaiLabel: fmtTanggal(p.tanggalMulai, locale),
            tanggalSelesai: p.tanggalSelesai,
            tanggalSelesaiLabel: fmtTanggal(p.tanggalSelesai, locale),
            tanggalTutupPendaftaran: p.tanggalTutupPendaftaran,
            tanggalTutupLabel: fmtTanggal(p.tanggalTutupPendaftaran, locale),
            jumlahKelas: kelasCountByPeriode.get(p.id) ?? 0,
        }));

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <AdminPeriodsView periods={periods} />
        </div>
    );
}
