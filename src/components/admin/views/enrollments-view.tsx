'use client';

import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import {
  AdminPageHeader,
  AdminTableShell,
  AdminSortHeader,
  type SortDir,
} from '@/components/admin/admin-table-kit';

export interface AdminEnrollmentRow {
  id: number;
  orangTuaNama: string;
  orangTuaTelepon: string;
  anakNama: string;
  jenjangLabel: string;
  kelasId: number;
  kelasNama: string;
  mapelNama: string;
  metodeBayar: 'lunas' | 'dp_cicilan';
  tenorBulan: number | null;
  paymentStatusLabel: string;
  paymentStatusTone: 'emerald' | 'brand' | 'amber' | 'red' | 'slate';
  rawStatus: string;
  tanggalDaftar: string;
  tanggalDaftarLabel: string;
}

const ITEMS_PER_PAGE = 10;

export function AdminEnrollmentsView({
  enrollments,
  initialStatusFilter = 'all',
  initialKelasId,
}: {
  enrollments: AdminEnrollmentRow[];
  initialStatusFilter?: string;
  initialKelasId?: number;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{
    key: 'orangTua' | 'anak' | 'kelas' | 'mapel' | 'metode' | 'status' | 'tanggal';
    dir: SortDir;
  } | null>({ key: 'tanggal', dir: 'desc' });

  const toggleSort = (
    key: 'orangTua' | 'anak' | 'kelas' | 'mapel' | 'metode' | 'status' | 'tanggal',
  ) => {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
      }
      return { key, dir: 'asc' };
    });
  };

  const filtered = useMemo(() => {
    let res = [...enrollments];
    if (initialKelasId) {
      res = res.filter((e) => e.kelasId === initialKelasId);
    }
    if (statusFilter === 'terdaftar') {
      res = res.filter((e) => e.rawStatus === 'terdaftar');
    } else if (statusFilter === 'menunggu_pembayaran') {
      res = res.filter((e) => e.rawStatus === 'menunggu_pembayaran');
    } else if (statusFilter === 'bermasalah') {
      res = res.filter((e) =>
        ['tertunggak', 'dibatalkan_timeout', 'dibatalkan_tunggakan', 'dibatalkan_kelas'].includes(
          e.rawStatus,
        ),
      );
    }

    const q = search.toLowerCase().trim();
    if (q) {
      res = res.filter((e) =>
        `${e.orangTuaNama} ${e.orangTuaTelepon} ${e.anakNama} ${e.kelasNama} ${e.mapelNama} ${e.paymentStatusLabel}`
          .toLowerCase()
          .includes(q),
      );
    }

    if (sort) {
      const { key, dir } = sort;
      res.sort((a, b) => {
        let cmp = 0;
        if (key === 'orangTua') cmp = a.orangTuaNama.localeCompare(b.orangTuaNama, 'id');
        else if (key === 'anak') cmp = a.anakNama.localeCompare(b.anakNama, 'id');
        else if (key === 'kelas') cmp = a.kelasNama.localeCompare(b.kelasNama, 'id');
        else if (key === 'mapel') cmp = a.mapelNama.localeCompare(b.mapelNama, 'id');
        else if (key === 'metode') cmp = a.metodeBayar.localeCompare(b.metodeBayar, 'id');
        else if (key === 'status') cmp = a.paymentStatusLabel.localeCompare(b.paymentStatusLabel, 'id');
        else if (key === 'tanggal') cmp = a.tanggalDaftar.localeCompare(b.tanggalDaftar);
        return dir === 'asc' ? cmp : -cmp;
      });
    }
    return res;
  }, [enrollments, statusFilter, search, sort, initialKelasId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Daftar Pendaftaran"
        description="Pantau pendaftaran kelas siswa, metode pembayaran, dan status tagihan terkini."
      />

      <AdminTableShell
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Cari orang tua, anak, kelas, atau mapel…"
        searchAriaLabel="Cari pendaftaran"
        tableAriaLabel="Tabel pendaftaran siswa"
        minWidthClass="min-w-[1040px]"
        totalRawCount={enrollments.length}
        filteredCount={filtered.length}
        currentPage={safePage}
        totalPages={totalPages}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel="pendaftaran"
        onPageChange={setPage}
        onResetFilters={() => {
          setSearch('');
          setStatusFilter('all');
          setPage(1);
        }}
        emptyTitle="Belum ada pendaftaran"
        emptyDescription="Pendaftaran siswa baru akan tampil di sini."
        toolbarRight={
          <FilterDropdown
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            size="sm"
            prefixLabel="Status:"
            options={[
              { value: 'all', label: 'Semua' },
              { value: 'terdaftar', label: 'Terdaftar' },
              { value: 'menunggu_pembayaran', label: 'Menunggu Bayar' },
              { value: 'bermasalah', label: 'Tertunggak / Batal' },
            ]}
          />
        }
        thead={
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <th scope="col" className="sticky left-0 z-20 w-12 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-center">
              No
            </th>
            <th
              scope="col"
              className="sticky left-12 z-20 min-w-[175px] max-w-[230px] bg-slate-50 dark:bg-slate-800 p-0 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]"
            >
              <AdminSortHeader
                label="Nama Orang Tua"
                active={sort?.key === 'orangTua'}
                dir={sort?.dir}
                onClick={() => toggleSort('orangTua')}
              />
            </th>
            <th scope="col" className="p-0 whitespace-nowrap">
              <AdminSortHeader
                label="Nama Anak"
                active={sort?.key === 'anak'}
                dir={sort?.dir}
                onClick={() => toggleSort('anak')}
              />
            </th>
            <th scope="col" className="p-0 whitespace-nowrap">
              <AdminSortHeader
                label="Kelas yang Diambil"
                active={sort?.key === 'kelas'}
                dir={sort?.dir}
                onClick={() => toggleSort('kelas')}
              />
            </th>
            <th scope="col" className="p-0 whitespace-nowrap">
              <AdminSortHeader
                label="Mapel yang Diambil"
                active={sort?.key === 'mapel'}
                dir={sort?.dir}
                onClick={() => toggleSort('mapel')}
              />
            </th>
            <th scope="col" className="p-0 text-center whitespace-nowrap">
              <AdminSortHeader
                label="Metode Bayar"
                align="center"
                active={sort?.key === 'metode'}
                dir={sort?.dir}
                onClick={() => toggleSort('metode')}
              />
            </th>
            <th scope="col" className="p-0 text-center whitespace-nowrap">
              <AdminSortHeader
                label="Status Pembayaran"
                align="center"
                active={sort?.key === 'status'}
                dir={sort?.dir}
                onClick={() => toggleSort('status')}
              />
            </th>
            <th scope="col" className="p-0 text-right whitespace-nowrap">
              <AdminSortHeader
                label="Tanggal Daftar"
                align="right"
                active={sort?.key === 'tanggal'}
                dir={sort?.dir}
                onClick={() => toggleSort('tanggal')}
              />
            </th>
            <th
              scope="col"
              className="md:sticky md:right-0 md:z-20 py-3 px-4 text-right bg-slate-50 dark:bg-slate-800 md:border-l md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)]"
            >
              Aksi
            </th>
          </tr>
        }
        tbody={paginated.map((e, idx) => (
          <tr
            key={e.id}
            className="group/row border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
          >
            <td className="sticky left-0 z-10 w-12 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-400 tabular-nums text-xs">
              {(safePage - 1) * ITEMS_PER_PAGE + idx + 1}
            </td>
            <td className="sticky left-12 z-10 min-w-[175px] max-w-[230px] bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]">
              <p className="truncate font-semibold text-slate-900 dark:text-slate-100" title={e.orangTuaNama}>
                {e.orangTuaNama}
              </p>
              <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {e.orangTuaTelepon || '—'}
              </p>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <p className="font-medium text-slate-900 dark:text-slate-100">{e.anakNama}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{e.jenjangLabel}</p>
            </td>
            <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
              <Link
                href={`/admin/classes/${e.kelasId}`}
                className="hover:text-blue-700 dark:hover:text-blue-400 hover:underline"
              >
                {e.kelasNama}
              </Link>
            </td>
            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
              {e.mapelNama}
            </td>
            <td className="px-4 py-3 text-center whitespace-nowrap">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {e.metodeBayar === 'dp_cicilan' ? 'DP + Cicilan' : 'Lunas'}
              </span>
              {e.tenorBulan ? (
                <span className="block text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                  {e.tenorBulan}x
                </span>
              ) : null}
            </td>
            <td className="px-4 py-3 text-center whitespace-nowrap">
              <Badge tone={e.paymentStatusTone}>{e.paymentStatusLabel}</Badge>
            </td>
            <td className="px-4 py-3 text-right tabular-nums text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
              {e.tanggalDaftarLabel}
            </td>
            <td className="md:sticky md:right-0 md:z-10 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 md:border-l md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-end">
                <Link
                  href={`/admin/enrollments/${e.id}`}
                  aria-label={`Lihat detail pendaftaran ${e.anakNama}`}
                  title="Lihat detail pendaftaran"
                  className="grid size-8 place-items-center rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/40 transition-colors"
                >
                  <Eye className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </td>
          </tr>
        ))}
      />
    </div>
  );
}
