import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Section } from "@/components/ui/section";
import { KelasGrid } from "@/components/kelas-card";
import { toKelasKatalog } from "@/lib/kelas";
import { filterKatalog, kelasKatalogHalaman, urlKatalog, UKURAN_HALAMAN_KATALOG } from "@/lib/katalog";
import { KatalogFilterBar } from "@/components/katalog/katalog-filter-bar";

export const dynamic = "force-dynamic";


export default async function ClassesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
 const tr = await getTranslations("public");
 const locale = (await getLocale()) === "en" ? "en" : "id";
const SORTS = [
  { value: "terbaru", label: tr("text241") },
  { value: "termurah", label: tr("text242") },
  { value: "termahal", label: tr("text243") },
] as const;

  const filter = filterKatalog(await searchParams);
  const { q, jenjang, tingkat, sort } = filter;
  const { rows, total, page, totalPages } = await kelasKatalogHalaman(filter, locale);
  const items = rows.map((row) => toKelasKatalog(row, locale));
  const current = { ...filter, page };

  return (
    <div className="bg-slate-50 min-h-full">
      {/* Hero: pola visual mengikuti hero detail produk */}
      <section className="relative overflow-hidden bg-[#1d4ed8] pt-6 pb-16 text-white shadow-xs sm:pt-8 sm:pb-20 lg:pt-10 lg:pb-24">
        {/* Gelombang sudut tanpa gradient */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <svg
            className="absolute -right-8 -top-8 w-72 sm:w-96 md:w-[480px]"
            viewBox="0 0 400 280"
            fill="none"
          >
            <path d="M120 0 C200 45, 290 110, 400 240 L400 0 Z" fill="white" fillOpacity="0.05" />
            <path d="M190 0 C260 40, 330 95, 400 180 L400 0 Z" fill="white" fillOpacity="0.07" />
            <path d="M270 0 C325 30, 365 65, 400 120 L400 0 Z" fill="white" fillOpacity="0.09" />
          </svg>

          <svg
            className="absolute -left-8 -bottom-8 w-64 sm:w-80 md:w-[420px]"
            viewBox="0 0 360 260"
            fill="none"
          >
            <path d="M0 60 C90 105, 180 175, 280 260 L0 260 Z" fill="white" fillOpacity="0.05" />
            <path d="M0 120 C75 155, 145 205, 210 260 L0 260 Z" fill="white" fillOpacity="0.07" />
            <path d="M0 180 C50 205, 100 230, 140 260 L0 260 Z" fill="white" fillOpacity="0.08" />
          </svg>
        </div>

        <Section className="relative flex flex-col items-center px-4 text-center">
          <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
            {tr("text247")}{tr("text248")}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100 sm:text-base">
            {tr("text249")}
          </p>
        </Section>
      </section>

      <Section className="-mt-14 sm:-mt-16 py-0 relative z-10">
        <KatalogFilterBar
          currentJenjang={jenjang}
          currentTingkat={tingkat}
          currentQ={q}
          currentSort={sort}
          actionUrl={locale === 'en' ? '/en/classes' : '/classes'}
          translations={{
            welcomeTitle: tr("welcomeFilterTitle"),
            welcomeSubtitle: tr("welcomeFilterSubtitle"),
            chooseClass: tr("chooseClass"),
            applyFilterSelection: tr("applyFilterSelection"),
            resetFilter: tr("resetFilter"),
            allLevelsFull: tr("allLevelsFull"),
            popularPackageFor: tr("popularPackageFor"),
            selectLevelAndClass: tr("selectLevelAndClass"),
            searchPlaceholderCatalog: tr("searchPlaceholderCatalog"),
            searchButtonCatalog: tr("searchButtonCatalog"),
          }}
        />
      </Section>

      <Section className="-mt-2 pt-0 pb-8 sm:pt-0 sm:pb-10">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border pb-4">
          <p className="text-sm font-medium text-muted">{tr("classesFound", {count: total})}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex flex-wrap gap-2" role="group" aria-label={tr("text256")}>
              {SORTS.map((s) => (
                <Link
                  key={s.value}
                  href={urlKatalog(current, { sort: s.value, page: 1 })}
                  prefetch={false}
                  aria-pressed={sort === s.value}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${sort === s.value ? "bg-brand text-white border-brand" : "bg-white border-border text-muted hover:border-foreground hover:text-foreground"}`}
                >
                  {s.label}
                </Link>
              ))}
            </div>
            <Link href="/about" className="text-sm font-semibold text-brand hover:underline">{tr("text257")}</Link>
          </div>
        </div>
        <div className="mt-6">
          <KelasGrid items={items} />
        </div>
        {total > 0 ? (
          <nav aria-label={tr("pagination")} className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            <p className="text-sm text-muted">{tr("pageRange", {
              from: (page - 1) * UKURAN_HALAMAN_KATALOG + 1,
              to: Math.min(page * UKURAN_HALAMAN_KATALOG, total), total,
            })}</p>
            <div className="flex items-center gap-3">
              {page > 1 ? <Link prefetch={false} href={urlKatalog(current, { page: page - 1 })} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold hover:border-brand">{tr("previousPage")}</Link> : null}
              <span className="text-sm text-muted">{tr("pageNumber", { page, totalPages })}</span>
              {page < totalPages ? <Link prefetch={false} href={urlKatalog(current, { page: page + 1 })} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold hover:border-brand">{tr("nextPage")}</Link> : null}
            </div>
          </nav>
        ) : null}
      </Section>
    </div>
  );
}
