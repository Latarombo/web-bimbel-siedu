import { getLocale } from 'next-intl/server';
import { redirect, getPathname } from '@/i18n/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/prisma/db';
import { collect } from '@/lib/collect';
import {
    AdminTeachersView,
    type AdminTeacherRow,
} from '@/components/admin/views/teachers-view';

export const dynamic = 'force-dynamic';

export default async function AdminTeachersPage() {
    const locale = await getLocale();
    const session = await auth();
    if (!session?.user) {
        return redirect({
            href: {
                pathname: '/login',
                query: { next: getPathname({ href: '/admin/teachers', locale }) },
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

    const [guruList, kelasList] = await Promise.all([
        collect(db.orm.public.User.where((u) => u.role.eq('guru')).all()),
        collect(db.orm.public.Kelas.all()),
    ]);

    const kelasByGuru = new Map<number, { id: number; nama: string }[]>();
    for (const k of kelasList) {
        if (k.status !== 'aktif') continue;
        const arr = kelasByGuru.get(k.guruId) ?? [];
        arr.push({ id: k.id, nama: k.nama });
        kelasByGuru.set(k.guruId, arr);
    }

    const teachers: AdminTeacherRow[] = guruList
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'id'))
        .map((g) => ({
            id: g.id,
            nama: g.name,
            nomorTelepon: g.nomorTelepon ?? '',
            email: g.email ?? '',
            alamat: g.alamat ?? '',
            kelasList: (kelasByGuru.get(g.id) ?? []).sort((a, b) =>
                a.nama.localeCompare(b.nama, 'id'),
            ),
        }));

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <AdminTeachersView teachers={teachers} />
        </div>
    );
}
