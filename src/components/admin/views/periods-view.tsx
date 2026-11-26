'use client';

import { useMemo, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { hapusPeriodeAction } from '@/app/actions/admin';
import PeriodeForm from '@/components/admin/periode-form';
import {
  AdminPageHeader,
  AdminTableShell,
  AdminSortHeader,
  AdminModal,
  AdminDeleteModal,
  RowActionIconBtn,
  type SortDir,
} from '@/components/admin/admin-table-kit';

export interface AdminPeriodRow {
  id: number;
  nama: string;
  status: string;
  tanggalMulai: string;
  tanggalMulaiLabel: string;
  tanggalSelesai: string;
  tanggalSelesaiLabel: string;
  tanggalTutupPendaftaran: string;
  tanggalTutupLabel: string;
  jumlahKelas: number;
}

const ITEMS_PER_PAGE = 10;

export function AdminPeriodsView({ periods }: { periods: AdminPeriodRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{
    key: 'nama' | 'status' | 'mulai' | 'selesai';
    dir: SortDir;
  } | null>({ key: 'mulai', dir: 'desc' });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPeriodRow | null>(null);
  const [deleting, setDeleting] = useState<AdminPeriodRow | null>(null);

  const toggleSort = (key: 'nama' | 'status' | 'mulai' | 'selesai') => {
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
        else if (key === 'mulai') cmp = a.tanggalMulai.localeCompare(b.tanggalMulai);
        else if (key === 'selesai') cmp = a.tanggalSelesai.localeCompare(b.tanggalSelesai);
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

  const statusTone = (status: string) =>
    status === 'dibuka' ? 'emerald' : status === 'ditutup' ? 'amber' : 'slate';

  const statusLabel = (status: string) =>
    status === 'dibuka' ? 'Dibuka' : status === 'ditutup' ? 'Ditutup' : 'Selesai';

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Semester & Periode"
        description="Atur semester akademik, rentang tanggal belajar, dan status pembukaan pendaftaran."
      />

      <AdminTableShell
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Cari nama semester…"
        searchAriaLabel="Cari semester"
        tableAriaLabel="Tabel daftar semester"
        minWidthClass="min-w-[780px]"
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
        emptyTitle="Belum ada semester"
        emptyDescription="Tambahkan semester baru untuk membuka periode pembelajaran."
        toolbarRight={
          <>
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
                { value: 'dibuka', label: 'Dibuka' },
                { value: 'ditutup', label: 'Ditutup' },
                { value: 'selesai', label: 'Selesai' },
              ]}
            />
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-2xs hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer"
            >
              Tambah Semester
            </button>
          </>
        }
        thead={
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <th scope="col" className="sticky left-0 z-20 w-12 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-center">
              No
            </th>
            <th
              scope="col"
              className="sticky left-12 z-20 min-w-[200px] max-w-[280px] bg-slate-50 dark:bg-slate-800 p-0 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]"
            >
              <AdminSortHeader
                label="Semester"
                active={sort?.key === 'nama'}
                dir={sort?.dir}
                onClick={() => toggleSort('nama')}
              />
            </th>
            <th scope="col" className="p-0 text-center whitespace-nowrap">
              <AdminSortHeader
                label="Status"
                align="center"
                active={sort?.key === 'status'}
                dir={sort?.dir}
                onClick={() => toggleSort('status')}
              />
            </th>
            <th scope="col" className="p-0 text-right whitespace-nowrap">
              <AdminSortHeader
                label="Tanggal Mulai"
                align="right"
                active={sort?.key === 'mulai'}
                dir={sort?.dir}
                onClick={() => toggleSort('mulai')}
              />
            </th>
            <th scope="col" className="p-0 text-right whitespace-nowrap">
              <AdminSortHeader
                label="Tanggal Selesai"
                align="right"
                active={sort?.key === 'selesai'}
                dir={sort?.dir}
                onClick={() => toggleSort('selesai')}
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
        tbody={paginated.map((p, idx) => (
          <tr
            key={p.id}
            className="group/row border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
          >
            <td className="sticky left-0 z-10 w-12 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-400 tabular-nums text-xs">
              {(safePage - 1) * ITEMS_PER_PAGE + idx + 1}
            </td>
            <td className="sticky left-12 z-10 min-w-[200px] max-w-[280px] bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]">
              <p className="font-semibold text-slate-900 dark:text-slate-100 truncate" title={p.nama}>
                {p.nama}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                Tutup daftar: {p.tanggalTutupLabel}
              </p>
            </td>
            <td className="px-4 py-3 text-center whitespace-nowrap">
              <Badge tone={statusTone(p.status)}>{statusLabel(p.status)}</Badge>
            </td>
            <td className="px-4 py-3 text-right tabular-nums text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
              {p.tanggalMulaiLabel}
            </td>
            <td className="px-4 py-3 text-right tabular-nums text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
              {p.tanggalSelesaiLabel}
            </td>
            <td className="md:sticky md:right-0 md:z-10 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 md:border-l md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-end gap-1">
                <RowActionIconBtn
                  onClick={() => {
                    setEditing(p);
                    setFormOpen(true);
                  }}
                  ariaLabel={`Edit semester ${p.nama}`}
                  title="Edit semester"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </RowActionIconBtn>
                <RowActionIconBtn
                  onClick={() => setDeleting(p)}
                  ariaLabel={`Hapus semester ${p.nama}`}
                  title="Hapus semester"
                  tone="danger"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </RowActionIconBtn>
              </div>
            </td>
          </tr>
        ))}
      />

      <AdminModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit Semester: ${editing.nama}` : 'Tambah Semester Baru'}
        subtitle="Tentukan nama semester, jadwal pembukaan, dan tanggal selesai belajar."
        maxWidthClass="sm:max-w-lg"
      >
        <PeriodeForm
          key={editing?.id ?? 'new-period'}
          periodeId={editing?.id}
          defaults={
            editing
              ? {
                  nama: editing.nama,
                  tanggalMulai: editing.tanggalMulai,
                  tanggalSelesai: editing.tanggalSelesai,
                  tanggalTutupPendaftaran: editing.tanggalTutupPendaftaran,
                  status: editing.status,
                }
              : undefined
          }
          onSuccess={() => {
            setFormOpen(false);
            router.refresh();
          }}
        />
      </AdminModal>

      <AdminDeleteModal
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Hapus Semester"
        itemName={deleting?.nama ?? ''}
        onConfirm={async () => {
          if (!deleting) return { error: 'Data tidak valid.' };
          const res = await hapusPeriodeAction(deleting.id);
          if (res.ok) router.refresh();
          return res;
        }}
      />
    </div>
  );
}
