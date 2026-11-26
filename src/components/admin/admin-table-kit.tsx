'use client';

import React, { useState, useTransition } from 'react';
import {
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { NativeDialog } from '@/components/common/native-dialog';
import { TablePagination } from '@/components/ui/table-pagination';

export function AdminPageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      {children ? (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{children}</div>
      ) : null}
    </div>
  );
}

export type SortDir = 'asc' | 'desc';

export function AdminSortHeader({
  label,
  active,
  dir,
  align = 'left',
  onClick,
}: {
  label: string;
  active: boolean;
  dir?: SortDir;
  align?: 'left' | 'right' | 'center';
  onClick: () => void;
}) {
  const justify =
    align === 'right'
      ? 'justify-end'
      : align === 'center'
        ? 'justify-center'
        : 'justify-between';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex w-full items-center ${justify} gap-1.5 py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600`}
    >
      <span>{label}</span>
      {active ? (
        dir === 'asc' ? (
          <ArrowUp className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
        ) : (
          <ArrowDown className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
        )
      ) : (
        <ArrowUpDown className="size-3 text-slate-400 opacity-60 shrink-0" aria-hidden="true" />
      )}
    </button>
  );
}

export function AdminTableShell({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  toolbarRight,
  totalRawCount,
  filteredCount,
  currentPage,
  totalPages,
  itemsPerPage = 10,
  itemLabel = 'data',
  onPageChange,
  onResetFilters,
  emptyTitle = 'Belum ada data',
  emptyDescription = 'Data yang ditambahkan akan tampil di sini.',
  filteredEmptyTitle = 'Tidak ada data yang cocok',
  filteredEmptyDescription = 'Tidak ditemukan data dengan kata kunci atau filter yang dipilih.',
  tableAriaLabel,
  minWidthClass = 'min-w-[820px]',
  thead,
  tbody,
}: {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder: string;
  searchAriaLabel: string;
  toolbarRight?: React.ReactNode;
  totalRawCount: number;
  filteredCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage?: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  onResetFilters?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  filteredEmptyTitle?: string;
  filteredEmptyDescription?: string;
  tableAriaLabel: string;
  minWidthClass?: string;
  thead: React.ReactNode;
  tbody: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <label htmlFor={tableAriaLabel} className="sr-only">
              {searchAriaLabel}
            </label>
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id={tableAriaLabel}
              type="search"
              autoComplete="off"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-8 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors shadow-2xs"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Hapus kata kunci pencarian"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>

        {toolbarRight ? (
          <div className="flex flex-wrap items-center gap-2">{toolbarRight}</div>
        ) : null}
      </div>

      {totalRawCount === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 sm:p-12 text-center">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {emptyTitle}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {emptyDescription}
          </p>
        </div>
      ) : filteredCount === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 sm:p-12 text-center">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {filteredEmptyTitle}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {filteredEmptyDescription}
          </p>
          {onResetFilters ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Reset Pencarian
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          <div
            tabIndex={0}
            role="region"
            aria-label={tableAriaLabel}
            className="w-full overflow-x-auto overscroll-x-contain focus:outline-hidden focus:ring-1 focus:ring-blue-600/30 touch-pan-x"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <table className={`w-full ${minWidthClass} text-left text-sm border-collapse`}>
              <thead>{thead}</thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tbody}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCount}
            itemsPerPage={itemsPerPage}
            itemLabel={itemLabel}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}

export function AdminModal({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidthClass = 'sm:max-w-xl',
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}) {
  return (
    <NativeDialog
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={title}
      className={`m-auto w-full ${maxWidthClass} rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 shadow-2xl overflow-hidden`}
    >
      <div className="flex max-h-[90vh] flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div>
            <h2 className="font-display text-base font-bold text-slate-950 dark:text-slate-50">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="grid size-8 shrink-0 place-items-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </NativeDialog>
  );
}

export function AdminDeleteModal({
  isOpen,
  onClose,
  title,
  itemName,
  description,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  itemName: string;
  description?: string;
  onConfirm: () => Promise<{ ok?: boolean; error?: string }>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) setError(null);
  }

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const res = await onConfirm();
      if (res?.error) {
        setError(res.error);
      } else {
        onClose();
      }
    });
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title={title} maxWidthClass="sm:max-w-md">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {description ?? `Yakin ingin menghapus "${itemName}"? Tindakan ini bersifat permanen.`}
        </p>
        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
          >
            {error}
          </div>
        ) : null}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isPending ? 'Menghapus…' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </AdminModal>
  );
}

export function RowActionIconBtn({
  onClick,
  ariaLabel,
  title,
  tone = 'neutral',
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  title?: string;
  tone?: 'neutral' | 'danger' | 'success';
  children: React.ReactNode;
}) {
  const toneClass =
    tone === 'danger'
      ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/40'
      : tone === 'success'
        ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40'
        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      className={`grid size-8 place-items-center rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${toneClass}`}
    >
      {children}
    </button>
  );
}
