import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage?: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  className?: string;
  showWhenSinglePage?: boolean;
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  itemLabel = "data",
  onPageChange,
  className = "",
  showWhenSinglePage = false,
}: TablePaginationProps) {
  if (totalPages <= 1 && !showWhenSinglePage) return null;
  if (totalItems <= 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 dark:border-slate-800 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 ${className}`}
    >
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Menampilkan{" "}
        <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
          {startItem} - {endItem}
        </span>{" "}
        dari{" "}
        <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
          {totalItems}
        </span>{" "}
        {itemLabel}
      </p>

      <div className="inline-flex items-center gap-1 sm:gap-1.5 self-end sm:self-auto">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label={`Halaman ${itemLabel} Sebelumnya`}
        >
          <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
          <span>Sebelumnya</span>
        </button>

        <span className="px-2 text-xs font-medium text-slate-600 dark:text-slate-400 tabular-nums select-none whitespace-nowrap">
          Halaman{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {currentPage}
          </span>{" "}
          dari{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {totalPages}
          </span>
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label={`Halaman ${itemLabel} Berikutnya`}
        >
          <span>Berikutnya</span>
          <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
