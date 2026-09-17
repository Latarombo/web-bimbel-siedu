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
  /** default true kalau values[key] ada */
  sortable?: boolean;
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
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
            />
          </label>
        </div>
      ) : null}
      {/* max-h-[70dvh] bukan 75vh: di HP bar alamat browser membuat vh lebih
          besar dari viewport nyata sehingga footer tabel terpotong. */}
      <div className="max-h-[70dvh] overflow-auto overscroll-x-contain rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              {columns.map((c) => {
                const sortable = c.sortable !== false && rows.some((r) => r.values[c.key] !== undefined);
                return (
                  <th
                    key={c.key}
                    className={cn(
                      "sticky top-0 z-10 bg-slate-50 px-3 py-3 text-xs font-semibold whitespace-nowrap text-slate-600 sm:px-4",
                      sortable && "cursor-pointer select-none hover:text-slate-900",
                      c.className,
                    )}
                    onClick={sortable ? () => toggleSort(c.key) : undefined}
                    aria-sort={sort?.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {c.header}
                      {sortable ? (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 12 12"
                          className={`size-3 ${sort?.key === c.key ? "text-blue-600" : "text-slate-300"}`}
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
              <tr key={row.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/80">
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-3 py-3 align-middle sm:px-4", c.className)}>
                    {row.cells?.[c.key] ?? String(row.values[c.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <p className="text-sm font-semibold text-slate-700">{q.trim() ? t("noResults") : (empty ?? t("empty"))}</p>
                  {q.trim() ? (
                    <button type="button" onClick={() => setQ("")} className="mt-1 text-xs font-semibold text-blue-700 hover:underline">
                      {t("clearSearch")}
                    </button>
                  ) : null}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        {sorted.length > 0 ? (
          <p className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
            <span className="tabular-nums">
              {q.trim() ? t("filteredCount", { shown: sorted.length, total: rows.length }) : t("count", { count: rows.length })}
            </span>
            {caption ? <span>{caption}</span> : null}
          </p>
        ) : caption ? (
          <p className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">{caption}</p>
        ) : null}
      </div>
    </div>
  );
}
