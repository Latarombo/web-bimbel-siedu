// Visualisasi khas portal ortu (referensi Dribbble #1 progress-report + #2
// student-portal): ring persentase amber dan kalender grid kehadiran.
// SVG murni — aman di Server Component, warna via class literal Tailwind
// (v4 scan statis; jangan bangun class dari string runtime).

import { useTranslations } from "next-intl";

/** Ring progres persentase (0–100). Tone: amber = perhatian, emerald = aman. */
export function RingProgres({
  pct,
  label,
  tone = "amber",
  size = 120,
}: {
  pct: number;
  label?: string;
  tone?: "amber" | "emerald" | "blue";
  size?: number;
}) {
  const stroke = size * 0.09;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const ringColor =
    tone === "emerald"
      ? "stroke-emerald-400"
      : tone === "blue"
        ? "stroke-blue-300"
        : "stroke-amber-400";
  const textColor =
    tone === "emerald"
      ? "text-emerald-200"
      : tone === "blue"
        ? "text-blue-100"
        : "text-amber-300";
  return (
    <div
      className="relative inline-grid place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-white/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (clamped / 100) * c}
          className={ringColor}
        />
      </svg>
      <div className="absolute text-center">
        <p
          className={`text-2xl font-bold tabular-nums text-white ${textColor}`}
        >
          {Math.round(clamped)}%
        </p>
        {label ? (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">
            {label}
          </p>
        ) : null}
      </div>
    </div>
  );
}

const HARI_LABEL = ["S", "S", "R", "K", "J", "S", "M"] as const;

/**
 * Kalender grid kehadiran sebulan (pola #2: titik warna per tanggal).
 * riwayat = [{tanggal:'YYYY-MM-DD', status}] — status selain 'hadir'
 * (izin/sakit/alpa) ditandai amber/rose; hari tanpa data netral.
 */
export function GridKehadiran({
  riwayat,
  bulan,
}: {
  riwayat: { tanggal: string; status: string }[];
  /** "YYYY-MM" bulan yang ditampilkan; default bulan ini. */
  bulan?: string;
}) {
  const tr = useTranslations("parent");
  const target = bulan ?? new Date().toISOString().slice(0, 7);
  const [y, m] = target.split("-").map(Number);
  const hariDLm = new Date(y, m, 0).getDate();
  const offset = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Senin pertama
  const byDate = new Map(
    riwayat.map((r) => [r.tanggal.slice(0, 10), r.status]),
  );

  return (
    <div className="w-full min-w-0">
      {/* Grid 7 kolom leak-fit: w-full + gap mengecil di HP supaya tidak pernah
          lebih lebar dari kontainer ( kolom 1fr menyusut mengikuti ruang). */}
      <div className="grid grid-cols-7 gap-1 text-center sm:gap-1.5">
        {HARI_LABEL.map((h, i) => (
          <span
            key={i}
            className="min-w-0 text-[10px] font-semibold uppercase text-muted"
          >
            {h}
          </span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-1.5">
        {Array.from({ length: offset }, (_, i) => (
          <span key={`x${i}`} className="min-w-0" />
        ))}
        {Array.from({ length: hariDLm }, (_, i) => {
          const date = `${target}-${String(i + 1).padStart(2, "0")}`;
          const st = byDate.get(date);
          const dot =
            st === "hadir"
              ? "bg-emerald-500 text-white"
              : st === "alpa"
                ? "bg-rose-500 text-white"
                : st
                  ? "bg-amber-400 text-white"
                  : "bg-slate-100 text-slate-400";
          return (
            <span
              key={date}
              title={st ? `${i + 1}: ${st}` : date}
              className={`grid h-6 min-w-0 place-items-center rounded-full text-[10px] font-semibold tabular-nums sm:h-7 sm:text-[11px] ${dot}`}
            >
              {i + 1}
            </span>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />  {tr("text192")} </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" />  {tr("text193")} </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500" />  {tr("text194")} </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-100" />  {tr("text195")} </span>
      </div>
    </div>
  );
}
