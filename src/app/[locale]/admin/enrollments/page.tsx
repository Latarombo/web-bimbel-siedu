import { getLocale } from 'next-intl/server';
import { redirect, getPathname } from '@/i18n/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/prisma/db';
import { collect } from '@/lib/collect';
import { fmtTanggal } from '@/lib/format/format';
import {
    AdminEnrollmentsView,
    type AdminEnrollmentRow,
} from '@/components/admin/views/enrollments-view';

export const dynamic = 'force-dynamic';

function parsePositiveInt(val?: string): number | undefined {
    if (!val) return undefined;
    const n = Number(val);
    return Number.isInteger(n) && n > 0 ? n : undefined;
}

function summarizePaymentStatus(
    rawStatus: string,
    bills: { status: unknown }[],
): {
    label: string;
    tone: AdminEnrollmentRow['paymentStatusTone'];
} {
    if (rawStatus === 'dibatalkan_tunggakan') {
        return { label: 'Dibatalkan', tone: 'red' };
    }
    if (rawStatus.startsWith('dibatalkan_')) {
        return { label: 'Dibatalkan', tone: 'slate' };
    }
    if (rawStatus === 'tertunggak') {
        return { label: 'Tertunggak', tone: 'red' };
    }
    if (rawStatus === 'menunggu_pembayaran') {
        return { label: 'Menunggu Bayar', tone: 'amber' };
    }
    if (bills.length > 0 && bills.every((b) => b.status === 'berhasil')) {
        return { label: 'Lunas', tone: 'emerald' };
    }
    return { label: 'DP Lunas', tone: 'brand' };
}

export default async function AdminEnrollmentsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; kelasId?: string }>;
}) {
    const locale = await getLocale();
    const session = await auth();
    if (!session?.user) {
        return redirect({
            href: {
                pathname: '/login',
                query: {
                    next: getPathname({ href: '/admin/enrollments', locale }),
                },
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

    const [pendaftaranList, anakList, userList, kelasList, pembayaranList] =
        await Promise.all([
            collect(db.orm.public.Pendaftaran.all()),
            collect(db.orm.public.Anak.all()),
            collect(db.orm.public.User.all()),
            collect(db.orm.public.Kelas.all()),
            collect(db.orm.public.Pembayaran.all()),
        ]);

    const anakById = new Map(anakList.map((a) => [a.id, a]));
    const userById = new Map(userList.map((u) => [u.id, u]));
    const kelasById = new Map(kelasList.map((k) => [k.id, k]));
    const billsByPendaftaran = new Map<number, typeof pembayaranList>();
    for (const bill of pembayaranList) {
        const arr = billsByPendaftaran.get(bill.pendaftaranId) ?? [];
        arr.push(bill);
        billsByPendaftaran.set(bill.pendaftaranId, arr);
    }

    const enrollments: AdminEnrollmentRow[] = pendaftaranList
        .slice()
        .sort((a, b) => b.id - a.id)
        .map((p) => {
            const anak = anakById.get(p.anakId);
            const ortu = anak ? userById.get(anak.orangTuaId) : undefined;
            const kelas = kelasById.get(p.kelasId);
            const bills = billsByPendaftaran.get(p.id) ?? [];
            const rawStatus = String(p.status);
            const summary = summarizePaymentStatus(rawStatus, bills);

            const jenjangParts = [
                anak?.jenjangTerakhir
                    ? String(anak.jenjangTerakhir)
                    : kelas?.jenjang
                      ? String(kelas.jenjang)
                      : '',
                anak?.tingkat ?? '',
            ].filter(Boolean);

            return {
                id: p.id,
                orangTuaNama: ortu?.name ?? '—',
                orangTuaTelepon: ortu?.nomorTelepon ?? '—',
                anakNama: anak?.nama ?? '—',
                jenjangLabel: jenjangParts.join(' · ') || '—',
                kelasId: p.kelasId,
                kelasNama: kelas?.nama ?? '—',
                mapelNama: kelas?.mapel ?? '—',
                metodeBayar:
                    p.metodeBayar === 'dp_cicilan' ? 'dp_cicilan' : 'lunas',
                tenorBulan: p.tenorBulan ?? null,
                paymentStatusLabel: summary.label,
                paymentStatusTone: summary.tone,
                rawStatus,
                tanggalDaftar: p.createdAt,
                tanggalDaftarLabel: fmtTanggal(p.createdAt, locale),
            };
        });

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <AdminEnrollmentsView
                enrollments={enrollments}
                initialStatusFilter={sp.status}
                initialKelasId={parsePositiveInt(sp.kelasId)}
            />
        </div>
    );
}
