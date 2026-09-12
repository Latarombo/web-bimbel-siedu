/*
 * ProgressRow — label + nilai + bar. Dipakai kartu tagihan (tenor cicilan) dan
 * kartu presensi (rasio hadir). Bukan primitif shadcn: bar-nya murni utility
 * Tailwind supaya bisa dipakai di RSC tanpa 'use client'.
 */
export function ProgressRow({
  label,
  value,
  pct,
  tone = "brand",
  hint,
}: {
  label: string;
  value: string;
  /** 0–100; clamp di komponen, bukan di pemanggil. */
  pct: number;
  tone?: "brand" | "emerald" | "amber" | "red";
  hint?: string;
}) {
  const fill =
    tone === "emerald"
      ? "bg-emerald-500"
      : tone === "amber"
        ? "bg-amber-500"
        : tone === "red"
          ? "bg-rose-500"
          : "bg-brand";
  const wide = Math.max(0, Math.min(100, pct));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold uppercase text-muted">{label}</p>
        <p className="text-sm font-bold tabular-nums">{value}</p>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={wide}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${wide}%` }} />
      </div>
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

/** Bar segmen kehadiran: hadir/izin/sakit/alpa dalam satu garis. */
export function SegmentBar({
  parts,
}: {
  parts: { label: string; n: number; className: string }[];
}) {
  const total = parts.reduce((s, p) => s + p.n, 0) || 1;
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
        {parts.map((p) =>
          p.n > 0 ? (
            <div
              key={p.label}
              className={p.className}
              style={{ width: `${(p.n / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {parts.map((p) => (
          <span key={p.label} className="inline-flex items-center gap-1.5 text-xs text-muted">
            <span className={`h-2 w-2 rounded-full ${p.className}`} />
            {p.label} <b className="text-foreground tabular-nums">{p.n}</b>
          </span>
        ))}
      </div>
    </div>
  );
}
