'use client';

import { useMemo, useState } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { hapusGuruAction } from '@/app/actions/admin';
import GuruForm from '@/components/admin/guru-form';
import {
  AdminPageHeader,
  AdminTableShell,
  AdminSortHeader,
  AdminModal,
  AdminDeleteModal,
  RowActionIconBtn,
  type SortDir,
} from '@/components/admin/admin-table-kit';

export interface AdminTeacherRow {
  id: number;
  nama: string;
  nomorTelepon: string;
  email: string;
  alamat: string;
  kelasList: { id: number; nama: string }[];
}

const ITEMS_PER_PAGE = 10;

export function AdminTeachersView({ teachers }: { teachers: AdminTeacherRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{
    key: 'nama' | 'telepon' | 'email' | 'kelas' | 'alamat';
    dir: SortDir;
  } | null>({ key: 'nama', dir: 'asc' });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTeacherRow | null>(null);
  const [deleting, setDeleting] = useState<AdminTeacherRow | null>(null);

  const toggleSort = (key: 'nama' | 'telepon' | 'email' | 'kelas' | 'alamat') => {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
      }
      return { key, dir: 'asc' };
    });
  };

  const filtered = useMemo(() => {
    let res = [...teachers];
    const q = search.toLowerCase().trim();
    if (q) {
      res = res.filter((g) => {
        const kelasText = g.kelasList.map((k) => k.nama).join(' ');
        return `${g.nama} ${g.nomorTelepon} ${g.email} ${g.alamat} ${kelasText}`
          .toLowerCase()
          .includes(q);
      });
    }
    if (sort) {
      const { key, dir } = sort;
      res.sort((a, b) => {
        let cmp = 0;
        if (key === 'nama') cmp = a.nama.localeCompare(b.nama, 'id');
        else if (key === 'telepon') cmp = a.nomorTelepon.localeCompare(b.nomorTelepon, 'id');
        else if (key === 'email') cmp = a.email.localeCompare(b.email, 'id');
        else if (key === 'kelas') cmp = a.kelasList.length - b.kelasList.length;
        else if (key === 'alamat') cmp = a.alamat.localeCompare(b.alamat, 'id');
        return dir === 'asc' ? cmp : -cmp;
      });
    }
    return res;
  }, [teachers, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Daftar Guru"
        description="Kelola akun pengajar, kontak, alamat, dan kelas yang diampu."
      />

      <AdminTableShell
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Cari nama guru, telepon, email, atau kelas…"
        searchAriaLabel="Cari guru"
        tableAriaLabel="Tabel daftar guru"
        minWidthClass="min-w-[920px]"
        totalRawCount={teachers.length}
        filteredCount={filtered.length}
        currentPage={safePage}
        totalPages={totalPages}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel="guru"
        onPageChange={setPage}
        onResetFilters={() => {
          setSearch('');
          setPage(1);
        }}
        emptyTitle="Belum ada data guru"
        emptyDescription="Tambahkan akun guru untuk menugaskan pengajar di kelas."
        toolbarRight={
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-2xs hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer"
          >
            Tambah Guru
          </button>
        }
        thead={
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <th scope="col" className="sticky left-0 z-20 w-12 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-center">
              No
            </th>
            <th
              scope="col"
              className="sticky left-12 z-20 min-w-[180px] max-w-[240px] bg-slate-50 dark:bg-slate-800 p-0 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]"
            >
              <AdminSortHeader
                label="Nama Guru"
                active={sort?.key === 'nama'}
                dir={sort?.dir}
                onClick={() => toggleSort('nama')}
              />
            </th>
            <th scope="col" className="p-0 text-right whitespace-nowrap">
              <AdminSortHeader
                label="Nomor Telepon"
                align="right"
                active={sort?.key === 'telepon'}
                dir={sort?.dir}
                onClick={() => toggleSort('telepon')}
              />
            </th>
            <th scope="col" className="p-0 whitespace-nowrap">
              <AdminSortHeader
                label="Email"
                active={sort?.key === 'email'}
                dir={sort?.dir}
                onClick={() => toggleSort('email')}
              />
            </th>
            <th scope="col" className="p-0 whitespace-nowrap">
              <AdminSortHeader
                label="Kelas yang Diampu"
                active={sort?.key === 'kelas'}
                dir={sort?.dir}
                onClick={() => toggleSort('kelas')}
              />
            </th>
            <th scope="col" className="p-0 whitespace-nowrap">
              <AdminSortHeader
                label="Alamat"
                active={sort?.key === 'alamat'}
                dir={sort?.dir}
                onClick={() => toggleSort('alamat')}
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
        tbody={paginated.map((g, idx) => {
          const initial = (g.nama?.[0] || 'G').toUpperCase();
          return (
            <tr
              key={g.id}
              className="group/row border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td className="sticky left-0 z-10 w-12 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-400 tabular-nums text-xs">
                {(safePage - 1) * ITEMS_PER_PAGE + idx + 1}
              </td>
              <td className="sticky left-12 z-10 min-w-[180px] max-w-[240px] bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                    {initial}
                  </div>
                  <span className="truncate font-semibold text-slate-900 dark:text-slate-100" title={g.nama}>
                    {g.nama}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {g.nomorTelepon || '—'}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {g.email}
              </td>
              <td className="px-4 py-3 text-xs max-w-[240px]">
                {g.kelasList.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {g.kelasList.map((k) => (
                      <Link
                        key={k.id}
                        href={`/admin/classes/${k.id}`}
                        className="inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/50 dark:hover:text-blue-300 transition-colors truncate max-w-[180px]"
                        title={k.nama}
                      >
                        {k.nama}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">Belum ada kelas</span>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 max-w-[220px]">
                <span className="line-clamp-2">{g.alamat || '—'}</span>
              </td>
              <td className="md:sticky md:right-0 md:z-10 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 md:border-l md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-end gap-1">
                  <RowActionIconBtn
                    onClick={() => {
                      setEditing(g);
                      setFormOpen(true);
                    }}
                    ariaLabel={`Edit guru ${g.nama}`}
                    title="Edit guru"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </RowActionIconBtn>
                  <RowActionIconBtn
                    onClick={() => setDeleting(g)}
                    ariaLabel={`Hapus guru ${g.nama}`}
                    title="Hapus guru"
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
        title={editing ? `Edit Guru: ${editing.nama}` : 'Tambah Guru Baru'}
        subtitle="Lengkapi identitas, kontak, dan alamat pengajar."
        maxWidthClass="sm:max-w-lg"
      >
        <GuruForm
          key={editing?.id ?? 'new-teacher'}
          guruId={editing?.id}
          defaults={
            editing
              ? {
                  nama: editing.nama,
                  email: editing.email,
                  alamat: editing.alamat,
                  nomorTelepon: editing.nomorTelepon,
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
        title="Hapus Akun Guru"
        itemName={deleting?.nama ?? ''}
        onConfirm={async () => {
          if (!deleting) return { error: 'Data tidak valid.' };
          const res = await hapusGuruAction(deleting.id);
          if (res.ok) router.refresh();
          return res;
        }}
      />
    </div>
  );
}
