'use client';

import { useActionState, useMemo, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Field, Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { saveOrangTuaAdmin, hapusOrangTuaAdmin, type AdminState } from '@/app/actions/admin';
import {
  AdminPageHeader,
  AdminTableShell,
  AdminSortHeader,
  AdminModal,
  AdminDeleteModal,
  RowActionIconBtn,
  type SortDir,
} from '@/components/admin/admin-table-kit';

export interface ParentChildDetail {
  id: number;
  nama: string;
  tanggalLahirLabel: string;
  jenjang: string | null;
  tingkat: string | null;
  nomorTelepon: string | null;
  email: string | null;
  alamat: string | null;
  kelasAktif: string[];
}

export interface AdminParentRow {
  id: number;
  nama: string;
  nomorTelepon: string;
  email: string;
  alamat: string;
  emailVerified: boolean;
  createdAtLabel: string;
  anakList: ParentChildDetail[];
}

const initial: AdminState = {};
const ITEMS_PER_PAGE = 10;

function OrangTuaForm({
  parent,
  onSuccess,
}: {
  parent: AdminParentRow | null;
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: AdminState, formData: FormData) => {
      const res = await saveOrangTuaAdmin(prev, formData);
      if (res.ok && !res.error) onSuccess();
      return res;
    },
    initial,
  );
  const err = (k: string) => state.fieldErrors?.[k];

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {parent ? <input type="hidden" name="user_id" value={parent.id} /> : null}
      <Field label="Nama Orang Tua" required error={err('nama')}>
        <Input name="nama" required maxLength={100} defaultValue={parent?.nama ?? ''} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nomor Telepon" required error={err('nomor_telepon')}>
          <Input name="nomor_telepon" required maxLength={20} placeholder="08xxxxxxxxxx" defaultValue={parent?.nomorTelepon ?? ''} />
        </Field>
        <Field label="Email" required error={err('email')}>
          <Input type="email" name="email" required maxLength={255} defaultValue={parent?.email ?? ''} />
        </Field>
      </div>
      <Field label="Alamat Lengkap" error={err('alamat')}>
        <Input name="alamat" maxLength={500} placeholder="Jalan, RT/RW, Kelurahan, Kota" defaultValue={parent?.alamat ?? ''} />
      </Field>
      <Field
        label={parent ? 'Password baru (kosongkan bila tidak ganti)' : 'Password'}
        required={!parent}
        error={err('password')}
      >
        <Input
          type="password"
          name="password"
          minLength={8}
          maxLength={72}
          required={!parent}
          placeholder="Minimal 8 karakter"
        />
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

export function AdminParentsView({ parents }: { parents: AdminParentRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{
    key: 'nama' | 'telepon' | 'email' | 'alamat';
    dir: SortDir;
  } | null>({ key: 'nama', dir: 'asc' });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminParentRow | null>(null);
  const [detailRow, setDetailRow] = useState<AdminParentRow | null>(null);
  const [deleting, setDeleting] = useState<AdminParentRow | null>(null);

  const toggleSort = (key: 'nama' | 'telepon' | 'email' | 'alamat') => {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
      }
      return { key, dir: 'asc' };
    });
  };

  const filtered = useMemo(() => {
    let res = [...parents];
    const q = search.toLowerCase().trim();
    if (q) {
      res = res.filter((p) => {
        const anakNames = p.anakList.map((a) => a.nama).join(' ');
        return `${p.nama} ${p.nomorTelepon} ${p.email} ${p.alamat} ${anakNames}`
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
        else if (key === 'alamat') cmp = a.alamat.localeCompare(b.alamat, 'id');
        return dir === 'asc' ? cmp : -cmp;
      });
    }
    return res;
  }, [parents, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Data Orang Tua"
        description="Kelola akun wali murid, kontak darurat, alamat lengkap, dan profil anak terkait."
      />

      <AdminTableShell
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Cari nama orang tua, telepon, email, atau nama anak…"
        searchAriaLabel="Cari orang tua"
        tableAriaLabel="Tabel data orang tua"
        minWidthClass="min-w-[880px]"
        totalRawCount={parents.length}
        filteredCount={filtered.length}
        currentPage={safePage}
        totalPages={totalPages}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel="orang tua"
        onPageChange={setPage}
        onResetFilters={() => {
          setSearch('');
          setPage(1);
        }}
        emptyTitle="Belum ada data orang tua"
        emptyDescription="Tambahkan akun orang tua atau tunggu pendaftar baru."
        toolbarRight={
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-2xs hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer"
          >
            Tambah Orang Tua
          </button>
        }
        thead={
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <th scope="col" className="sticky left-0 z-20 w-12 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-center">
              No
            </th>
            <th
              scope="col"
              className="sticky left-12 z-20 min-w-[185px] max-w-[240px] bg-slate-50 dark:bg-slate-800 p-0 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]"
            >
              <AdminSortHeader
                label="Nama Orang Tua"
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
                label="Alamat Lengkap"
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
        tbody={paginated.map((p, idx) => {
          const initialChar = (p.nama?.[0] || 'O').toUpperCase();
          return (
            <tr
              key={p.id}
              className="group/row border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td className="sticky left-0 z-10 w-12 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-400 tabular-nums text-xs">
                {(safePage - 1) * ITEMS_PER_PAGE + idx + 1}
              </td>
              <td className="sticky left-12 z-10 min-w-[185px] max-w-[240px] bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                    {initialChar}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailRow(p)}
                    className="truncate font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-700 dark:hover:text-blue-400 text-left cursor-pointer"
                    title={p.nama}
                  >
                    {p.nama}
                  </button>
                </div>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {p.nomorTelepon || '—'}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {p.email}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 max-w-[280px]">
                <span className="line-clamp-2">{p.alamat || '—'}</span>
              </td>
              <td className="md:sticky md:right-0 md:z-10 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 md:border-l md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-end gap-1">
                  <RowActionIconBtn
                    onClick={() => setDetailRow(p)}
                    ariaLabel={`Lihat detail orang tua dan anak ${p.nama}`}
                    title="Lihat detail orang tua & anak"
                  >
                    <Eye className="size-4" aria-hidden="true" />
                  </RowActionIconBtn>
                  <RowActionIconBtn
                    onClick={() => {
                      setEditing(p);
                      setFormOpen(true);
                    }}
                    ariaLabel={`Edit orang tua ${p.nama}`}
                    title="Edit orang tua"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </RowActionIconBtn>
                  <RowActionIconBtn
                    onClick={() => setDeleting(p)}
                    ariaLabel={`Hapus orang tua ${p.nama}`}
                    title="Hapus orang tua"
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
        title={editing ? `Edit Orang Tua: ${editing.nama}` : 'Tambah Orang Tua Baru'}
        subtitle="Kelola informasi kontak dan alamat wali murid."
        maxWidthClass="sm:max-w-lg"
      >
        <OrangTuaForm
          key={editing?.id ?? 'new-parent'}
          parent={editing}
          onSuccess={() => {
            setFormOpen(false);
            router.refresh();
          }}
        />
      </AdminModal>

      <AdminModal
        isOpen={Boolean(detailRow)}
        onClose={() => setDetailRow(null)}
        title={detailRow ? `Detail Orang Tua: ${detailRow.nama}` : 'Detail Orang Tua'}
        subtitle="Profil lengkap wali murid beserta daftar anak yang terdaftar."
        maxWidthClass="sm:max-w-2xl"
      >
        {detailRow ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-700/60">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Data Orang Tua
                </h3>
                <Badge tone={detailRow.emailVerified ? 'emerald' : 'amber'}>
                  {detailRow.emailVerified ? 'Email Terverifikasi' : 'Belum Verifikasi'}
                </Badge>
              </div>
              <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Nama Lengkap</dt>
                  <dd className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">{detailRow.nama}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Nomor Telepon</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums text-slate-900 dark:text-slate-100">{detailRow.nomorTelepon || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Email</dt>
                  <dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">{detailRow.email}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Tanggal Bergabung</dt>
                  <dd className="mt-0.5 tabular-nums text-slate-800 dark:text-slate-200">{detailRow.createdAtLabel}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-500 dark:text-slate-400">Alamat Lengkap</dt>
                  <dd className="mt-0.5 text-slate-800 dark:text-slate-200">{detailRow.alamat || '—'}</dd>
                </div>
              </dl>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Data Anak ({detailRow.anakList.length})
              </h3>
              {detailRow.anakList.length > 0 ? (
                <div className="space-y-2.5">
                  {detailRow.anakList.map((anak) => (
                    <div
                      key={anak.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{anak.nama}</p>
                        <Badge tone="brand">
                          {anak.jenjang ?? '—'}
                          {anak.tingkat ? ` · ${anak.tingkat}` : ''}
                        </Badge>
                      </div>
                      <dl className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 text-slate-600 dark:text-slate-300">
                        <div>
                          <dt className="text-[11px] text-slate-400">Tanggal Lahir</dt>
                          <dd className="tabular-nums">{anak.tanggalLahirLabel}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] text-slate-400">Nomor Telepon</dt>
                          <dd className="tabular-nums">{anak.nomorTelepon || detailRow.nomorTelepon || '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] text-slate-400">Email</dt>
                          <dd>{anak.email || detailRow.email || '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] text-slate-400">Alamat</dt>
                          <dd>{anak.alamat || detailRow.alamat || '—'}</dd>
                        </div>
                      </dl>
                      {anak.kelasAktif.length > 0 ? (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[11px] text-slate-400">Kelas terdaftar: </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {anak.kelasAktif.join(', ')}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  Belum ada data anak yang terdaftar pada akun ini.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </AdminModal>

      <AdminDeleteModal
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Hapus Akun Orang Tua"
        itemName={deleting?.nama ?? ''}
        onConfirm={async () => {
          if (!deleting) return { error: 'Data tidak valid.' };
          const res = await hapusOrangTuaAdmin(deleting.id);
          if (res.ok) router.refresh();
          return res;
        }}
      />
    </div>
  );
}
