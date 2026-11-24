import { getLocale, getTranslations } from 'next-intl/server';
import { Link, redirect, getPathname } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/prisma/db';
import { collect } from '@/lib/collect';
import { rupiah } from '@/lib/format/format';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import {
    StatusBadge,
    type StatusPendaftaran,
} from '@/components/common/status-badge';
import {
    DataTable,
    type TableColumn,
    type TableRowData,
} from '@/components/ui/data-table';
import {
    PageShell,
    PageHeader,
    Panel,
    FilterTabs,
} from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export default async function AdminClassDetail({
    params,
    searchParams,
}: {
    params: Promise<{ classId: string }>;
    searchParams: Promise<{ tab?: string }>;
}) {
    const locale = await getLocale();
    const t = await getTranslations('admin');
    const labelKelas = (value: string) =>
        t.has(`labelKelas_${value}`)
            ? t(`labelKelas_${value}`)
            : value.replaceAll('_', ' ');
    const labelMetode = (value: string) =>
        t.has(`labelMetode_${value}`)
            ? t(`labelMetode_${value}`)
            : value.replaceAll('_', ' ');
    const dayLabel = (day: string) =>
        locale === 'en' && t.has(`day_${day.toLowerCase()}`)
            ? t(`day_${day.toLowerCase()}`)
            : day;
    const fmtTanggal = (iso: string) =>
        new Date(iso).toLocaleDateString(locale === 'en' ? 'en-GB' : 'id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'Asia/Jakarta',
        });

    const session = await auth();
    if (!session?.user) {
        return redirect({
            href: {
                pathname: '/login',
                query: {
                    next: getPathname({ href: '/admin/classes', locale }),
                },
            },
            locale,
        });
    }

    const { classId } = await params;
    const { tab = 'roster' } = await searchParams;
    const kId = Number(classId);
    if (!Number.isInteger(kId) || kId <= 0) notFound();

    const [
        kelasArr,
        mapelAll,
        guruAll,
        periodeAll,
        jadwalAll,
        pendaftaranAll,
        anakAll,
        usersAll,
        pembayaranAll,
        presensiAll,
    ] = await Promise.all([
        collect(db.orm.public.Kelas.where((k) => k.id.eq(kId)).all()),
        collect(db.orm.public.MataPelajaran.all()),
        collect(db.orm.public.User.where((u) => u.role.eq('guru')).all()),
        collect(db.orm.public.PeriodePendaftaran.all()),
        collect(db.orm.public.JadwalItem.where((j) => j.kelasId.eq(kId)).all()),
        collect(
            db.orm.public.Pendaftaran.where((p) => p.kelasId.eq(kId)).all(),
        ),
        collect(db.orm.public.Anak.all()),
        collect(db.orm.public.User.all()),
        collect(db.orm.public.Pembayaran.all()),
        collect(db.orm.public.Presensi.all()),
    ]);

    const kelas = kelasArr[0];
    if (!kelas) notFound();

    const mapel = mapelAll.find((m) => m.id === kelas.mataPelajaranId);
    const guru = guruAll.find((g) => g.id === kelas.guruId);
    const periode = periodeAll.find((p) => p.id === kelas.periodeId);

    const anakById = new Map(anakAll.map((a) => [a.id, a]));
    const userById = new Map(usersAll.map((u) => [u.id, u]));

    // Roster pendaftaran di kelas ini
    const pendaftaranIds = new Set(pendaftaranAll.map((p) => p.id));
    const tagihanKelas = pembayaranAll.filter((b) =>
        pendaftaranIds.has(b.pendaftaranId),
    );
    const presensiKelas = presensiAll.filter((pr) =>
        pendaftaranIds.has(pr.pendaftaranId),
    );

    const terisi = pendaftaranAll.filter((p) =>
        ['terdaftar', 'tertunggak', 'menunggu_pembayaran'].includes(p.status),
    ).length;
    const pctKuota = Math.min(
        100,
        Math.round((terisi / Math.max(kelas.kuotaMaksimum, 1)) * 100),
    );

    // Data Roster Siswa
    const rosterColumns: TableColumn[] = [
        { key: 'anak', header: t('text117') },
        { key: 'wali', header: t('text30') },
        { key: 'metode', header: t('text118'), align: 'center' },
        { key: 'pembayaran', header: t('text18'), align: 'right' },
        { key: 'status', header: t('text32'), align: 'center' },
        { key: 'tanggal', header: t('text120'), align: 'right' },
    ];

    const rosterRows: TableRowData[] = pendaftaranAll
        .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((p) => {
            const a = anakById.get(p.anakId);
            const wali = a ? userById.get(a.orangTuaId) : undefined;
            const tagihanSiswa = tagihanKelas.filter(
                (b) => b.pendaftaranId === p.id,
            );
            const tagihanBerhasil = tagihanSiswa.filter(
                (b) => b.status === 'berhasil',
            );
            const totalBayar = tagihanBerhasil.reduce(
                (sum, b) => sum + Number(b.jumlah),
                0,
            );

            const anakNama = a?.nama ?? `Siswa #${p.anakId}`;
            const waliNama = wali?.name ?? '-';

            return {
                id: p.id,
                values: {
                    anak: `${anakNama} ${a?.jenjangTerakhir ?? ''}`,
                    wali: `${waliNama} ${wali?.nomorTelepon ?? ''}`,
                    metode: p.metodeBayar,
                    pembayaran: totalBayar,
                    status: p.status,
                    tanggal: p.createdAt,
                },
                cells: {
                    anak: (
                        <div>
                            <p className="font-semibold text-slate-900">
                                {anakNama}
                            </p>
                            <p className="text-xs text-slate-500">
                                {a?.jenjangTerakhir ?? p.jenjangSaatDaftar}
                                {a?.tingkat ? ` · ${a.tingkat}` : ''}
                            </p>
                        </div>
                    ),
                    wali: (
                        <div>
                            <p className="text-sm font-medium text-slate-900">
                                {waliNama}
                            </p>
                            <p className="text-xs tabular-nums text-slate-500">
                                {wali?.nomorTelepon || '-'}
                            </p>
                        </div>
                    ),
                    metode: (
                        <div className="text-center">
                            <span className="text-xs font-medium text-slate-700">
                                {labelMetode(p.metodeBayar)}
                            </span>
                            {p.tenorBulan ? (
                                <span className="block text-[11px] tabular-nums text-slate-500">
                                    {p.tenorBulan}x cicilan
                                </span>
                            ) : null}
                        </div>
                    ),
                    pembayaran: (
                        <div className="text-right">
                            <span className="font-semibold tabular-nums text-slate-900">
                                {rupiah(totalBayar)}
                            </span>
                            <span className="block text-xs tabular-nums text-slate-500">
                                {tagihanBerhasil.length}/{tagihanSiswa.length}{' '}
                                tagihan
                            </span>
                        </div>
                    ),
                    status: (
                        <StatusBadge status={p.status as StatusPendaftaran} />
                    ),
                    tanggal: (
                        <span className="tabular-nums text-xs text-slate-500">
                            {fmtTanggal(p.createdAt)}
                        </span>
                    ),
                },
            };
        });

    // Rekap Presensi
    const totalPresensi = presensiKelas.length;
    const countHadir = presensiKelas.filter((x) => x.status === 'hadir').length;
    const countIzin = presensiKelas.filter((x) => x.status === 'izin').length;
    const countSakit = presensiKelas.filter((x) => x.status === 'sakit').length;
    const countAlpa = presensiKelas.filter((x) => x.status === 'alpa').length;

    const jadwalSorted = jadwalAll.toSorted(
        (a, b) =>
            a.hari.localeCompare(b.hari) ||
            a.jamMulai.localeCompare(b.jamMulai),
    );

    const mapelNama = mapel?.nama ?? `Kelas #${kelas.id}`;

    return (
        <PageShell wide>
            <PageHeader
                backHref="/admin/classes"
                title={`${mapelNama} - ${kelas.jenjang}${kelas.tingkat ? ` · ${kelas.tingkat}` : ''}`}
                desc={`Pengajar: ${guru?.name ?? '-'} · Ruangan: ${kelas.ruangan || 'Belum ditentukan'}`}
                meta={`${terisi}/${kelas.kuotaMaksimum} siswa terdaftar`}
            >
                <div className="flex items-center gap-2">
                    <Badge
                        tone={kelas.status === 'aktif' ? 'emerald' : 'slate'}
                    >
                        {labelKelas(kelas.status)}
                    </Badge>
                    <ButtonLink
                        href={getPathname({
                            href: `/admin/classes/${kelas.id}/edit`,
                            locale,
                        })}
                        variant="secondary"
                    >
                        {t('text63')}
                    </ButtonLink>
                </div>
            </PageHeader>

            <div className="mt-5">
                <FilterTabs
                    label="Tab Navigasi Detail Kelas"
                    tabs={[
                        {
                            label: `Roster Siswa`,
                            href: `/admin/classes/${kelas.id}?tab=roster`,
                            count: pendaftaranAll.length,
                            aktif: tab === 'roster',
                        },
                        {
                            label: `Jadwal & Presensi`,
                            href: `/admin/classes/${kelas.id}?tab=jadwal`,
                            count: jadwalAll.length,
                            aktif: tab === 'jadwal',
                        },
                        {
                            label: `Info & Pengajar`,
                            href: `/admin/classes/${kelas.id}?tab=info`,
                            aktif: tab === 'info',
                        },
                    ]}
                />
            </div>

            {tab === 'roster' && (
                <Panel className="mt-4 p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">
                                Daftar Siswa Terdaftar
                            </h2>
                            <p className="text-xs text-slate-500">
                                Siswa dan status administrasi pendaftaran pada
                                kelas ini.
                            </p>
                        </div>
                        <ButtonLink
                            href={getPathname({
                                href: `/admin/enrollments?kelasId=${kelas.id}`,
                                locale,
                            })}
                            variant="ghost"
                            size="sm"
                        >
                            Lihat di Hub Pendaftaran ➔
                        </ButtonLink>
                    </div>
                    <DataTable
                        columns={rosterColumns}
                        rows={rosterRows}
                        empty="Belum ada siswa yang mendaftar di kelas ini."
                        initialSort={{ key: 'tanggal', dir: 'desc' }}
                        searchPlaceholder="Cari siswa atau orang tua..."
                    />
                </Panel>
            )}

            {tab === 'jadwal' && (
                <div className="mt-4 grid gap-5 lg:grid-cols-2">
                    {/* Slot Jadwal */}
                    <Panel className="p-5">
                        <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">
                            Jadwal Sesi Mingguan
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Hari dan jam pelaksanaan kegiatan belajar mengajar
                            per minggu.
                        </p>
                        {jadwalSorted.length === 0 ? (
                            <p className="mt-4 text-sm text-slate-500">
                                Belum ada slot jadwal yang ditentukan.
                            </p>
                        ) : (
                            <ul className="mt-4 divide-y divide-slate-100">
                                {jadwalSorted.map((j) => (
                                    <li
                                        key={j.id}
                                        className="flex items-center justify-between py-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700">
                                                {j.hari.slice(0, 3)}
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {dayLabel(j.hari)}
                                                </p>
                                                <p className="text-xs tabular-nums text-slate-500">
                                                    {j.jamMulai.slice(0, 5)} –{' '}
                                                    {j.jamSelesai.slice(0, 5)}{' '}
                                                    WIB
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-600">
                                            {kelas.ruangan || 'Ruangan standar'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>

                    {/* Rekap Presensi */}
                    <Panel className="p-5">
                        <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">
                            Rekapitulasi Presensi Sesi
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Total catatan kehadiran seluruh siswa pada sesi
                            kelas ini.
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-center">
                                <p className="font-display text-xl font-bold tabular-nums text-emerald-800">
                                    {countHadir}
                                </p>
                                <p className="mt-1 text-xs font-medium text-emerald-700">
                                    Hadir
                                </p>
                            </div>
                            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-center">
                                <p className="font-display text-xl font-bold tabular-nums text-blue-800">
                                    {countIzin}
                                </p>
                                <p className="mt-1 text-xs font-medium text-blue-700">
                                    Izin
                                </p>
                            </div>
                            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-center">
                                <p className="font-display text-xl font-bold tabular-nums text-amber-800">
                                    {countSakit}
                                </p>
                                <p className="mt-1 text-xs font-medium text-amber-700">
                                    Sakit
                                </p>
                            </div>
                            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-center">
                                <p className="font-display text-xl font-bold tabular-nums text-rose-800">
                                    {countAlpa}
                                </p>
                                <p className="mt-1 text-xs font-medium text-rose-700">
                                    Alpa
                                </p>
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-slate-500">
                            Total entri presensi tercatat:{' '}
                            <strong className="text-slate-700">
                                {totalPresensi} entri
                            </strong>
                            .
                        </p>
                    </Panel>
                </div>
            )}

            {tab === 'info' && (
                <div className="mt-4 grid gap-5 lg:grid-cols-2">
                    {/* Profil Guru */}
                    <Panel className="p-5">
                        <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">
                            Pengajar / Guru Pengampu
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Informasi kontak guru yang ditugaskan mengampu kelas
                            ini.
                        </p>
                        {guru ? (
                            <div className="mt-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
                                        {guru.name
                                            .trim()
                                            .charAt(0)
                                            .toUpperCase()}
                                    </span>
                                    <div>
                                        <p className="font-semibold text-slate-900">
                                            {guru.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {guru.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-700 space-y-1">
                                    <p>
                                        <span className="font-medium text-slate-500">
                                            Nomor Telepon:
                                        </span>{' '}
                                        <span className="tabular-nums font-semibold">
                                            {guru.nomorTelepon || '-'}
                                        </span>
                                    </p>
                                    <p>
                                        <span className="font-medium text-slate-500">
                                            Alamat:
                                        </span>{' '}
                                        <span>{guru.alamat || '-'}</span>
                                    </p>
                                </div>
                                <div>
                                    <Link
                                        href={`/admin/classes?guruId=${guru.id}`}
                                        className="inline-flex text-xs font-semibold text-blue-700 hover:underline"
                                    >
                                        Lihat seluruh kelas yang diampu guru ini
                                        ➔
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-slate-500">
                                Belum ada guru yang ditugaskan.
                            </p>
                        )}
                    </Panel>

                    {/* Kuota & Biaya */}
                    <Panel className="p-5">
                        <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">
                            Konfigurasi Kuota & Keuangan
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Ketentuan biaya pendaftaran, cicilan, dan kapasitas
                            ruang belajar.
                        </p>
                        <div className="mt-4 space-y-3 text-sm">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">
                                    Kapasitas Kuota
                                </span>
                                <span className="font-semibold tabular-nums text-slate-900">
                                    {terisi} / {kelas.kuotaMaksimum} kursi (
                                    {pctKuota}%)
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">
                                    Kuota Minimum (BR#10)
                                </span>
                                <span className="font-semibold tabular-nums text-slate-900">
                                    {kelas.kuotaMinimum} kursi
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">
                                    Biaya Periode Penuh
                                </span>
                                <span className="font-semibold tabular-nums text-slate-900">
                                    {rupiah(Number(kelas.biayaPeriode))}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">
                                    Uang Muka (DP)
                                </span>
                                <span className="font-semibold tabular-nums text-slate-900">
                                    {kelas.biayaDp
                                        ? rupiah(Number(kelas.biayaDp))
                                        : 'Tidak tersedia'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between pb-1">
                                <span className="text-slate-500">
                                    Maksimal Tenor Cicilan
                                </span>
                                <span className="font-semibold tabular-nums text-slate-900">
                                    {kelas.tenorMaksimum
                                        ? `${kelas.tenorMaksimum} bulan`
                                        : '-'}
                                </span>
                            </div>
                        </div>

                        {periode ? (
                            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-600">
                                <p className="font-semibold text-slate-900">
                                    {periode.nama}
                                </p>
                                <p className="mt-0.5 tabular-nums">
                                    Rentang: {fmtTanggal(periode.tanggalMulai)}{' '}
                                    – {fmtTanggal(periode.tanggalSelesai)}
                                </p>
                                <p className="mt-0.5 tabular-nums text-slate-500">
                                    Batas Pendaftaran:{' '}
                                    {fmtTanggal(
                                        periode.tanggalTutupPendaftaran,
                                    )}
                                </p>
                            </div>
                        ) : null}
                    </Panel>
                </div>
            )}
        </PageShell>
    );
}
