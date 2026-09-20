import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Section } from "@/components/ui/section";
import { KelasGrid } from "@/components/kelas-card";
import { toKelasKatalog } from "@/lib/kelas";
import { filterKatalog, kelasKatalogHalaman, urlKatalog, UKURAN_HALAMAN_KATALOG } from "@/lib/katalog";
import { KatalogFilterBar } from "@/components/katalog/katalog-filter-bar";

export const dynamic = "force-dynamic";


const TEAL = "#227195";

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
      {/* Hero: Deep navy brand gradient with blob decorations */}
      <section className="relative overflow-hidden rounded-b-[3rem] md:rounded-b-[4.5rem] bg-[#0f235f] pt-10 pb-20 sm:pt-14 sm:pb-24">
        {/* Blob dekorasi abstrak */}
        <div className="pointer-events-none absolute -top-16 -right-16 size-72 rounded-full bg-blue-500/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute bottom-0 -left-12 size-56 rounded-full bg-indigo-400/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute top-1/2 left-1/3 size-40 rounded-full bg-sky-400/10 blur-2xl" aria-hidden />
        <Section className="relative flex flex-col items-center text-center px-4">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white max-w-3xl leading-tight">
            {tr("text247")} <span className="text-amber-400">{tr("text248")}</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm sm:text-base leading-relaxed text-slate-300">
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

      <Section className="pt-8 pb-8 sm:pb-10">
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
