import { Link } from "@/i18n/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type KatalogPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  rangeLabel: string;
  pageBadgeLabel?: string;
  createPageUrl: (targetPage: number) => string;
  getPageAriaLabel?: (page: number) => string;
  translations: {
    pagination: string;
    previousPage: string;
    nextPage: string;
  };
};

export function getPaginationRange(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
}

export function KatalogPagination({
  page,
  totalPages,
  total,
  rangeLabel,
  pageBadgeLabel,
  createPageUrl,
  getPageAriaLabel,
  translations,
}: KatalogPaginationProps) {
  if (total <= 0) return null;

  const pageNumbers = getPaginationRange(page, totalPages);
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label={translations.pagination}
      className="mt-12 flex flex-col items-center justify-center gap-3"
    >
      {/* Teks ringkasan informasi terpusat */}
      <p className="text-xs font-medium text-slate-500 sm:text-sm text-center">
        {rangeLabel}
      </p>

      {/* Centered Segmented Island / Floating Dock */}
      <div
        className="inline-flex items-center gap-1 rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-sm transition-shadow hover:shadow-md"
        role="group"
        aria-label={translations.pagination}
      >
        {/* Tombol Sebelumnya */}
        {hasPrevious ? (
          <Link
            prefetch={false}
            href={createPageUrl(page - 1)}
            title={translations.previousPage}
            aria-label={translations.previousPage}
            className="inline-flex h-9 items-center justify-center gap-1 rounded-xl px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 sm:text-sm"
          >
            <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">{translations.previousPage}</span>
          </Link>
        ) : (
          <span
            aria-disabled="true"
            title={translations.previousPage}
            className="inline-flex h-9 items-center justify-center gap-1 rounded-xl px-2.5 text-xs font-medium text-slate-300 cursor-not-allowed select-none opacity-60 sm:text-sm"
          >
            <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">{translations.previousPage}</span>
          </span>
        )}

        {/* Pemisah halus */}
        <span className="mx-0.5 h-5 w-px bg-slate-200/80" aria-hidden="true" />

        {/* Daftar Nomor Halaman */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx) => {
            if (p === "ellipsis") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  aria-hidden="true"
                  className="flex size-9 items-center justify-center text-sm font-medium text-slate-400 select-none"
                >
                  &hellip;
                </span>
              );
            }

            const isCurrent = p === page;
            const ariaLabel = getPageAriaLabel
              ? getPageAriaLabel(p)
              : `Halaman ${p}`;

            if (isCurrent) {
              return (
                <span
                  key={p}
                  aria-current="page"
                  aria-label={ariaLabel}
                  className="flex size-9 items-center justify-center rounded-xl border border-blue-200/90 bg-blue-50 text-xs font-bold text-brand shadow-2xs select-none sm:text-sm"
                >
                  {p}
                </span>
              );
            }

            return (
              <Link
                key={p}
                prefetch={false}
                href={createPageUrl(p)}
                aria-label={ariaLabel}
                className="flex size-9 items-center justify-center rounded-xl text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 sm:text-sm"
              >
                {p}
              </Link>
            );
          })}
        </div>

        {/* Pemisah halus */}
        <span className="mx-0.5 h-5 w-px bg-slate-200/80" aria-hidden="true" />

        {/* Tombol Berikutnya */}
        {hasNext ? (
          <Link
            prefetch={false}
            href={createPageUrl(page + 1)}
            title={translations.nextPage}
            aria-label={translations.nextPage}
            className="inline-flex h-9 items-center justify-center gap-1 rounded-xl px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 sm:text-sm"
          >
            <span className="hidden sm:inline">{translations.nextPage}</span>
            <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
          </Link>
        ) : (
          <span
            aria-disabled="true"
            title={translations.nextPage}
            className="inline-flex h-9 items-center justify-center gap-1 rounded-xl px-2.5 text-xs font-medium text-slate-300 cursor-not-allowed select-none opacity-60 sm:text-sm"
          >
            <span className="hidden sm:inline">{translations.nextPage}</span>
            <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
          </span>
        )}
      </div>
    </nav>
  );
}
