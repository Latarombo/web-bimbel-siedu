'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { rupiah } from '@/lib/format/format';
import {
  AdminPageHeader,
  AdminTableShell,
  AdminSortHeader,
  type SortDir,
} from '@/components/admin/admin-table-kit';

export interface AdminReportKpi {
  label: string;
  value: string;
  sub: string;
}

export interface AdminReportPeriodRow {
  id: number;
  nama: string;
  status: string;
  tanggalMulai: string;
  tanggalMulaiLabel: string;
  tanggalSelesaiLabel: string;
  totalPendaftar: number;
  aktif: number;
  tertunggak: number;
  batal: number;
  terkumpul: number;
  terkumpulCount: number;
  pending: number;
  pendingCount: number;
  totalTagihan: number;
}

const ITEMS_PER_PAGE = 10;

export function AdminReportsView({
  kpis,
  periods,
}: {
  kpis: AdminReportKpi[];
  periods: AdminReportPeriodRow[];
}) {
  const t = useTranslations('admin');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{
    key: 'nama' | 'status' | 'aktif' | 'tertunggak' | 'batal' | 'terkumpul' | 'pending';
    dir: SortDir;
  } | null>(null);

  const labelPeriode = (value: string) =>
    t.has(`labelPeriode_${value}`)
      ? t(`labelPeriode_${value}`)
      : value.replaceAll('_', ' ');

  const toggleSort = (
    key: 'nama' | 'status' | 'aktif' | 'tertunggak' | 'batal' | 'terkumpul' | 'pending',
  ) => {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
      }
      return { key, dir: 'asc' };
    });
  };

  const filtered = useMemo(() => {
    let res = [...periods];
    if (statusFilter !== 'all') {
      res = res.filter((p) => p.status === statusFilter);
    }
    const q = search.toLowerCase().trim();
    if (q) {
      res = res.filter((p) =>
        `${p.nama} ${p.status} ${p.tanggalMulaiLabel} ${p.tanggalSelesaiLabel}`
          .toLowerCase()
          .includes(q),
      );
    }
    if (sort) {
      const { key, dir } = sort;
      res.sort((a, b) => {
        let cmp = 0;
        if (key === 'nama') cmp = a.nama.localeCompare(b.nama, 'id');
        else if (key === 'status') cmp = a.status.localeCompare(b.status, 'id');
        else if (key === 'aktif') cmp = a.aktif - b.aktif;
        else if (key === 'tertunggak') cmp = a.tertunggak - b.tertunggak;
        else if (key === 'batal') cmp = a.batal - b.batal;
        else if (key === 'terkumpul') cmp = a.terkumpul - b.terkumpul;
        else if (key === 'pending') cmp = a.pending - b.pending;
        return dir === 'asc' ? cmp : -cmp;
      });
    }
    return res;
  }, [periods, statusFilter, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t('text14')} description={t('text115')} />

      {/* KPI CARDS — gaya Dashboard Admin: tanpa border-top warna */}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((s) => (
          <li
            key={s.label}
            className="flex min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 sm:p-6"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {s.label}
            </p>
            <p className="mt-3 truncate font-display text-2xl font-extrabold leading-none tracking-tight tabular-nums text-slate-950 dark:text-white sm:text-3xl">
              {s.value}
            </p>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              {s.sub}
            </p>
          </li>
        ))}
      </ul>

      <AdminTableShell
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder={t('text106')}
        searchAriaLabel="Cari laporan periode"
        tableAriaLabel="Tabel laporan per semester"
        minWidthClass="min-w-[1040px]"
        totalRawCount={periods.length}
        filteredCount={filtered.length}
        currentPage={safePage}
        totalPages={totalPages}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel="semester"
        onPageChange={setPage}
        onResetFilters={() => {
          setSearch('');
          setStatusFilter('all');
          setPage(1);
        }}
        emptyTitle={t('text116')}
        emptyDescription="Ringkasan laporan per semester akan tampil di sini."
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
              { value: 'all', label: t('text67') },
              { value: 'dibuka', label: labelPeriode('dibuka') },
              { value: 'ditutup', label: labelPeriode('ditutup') },
              { value: 'selesai', label: labelPeriode('selesai') },
            ]}
          />
        }
        thead={
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <th
              scope="col"
              className="sticky left-0 z-20 w-12 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-center"
            >
              No
            </th>
            <th
              scope="col"
              className="sticky left-12 z-20 min-w-[220px] max-w-[280px] bg-slate-50 dark:bg-slate-800 p-0 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]"
            >
              <AdminSortHeader
                label={t('text9')}
                active={sort?.key === 'nama'}
                dir={sort?.dir}
                onClick={() => toggleSort('nama')}
              />
            </th>
            <th scope="col" className="p-0 text-center whitespace-nowrap">
              <AdminSortHeader
                label={t('text32')}
                align="center"
                active={sort?.key === 'status'}
                dir={sort?.dir}
                onClick={() => toggleSort('status')}
              />
            </th>
            <th scope="col" className="p-0 text-right whitespace-nowrap">
              <AdminSortHeader
                label={t('text68')}
                align="right"
                active={sort?.key === 'aktif'}
                dir={sort?.dir}
                onClick={() => toggleSort('aktif')}
              />
            </th>
            <th scope="col" className="p-0 text-right whitespace-nowrap">
              <AdminSortHeader
                label={t('text110')}
                align="right"
                active={sort?.key === 'tertunggak'}
                dir={sort?.dir}
                onClick={() => toggleSort('tertunggak')}
              />
            </th>
            <th scope="col" className="p-0 text-right whitespace-nowrap">
              <AdminSortHeader
                label={t('text113')}
                align="right"
                active={sort?.key === 'batal'}
                dir={sort?.dir}
                onClick={() => toggleSort('batal')}
              />
            </th>
            <th scope="col" className="p-0 text-right whitespace-nowrap">
              <AdminSortHeader
                label={t('text114')}
                align="right"
                active={sort?.key === 'terkumpul'}
                dir={sort?.dir}
                onClick={() => toggleSort('terkumpul')}
              />
            </th>
            <th scope="col" className="p-0 text-right whitespace-nowrap">
              <AdminSortHeader
                label={t('text20')}
                align="right"
                active={sort?.key === 'pending'}
                dir={sort?.dir}
                onClick={() => toggleSort('pending')}
              />
            </th>
          </tr>
        }
        tbody={paginated.map((pr, idx) => (
          <tr
            key={pr.id}
            className="group/row border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
          >
            <td className="sticky left-0 z-10 w-12 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-400 tabular-nums text-xs">
              {(safePage - 1) * ITEMS_PER_PAGE + idx + 1}
            </td>
            <td className="sticky left-12 z-10 min-w-[220px] max-w-[280px] bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]">
              <Link
                href={`/admin/classes?periodeId=${pr.id}`}
                className="font-semibold text-blue-700 dark:text-blue-400 hover:underline"
              >
                {pr.nama}
              </Link>
              <p className="mt-0.5 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {t('periodEnrollmentSummary', {
                  start: pr.tanggalMulaiLabel,
                  end: pr.tanggalSelesaiLabel,
                  count: pr.totalPendaftar,
                })}
              </p>
            </td>
            <td className="px-4 py-3 text-center whitespace-nowrap">
              <Badge
                tone={
                  pr.status === 'dibuka'
                    ? 'emerald'
                    : pr.status === 'ditutup'
                      ? 'amber'
                      : 'slate'
                }
              >
                {labelPeriode(pr.status)}
              </Badge>
            </td>
            <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
              {pr.aktif}
            </td>
            <td className="px-4 py-3 text-right whitespace-nowrap">
              <span
                className={`font-bold tabular-nums ${
                  pr.tertunggak > 0
                    ? 'text-rose-700 dark:text-rose-300'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {pr.tertunggak}
              </span>
            </td>
            <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
              {pr.batal}
            </td>
            <td className="px-4 py-3 text-right whitespace-nowrap">
              <p className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                {rupiah(pr.terkumpul)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('successfulInvoices', { count: pr.terkumpulCount })}
              </p>
            </td>
            <td className="px-4 py-3 text-right whitespace-nowrap">
              <p className="tabular-nums text-slate-700 dark:text-slate-300">
                {rupiah(pr.pending)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('invoiceSummary', {
                  count: pr.pendingCount,
                  amount: rupiah(pr.totalTagihan),
                })}
              </p>
            </td>
          </tr>
        ))}
      />
    </div>
  );
}
