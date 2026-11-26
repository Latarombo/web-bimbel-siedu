'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { AdminPageHeader } from '@/components/admin/admin-table-kit';
import { ConfirmAction } from '@/components/admin/confirm-action';
import { hapusPesan, ubahStatusPesan } from '@/app/actions/admin';

export interface AdminMessageRow {
  id: number;
  nama: string;
  email: string;
  telepon: string | null;
  jenjang: string | null;
  sekolah: string | null;
  subjek: string;
  pesan: string;
  status: 'baru' | 'diproses' | 'selesai';
  createdAt: string;
  createdAtLabel: string;
}

const STATUS_TONE = {
  baru: 'amber',
  diproses: 'brand',
  selesai: 'emerald',
} as const;

export function AdminMessagesView({
  messages,
  initialStatus = 'all',
  initialSelectedId,
}: {
  messages: AdminMessageRow[];
  initialStatus?: string;
  initialSelectedId?: number;
}) {
  const t = useTranslations('admin');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(
    initialStatus === 'baru' ||
      initialStatus === 'diproses' ||
      initialStatus === 'selesai'
      ? initialStatus
      : 'all',
  );
  const [selectedId, setSelectedId] = useState<number | null>(
    initialSelectedId ?? null,
  );

  const statusLabels = {
    baru: t('text185'),
    diproses: t('text186'),
    selesai: t('text187'),
  } as const;

  const filtered = useMemo(() => {
    let res = messages;
    if (statusFilter !== 'all') {
      res = res.filter((m) => m.status === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      res = res.filter((m) =>
        `${m.nama} ${m.email} ${m.subjek} ${m.pesan} ${m.sekolah ?? ''}`
          .toLowerCase()
          .includes(q),
      );
    }
    return res;
  }, [messages, statusFilter, search]);

  const selected =
    filtered.find((m) => m.id === selectedId) ?? filtered[0] ?? null;

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t('text188')} description={t('text189')} />

      <div className="space-y-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <label htmlFor="search-admin-messages" className="sr-only">
              Cari pesan masuk
            </label>
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="search-admin-messages"
              type="search"
              autoComplete="off"
              placeholder="Cari pengirim, email, atau subjek…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-8 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors shadow-2xs"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Hapus kata kunci pencarian"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              size="sm"
              prefixLabel="Status:"
              options={[
                { value: 'all', label: t('text67') },
                { value: 'baru', label: t('text185') },
                { value: 'diproses', label: t('text186') },
                { value: 'selesai', label: t('text187') },
              ]}
            />
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 sm:p-12 text-center">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t('text193')}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Pesan dari formulir kontak publik akan tampil di sini.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 sm:p-12 text-center">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t('text192')}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Tidak ditemukan pesan dengan kata kunci atau filter yang dipilih.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Reset Pencarian
              </button>
            </div>
          </div>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_30rem]">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((m) => {
                  const isSel = selected?.id === m.id;
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(m.id)}
                        aria-current={isSel ? 'true' : undefined}
                        className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 ${
                          isSel
                            ? 'bg-blue-50/60 dark:bg-blue-950/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <span
                          className={`mt-1.5 size-2 shrink-0 rounded-full ${
                            m.status === 'baru'
                              ? 'bg-amber-500'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {m.nama}
                              <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                                {m.email}
                              </span>
                            </span>
                            <span className="flex-shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                              {m.createdAtLabel}
                            </span>
                          </span>
                          <span className="mt-0.5 block truncate text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {m.subjek}
                          </span>
                          <span className="mt-0.5 block line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                            {m.pesan}
                          </span>
                        </span>
                        {m.status !== 'baru' ? (
                          <Badge tone={STATUS_TONE[m.status]}>
                            {statusLabels[m.status]}
                          </Badge>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="lg:sticky lg:top-20">
              {selected ? (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                  <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-100 dark:bg-blue-950/50 text-sm font-bold text-blue-800 dark:text-blue-300">
                          {selected.nama.trim().charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <h2 className="truncate font-display text-[15px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            {selected.nama}
                          </h2>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            <a
                              href={`mailto:${selected.email}`}
                              className="text-blue-700 dark:text-blue-400 hover:underline"
                            >
                              {selected.email}
                            </a>
                            {selected.telepon ? ` · ${selected.telepon}` : ''}
                          </p>
                        </div>
                      </div>
                      <Badge tone={STATUS_TONE[selected.status]}>
                        {statusLabels[selected.status]}
                      </Badge>
                    </div>
                    <p className="mt-2.5 text-xs tabular-nums text-slate-600 dark:text-slate-300">
                      {t('receivedAt', { date: selected.createdAtLabel })}
                      {selected.jenjang
                        ? t('messageLevel', { level: selected.jenjang })
                        : ''}
                      {selected.sekolah ? ` · ${selected.sekolah}` : ''}
                    </p>
                  </div>

                  <div className="p-5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {selected.subjek}
                    </h3>
                    <p className="mt-2.5 whitespace-pre-line rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 py-3.5 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                      {selected.pesan}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {(['baru', 'diproses', 'selesai'] as const)
                        .filter((s) => s !== selected.status)
                        .map((s) => (
                          <form key={s} action={ubahStatusPesan}>
                            <input
                              type="hidden"
                              name="pesan_id"
                              value={selected.id}
                            />
                            <input type="hidden" name="status" value={s} />
                            <Button
                              type="submit"
                              size="sm"
                              variant={s === 'selesai' ? 'default' : 'outline'}
                            >
                              {t('markStatus', { status: statusLabels[s] })}
                            </Button>
                          </form>
                        ))}
                      <ConfirmAction
                        action={hapusPesan}
                        label={t('text93')}
                        confirmLabel={t('text194')}
                      >
                        <input
                          type="hidden"
                          name="pesan_id"
                          value={selected.id}
                        />
                      </ConfirmAction>
                      <a
                        href={`mailto:${selected.email}?subject=${encodeURIComponent(t('replySubject', { subject: selected.subjek }))}`}
                        className="ml-auto text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                      >
                        {t('text195')}
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500 dark:text-slate-400 shadow-2xs">
                  {t('text196')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
