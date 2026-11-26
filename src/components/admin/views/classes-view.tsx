'use client';

import { useMemo, useState } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { rupiah } from '@/lib/format/format';
import { hapusKelasAction } from '@/app/actions/admin';
import KelasForm from '@/components/admin/kelas-form';
import {
  AdminPageHeader,
  AdminTableShell,
  AdminSortHeader,
  AdminModal,
  AdminDeleteModal,
  RowActionIconBtn,
  type SortDir,
} from '@/components/admin/admin-table-kit';

export interface AdminClassRow {
  id: number;
  nama: string;
  mapel: string;
  guruId: number;
  guruNama: string;
  periodeId: number;
  periodeNama: string;
  jenjang: string;
  tingkat: string | null;
  ruangan: string | null;
  kuotaTerisi: number;
  kuotaMinimum: number;
  kuotaMaksimum: number;
  biayaPeriode: string;
  biayaDp: string | null;
  tenorMaksimum: number | null;
  status: string;
  jadwal: {
    hari: string;
    jamMulai: string;
    jamSelesai: string;
    tempat: string | null;
  }[];
  jadwalSummary: string;
}

const ITEMS_PER_PAGE = 10;

export function AdminClassesView({
  classes,
  guruOptions,
  periodeOptions,
  initialStatusFilter = 'all',
  initialGuruId,
  initialPeriodeId,
}: {
  classes: AdminClassRow[];
  guruOptions: { id: number; nama: string }[];
  periodeOptions: { id: number; nama: string; status: string }[];
  initialStatusFilter?: string;
  initialGuruId?: number;
  initialPeriodeId?: number;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{
    key: 'nama' | 'mapel' | 'guru' | 'kuota' | 'biaya' | 'status';
    dir: SortDir;
  } | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminClassRow | null>(null);
  const [deleting, setDeleting] = useState<AdminClassRow | null>(null);

  const toggleSort = (key: 'nama' | 'mapel' | 'guru' | 'kuota' | 'biaya' | 'status') => {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
      }
      return { key, dir: 'asc' };
    });
  };

  const filtered = useMemo(() => {
    let res = [...classes];
    if (initialGuruId) {
      res = res.filter((c) => c.guruId === initialGuruId);
    }
    if (initialPeriodeId) {
      res = res.filter((c) => c.periodeId === initialPeriodeId);
    }
    if (statusFilter !== 'all') {
      res = res.filter((c) => c.status === statusFilter);
    }
    const q = search.toLowerCase().trim();
    if (q) {
      res = res.filter((c) =>
        `${c.nama} ${c.mapel} ${c.guruNama} ${c.jenjang} ${c.tingkat ?? ''} ${c.jadwalSummary}`
          .toLowerCase()
          .includes(q),
      );
    }
    if (sort) {
      const { key, dir } = sort;
      res.sort((a, b) => {
        let cmp = 0;
        if (key === 'nama') cmp = a.nama.localeCompare(b.nama, 'id');
        else if (key === 'mapel') cmp = a.mapel.localeCompare(b.mapel, 'id');
        else if (key === 'guru') cmp = a.guruNama.localeCompare(b.guruNama, 'id');
        else if (key === 'kuota') cmp = a.kuotaTerisi - b.kuotaTerisi;
        else if (key === 'biaya') cmp = Number(a.biayaPeriode) - Number(b.biayaPeriode);
        else if (key === 'status') cmp = a.status.localeCompare(b.status, 'id');
        return dir === 'asc' ? cmp : -cmp;
      });
    }
    return res;
  }, [classes, statusFilter, search, sort, initialGuruId, initialPeriodeId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (row: AdminClassRow) => {
    setEditing(row);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Daftar Kelas"
        description="Kelola penawaran kelas, mata pelajaran, pengajar, kuota, biaya, dan jadwal belajar."
      />

      <AdminTableShell
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Cari nama kelas, mapel, atau guru…"
        searchAriaLabel="Cari kelas"
        tableAriaLabel="Tabel daftar kelas"
        minWidthClass="min-w-[980px]"
        totalRawCount={classes.length}
        filteredCount={filtered.length}
        currentPage={safePage}
        totalPages={totalPages}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel="kelas"
        onPageChange={setPage}
        onResetFilters={() => {
          setSearch('');
          setStatusFilter('all');
          setPage(1);
        }}
        emptyTitle="Belum ada kelas"
        emptyDescription="Tambahkan kelas baru untuk mulai membuka pendaftaran siswa."
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
                { value: 'aktif', label: 'Aktif' },
                { value: 'dibatalkan', label: 'Dibatalkan' },
              ]}
            />
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-2xs hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer"
            >
              Tambah Kelas
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
              className="sticky left-12 z-20 min-w-[200px] max-w-[260px] bg-slate-50 dark:bg-slate-800 p-0 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]"
            >
              <AdminSortHeader
                label="Nama Kelas"
                active={sort?.key === 'nama'}
                dir={sort?.dir}
                onClick={() => toggleSort('nama')}
              />
            </th>
            <th scope="col" className="p-0 whitespace-nowrap">
              <AdminSortHeader
                label="Mapel"
                active={sort?.key === 'mapel'}
                dir={sort?.dir}
                onClick={() => toggleSort('mapel')}
              />
            </th>
            <th scope="col" className="p-0 whitespace-nowrap">
              <AdminSortHeader
                label="Guru"
                active={sort?.key === 'guru'}
                dir={sort?.dir}
                onClick={() => toggleSort('guru')}
              />
            </th>
            <th scope="col" className="p-0 text-right whitespace-nowrap">
              <AdminSortHeader
                label="Kuota"
                align="right"
                active={sort?.key === 'kuota'}
                dir={sort?.dir}
                onClick={() => toggleSort('kuota')}
              />
            </th>
            <th scope="col" className="p-0 text-right whitespace-nowrap">
              <AdminSortHeader
                label="Biaya"
                align="right"
                active={sort?.key === 'biaya'}
                dir={sort?.dir}
                onClick={() => toggleSort('biaya')}
              />
            </th>
            <th scope="col" className="py-3 px-4 whitespace-nowrap">
              Jadwal
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
            <th
              scope="col"
              className="md:sticky md:right-0 md:z-20 py-3 px-4 text-right bg-slate-50 dark:bg-slate-800 md:border-l md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)]"
            >
              Aksi
            </th>
          </tr>
        }
        tbody={paginated.map((c, idx) => {
          const pct = Math.min(100, Math.round((c.kuotaTerisi / Math.max(c.kuotaMaksimum, 1)) * 100));
          return (
            <tr
              key={c.id}
              className="group/row border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td className="sticky left-0 z-10 w-12 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-400 tabular-nums text-xs">
                {(safePage - 1) * ITEMS_PER_PAGE + idx + 1}
              </td>
              <td className="sticky left-12 z-10 min-w-[200px] max-w-[260px] bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]">
                <Link
                  href={`/admin/classes/${c.id}`}
                  className="block truncate font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-700 dark:hover:text-blue-400"
                  title={c.nama}
                >
                  {c.nama}
                </Link>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {c.jenjang}
                  {c.tingkat ? ` · ${c.tingkat}` : ''}
                  {c.periodeNama ? ` · ${c.periodeNama}` : ''}
                </p>
              </td>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                {c.mapel}
              </td>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {c.guruNama}
              </td>
              <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {c.kuotaTerisi}/{c.kuotaMaksimum}
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  {pct}% terisi
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {rupiah(Number(c.biayaPeriode))}
                </span>
                {c.biayaDp ? (
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    DP {rupiah(Number(c.biayaDp))}
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 max-w-[220px]">
                <span className="line-clamp-2">{c.jadwalSummary || 'Belum ada jadwal'}</span>
              </td>
              <td className="px-4 py-3 text-center whitespace-nowrap">
                <Badge tone={c.status === 'aktif' ? 'emerald' : 'slate'}>
                  {c.status === 'aktif' ? 'Aktif' : 'Dibatalkan'}
                </Badge>
              </td>
              <td className="md:sticky md:right-0 md:z-10 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 md:border-l md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/classes/${c.id}`}
                    aria-label={`Lihat detail ${c.nama}`}
                    title="Lihat detail kelas"
                    className="grid size-8 place-items-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Eye className="size-4" aria-hidden="true" />
                  </Link>
                  <RowActionIconBtn
                    onClick={() => openEdit(c)}
                    ariaLabel={`Edit ${c.nama}`}
                    title="Edit kelas"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </RowActionIconBtn>
                  <RowActionIconBtn
                    onClick={() => setDeleting(c)}
                    ariaLabel={`Hapus ${c.nama}`}
                    title="Hapus kelas"
                    tone="danger"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </RowActionIconBtn>
                </div>
              </td>
            </tr>
          );
        })}
      />

      <AdminModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit Kelas: ${editing.nama}` : 'Tambah Kelas Baru'}
        subtitle="Lengkapi identitas kelas, pengajar, kuota, biaya, dan slot jadwal."
        maxWidthClass="sm:max-w-2xl"
      >
        <KelasForm
          key={editing?.id ?? 'new-class'}
          kelasId={editing?.id}
          guruOptions={guruOptions}
          periodeOptions={periodeOptions}
          defaults={
            editing
              ? {
                  nama: editing.nama,
                  mapel: editing.mapel,
                  guruId: editing.guruId,
                  periodeId: editing.periodeId,
                  jenjang: editing.jenjang,
                  tingkat: editing.tingkat ?? '',
                  ruangan: editing.ruangan ?? '',
                  kuotaMaksimum: editing.kuotaMaksimum,
                  kuotaMinimum: editing.kuotaMinimum,
                  biayaPeriode: editing.biayaPeriode,
                  biayaDp: editing.biayaDp ?? '',
                  tenorMaksimum: editing.tenorMaksimum ? String(editing.tenorMaksimum) : '',
                  status: editing.status,
                }
              : undefined
          }
          defaultJadwal={
            editing
              ? editing.jadwal.map((j) => ({
                  hari: j.hari,
                  jamMulai: j.jamMulai.slice(0, 5),
                  jamSelesai: j.jamSelesai.slice(0, 5),
                  tempat: j.tempat ?? '',
                }))
              : []
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
        title="Hapus Kelas"
        itemName={deleting?.nama ?? ''}
        onConfirm={async () => {
          if (!deleting) return { error: 'Data tidak valid.' };
          const res = await hapusKelasAction(deleting.id);
          if (res.ok) router.refresh();
          return res;
        }}
      />
    </div>
  );
}
