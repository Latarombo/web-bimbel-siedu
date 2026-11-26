'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { Eye, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { rupiah } from '@/lib/format/format';
import { konfirmasiPembayaranManualAdmin } from '@/app/actions/admin';
import {
  AdminPageHeader,
  AdminTableShell,
  AdminSortHeader,
  AdminModal,
  RowActionIconBtn,
  type SortDir,
} from '@/components/admin/admin-table-kit';

export interface AdminPaymentRow {
  id: number;
  pendaftaranId: number;
  orangTuaNama: string;
  anakNama: string;
  kelasNama: string;
  metodeBayar: 'lunas' | 'dp_cicilan';
  hargaKelas: number;
  nominalPembayaran: number;
  nominalMasukTotal: number;
  status: 'pending' | 'berhasil' | 'gagal';
  dibayarPada: string | null;
  dibayarPadaLabel: string;
  tipe: 'dp' | 'cicilan' | 'lunas';
  cicilanKe: number | null;
  cicilanLabel: string;
  jatuhTempo: string | null;
  jatuhTempoLabel: string;
}

const ITEMS_PER_PAGE = 10;

export function AdminPaymentsView({ payments }: { payments: AdminPaymentRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{
    key: 'orangTua' | 'kelas' | 'harga' | 'pembayaran' | 'total' | 'status' | 'dibayarPada' | 'jatuhTempo';
    dir: SortDir;
  } | null>({ key: 'dibayarPada', dir: 'desc' });

  const [confirming, setConfirming] = useState<AdminPaymentRow | null>(null);
  const [catatan, setCatatan] = useState('');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleSort = (
    key: 'orangTua' | 'kelas' | 'harga' | 'pembayaran' | 'total' | 'status' | 'dibayarPada' | 'jatuhTempo',
  ) => {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
      }
      return { key, dir: 'asc' };
    });
  };

  const filtered = useMemo(() => {
    let res = [...payments];
    if (statusFilter !== 'all') {
      res = res.filter((p) => p.status === statusFilter);
    }
    const q = search.toLowerCase().trim();
    if (q) {
      res = res.filter((p) =>
        `${p.orangTuaNama} ${p.anakNama} ${p.kelasNama} ${p.cicilanLabel} ${p.status}`
          .toLowerCase()
          .includes(q),
      );
    }
    if (sort) {
      const { key, dir } = sort;
      res.sort((a, b) => {
        let cmp = 0;
        if (key === 'orangTua') cmp = a.orangTuaNama.localeCompare(b.orangTuaNama, 'id');
        else if (key === 'kelas') cmp = a.kelasNama.localeCompare(b.kelasNama, 'id');
        else if (key === 'harga') cmp = a.hargaKelas - b.hargaKelas;
        else if (key === 'pembayaran') cmp = a.nominalPembayaran - b.nominalPembayaran;
        else if (key === 'total') cmp = a.nominalMasukTotal - b.nominalMasukTotal;
        else if (key === 'status') cmp = a.status.localeCompare(b.status, 'id');
        else if (key === 'dibayarPada') {
          cmp = (a.dibayarPada ?? '').localeCompare(b.dibayarPada ?? '');
        } else if (key === 'jatuhTempo') {
          cmp = (a.jatuhTempo ?? '9999').localeCompare(b.jatuhTempo ?? '9999');
        }
        return dir === 'asc' ? cmp : -cmp;
      });
    }
    return res;
  }, [payments, statusFilter, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const handleManualConfirm = () => {
    if (!confirming) return;
    setConfirmError(null);
    startTransition(async () => {
      const res = await konfirmasiPembayaranManualAdmin(
        confirming.id,
        catatan.trim() || `Pembayaran manual ${confirming.cicilanLabel} diterima admin`,
      );
      if (res?.error) {
        setConfirmError(res.error);
      } else {
        setConfirming(null);
        setCatatan('');
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Daftar Pembayaran"
        description="Pantau seluruh tagihan pendaftaran, rincian cicilan, nominal masuk, dan konfirmasi pembayaran."
      />

      <AdminTableShell
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Cari nama orang tua, siswa, atau kelas…"
        searchAriaLabel="Cari pembayaran"
        tableAriaLabel="Tabel daftar pembayaran"
        minWidthClass="min-w-[1260px]"
        totalRawCount={payments.length}
        filteredCount={filtered.length}
        currentPage={safePage}
        totalPages={totalPages}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel="pembayaran"
        onPageChange={setPage}
        onResetFilters={() => {
          setSearch('');
          setStatusFilter('all');
          setPage(1);
        }}
        emptyTitle="Belum ada transaksi pembayaran"
        emptyDescription="Tagihan pembayaran pendaftaran siswa akan tampil di sini."
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
              { value: 'berhasil', label: 'Berhasil' },
              { value: 'pending', label: 'Pending' },
              { value: 'gagal', label: 'Gagal' },
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
                label="Kelas"
                active={sort?.key === 'kelas'}
                dir={sort?.dir}
                onClick={() => toggleSort('kelas')}
              />
            </th>
            <th scope="col" className="py-3 px-4 text-center whitespace-nowrap">
              Metode Bayar
            </th>
            <th scope="col" className="p-0 text-right whitespace-nowrap">
              <AdminSortHeader
                label="Harga Kelas"
                align="right"
                active={sort?.key === 'harga'}
                dir={sort?.dir}
                onClick={() => toggleSort('harga')}
              />
            </th>
            <th scope="col" className="p-0 text-right whitespace-nowrap">
              <AdminSortHeader
                label="Pembayaran"
                align="right"
                active={sort?.key === 'pembayaran'}
                dir={sort?.dir}
                onClick={() => toggleSort('pembayaran')}
              />
            </th>
            <th scope="col" className="p-0 text-right whitespace-nowrap">
              <AdminSortHeader
                label="Nominal Masuk / Total"
                align="right"
                active={sort?.key === 'total'}
                dir={sort?.dir}
                onClick={() => toggleSort('total')}
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
                label="Tanggal Dibayar"
                align="right"
                active={sort?.key === 'dibayarPada'}
                dir={sort?.dir}
                onClick={() => toggleSort('dibayarPada')}
              />
            </th>
            <th scope="col" className="py-3 px-4 text-center whitespace-nowrap">
              Cicilan Ke
            </th>
            <th scope="col" className="p-0 text-right whitespace-nowrap">
              <AdminSortHeader
                label="Jatuh Tempo"
                align="right"
                active={sort?.key === 'jatuhTempo'}
                dir={sort?.dir}
                onClick={() => toggleSort('jatuhTempo')}
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
          const tone =
            p.status === 'berhasil'
              ? 'emerald'
              : p.status === 'pending'
                ? 'amber'
                : 'red';
          const statusLabel =
            p.status === 'berhasil'
              ? 'Berhasil'
              : p.status === 'pending'
                ? 'Pending'
                : 'Gagal';

          return (
            <tr
              key={p.id}
              className="group/row border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td className="sticky left-0 z-10 w-12 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-400 tabular-nums text-xs">
                {(safePage - 1) * ITEMS_PER_PAGE + idx + 1}
              </td>
              <td className="sticky left-12 z-10 min-w-[175px] max-w-[230px] bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]">
                <p className="truncate font-semibold text-slate-900 dark:text-slate-100" title={p.orangTuaNama}>
                  {p.orangTuaNama}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Siswa: {p.anakNama}
                </p>
              </td>
              <td className="px-4 py-3 text-xs font-medium text-slate-800 dark:text-slate-200">
                {p.kelasNama}
              </td>
              <td className="px-4 py-3 text-center text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {p.metodeBayar === 'dp_cicilan' ? 'DP + Cicilan' : 'Lunas'}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {rupiah(p.hargaKelas)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-xs font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {rupiah(p.nominalPembayaran)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                {rupiah(p.nominalMasukTotal)}
              </td>
              <td className="px-4 py-3 text-center whitespace-nowrap">
                <Badge tone={tone}>{statusLabel}</Badge>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {p.dibayarPadaLabel}
              </td>
              <td className="px-4 py-3 text-center text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {p.cicilanLabel}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {p.jatuhTempoLabel}
              </td>
              <td className="md:sticky md:right-0 md:z-10 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 md:border-l md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/enrollments/${p.pendaftaranId}`}
                    aria-label={`Lihat detail pendaftaran ${p.anakNama}`}
                    title="Lihat detail pendaftaran"
                    className="grid size-8 place-items-center rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/40 transition-colors"
                  >
                    <Eye className="size-4" aria-hidden="true" />
                  </Link>
                  {p.status === 'pending' ? (
                    <RowActionIconBtn
                      onClick={() => {
                        setCatatan('');
                        setConfirmError(null);
                        setConfirming(p);
                      }}
                      ariaLabel={`Konfirmasi pembayaran manual ${p.anakNama}`}
                      title="Konfirmasi pembayaran manual"
                      tone="success"
                    >
                      <Check className="size-4" aria-hidden="true" />
                    </RowActionIconBtn>
                  ) : null}
                </div>
              </td>
            </tr>
          );
        })}
      />

      <AdminModal
        isOpen={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        title="Konfirmasi Pembayaran Manual"
        subtitle={
          confirming
            ? `${confirming.orangTuaNama} · ${confirming.cicilanLabel} (${rupiah(confirming.nominalPembayaran)})`
            : undefined
        }
        maxWidthClass="sm:max-w-md"
      >
        {confirming ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Konfirmasi penerimaan pembayaran tunai/transfer langsung untuk siswa{' '}
              <strong>{confirming.anakNama}</strong> di kelas{' '}
              <strong>{confirming.kelasNama}</strong>.
            </p>
            {confirmError ? (
              <div
                role="alert"
                className="rounded-lg bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs text-rose-700 dark:text-rose-300"
              >
                {confirmError}
              </div>
            ) : null}
            <div>
              <label
                htmlFor="manual-payment-note"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Catatan Penerimaan (Opsional)
              </label>
              <textarea
                id="manual-payment-note"
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Diterima tunai di kantor bimbel"
                className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                disabled={isPending}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleManualConfirm}
                disabled={isPending}
                className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? 'Memproses…' : 'Konfirmasi Lunas'}
              </button>
            </div>
          </div>
        ) : null}
      </AdminModal>
    </div>
  );
}
