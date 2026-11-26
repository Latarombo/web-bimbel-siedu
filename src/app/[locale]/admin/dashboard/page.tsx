import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { redirect, getPathname } from '@/i18n/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/prisma/db';
import { collect } from '@/lib/collect';
import { rupiah } from '@/lib/format/format';
import { ButtonLink } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/status-badge';
import {
    DataTable,
    type TableColumn,
    type TableRowData,
} from '@/components/ui/data-table';
import { EnrollmentTrendChart } from '@/components/admin/enrollment-trend-chart';
import {
    PaymentStatusChart,
    type StatusSlice,
} from '@/components/admin/payment-status-chart';
import { Panel } from '@/components/admin/ui';
import { ArrowUpRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

/*
 * Dashboard admin — menyelaraskan bahasa desain dengan dashboard guru:
 * header bersih + tanggal, KPI tanpa border-top warna, grid 12 kolom,
 * quick actions, dan antrean flat list. Token dark:* disiapkan untuk
 * saat mode gelap diaktifkan.
 */

// Ikon feather-style inline — hanya untuk status kritis/peringatan.
function Icon({ d, className }: { d: string; className: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d={d} />
        </svg>
    );
}

const P = {
    alert: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01',
};

const STATUS_AKTIF = ['menunggu_pembayaran', 'terdaftar', 'tertunggak'];

// Warna hover per pintasan aksi — kelas literal agar terbaca Tailwind.
const QUICK_TONE = {
    blue: {
        card: 'hover:border-blue-300 hover:bg-blue-50/40 dark:hover:border-blue-800 dark:hover:bg-blue-950/20',
        arrow: 'group-hover:text-blue-500',
        label: 'group-hover:text-blue-700 dark:group-hover:text-blue-400',
    },
    amber: {
        card: 'hover:border-amber-300 hover:bg-amber-50/40 dark:hover:border-amber-800 dark:hover:bg-amber-950/20',
        arrow: 'group-hover:text-amber-500',
        label: 'group-hover:text-amber-700 dark:group-hover:text-amber-400',
    },
    emerald: {
        card: 'hover:border-emerald-300 hover:bg-emerald-50/40 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20',
        arrow: 'group-hover:text-emerald-500',
        label: 'group-hover:text-emerald-700 dark:group-hover:text-emerald-400',
    },
    indigo: {
        card: 'hover:border-indigo-300 hover:bg-indigo-50/40 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20',
        arrow: 'group-hover:text-indigo-500',
        label: 'group-hover:text-indigo-700 dark:group-hover:text-indigo-400',
    },
} as const;

// "YYYY-MM-DD" (DateString) → Date WIB tengah malam; aman untuk selisih hari.
function tanggalWIB(s: string): Date {
    return new Date(`${s}T00:00:00+07:00`);
}

export default async function AdminDashboard() {
    const locale = await getLocale();
    const t = await getTranslations('admin');
    const session = await auth();
    if (!session?.user)
        return redirect({
            href: {
                pathname: '/login',
                query: {
                    next: getPathname({ href: '/admin/dashboard', locale }),
                },
            },
            locale,
        });

    const [
        users,
        kelas,
        pendaftaran,
        pembayaran,
        periode,
        pesanBaru,
        anak,
    ] = await Promise.all([
        collect(db.orm.public.User.all()),
        collect(db.orm.public.Kelas.all()),
        collect(db.orm.public.Pendaftaran.all()),
        collect(db.orm.public.Pembayaran.all()),
        collect(
            db.orm.public.PeriodePendaftaran.where((p) =>
                p.status.eq('dibuka'),
            ).all(),
        ),
        collect(
            db.orm.public.PesanKontak.where((p) => p.status.eq('baru')).all(),
        ),
        collect(db.orm.public.Anak.all()),
    ]);

    const now = new Date();
    const thisMonth = now.getFullYear() * 12 + now.getMonth();
    const monthOf = (iso: string) => {
        const d = new Date(iso);
        return d.getFullYear() * 12 + d.getMonth();
    };
    const thisMonthCount = (items: { createdAt: string }[]) =>
        items.filter((x) => monthOf(x.createdAt) === thisMonth).length;
    const lastMonthCount = (items: { createdAt: string }[]) =>
        items.filter((x) => monthOf(x.createdAt) === thisMonth - 1).length;

    const daftarAktif = pendaftaran.filter((p) =>
        STATUS_AKTIF.includes(p.status),
    );
    const nSiswaAktif = new Set(daftarAktif.map((p) => p.anakId)).size;
    const nGuru = users.filter((u) => u.role === 'guru').length;
    const kelasAktif = kelas.filter((k) => k.status === 'aktif');
    const kuotaTerisi = kelasAktif.reduce((s, k) => s + k.kuotaTerisi, 0);
    const kuotaTotal = kelasAktif.reduce((s, k) => s + k.kuotaMaksimum, 0);
    const pctKuota =
        kuotaTotal > 0 ? Math.round((kuotaTerisi / kuotaTotal) * 100) : 0;
    const nTunggakan = pendaftaran.filter(
        (p) => p.status === 'tertunggak',
    ).length;
    const nMenungguBayar = pendaftaran.filter(
        (p) => p.status === 'menunggu_pembayaran',
    ).length;
    const bayarBerhasil = pembayaran.filter((b) => b.status === 'berhasil');
    const nBayarPending = pembayaran.filter(
        (b) => b.status === 'pending',
    ).length;
    const nBayarGagal = pembayaran.filter((b) => b.status === 'gagal').length;
    const perluTindakan = nTunggakan + nMenungguBayar + pesanBaru.length;

    const bulanIni = thisMonthCount(pendaftaran);
    const bulanLalu = lastMonthCount(pendaftaran);

    const stats: {
        label: string;
        value: string;
        sub: React.ReactNode;
        href: string | null;
        bar?: number;
    }[] = [
        {
            label: t('text15'),
            value: String(nSiswaAktif),
            sub: t('childrenTotal', { count: anak.length }),
            href: '/admin/enrollments?status=terdaftar',
        },
        {
            label: t('text10'),
            value: String(nGuru),
            sub: t('teachingActive', { count: kelasAktif.length }),
            href: '/admin/teachers',
        },
        {
            label: t('text16'),
            value: String(kelasAktif.length),
            sub: t('capacitySummary', {
                percent: pctKuota,
                filled: kuotaTerisi,
                total: kuotaTotal,
            }),
            href: '/admin/classes?status=aktif',
            bar: pctKuota,
        },
        {
            label: t('text17'),
            value: String(bulanIni),
            sub: t('lastMonth', { count: bulanLalu }),
            href: '/admin/enrollments',
        },
        {
            label: t('text18'),
            value: rupiah(
                bayarBerhasil.reduce((s, b) => s + Number(b.jumlah), 0),
            ),
            sub: t('successfulPayments', { count: bayarBerhasil.length }),
            href: '/admin/reports',
        },
    ];

    // Tren pendaftaran 6 bulan terakhir (dari createdAt).
    const bulan: { label: string; n: number }[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const n = pendaftaran.filter((p) => {
            const t = new Date(p.createdAt);
            return (
                t.getFullYear() === d.getFullYear() &&
                t.getMonth() === d.getMonth()
            );
        }).length;
        bulan.push({
            label: d.toLocaleString(locale === 'en' ? 'en-GB' : 'id-ID', {
                month: 'short',
            }),
            n,
        });
    }
    const rata2Bulan = (bulan.reduce((s, b) => s + b.n, 0) / 6).toLocaleString(
        locale,
        { minimumFractionDigits: 1, maximumFractionDigits: 1 },
    );

    // Status pembayaran (donut) — warna literal palet dashboard, bukan var token.
    const slices: StatusSlice[] = [
        {
            key: 'berhasil',
            label: t('text19'),
            n: bayarBerhasil.length,
            color: '#10b981',
        },
        {
            key: 'pending',
            label: t('text20'),
            n: nBayarPending,
            color: '#f59e0b',
        },
        { key: 'gagal', label: t('text21'), n: nBayarGagal, color: '#e11d48' },
    ].filter((s) => s.n > 0);

    const antrean: { label: string; hint: string; n: number; href: string }[] =
        [
            {
                label: t('text22'),
                hint: t('text23'),
                n: nTunggakan,
                href: '/admin/enrollments/flagged?status=tertunggak',
            },
            {
                label: t('text24'),
                hint: t('text25'),
                n: nMenungguBayar,
                href: '/admin/enrollments?status=menunggu_pembayaran',
            },
            {
                label: t('text28'),
                hint: t('text29'),
                n: pesanBaru.length,
                href: '/admin/messages?status=baru',
            },
        ];

    const quickActions: {
        label: string;
        desc: string;
        href: string;
        tone: keyof typeof QUICK_TONE;
    }[] = [
        {
            label: t('quickNewClass'),
            desc: t('quickNewClassDesc'),
            href: '/admin/classes/new',
            tone: 'blue',
        },
        {
            label: t('quickEnrollments'),
            desc: t('quickEnrollmentsDesc'),
            href: '/admin/enrollments',
            tone: 'amber',
        },
        {
            label: t('quickTeachers'),
            desc: t('quickTeachersDesc'),
            href: '/admin/teachers',
            tone: 'emerald',
        },
        {
            label: t('quickReports'),
            desc: t('quickReportsDesc'),
            href: '/admin/reports',
            tone: 'indigo',
        },
    ];

    // Periode dibuka terdekat — hitung hari nyata ke tanggal tutup pendaftaran.
    const periodeTerkini = periode
        .map((p) => ({
            p,
            sisa: Math.ceil(
                (tanggalWIB(p.tanggalTutupPendaftaran).getTime() -
                    now.getTime()) /
                    86_400_000,
            ),
        }))
        .sort((a, b) => a.sisa - b.sisa)[0];

    // Tabel pendaftaran terbaru — 6 baris terakhir (ReactNode sel dirender server).
    const anakById = new Map(anak.map((a) => [a.id, a]));
    const kelasById = new Map(kelas.map((k) => [k.id, k]));
    const terbaru = pendaftaran
        .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 6);
    const columns: TableColumn[] = [
        { key: 'anak', header: t('text30') },
        { key: 'kelas', header: t('text11') },
        { key: 'createdAt', header: t('text31'), align: 'right' },
        { key: 'status', header: t('text32'), align: 'center' },
    ];
    const rows: TableRowData[] = terbaru.map((p) => {
        const a = anakById.get(p.anakId);
        const k = kelasById.get(p.kelasId);
        const mapelNama = k?.nama || k?.mapel || "—";
        return {
            id: p.id,
            values: {
                anak: a?.nama ?? t('childFallback', { id: p.anakId }),
                kelas: mapelNama,
                createdAt: p.createdAt,
                status: p.status,
            },
            cells: {
                anak: (
                    <span className="flex items-center gap-2.5">
                        <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-blue-50 text-[11px] font-bold leading-none text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                            {(a?.nama ?? '?').slice(0, 1).toUpperCase()}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {a?.nama ?? t('childFallback', { id: p.anakId })}
                        </span>
                    </span>
                ),
                kelas: (
                    <Link
                        href={`/admin/classes/${p.kelasId}`}
                        className="font-medium text-slate-700 hover:text-blue-700 hover:underline dark:text-slate-300 dark:hover:text-blue-400"
                    >
                        {mapelNama}
                        {k ? (
                            <span className="text-slate-500 dark:text-slate-400">
                                {' '}
                                · {k.jenjang}
                            </span>
                        ) : null}
                    </Link>
                ),
                createdAt: (
                    <span className="text-slate-500 tabular-nums dark:text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString(
                            locale === 'en' ? 'en-GB' : 'id-ID',
                            {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                timeZone: 'Asia/Jakarta',
                            },
                        )}
                    </span>
                ),
                status: <StatusBadge status={p.status as never} />,
            },
        };
    });

    const tanggalLengkap = now.toLocaleDateString(
        locale === 'en' ? 'en-US' : 'id-ID',
        {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'Asia/Jakarta',
        },
    );

    const periodeInfo = periodeTerkini ? (
        <>
            {t('periodLabel')}:{' '}
            <span className="font-medium text-slate-600 dark:text-slate-300">
                {periodeTerkini.p.nama}
            </span>{' '}
            ·{' '}
            {periodeTerkini.sisa > 30 ? (
                t('closesIn', { days: periodeTerkini.sisa })
            ) : periodeTerkini.sisa > 0 ? (
                <span className="font-medium text-amber-600 dark:text-amber-400">
                    {t('closesSoon', { days: periodeTerkini.sisa })}
                </span>
            ) : periodeTerkini.sisa === 0 ? (
                <span className="font-medium text-amber-600 dark:text-amber-400">
                    {t('text37')}
                </span>
            ) : (
                t('closedAgo', { days: Math.abs(periodeTerkini.sisa) })
            )}
        </>
    ) : (
        <>
            {t('text38')}{' '}
            <Link
                href="/admin/periods"
                className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
                {t('text39')}
            </Link>
        </>
    );

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {/* HEADER — judul bersih + tanggal + konteks periode + 1 CTA utama */}
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight text-balance text-slate-950 dark:text-slate-50 sm:text-3xl">
                        {t('dashboardTitle')}
                    </h1>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
                        {tanggalLengkap}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {periodeInfo}
                    </p>
                </div>
                <div className="flex flex-shrink-0">
                    <ButtonLink
                        href={getPathname({
                            href: '/admin/classes/new',
                            locale,
                        })}
                        size="sm"
                    >
                        {t('text35')}
                    </ButtonLink>
                </div>
            </div>

            {/* BANNER perlu perhatian — ringan, actionable */}
            {perluTindakan > 0 ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="flex items-start gap-3">
                            <Icon
                                d={P.alert}
                                className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400"
                            />
                            <div>
                                <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                    {t('actionCount', { count: perluTindakan })}
                                </p>
                                <p className="mt-0.5 text-sm text-amber-800 dark:text-amber-300/90">
                                    {[
                                        nTunggakan > 0
                                            ? t('overdueCount', {
                                                  count: nTunggakan,
                                              })
                                            : null,
                                        nMenungguBayar > 0
                                            ? t('awaitingPaymentCount', {
                                                  count: nMenungguBayar,
                                              })
                                            : null,
                                        pesanBaru.length > 0
                                            ? t('newMessageCount', {
                                                  count: pesanBaru.length,
                                              })
                                            : null,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/admin/enrollments/flagged"
                            className="flex-shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500"
                        >
                            {t('text40')}
                        </Link>
                    </div>
                </div>
            ) : null}

            {/* KPI CARDS — label uppercase kecil, angka besar, tanpa border warna */}
            <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {stats.map((s) => {
                    const cardContent = (
                        <div className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-shadow hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {s.label}
                            </p>
                            <p className="mt-3 font-display text-2xl font-extrabold leading-none tracking-tight tabular-nums text-slate-950 dark:text-white sm:text-3xl">
                                {s.value}
                            </p>
                            {s.bar !== undefined ? (
                                <div
                                    className="mt-2"
                                    role="progressbar"
                                    aria-valuenow={s.bar}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-label={t('text42')}
                                >
                                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div
                                            className="h-full rounded-full bg-blue-600 dark:bg-blue-500"
                                            style={{
                                                width: `${Math.max(0, Math.min(100, s.bar))}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : null}
                            <p
                                className={`text-xs text-slate-500 dark:text-slate-400 ${s.bar !== undefined ? 'mt-1.5' : 'mt-auto pt-2'}`}
                            >
                                {s.sub}
                            </p>
                        </div>
                    );

                    return (
                        <li key={s.label}>
                            {s.href ? (
                                <Link
                                    href={s.href}
                                    aria-label={t('openLabel', {
                                        label: s.label,
                                    })}
                                    className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                >
                                    {cardContent}
                                </Link>
                            ) : (
                                cardContent
                            )}
                        </li>
                    );
                })}
            </ul>

            {/* GRID 12 KOLOM: kiri alur operasional (8), kanan panel ringkas (4) */}
            <div className="mt-4 grid items-start gap-4 lg:grid-cols-12 lg:gap-6">
                <div className="flex flex-col gap-4 lg:col-span-8 lg:gap-6">
                    {/* Tren pendaftaran + stat cards */}
                    <Panel>
                        <div className="p-4 sm:p-6">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h2 className="font-display text-base font-bold tracking-tight text-slate-950 dark:text-slate-50">
                                        {t('text43')}
                                    </h2>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        {t('text44')}
                                    </p>
                                </div>
                                {bulanIni > bulanLalu ? (
                                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900">
                                        {t('monthIncrease', {
                                            count: bulanIni - bulanLalu,
                                        })}
                                    </span>
                                ) : null}
                            </div>
                            <div className="mt-4">
                                <EnrollmentTrendChart
                                    data={bulan.map((b) => ({
                                        label: b.label,
                                        n: b.n,
                                    }))}
                                />
                            </div>
                            {/* Sub-metri — stat card kecil pola teacher */}
                            <dl className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                                <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                                    <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                        {t('text45')}
                                    </dt>
                                    <dd className="mt-0.5 font-display text-lg font-extrabold tabular-nums text-slate-950 dark:text-white">
                                        {bulanIni}
                                    </dd>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                                    <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                        {t('text46')}
                                    </dt>
                                    <dd className="mt-0.5 font-display text-lg font-extrabold tabular-nums text-slate-950 dark:text-white">
                                        {rata2Bulan}
                                    </dd>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                                    <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                        {t('text47')}
                                    </dt>
                                    <dd className="mt-0.5 font-display text-lg font-extrabold tabular-nums text-slate-950 dark:text-white">
                                        {daftarAktif.length}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </Panel>

                    {/* PENDAFTARAN TERBARU */}
                    <Panel>
                        <div className="p-4 sm:p-6">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <h2 className="font-display text-base font-bold tracking-tight text-slate-950 dark:text-slate-50">
                                        {t('text48')}
                                    </h2>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        {t('text49')}
                                    </p>
                                </div>
                                <ButtonLink
                                    href={getPathname({
                                        href: '/admin/enrollments',
                                        locale,
                                    })}
                                    variant="outline"
                                    size="sm"
                                >
                                    {t('text50')}
                                </ButtonLink>
                            </div>
                            <div className="mt-4">
                                <DataTable
                                    columns={columns}
                                    rows={rows}
                                    initialSort={{
                                        key: 'createdAt',
                                        dir: 'desc',
                                    }}
                                    empty={t('text51')}
                                />
                            </div>
                        </div>
                    </Panel>

                    {/* PINTASAN AKSI CEPAT */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                        {quickActions.map((a) => {
                            const tone = QUICK_TONE[a.tone];
                            return (
                                <Link
                                    key={a.href}
                                    href={a.href}
                                    className={`group relative flex min-h-24 flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition-all dark:border-slate-800 dark:bg-slate-900 ${tone.card}`}
                                >
                                    <ArrowUpRight
                                        className={`absolute right-3 top-3 size-4 text-slate-300 transition-colors dark:text-slate-600 ${tone.arrow}`}
                                        aria-hidden="true"
                                    />
                                    <span
                                        className={`pr-6 text-sm font-bold text-slate-950 transition-colors dark:text-slate-50 ${tone.label}`}
                                    >
                                        {a.label}
                                    </span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {a.desc}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col gap-4 lg:col-span-4 lg:gap-6">
                    {/* DONUT STATUS PEMBAYARAN */}
                    <Panel>
                        <div className="p-4 sm:p-6">
                            <h2 className="font-display text-base font-bold tracking-tight text-slate-950 dark:text-slate-50">
                                {t('text52')}
                            </h2>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                {t('midtransCount', {
                                    count: pembayaran.length,
                                })}
                            </p>
                            {slices.length > 0 ? (
                                <div className="mt-3">
                                    <PaymentStatusChart
                                        slices={slices}
                                        total={pembayaran.length}
                                    />
                                </div>
                            ) : (
                                <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-800/40">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {t('text53')}
                                    </p>
                                    <ButtonLink
                                        href={getPathname({
                                            href: '/admin/reports',
                                            locale,
                                        })}
                                        variant="outline"
                                        size="sm"
                                    >
                                        {t('text54')}
                                    </ButtonLink>
                                </div>
                            )}
                        </div>
                    </Panel>

                    {/* ANTREAN PERLU TINDAKAN — flat divide-y list */}
                    <Panel className="flex-1">
                        <div className="p-4 sm:p-6">
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="font-display text-base font-bold tracking-tight text-slate-950 dark:text-slate-50">
                                    {t('actionQueueTitle')}
                                </h2>
                                {perluTindakan > 0 ? (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                                        {perluTindakan}
                                    </span>
                                ) : null}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                {t('text56')}
                            </p>
                            {antrean.every((a) => a.n === 0) ? (
                                <div className="mt-4 flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-800/40">
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                        {t('text57')}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                                        {antrean.map((a) => (
                                            <li key={a.label}>
                                                <Link
                                                    href={a.href}
                                                    className="group flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                                                >
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block text-sm font-semibold leading-snug text-slate-800 dark:text-slate-200">
                                                            {a.label}
                                                        </span>
                                                        <span className="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-slate-400">
                                                            {a.hint}
                                                        </span>
                                                    </span>
                                                    <span
                                                        className={`flex-shrink-0 rounded-full px-2.5 py-1 text-sm font-bold tabular-nums ${
                                                            a.n > 0
                                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}
                                                    >
                                                        {a.n}
                                                    </span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                    {antrean.some((a) => a.n > 0) ? (
                                        <div className="mt-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                            <Link
                                                href="/admin/enrollments/flagged"
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                            >
                                                {t('viewAllQueue')}
                                                <ArrowUpRight className="size-3.5" />
                                            </Link>
                                        </div>
                                    ) : null}
                                </>
                            )}
                        </div>
                    </Panel>
                </div>
            </div>
        </div>
    );
}
