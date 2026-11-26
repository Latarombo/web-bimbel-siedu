/* Komponen shared halaman admin — styling EKSPLISIT skala Tailwind (slate/blue/amber),
   sengaja tidak pakai token semantik globals.css (border-border/bg-surface) supaya
   kartu tidak putih-di-atas-putih. Ikuti pola halaman dashboard (13 Sep). */
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

/** Pembungkus halaman: latar sudah bg-slate-50 dari layout admin. */
export function PageShell({
    children,
    wide = false,
}: {
    children: React.ReactNode;
    wide?: boolean;
}) {
    return (
        <div
            className={`mx-auto w-full ${wide ? 'max-w-7xl' : 'max-w-6xl'} px-4 py-6 sm:px-6 sm:py-8 lg:px-8`}
        >
            {children}
        </div>
    );
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
    const t = useTranslations('shared');
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
                {backHref ? (
                    <Link
                        href={backHref}
                        className="group mb-2.5 inline-flex items-center rounded-lg border border-slate-200/80 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white dark:hover:border-slate-700"
                    >
                        <span>{t('back')}</span>
                    </Link>
                ) : null}
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-[26px] dark:text-slate-50">
                    {title}
                </h1>
                {meta ? (
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                        {desc}
                        <span className="font-medium text-slate-400 dark:text-slate-500"> · </span>
                        <span className="font-medium tabular-nums text-slate-600 dark:text-slate-300">
                            {meta}
                        </span>
                    </p>
                ) : (
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{desc}</p>
                )}
            </div>
            {children ? (
                <div className="flex flex-shrink-0 items-center gap-2">
                    {children}
                </div>
            ) : null}
        </div>
    );
}

/** Kartu panel — sama persis dengan Panel di dashboard. */
export function Panel({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_0_rgba(15,23,42,0.10),0_4px_12px_-6px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 ${className}`}
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
            <div>
                <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    {title}
                </h2>
                {sub ? <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p> : null}
            </div>
            {children ? (
                <div className="flex items-center gap-2">{children}</div>
            ) : null}
        </div>
    );
}

export type FilterTab = {
    label: string;
    href: string;
    count?: number;
    aktif: boolean;
    /** tab yang butuh perhatian (mis. 'baru') disorot amber saat aktif */ attention?: boolean;
};

/** Filter tab berbasis underline modern — selaras dengan UnderlineTabs di portal guru. */
export function FilterTabs({
    tabs,
    label,
    className = '',
}: {
    tabs: FilterTab[];
    label: string;
    className?: string;
}) {
    return (
        <div className={`border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none ${className}`}>
            <nav
                aria-label={label}
                className="flex space-x-6 sm:space-x-8 min-w-max pb-px"
            >
                {tabs.map((t) => (
                    <Link
                        key={t.href}
                        href={t.href}
                        aria-current={t.aktif ? 'page' : undefined}
                        className={`group relative flex items-center gap-2 pb-3 pt-1 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                            t.aktif
                                ? t.attention
                                    ? 'text-amber-700 dark:text-amber-400 font-bold border-b-2 border-amber-500'
                                    : 'text-blue-700 dark:text-blue-400 font-bold border-b-2 border-blue-600 dark:border-blue-400'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 border-b-2 border-transparent'
                        }`}
                    >
                        <span>{t.label}</span>
                        {t.count !== undefined ? (
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums transition-colors ${
                                    t.aktif
                                        ? t.attention
                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/70 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700'
                                }`}
                            >
                                {t.count}
                            </span>
                        ) : null}
                    </Link>
                ))}
            </nav>
        </div>
    );
}

/** Banner peringatan/info seragam (mengganti Card border-amber-300 polos). */
export function Notice({
    tone = 'amber',
    title,
    children,
}: {
    tone?: 'amber' | 'blue';
    title: string;
    children?: React.ReactNode;
}) {
    const map = {
        amber: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200',
        blue: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200',
    } as const;
    const dot = { amber: 'bg-amber-500', blue: 'bg-blue-600' } as const;
    return (
        <div className={`rounded-xl border px-4 py-3.5 ${map[tone]}`}>
            <p className="flex items-center gap-2 text-sm font-bold">
                <span
                    className={`inline-block size-2 rounded-full ${dot[tone]}`}
                    aria-hidden="true"
                />
                {title}
            </p>
            {children ? (
                <div className="mt-1 pl-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {children}
                </div>
            ) : null}
        </div>
    );
}
