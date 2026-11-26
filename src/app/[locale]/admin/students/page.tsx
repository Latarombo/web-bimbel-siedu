import { getLocale } from 'next-intl/server';
import { redirect, getPathname } from '@/i18n/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/prisma/db';
import { collect } from '@/lib/collect';
import { fmtTanggal } from '@/lib/format/format';
import {
    AdminStudentsView,
    type AdminStudentRow,
} from '@/components/admin/views/students-view';

export const dynamic = 'force-dynamic';

export default async function AdminStudentsPage() {
    const locale = await getLocale();
    const session = await auth();
    if (!session?.user) {
        return redirect({
            href: {
                pathname: '/login',
                query: { next: getPathname({ href: '/admin/students', locale }) },
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

    const [anakList, ortuList] = await Promise.all([
        collect(db.orm.public.Anak.all()),
        collect(db.orm.public.User.where((u) => u.role.eq('orang_tua')).all()),
    ]);

    const ortuById = new Map(ortuList.map((u) => [u.id, u]));

    const students: AdminStudentRow[] = anakList
        .slice()
        .sort((a, b) => b.id - a.id)
        .map((a) => {
            const ortu = ortuById.get(a.orangTuaId);
            return {
                id: a.id,
                orangTuaId: a.orangTuaId,
                nama: a.nama,
                orangTuaNama: ortu?.name ?? '—',
                jenjang: a.jenjangTerakhir ? String(a.jenjangTerakhir) : '',
                nomorTelepon: a.nomorTelepon ?? '',
                email: a.email ?? '',
                alamat: a.alamat ?? '',
                tanggalLahir: a.tanggalLahir,
                tanggalLahirLabel: fmtTanggal(a.tanggalLahir, locale),
                tingkat: a.tingkat ?? '',
                parentFallbackEmail: ortu?.email ?? '',
                parentFallbackAlamat: ortu?.alamat ?? '',
            };
        });

    const parentOptions = ortuList
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'id'))
        .map((u) => ({
            id: u.id,
            nama: u.name,
            telepon: u.nomorTelepon ?? '',
        }));

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <AdminStudentsView
                students={students}
                parentOptions={parentOptions}
            />
        </div>
    );
}
