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
  empty = "Tidak ada data.",
  caption,
  initialSort,
}: {
  columns: TableColumn[];
  rows: TableRowData[];
  empty?: string;
  caption?: string;
  /** { key, dir } urutan awal */
  initialSort?: { key: string; dir: "asc" | "desc" };
}) {
  const [sort, setSort] = React.useState(initialSort ?? null);

  const sorted = React.useMemo(() => {
    if (!sort) return rows;
    const { key, dir } = sort;
    return [...rows].sort((a, b) => {
      const va = a.values[key] ?? "";
      const vb = b.values[key] ?? "";
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), "id");
      return dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort]);

  function toggleSort(key: string) {
    setSort((s) =>
      s?.key === key ? (s.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" },
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-slate-50 text-left">
            {columns.map((c) => {
              const sortable = c.sortable !== false && rows.some((r) => r.values[c.key] !== undefined);
              return (
                <th
                  key={c.key}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted whitespace-nowrap",
                    sortable && "cursor-pointer select-none hover:text-foreground",
                    c.className,
                  )}
                  onClick={sortable ? () => toggleSort(c.key) : undefined}
                  aria-sort={sort?.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {sortable ? (
                      <span className={cn("text-[10px]", sort?.key === c.key ? "text-brand" : "text-slate-300")}>
                        {sort?.key === c.key ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    ) : null}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.id} className="border-b border-border/60 last:border-0 hover:bg-slate-50/70 transition-colors">
              {columns.map((c) => (
                <td key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>
                  {row.cells?.[c.key] ?? String(row.values[c.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-muted">
                {empty}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      {caption ? <p className="border-t border-border/60 px-4 py-2.5 text-xs text-muted">{caption}</p> : null}
    </div>
  );
}
