import { getLocale } from 'next-intl/server';
import { redirect, getPathname } from '@/i18n/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/prisma/db';
import { collect } from '@/lib/collect';
import { fmtTanggal } from '@/lib/format/format';
import {
    AdminPaymentsView,
    type AdminPaymentRow,
} from '@/components/admin/views/payments-view';

export const dynamic = 'force-dynamic';

function formatCicilanLabel(tipe: string, cicilanKe: number | null): string {
    if (tipe === 'lunas') return 'Lunas';
    if (tipe === 'dp') return 'DP';
    return `Cicilan #${cicilanKe ?? '-'}`;
}

export default async function AdminPaymentsPage() {
    const locale = await getLocale();
    const session = await auth();
    if (!session?.user) {
        return redirect({
            href: {
                pathname: '/login',
                query: { next: getPathname({ href: '/admin/payments', locale }) },
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

    const [pembayaranList, pendaftaranList, anakList, userList, kelasList] =
        await Promise.all([
            collect(db.orm.public.Pembayaran.all()),
            collect(db.orm.public.Pendaftaran.all()),
            collect(db.orm.public.Anak.all()),
            collect(db.orm.public.User.all()),
            collect(db.orm.public.Kelas.all()),
        ]);

    const pendaftaranById = new Map(pendaftaranList.map((p) => [p.id, p]));
    const anakById = new Map(anakList.map((a) => [a.id, a]));
    const userById = new Map(userList.map((u) => [u.id, u]));
    const kelasById = new Map(kelasList.map((k) => [k.id, k]));

    const paidTotalByPendaftaran = new Map<number, number>();
    for (const b of pembayaranList) {
        if (b.status !== 'berhasil') continue;
        paidTotalByPendaftaran.set(
            b.pendaftaranId,
            (paidTotalByPendaftaran.get(b.pendaftaranId) ?? 0) + Number(b.jumlah),
        );
    }

    const payments: AdminPaymentRow[] = pembayaranList
        .slice()
        .sort((a, b) => b.id - a.id)
        .map((b) => {
            const p = pendaftaranById.get(b.pendaftaranId);
            const anak = p ? anakById.get(p.anakId) : undefined;
            const ortu = anak ? userById.get(anak.orangTuaId) : undefined;
            const kelas = p ? kelasById.get(p.kelasId) : undefined;
            const tipe =
                b.tipe === 'dp' || b.tipe === 'cicilan' ? b.tipe : 'lunas';
            const status =
                b.status === 'berhasil' || b.status === 'gagal'
                    ? b.status
                    : 'pending';

            return {
                id: b.id,
                pendaftaranId: b.pendaftaranId,
                orangTuaNama: ortu?.name ?? '—',
                anakNama: anak?.nama ?? '—',
                kelasNama: kelas?.nama ?? '—',
                metodeBayar:
                    p?.metodeBayar === 'dp_cicilan' ? 'dp_cicilan' : 'lunas',
                hargaKelas: kelas ? Number(kelas.biayaPeriode) : 0,
                nominalPembayaran: Number(b.jumlah),
                nominalMasukTotal:
                    paidTotalByPendaftaran.get(b.pendaftaranId) ?? 0,
                status,
                dibayarPada: b.dibayarPada ?? null,
                dibayarPadaLabel: b.dibayarPada
                    ? fmtTanggal(b.dibayarPada, locale)
                    : '—',
                tipe,
                cicilanKe: b.cicilanKe ?? null,
                cicilanLabel: formatCicilanLabel(tipe, b.cicilanKe ?? null),
                jatuhTempo: b.jatuhTempo ?? null,
                jatuhTempoLabel: b.jatuhTempo
                    ? fmtTanggal(b.jatuhTempo, locale)
                    : '—',
            };
        });

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <AdminPaymentsView payments={payments} />
        </div>
    );
}
