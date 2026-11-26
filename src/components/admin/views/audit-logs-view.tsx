'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { AuditDetailDialog } from '@/components/admin/audit-detail-dialog';
import {
  AdminPageHeader,
  AdminTableShell,
  AdminSortHeader,
  type SortDir,
} from '@/components/admin/admin-table-kit';

export interface AdminAuditLogRow {
  id: number;
  aktorNama: string;
  aktorRole: string;
  entitas: string;
  entitasId: number;
  aksi: string;
  alasan: string | null;
  sebelum: string | null;
  sesudah: string | null;
  createdAt: string;
  createdAtLabel: string;
}

const ITEMS_PER_PAGE = 10;

const ENTITAS_OPTIONS = [
  { value: 'all', label: 'Semua' },
  { value: 'pembayaran', label: 'Pembayaran' },
  { value: 'pendaftaran', label: 'Pendaftaran' },
  { value: 'presensi', label: 'Presensi' },
  { value: 'penilaian', label: 'Penilaian' },
];

export function AdminAuditLogsView({
  logs,
  initialEntitas = 'all',
}: {
  logs: AdminAuditLogRow[];
  initialEntitas?: string;
}) {
  const validInitial = ENTITAS_OPTIONS.some((o) => o.value === initialEntitas)
    ? initialEntitas
    : 'all';

  const [search, setSearch] = useState('');
  const [entitasFilter, setEntitasFilter] = useState(validInitial);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{
    key: 'aktor' | 'entitas' | 'aksi' | 'waktu';
    dir: SortDir;
  } | null>({ key: 'waktu', dir: 'desc' });

  const toggleSort = (key: 'aktor' | 'entitas' | 'aksi' | 'waktu') => {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
      }
      return { key, dir: 'asc' };
    });
  };

  const filtered = useMemo(() => {
    let res = [...logs];
    if (entitasFilter !== 'all') {
      res = res.filter((log) => log.entitas === entitasFilter);
    }
    const q = search.toLowerCase().trim();
    if (q) {
      res = res.filter((log) =>
        `${log.aktorNama} ${log.aktorRole} ${log.entitas} ${log.entitasId} ${log.aksi} ${log.alasan ?? ''}`
          .toLowerCase()
          .includes(q),
      );
    }
    if (sort) {
      const { key, dir } = sort;
      res.sort((a, b) => {
        let cmp = 0;
        if (key === 'aktor') cmp = a.aktorNama.localeCompare(b.aktorNama, 'id');
        else if (key === 'entitas')
          cmp =
            a.entitas.localeCompare(b.entitas, 'id') ||
            a.entitasId - b.entitasId;
        else if (key === 'aksi') cmp = a.aksi.localeCompare(b.aksi, 'id');
        else if (key === 'waktu')
          cmp = a.createdAt.localeCompare(b.createdAt);
        return dir === 'asc' ? cmp : -cmp;
      });
    }
    return res;
  }, [logs, entitasFilter, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Log Audit Sistem"
        description="Jejak audit kronologis seluruh perubahan data penting pada sistem lembaga Siedu."
      />

      <AdminTableShell
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Cari aktor, entitas, atau kata kunci…"
        searchAriaLabel="Cari log audit"
        tableAriaLabel="Tabel log audit sistem"
        minWidthClass="min-w-[1040px]"
        totalRawCount={logs.length}
        filteredCount={filtered.length}
        currentPage={safePage}
        totalPages={totalPages}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel="rekaman"
        onPageChange={setPage}
        onResetFilters={() => {
          setSearch('');
          setEntitasFilter('all');
          setPage(1);
        }}
        emptyTitle="Belum ada catatan log audit"
        emptyDescription="Aktivitas perubahan data penting sistem akan tercatat di sini."
        filteredEmptyTitle="Tidak ada log audit yang cocok"
        filteredEmptyDescription="Belum ada catatan log audit untuk kategori atau kata kunci ini."
        toolbarRight={
          <FilterDropdown
            value={entitasFilter}
            onChange={(val) => {
              setEntitasFilter(val);
              setPage(1);
            }}
            size="sm"
            prefixLabel="Entitas:"
            options={ENTITAS_OPTIONS}
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
              className="sticky left-12 z-20 min-w-[190px] max-w-[240px] bg-slate-50 dark:bg-slate-800 p-0 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]"
            >
              <AdminSortHeader
                label="Aktor Pelaksana"
                active={sort?.key === 'aktor'}
                dir={sort?.dir}
                onClick={() => toggleSort('aktor')}
              />
            </th>
            <th scope="col" className="p-0 whitespace-nowrap">
              <AdminSortHeader
                label="Entitas Terkait"
                active={sort?.key === 'entitas'}
                dir={sort?.dir}
                onClick={() => toggleSort('entitas')}
              />
            </th>
            <th scope="col" className="p-0 whitespace-nowrap">
              <AdminSortHeader
                label="Aksi Mutasi"
                active={sort?.key === 'aksi'}
                dir={sort?.dir}
                onClick={() => toggleSort('aksi')}
              />
            </th>
            <th scope="col" className="px-4 py-3 text-left whitespace-nowrap">
              Catatan / Alasan
            </th>
            <th scope="col" className="p-0 text-right whitespace-nowrap">
              <AdminSortHeader
                label="Waktu (WIB)"
                align="right"
                active={sort?.key === 'waktu'}
                dir={sort?.dir}
                onClick={() => toggleSort('waktu')}
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
        tbody={paginated.map((log, idx) => (
          <tr
            key={log.id}
            className="group/row border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
          >
            <td className="sticky left-0 z-10 w-12 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-400 tabular-nums text-xs">
              {(safePage - 1) * ITEMS_PER_PAGE + idx + 1}
            </td>
            <td className="sticky left-12 z-10 min-w-[190px] max-w-[240px] bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]">
              <p
                className="truncate font-semibold text-slate-900 dark:text-slate-100"
                title={log.aktorNama}
              >
                {log.aktorNama}
              </p>
              <span className="mt-0.5 inline-block rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">
                {log.aktorRole}
              </span>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <Badge tone="brand">{log.entitas}</Badge>
                <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  #{log.entitasId}
                </span>
              </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                {log.aksi}
              </span>
            </td>
            <td className="px-4 py-3">
              <p className="line-clamp-2 max-w-sm text-xs text-slate-600 dark:text-slate-400">
                {log.alasan || '—'}
              </p>
            </td>
            <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
              {log.createdAtLabel}
            </td>
            <td className="md:sticky md:right-0 md:z-10 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 md:border-l md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-end">
                <AuditDetailDialog
                  aksi={log.aksi}
                  entitas={log.entitas}
                  entitasId={log.entitasId}
                  sebelum={log.sebelum}
                  sesudah={log.sesudah}
                  alasan={log.alasan}
                />
              </div>
            </td>
          </tr>
        ))}
      />
    </div>
  );
}
