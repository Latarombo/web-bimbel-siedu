'use client';

import { useActionState, useMemo, useState } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { UnderlineTabs } from '@/components/ui/underline-tabs';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Field, Input, Select } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { saveJadwalAdmin, hapusJadwalAdmin, type AdminState } from '@/app/actions/admin';
import {
  AdminPageHeader,
  AdminTableShell,
  AdminSortHeader,
  AdminModal,
  AdminDeleteModal,
  RowActionIconBtn,
  type SortDir,
} from '@/components/admin/admin-table-kit';

const HARI_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'] as const;

export interface AdminScheduleRow {
  id: number;
  kelasId: number;
  kelasNama: string;
  kelasMapel: string;
  jenjang: string;
  guruNama: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  tempat: string;
  kuotaTerisi: number;
  kuotaMaksimum: number;
}

const initial: AdminState = {};
const ITEMS_PER_PAGE = 10;

function JadwalForm({
  jadwal,
  classOptions,
  onSuccess,
}: {
  jadwal: AdminScheduleRow | null;
  classOptions: { id: number; label: string }[];
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: AdminState, formData: FormData) => {
      const res = await saveJadwalAdmin(prev, formData);
      if (res.ok && !res.error) onSuccess();
      return res;
    },
    initial,
  );
  const err = (k: string) => state.fieldErrors?.[k];

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {jadwal ? <input type="hidden" name="jadwal_id" value={jadwal.id} /> : null}
      <Field label="Kelas" required error={err('kelas_id')}>
        <Select name="kelas_id" required defaultValue={jadwal?.kelasId ?? ''}>
          <option value="">— pilih kelas —</option>
          {classOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Hari" required error={err('hari')}>
          <Select name="hari" required defaultValue={jadwal?.hari ?? 'Senin'}>
            {HARI_LIST.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Jam Mulai" required error={err('jam_mulai')}>
          <Input type="time" name="jam_mulai" required defaultValue={jadwal?.jamMulai.slice(0, 5) ?? ''} />
        </Field>
        <Field label="Jam Selesai" required error={err('jam_selesai')}>
          <Input type="time" name="jam_selesai" required defaultValue={jadwal?.jamSelesai.slice(0, 5) ?? ''} />
        </Field>
      </div>
      <Field label="Tempat / Alamat" error={err('tempat')}>
        <Input
          name="tempat"
          maxLength={150}
          placeholder="cth. Ruang Galileo Lt. 2 / Jl. Merdeka No. 10"
          defaultValue={jadwal?.tempat ?? ''}
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

export function AdminScheduleView({
  schedules,
  classOptions,
}: {
  schedules: AdminScheduleRow[];
  classOptions: { id: number; label: string }[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [hariFilter, setHariFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{
    key: 'hari' | 'jamMulai' | 'jamSelesai' | 'tempat' | 'kelas';
    dir: SortDir;
  } | null>({ key: 'hari', dir: 'asc' });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminScheduleRow | null>(null);
  const [deleting, setDeleting] = useState<AdminScheduleRow | null>(null);

  const toggleSort = (key: 'hari' | 'jamMulai' | 'jamSelesai' | 'tempat' | 'kelas') => {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
      }
      return { key, dir: 'asc' };
    });
  };

  const filtered = useMemo(() => {
    let res = [...schedules];
    if (hariFilter !== 'all') {
      res = res.filter((s) => s.hari === hariFilter);
    }
    const q = search.toLowerCase().trim();
    if (q) {
      res = res.filter((s) =>
        `${s.hari} ${s.jamMulai} ${s.jamSelesai} ${s.tempat} ${s.kelasNama} ${s.kelasMapel} ${s.guruNama}`
          .toLowerCase()
          .includes(q),
      );
    }
    if (sort) {
      const { key, dir } = sort;
      res.sort((a, b) => {
        let cmp = 0;
        if (key === 'hari') {
          cmp =
            HARI_LIST.indexOf(a.hari as (typeof HARI_LIST)[number]) -
            HARI_LIST.indexOf(b.hari as (typeof HARI_LIST)[number]);
          if (cmp === 0) cmp = a.jamMulai.localeCompare(b.jamMulai);
        } else if (key === 'jamMulai') cmp = a.jamMulai.localeCompare(b.jamMulai);
        else if (key === 'jamSelesai') cmp = a.jamSelesai.localeCompare(b.jamSelesai);
        else if (key === 'tempat') cmp = a.tempat.localeCompare(b.tempat, 'id');
        else if (key === 'kelas') cmp = a.kelasNama.localeCompare(b.kelasNama, 'id');
        return dir === 'asc' ? cmp : -cmp;
      });
    }
    return res;
  }, [schedules, hariFilter, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const jadwalByHari = useMemo(() => {
    const map = new Map<string, AdminScheduleRow[]>();
    for (const h of HARI_LIST) map.set(h, []);
    for (const s of filtered) {
      const list = map.get(s.hari) ?? [];
      list.push(s);
      map.set(s.hari, list);
    }
    for (const h of HARI_LIST) {
      map.get(h)?.sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Jadwal Belajar"
        description="Kelola slot jadwal kelas, jam pertemuan, tempat pelaksanaan, dan matriks mingguan."
      />

      <UnderlineTabs
        tabs={[
          { id: 'table', label: 'Daftar Jadwal' },
          { id: 'grid', label: 'Matriks Mingguan' },
        ]}
        activeTab={activeTab}
        onChange={(val) => setActiveTab(val as 'table' | 'grid')}
        ariaLabel="Tampilan jadwal"
        layoutId="admin-schedule-tabs"
      />

      {activeTab === 'table' ? (
        <AdminTableShell
          searchQuery={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          searchPlaceholder="Cari hari, tempat, kelas, atau guru…"
          searchAriaLabel="Cari jadwal"
          tableAriaLabel="Tabel daftar jadwal"
          minWidthClass="min-w-[860px]"
          totalRawCount={schedules.length}
          filteredCount={filtered.length}
          currentPage={safePage}
          totalPages={totalPages}
          itemsPerPage={ITEMS_PER_PAGE}
          itemLabel="jadwal"
          onPageChange={setPage}
          onResetFilters={() => {
            setSearch('');
            setHariFilter('all');
            setPage(1);
          }}
          emptyTitle="Belum ada jadwal"
          emptyDescription="Tambahkan slot jadwal baru untuk kelas aktif."
          toolbarRight={
            <>
              <FilterDropdown
                value={hariFilter}
                onChange={(val) => {
                  setHariFilter(val);
                  setPage(1);
                }}
                size="sm"
                prefixLabel="Hari:"
                options={[
                  { value: 'all', label: 'Semua' },
                  ...HARI_LIST.map((h) => ({ value: h, label: h })),
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
                Tambah Jadwal
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
                className="sticky left-12 z-20 min-w-[130px] bg-slate-50 dark:bg-slate-800 p-0 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]"
              >
                <AdminSortHeader
                  label="Hari"
                  active={sort?.key === 'hari'}
                  dir={sort?.dir}
                  onClick={() => toggleSort('hari')}
                />
              </th>
              <th scope="col" className="p-0 text-right whitespace-nowrap">
                <AdminSortHeader
                  label="Jam Mulai"
                  align="right"
                  active={sort?.key === 'jamMulai'}
                  dir={sort?.dir}
                  onClick={() => toggleSort('jamMulai')}
                />
              </th>
              <th scope="col" className="p-0 text-right whitespace-nowrap">
                <AdminSortHeader
                  label="Jam Selesai"
                  align="right"
                  active={sort?.key === 'jamSelesai'}
                  dir={sort?.dir}
                  onClick={() => toggleSort('jamSelesai')}
                />
              </th>
              <th scope="col" className="p-0 whitespace-nowrap">
                <AdminSortHeader
                  label="Tempat / Alamat"
                  active={sort?.key === 'tempat'}
                  dir={sort?.dir}
                  onClick={() => toggleSort('tempat')}
                />
              </th>
              <th scope="col" className="p-0 whitespace-nowrap">
                <AdminSortHeader
                  label="Kelas & Pengajar"
                  active={sort?.key === 'kelas'}
                  dir={sort?.dir}
                  onClick={() => toggleSort('kelas')}
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
          tbody={paginated.map((s, idx) => (
            <tr
              key={s.id}
              className="group/row border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td className="sticky left-0 z-10 w-12 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-400 tabular-nums text-xs">
                {(safePage - 1) * ITEMS_PER_PAGE + idx + 1}
              </td>
              <td className="sticky left-12 z-10 min-w-[130px] bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)] font-semibold text-slate-900 dark:text-slate-100">
                {s.hari}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                {s.jamMulai.slice(0, 5)} WIB
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                {s.jamSelesai.slice(0, 5)} WIB
              </td>
              <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300 max-w-[240px]">
                <span className="line-clamp-2">{s.tempat || '—'}</span>
              </td>
              <td className="px-4 py-3 text-xs">
                <Link
                  href={`/admin/classes/${s.kelasId}`}
                  className="font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                >
                  {s.kelasNama}
                </Link>
                <p className="text-slate-500 dark:text-slate-400">
                  {s.guruNama} · {s.jenjang}
                </p>
              </td>
              <td className="md:sticky md:right-0 md:z-10 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 md:border-l md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-end gap-1">
                  <RowActionIconBtn
                    onClick={() => {
                      setEditing(s);
                      setFormOpen(true);
                    }}
                    ariaLabel={`Edit jadwal ${s.hari} ${s.jamMulai.slice(0, 5)}`}
                    title="Edit jadwal"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </RowActionIconBtn>
                  <RowActionIconBtn
                    onClick={() => setDeleting(s)}
                    ariaLabel={`Hapus jadwal ${s.hari} ${s.jamMulai.slice(0, 5)}`}
                    title="Hapus jadwal"
                    tone="danger"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </RowActionIconBtn>
                </div>
              </td>
            </tr>
          ))}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
          {HARI_LIST.map((hari) => {
            const list = jadwalByHari.get(hari) ?? [];
            return (
              <div
                key={hari}
                className="flex flex-col rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden"
              >
                <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 px-3 py-2.5 flex items-center justify-between">
                  <span className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                    {hari}
                  </span>
                  <span className="rounded-full bg-slate-200/80 dark:bg-slate-700 px-2 py-0.5 text-[11px] font-bold tabular-nums text-slate-700 dark:text-slate-300">
                    {list.length}
                  </span>
                </div>
                <div className="flex-1 p-2 space-y-2 min-h-[140px]">
                  {list.length > 0 ? (
                    list.map((j) => (
                      <Link
                        key={j.id}
                        href={`/admin/classes/${j.kelasId}`}
                        className="group block rounded-lg border border-slate-200/90 bg-white p-2.5 transition-all hover:border-blue-400 hover:shadow-2xs dark:border-slate-700/80 dark:bg-slate-800/80 dark:hover:border-blue-500"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold tabular-nums text-blue-700 dark:text-blue-400">
                            {j.jamMulai.slice(0, 5)} - {j.jamSelesai.slice(0, 5)}
                          </span>
                          <span className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 font-bold uppercase text-[10px] text-slate-700 dark:text-slate-300">
                            {j.jenjang}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-1">
                          {j.kelasNama}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {j.guruNama}
                        </p>
                        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px] text-slate-400 dark:border-slate-700/60 dark:text-slate-500">
                          <span className="truncate max-w-[110px]">{j.tempat || '—'}</span>
                          <span className="font-mono tabular-nums">
                            {j.kuotaTerisi}/{j.kuotaMaksimum}
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="flex h-full items-center justify-center py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                      Tidak ada sesi
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AdminModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit Jadwal: ${editing.hari}` : 'Tambah Jadwal Baru'}
        subtitle="Sistem memvalidasi jam mulai/selesai dan mencegah bentrok jadwal pengajar (BR#6)."
        maxWidthClass="sm:max-w-lg"
      >
        <JadwalForm
          key={editing?.id ?? 'new-schedule'}
          jadwal={editing}
          classOptions={classOptions}
          onSuccess={() => {
            setFormOpen(false);
            router.refresh();
          }}
        />
      </AdminModal>

      <AdminDeleteModal
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Hapus Jadwal"
        itemName={
          deleting
            ? `${deleting.hari} ${deleting.jamMulai.slice(0, 5)}–${deleting.jamSelesai.slice(0, 5)} (${deleting.kelasNama})`
            : ''
        }
        onConfirm={async () => {
          if (!deleting) return { error: 'Data tidak valid.' };
          const res = await hapusJadwalAdmin(deleting.id);
          if (res.ok) router.refresh();
          return res;
        }}
      />
    </div>
  );
}
