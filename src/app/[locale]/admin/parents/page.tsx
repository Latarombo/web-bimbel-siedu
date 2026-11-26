import { getLocale } from 'next-intl/server';
import { redirect, getPathname } from '@/i18n/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/prisma/db';
import { collect } from '@/lib/collect';
import { fmtTanggal } from '@/lib/format/format';
import {
    AdminParentsView,
    type AdminParentRow,
} from '@/components/admin/views/parents-view';

export const dynamic = 'force-dynamic';

const STATUS_AKTIF = new Set(['menunggu_pembayaran', 'terdaftar', 'tertunggak']);

export default async function AdminParentsPage() {
    const locale = await getLocale();
    const session = await auth();
    if (!session?.user) {
        return redirect({
            href: {
                pathname: '/login',
                query: { next: getPathname({ href: '/admin/parents', locale }) },
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

    const [ortuList, anakList, pendaftaranList, kelasList] = await Promise.all([
        collect(db.orm.public.User.where((u) => u.role.eq('orang_tua')).all()),
        collect(db.orm.public.Anak.all()),
        collect(db.orm.public.Pendaftaran.all()),
        collect(db.orm.public.Kelas.all()),
    ]);

    const kelasById = new Map(kelasList.map((k) => [k.id, k]));
    const kelasAktifByAnak = new Map<number, string[]>();
    for (const p of pendaftaranList) {
        if (!STATUS_AKTIF.has(String(p.status))) continue;
        const k = kelasById.get(p.kelasId);
        if (!k) continue;
        const arr = kelasAktifByAnak.get(p.anakId) ?? [];
        arr.push(k.nama);
        kelasAktifByAnak.set(p.anakId, arr);
    }

    const anakByOrtu = new Map<number, typeof anakList>();
    for (const a of anakList) {
        const arr = anakByOrtu.get(a.orangTuaId) ?? [];
        arr.push(a);
        anakByOrtu.set(a.orangTuaId, arr);
    }

    const parents: AdminParentRow[] = ortuList
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'id'))
        .map((u) => {
            const children = (anakByOrtu.get(u.id) ?? [])
                .slice()
                .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
                .map((a) => ({
                    id: a.id,
                    nama: a.nama,
                    tanggalLahirLabel: fmtTanggal(a.tanggalLahir, locale),
                    jenjang: a.jenjangTerakhir ? String(a.jenjangTerakhir) : null,
                    tingkat: a.tingkat ?? null,
                    nomorTelepon: a.nomorTelepon ?? null,
                    email: a.email ?? null,
                    alamat: a.alamat ?? null,
                    kelasAktif: kelasAktifByAnak.get(a.id) ?? [],
                }));

            return {
                id: u.id,
                nama: u.name,
                nomorTelepon: u.nomorTelepon ?? '',
                email: u.email ?? '',
                alamat: u.alamat ?? '',
                emailVerified: Boolean(u.emailVerifiedAt),
                createdAtLabel: fmtTanggal(u.createdAt, locale),
                anakList: children,
            };
        });

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <AdminParentsView parents={parents} />
        </div>
    );
}
