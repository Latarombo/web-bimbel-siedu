/* Komponen shared halaman admin — styling EKSPLISIT skala Tailwind (slate/blue/amber),
   sengaja tidak pakai token semantik globals.css (border-border/bg-surface) supaya
   kartu tidak putih-di-atas-putih. Ikuti pola halaman dashboard (13 Sep). */
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

/** Pembungkus halaman: latar sudah bg-slate-50 dari layout admin. */
export function PageShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={`mx-auto w-full ${wide ? "max-w-7xl" : "max-w-6xl"} px-4 py-6 sm:px-6 sm:py-8 lg:px-8`}>{children}</div>;
}

/** Header halaman seragam: judul display + deskripsi + chip meta + aksi kanan. */
export function PageHeader({
  title,
  desc,
  meta,
  backHref,
  children,
}: {
  title: string;
  desc: string;
  /** chip angka kecil di sebelah judul (mis. "12 kelas") — dari DB, bukan hiasan */
  meta?: string;
  /** link "kembali" tipis di atas judul (halaman detail) */
  backHref?: string;
  /** aksi kanan (ButtonLink) */
  children?: React.ReactNode;
}) {
  const t = useTranslations("shared");
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {backHref ? (
          <Link href={backHref} className="mb-1.5 inline-block text-sm font-semibold text-slate-500 hover:text-slate-900 hover:underline">
            {t("back")}
          </Link>
        ) : null}
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-[26px]">{title}</h1>
        {meta ? (
          <p className="mt-1.5 flex items-center gap-2 text-sm text-slate-500">
            {desc}
            <span className="inline-flex items-center rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-bold tabular-nums text-slate-700">
              {meta}
            </span>
          </p>
        ) : (
          <p className="mt-1.5 text-sm text-slate-500">{desc}</p>
        )}
      </div>
      {children ? <div className="flex flex-shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  );
}

/** Kartu panel — sama persis dengan Panel di dashboard. */
export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_0_rgba(15,23,42,0.10),0_4px_12px_-6px_rgba(15,23,42,0.08)] ${className}`}
    >
      {children}
    </div>
  );
}

/** Kepala Panel: judul + sub-teks kiri, aksi kanan. */
export function PanelHead({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
      <div>
        <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{title}</h2>
        {sub ? <p className="text-xs text-slate-500">{sub}</p> : null}
      </div>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </div>
  );
}

export type FilterTab = { label: string; href: string; count?: number; aktif: boolean; /** tab yang butuh perhatian (mis. 'baru') disorot amber saat aktif */ attention?: boolean };

/** Segmented filter seragam satu-satunya untuk semua halaman admin. */
export function FilterTabs({ tabs, label }: { tabs: FilterTab[]; label: string }) {
  return (
    <nav aria-label={label} className="inline-flex flex-wrap rounded-full bg-slate-200/70 p-1">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.aktif ? "page" : undefined}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            t.aktif
              ? t.attention
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-white text-blue-700 shadow-sm"
              : "text-slate-700 hover:text-slate-900"
          }`}
        >
          {t.label}
          {t.count !== undefined ? (
            <span
              className={`rounded-full px-1.5 text-[11px] font-bold tabular-nums ${
                t.aktif ? (t.attention ? "bg-white/25 text-white" : "bg-blue-100 text-blue-800") : "bg-white/70 text-slate-600"
              }`}
            >
              {t.count}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

/** Banner peringatan/info seragam (mengganti Card border-amber-300 polos). */
export function Notice({
  tone = "amber",
  title,
  children,
}: {
  tone?: "amber" | "blue";
  title: string;
  children?: React.ReactNode;
}) {
  const map = {
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    blue: "border-blue-200 bg-blue-50 text-blue-900",
  } as const;
  const dot = { amber: "bg-amber-500", blue: "bg-blue-600" } as const;
  return (
    <div className={`rounded-xl border px-4 py-3.5 ${map[tone]}`}>
      <p className="flex items-center gap-2 text-sm font-bold">
        <span className={`inline-block size-2 rounded-full ${dot[tone]}`} aria-hidden="true" />
        {title}
      </p>
      {children ? <div className="mt-1 pl-4 text-sm leading-relaxed text-slate-700">{children}</div> : null}
    </div>
  );
}
