import { getLocale, getTranslations } from 'next-intl/server';
import { redirect, getPathname } from '@/i18n/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/prisma/db';
import { collect } from '@/lib/collect';
import { rupiah } from '@/lib/format/format';
import {
  AdminReportsView,
  type AdminReportKpi,
  type AdminReportPeriodRow,
} from '@/components/admin/views/reports-view';

export const dynamic = 'force-dynamic';

const AKTIF = ['menunggu_pembayaran', 'terdaftar', 'tertunggak'];

export default async function AdminReportsPage() {
  const locale = await getLocale();
  const t = await getTranslations('admin');
  const session = await auth();
  if (!session?.user) {
    return redirect({
      href: {
        pathname: '/login',
        query: { next: getPathname({ href: '/admin/reports', locale }) },
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

  const fmtTanggal = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'en' ? 'en-GB' : 'id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    });

  const [periode, pendaftaran, pembayaran] = await Promise.all([
    collect(db.orm.public.PeriodePendaftaran.all()),
    collect(db.orm.public.Pendaftaran.all()),
    collect(db.orm.public.Pembayaran.all()),
  ]);

  const urut = periode.toSorted((a, b) =>
    b.tanggalMulai.localeCompare(a.tanggalMulai),
  );

  const berhasil = pembayaran.filter((b) => b.status === 'berhasil');
  const pending = pembayaran.filter((b) => b.status === 'pending');
  const totalBerhasil = berhasil.reduce((acc, b) => acc + Number(b.jumlah), 0);
  const totalPending = pending.reduce((acc, b) => acc + Number(b.jumlah), 0);
  const nAktif = pendaftaran.filter((p) => AKTIF.includes(p.status)).length;
  const nTertunggak = pendaftaran.filter(
    (p) => p.status === 'tertunggak',
  ).length;

  const kpis: AdminReportKpi[] = [
    {
      label: t('text18'),
      value: rupiah(totalBerhasil),
      sub: t('successfulPayments', { count: berhasil.length }),
    },
    {
      label: t('text108'),
      value: rupiah(totalPending),
      sub: t('pendingTransactions', { count: pending.length }),
    },
    {
      label: t('text109'),
      value: String(nAktif),
      sub: t('enrollmentTotal', { count: pendaftaran.length }),
    },
    {
      label: t('text110'),
      value: String(nTertunggak),
      sub: nTertunggak > 0 ? t('text111') : t('text112'),
    },
  ];

  const periods: AdminReportPeriodRow[] = urut.map((pr) => {
    const pP = pendaftaran.filter((p) => p.periodeId === pr.id);
    const byStatus = (s: string) => pP.filter((p) => p.status === s).length;
    const tagihanIds = new Set(pP.map((p) => p.id));
    const bP = pembayaran.filter((b) => tagihanIds.has(b.pendaftaranId));
    const sumAmount = (list: typeof bP) =>
      list.reduce((acc, b) => acc + Number(b.jumlah), 0);
    const ok = bP.filter((b) => b.status === 'berhasil');
    const pen = bP.filter((b) => b.status === 'pending');
    const aktif = AKTIF.reduce((a, s) => a + byStatus(s), 0);

    return {
      id: pr.id,
      nama: pr.nama,
      status: pr.status,
      tanggalMulai: pr.tanggalMulai,
      tanggalMulaiLabel: fmtTanggal(pr.tanggalMulai),
      tanggalSelesaiLabel: fmtTanggal(pr.tanggalSelesai),
      totalPendaftar: pP.length,
      aktif,
      tertunggak: byStatus('tertunggak'),
      batal: pP.length - aktif,
      terkumpul: sumAmount(ok),
      terkumpulCount: ok.length,
      pending: sumAmount(pen),
      pendingCount: pen.length,
      totalTagihan: sumAmount(bP),
    };
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <AdminReportsView kpis={kpis} periods={periods} />
    </div>
  );
}
