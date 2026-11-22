"use client";

/*
 * DataTable minimal — gaya shadcn table: header sticky, row hover, sort kolom.
 * Kontrak RSC: page (server) kirim columns polos + rows {values, cells} —
 * cells = ReactNode hasil render server (boleh berisi Link/form server action),
 * values = string/number polos untuk sort client-side.
 * ponytail: sort client-side sederhana; TanStack Table kalau butuh
 * pagination server-side / filter kolom kompleks.
 */
import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type TableColumn = {
  key: string;
  header: string;
  className?: string;
  /** Perataan isi dan header kolom secara semantik (default: "left") */
  align?: "left" | "center" | "right";
  /** default true kalau values[key] ada */
  sortable?: boolean;
  /** Pin kolom di sisi kiri atau kanan saat scroll horizontal */
  sticky?: "left" | "right";
  /** Truncate cell text jika panjang */
  truncate?: boolean;
  /** Batas lebar maksimum untuk truncate (contoh: "max-w-[200px]") */
  maxWidth?: string;
};

export type TableRowData = {
  id: number | string;
  /** nilai polos per column key — dipakai sorting */
  values: Record<string, string | number>;
  /** ReactNode per column key (opsional — fallback: values[key]) */
  cells?: Record<string, React.ReactNode>;
};

export function DataTable({
  columns,
  rows,
  empty,
  caption,
  initialSort,
  searchPlaceholder,
  searchKeys,
  stickyLeft = true,
  stickyActions = true,
}: {
  columns: TableColumn[];
  rows: TableRowData[];
  empty?: string;
  caption?: string;
  /** { key, dir } urutan awal */
  initialSort?: { key: string; dir: "asc" | "desc" };
  /** kalau diisi, tampil input cari client-side di atas tabel */
  searchPlaceholder?: string;
  /** kolom yang ikut dicari (default: semua keys dari initialSort+columns) */
  searchKeys?: string[];
  /** Bekukan kolom pertama (konteks nama/identitas) di sisi kiri saat scroll horizontal (default: true) */
  stickyLeft?: boolean;
  /** Bekukan kolom aksi di sisi kanan saat scroll horizontal (default: true) */
  stickyActions?: boolean;
}) {
  const t = useTranslations("shared.table");
  const locale = useLocale();
  const [sort, setSort] = React.useState(initialSort ?? null);
  const [q, setQ] = React.useState("");

  const keys = React.useMemo(
    () => searchKeys ?? columns.map((c) => c.key).filter((k) => k !== "aksi"),
    [columns, searchKeys],
  );

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => keys.some((k) => String(r.values[k] ?? "").toLowerCase().includes(term)));
  }, [rows, q, keys]);

  const sorted = React.useMemo(() => {
    if (!sort) return filtered;
    const { key, dir } = sort;
    return [...filtered].sort((a, b) => {
      const va = a.values[key] ?? "";
      const vb = b.values[key] ?? "";
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), locale);
      return dir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sort, locale]);

  function toggleSort(key: string) {
    setSort((s) =>
      s?.key === key ? (s.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" },
    );
  }

  return (
    <div>
      {searchPlaceholder ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <label className="relative block w-full max-w-xs sm:max-w-64">
            <span className="sr-only">{t("search")}</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-400">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-8 text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
            />
            {q ? (
              <button
                type="button"
                onClick={() => setQ("")}
                aria-label={t("clearSearch")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </label>
        </div>
      ) : null}
      {/* max-h-[70dvh] bukan 75vh: di HP bar alamat browser membuat vh lebih
          besar dari viewport nyata sehingga footer tabel terpotong. */}
      <div
        tabIndex={0}
        role="region"
        aria-label={caption || "Tabel data"}
        className="max-h-[70dvh] overflow-auto overscroll-x-contain rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-600/30"
      >
        <table className="w-full text-sm">
          <caption className="sr-only">{caption || "Tabel data"}</caption>
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              {columns.map((c, idx) => {
                const sortable = c.sortable !== false && rows.some((r) => r.values[c.key] !== undefined);
                const isFirstSticky = stickyLeft && (c.sticky === "left" || (idx === 0 && c.sticky !== "right"));
                const isLastSticky = stickyActions && (c.sticky === "right" || (c.key === "aksi" && c.sticky !== "left"));
                const stickyHeaderClass = isFirstSticky
                  ? "sticky top-0 left-0 z-30 bg-slate-50 dark:bg-slate-800 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]"
                  : isLastSticky
                    ? "sticky top-0 right-0 z-30 bg-slate-50 dark:bg-slate-800 border-l border-slate-200/80 dark:border-slate-800/80 shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)]"
                    : "sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/90";
                const alignClass =
                  c.align === "right"
                    ? "text-right"
                    : c.align === "center"
                      ? "text-center"
                      : "text-left";
                return (
                  <th
                    key={c.key}
                    scope="col"
                    tabIndex={sortable ? 0 : undefined}
                    role={sortable ? "button" : undefined}
                    onKeyDown={
                      sortable
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleSort(c.key);
                            }
                          }
                        : undefined
                    }
                    className={cn(
                      "px-3 py-3 text-xs font-semibold whitespace-nowrap text-slate-600 dark:text-slate-300 sm:px-4",
                      stickyHeaderClass,
                      alignClass,
                      sortable && "cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600",
                      c.className,
                    )}
                    onClick={sortable ? () => toggleSort(c.key) : undefined}
                    aria-sort={sort?.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                  >
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5",
                        c.align === "right" && "justify-end",
                        c.align === "center" && "justify-center",
                      )}
                    >
                      {c.header}
                      {sortable ? (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 12 12"
                          className={`size-3 ${sort?.key === c.key ? "text-blue-600 dark:text-blue-400" : "text-slate-300 dark:text-slate-600"}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          {sort?.key === c.key ? (
                            sort.dir === "asc" ? <path d="M2.5 7.5 6 4l3.5 3.5" /> : <path d="M2.5 4.5 6 8l3.5-3.5" />
                          ) : (
                            <path d="M6 2v8M3.5 4.5 6 2l2.5 2.5M3.5 7.5 6 10l2.5-2.5" />
                          )}
                        </svg>
                      ) : null}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.id} className="group/row relative border-b border-slate-100 dark:border-slate-800/60 transition-colors last:border-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                {columns.map((c, idx) => {
                  const isFirstSticky = stickyLeft && (c.sticky === "left" || (idx === 0 && c.sticky !== "right"));
                  const isLastSticky = stickyActions && (c.sticky === "right" || (c.key === "aksi" && c.sticky !== "left"));
                  const stickyCellClass = isFirstSticky
                    ? "sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]"
                    : isLastSticky
                      ? "sticky right-0 z-10 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 border-l border-slate-200/80 dark:border-slate-800/80 shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)]"
                      : "";
                  const alignClass =
                    c.align === "right"
                      ? "text-right"
                      : c.align === "center"
                        ? "text-center"
                        : "text-left";
                  const rawVal = row.values[c.key];
                  const renderedCell = row.cells?.[c.key];
                  const isSimple = renderedCell === undefined;
                  const textToDisplay = isSimple ? String(rawVal ?? "") : null;
                  const isAksi = c.key === "aksi";

                  return (
                    <td
                      key={c.key}
                      className={cn(
                        "px-3 py-3 align-middle transition-colors sm:px-4",
                        stickyCellClass,
                        alignClass,
                        c.className,
                      )}
                    >
                      {isAksi ? (
                        <div className="opacity-70 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity duration-150 max-sm:opacity-100">
                          {renderedCell ?? textToDisplay}
                        </div>
                      ) : isSimple && (c.truncate || typeof rawVal === "string") ? (
                        <div
                          className={cn(
                            "truncate whitespace-nowrap",
                            c.maxWidth ?? "max-w-[220px] sm:max-w-[280px]",
                          )}
                          title={textToDisplay ?? undefined}
                        >
                          {textToDisplay}
                        </div>
                      ) : (
                        renderedCell ?? textToDisplay
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{q.trim() ? t("noResults") : (empty ?? t("empty"))}</p>
                  {q.trim() ? (
                    <button type="button" onClick={() => setQ("")} className="mt-1 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline">
                      {t("clearSearch")}
                    </button>
                  ) : null}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        {sorted.length > 0 ? (
          <p className="flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="tabular-nums">
              {q.trim() ? t("filteredCount", { shown: sorted.length, total: rows.length }) : t("count", { count: rows.length })}
            </span>
            {caption ? <span>{caption}</span> : null}
          </p>
        ) : caption ? (
          <p className="border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">{caption}</p>
        ) : null}
      </div>
    </div>
  );
}
