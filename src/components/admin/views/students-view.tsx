'use client';

import { useActionState, useMemo, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Field, Input, Select } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { saveAnakAdmin, hapusAnakAdmin, type AdminState } from '@/app/actions/admin';
import {
  AdminPageHeader,
  AdminTableShell,
  AdminSortHeader,
  AdminModal,
  AdminDeleteModal,
  RowActionIconBtn,
  type SortDir,
} from '@/components/admin/admin-table-kit';

export interface AdminStudentRow {
  id: number;
  orangTuaId: number;
  nama: string;
  orangTuaNama: string;
  jenjang: string;
  nomorTelepon: string;
  email: string;
  alamat: string;
  tanggalLahir: string;
  tanggalLahirLabel: string;
  tingkat: string;
  parentFallbackEmail: string;
  parentFallbackAlamat: string;
}

const initial: AdminState = {};
const ITEMS_PER_PAGE = 10;

function AnakForm({
  student,
  parentOptions,
  onSuccess,
}: {
  student: AdminStudentRow | null;
  parentOptions: { id: number; nama: string; telepon: string }[];
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: AdminState, formData: FormData) => {
      const res = await saveAnakAdmin(prev, formData);
      if (res.ok && !res.error) onSuccess();
      return res;
    },
    initial,
  );
  const err = (k: string) => state.fieldErrors?.[k];

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {student ? <input type="hidden" name="anak_id" value={student.id} /> : null}
      <Field label="Orang Tua / Wali" required error={err('orang_tua_id')}>
        <Select name="orang_tua_id" required defaultValue={student?.orangTuaId ?? ''}>
          <option value="">— pilih orang tua —</option>
          {parentOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nama} ({o.telepon})
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama Anak" required error={err('nama')}>
          <Input name="nama" required maxLength={100} defaultValue={student?.nama ?? ''} />
        </Field>
        <Field label="Tanggal Lahir" required error={err('tanggal_lahir')}>
          <Input type="date" name="tanggal_lahir" required defaultValue={student?.tanggalLahir ?? ''} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jenjang" required error={err('jenjang_terakhir')}>
          <Select name="jenjang_terakhir" required defaultValue={student?.jenjang || 'SD'}>
            <option value="TK">TK</option>
            <option value="SD">SD</option>
            <option value="SMP">SMP</option>
            <option value="SMA">SMA</option>
          </Select>
        </Field>
        <Field label="Tingkat / Kelas" error={err('tingkat')}>
          <Input name="tingkat" maxLength={30} placeholder="cth. Kelas 6" defaultValue={student?.tingkat ?? ''} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nomor Telepon" error={err('nomor_telepon')}>
          <Input name="nomor_telepon" maxLength={20} placeholder="08xxxxxxxxxx (opsional)" defaultValue={student?.nomorTelepon ?? ''} />
        </Field>
        <Field label="Email" error={err('email')}>
          <Input type="email" name="email" maxLength={255} placeholder="Email anak (opsional)" defaultValue={student?.email ?? ''} />
        </Field>
      </div>
      <Field label="Alamat" error={err('alamat')}>
        <Input name="alamat" maxLength={500} placeholder="Alamat anak (opsional)" defaultValue={student?.alamat ?? ''} />
      </Field>
      {state.error ? (
        <p className="rounded-lg bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs text-rose-700 dark:text-rose-300" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Menyimpan…' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
}

export function AdminStudentsView({
  students,
  parentOptions,
}: {
  students: AdminStudentRow[];
  parentOptions: { id: number; nama: string; telepon: string }[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [jenjangFilter, setJenjangFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{
    key: 'nama' | 'orangTua' | 'jenjang' | 'tanggalLahir' | 'tingkat';
    dir: SortDir;
  } | null>({ key: 'nama', dir: 'asc' });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminStudentRow | null>(null);
  const [deleting, setDeleting] = useState<AdminStudentRow | null>(null);

  const toggleSort = (
    key: 'nama' | 'orangTua' | 'jenjang' | 'tanggalLahir' | 'tingkat',
  ) => {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
      }
      return { key, dir: 'asc' };
    });
  };

  const filtered = useMemo(() => {
    let res = [...students];
    if (jenjangFilter !== 'all') {
      res = res.filter((s) => s.jenjang === jenjangFilter);
    }
    const q = search.toLowerCase().trim();
    if (q) {
      res = res.filter((s) =>
        `${s.nama} ${s.orangTuaNama} ${s.jenjang} ${s.tingkat} ${s.nomorTelepon} ${s.email} ${s.alamat}`
          .toLowerCase()
          .includes(q),
      );
    }
    if (sort) {
      const { key, dir } = sort;
      res.sort((a, b) => {
        let cmp = 0;
        if (key === 'nama') cmp = a.nama.localeCompare(b.nama, 'id');
        else if (key === 'orangTua') cmp = a.orangTuaNama.localeCompare(b.orangTuaNama, 'id');
        else if (key === 'jenjang') cmp = a.jenjang.localeCompare(b.jenjang, 'id');
        else if (key === 'tanggalLahir') cmp = a.tanggalLahir.localeCompare(b.tanggalLahir);
        else if (key === 'tingkat') cmp = a.tingkat.localeCompare(b.tingkat, 'id');
        return dir === 'asc' ? cmp : -cmp;
      });
    }
    return res;
  }, [students, jenjangFilter, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Data Anak / Siswa"
        description="Kelola profil lengkap siswa, jenjang pendidikan, kontak, dan orang tua terkait."
      />

      <AdminTableShell
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Cari nama anak, orang tua, email, atau tingkat…"
        searchAriaLabel="Cari anak"
        tableAriaLabel="Tabel data anak"
        minWidthClass="min-w-[1140px]"
        totalRawCount={students.length}
        filteredCount={filtered.length}
        currentPage={safePage}
        totalPages={totalPages}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel="anak"
        onPageChange={setPage}
        onResetFilters={() => {
          setSearch('');
          setJenjangFilter('all');
          setPage(1);
        }}
        emptyTitle="Belum ada data anak"
        emptyDescription="Tambahkan data anak baru untuk mendaftarkan siswa ke kelas."
        toolbarRight={
          <>
            <FilterDropdown
              value={jenjangFilter}
              onChange={(val) => {
                setJenjangFilter(val);
                setPage(1);
              }}
              size="sm"
              prefixLabel="Jenjang:"
              options={[
                { value: 'all', label: 'Semua' },
                { value: 'TK', label: 'TK' },
                { value: 'SD', label: 'SD' },
                { value: 'SMP', label: 'SMP' },
                { value: 'SMA', label: 'SMA' },
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
              Tambah Anak
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
              className="sticky left-12 z-20 min-w-[175px] max-w-[230px] bg-slate-50 dark:bg-slate-800 p-0 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]"
            >
              <AdminSortHeader
                label="Nama Anak"
                active={sort?.key === 'nama'}
                dir={sort?.dir}
                onClick={() => toggleSort('nama')}
              />
            </th>
            <th scope="col" className="p-0 whitespace-nowrap">
              <AdminSortHeader
                label="Nama Orang Tua"
                active={sort?.key === 'orangTua'}
                dir={sort?.dir}
                onClick={() => toggleSort('orangTua')}
              />
            </th>
            <th scope="col" className="p-0 text-center whitespace-nowrap">
              <AdminSortHeader
                label="Jenjang"
                align="center"
                active={sort?.key === 'jenjang'}
                dir={sort?.dir}
                onClick={() => toggleSort('jenjang')}
              />
            </th>
            <th scope="col" className="py-3 px-4 text-right whitespace-nowrap">
              Nomor Telepon
            </th>
            <th scope="col" className="py-3 px-4 whitespace-nowrap">
              Email
            </th>
            <th scope="col" className="py-3 px-4 whitespace-nowrap">
              Alamat
            </th>
            <th scope="col" className="p-0 text-right whitespace-nowrap">
              <AdminSortHeader
                label="Tanggal Lahir"
                align="right"
                active={sort?.key === 'tanggalLahir'}
                dir={sort?.dir}
                onClick={() => toggleSort('tanggalLahir')}
              />
            </th>
            <th scope="col" className="p-0 whitespace-nowrap">
              <AdminSortHeader
                label="Tingkat / Kelas"
                active={sort?.key === 'tingkat'}
                dir={sort?.dir}
                onClick={() => toggleSort('tingkat')}
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
        tbody={paginated.map((s, idx) => {
          const initialChar = (s.nama?.[0] || 'S').toUpperCase();
          const emailDisplay = s.email || s.parentFallbackEmail;
          const alamatDisplay = s.alamat || s.parentFallbackAlamat;
          return (
            <tr
              key={s.id}
              className="group/row border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td className="sticky left-0 z-10 w-12 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-400 tabular-nums text-xs">
                {(safePage - 1) * ITEMS_PER_PAGE + idx + 1}
              </td>
              <td className="sticky left-12 z-10 min-w-[175px] max-w-[230px] bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                    {initialChar}
                  </div>
                  <span className="truncate font-semibold text-slate-900 dark:text-slate-100" title={s.nama}>
                    {s.nama}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                {s.orangTuaNama}
              </td>
              <td className="px-4 py-3 text-center whitespace-nowrap">
                <Badge tone="slate">{s.jenjang || '—'}</Badge>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {s.nomorTelepon || '—'}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {emailDisplay ? (
                  <span>
                    {emailDisplay}
                    {!s.email ? (
                      <span className="ml-1 text-[10px] text-slate-400">(wali)</span>
                    ) : null}
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 max-w-[220px]">
                <span className="line-clamp-2">
                  {alamatDisplay || '—'}
                  {!s.alamat && alamatDisplay ? (
                    <span className="ml-1 text-[10px] text-slate-400">(wali)</span>
                  ) : null}
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {s.tanggalLahirLabel}
              </td>
              <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {s.tingkat || '—'}
              </td>
              <td className="md:sticky md:right-0 md:z-10 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 md:border-l md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-end gap-1">
                  <RowActionIconBtn
                    onClick={() => {
                      setEditing(s);
                      setFormOpen(true);
                    }}
                    ariaLabel={`Edit anak ${s.nama}`}
                    title="Edit anak"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </RowActionIconBtn>
                  <RowActionIconBtn
                    onClick={() => setDeleting(s)}
                    ariaLabel={`Hapus anak ${s.nama}`}
                    title="Hapus anak"
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
        title={editing ? `Edit Anak: ${editing.nama}` : 'Tambah Anak Baru'}
        subtitle="Lengkapi identitas anak, orang tua, jenjang, kontak, dan alamat."
        maxWidthClass="sm:max-w-lg"
      >
        <AnakForm
          key={editing?.id ?? 'new-student'}
          student={editing}
          parentOptions={parentOptions}
          onSuccess={() => {
            setFormOpen(false);
            router.refresh();
          }}
        />
      </AdminModal>

      <AdminDeleteModal
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Hapus Data Anak"
        itemName={deleting?.nama ?? ''}
        onConfirm={async () => {
          if (!deleting) return { error: 'Data tidak valid.' };
          const res = await hapusAnakAdmin(deleting.id);
          if (res.ok) router.refresh();
          return res;
        }}
      />
    </div>
  );
}
