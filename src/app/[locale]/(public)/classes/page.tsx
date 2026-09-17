import Form from 'next/form';
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Section } from "@/components/ui/section";
import { KelasGrid } from "@/components/kelas-card";
import { toKelasKatalog } from "@/lib/kelas";
import { filterKatalog, kelasKatalogHalaman, urlKatalog, JENJANG_KATALOG, UKURAN_HALAMAN_KATALOG } from "@/lib/katalog";

export const dynamic = "force-dynamic";

/* Hero katalog: band teal solid (satu keluarga dgn hero About), oranye amber
 * mundur ke perannya sebagai aksen CTA kartu. 15 Sep (user): blok statistik
 * kanan dihapus; band diberi pattern kotak-kotak (checkerboard) yang muncul
 * dari mask radial — tersembunyi di pojok kiri-atas, terlihat di kanan-bawah. */
const TEAL = "#227195";

const JENJANG = JENJANG_KATALOG;


export default async function ClassesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
 const tr = await getTranslations("public");
 const locale = (await getLocale()) === "en" ? "en" : "id";
const SORTS = [
  { value: "terbaru", label: tr("text241") },
  { value: "termurah", label: tr("text242") },
  { value: "termahal", label: tr("text243") },
] as const;

  const filter = filterKatalog(await searchParams);
  const { q, jenjang, sort } = filter;
  const { rows, jumlahJenjang, semua, total, page, totalPages } = await kelasKatalogHalaman(filter, locale);
  const items = rows.map((row) => toKelasKatalog(row, locale));
  const current = { ...filter, page };

  return (
    <div className="bg-slate-50 min-h-full">
      {/* Hero: band teal solid + pattern kotak-kotak (checkerboard) yang dimask
          radial dari pojok kiri-atas: hilang di kiri-atas, muncul bertahap ke
          kanan-bawah. Search bridge putih tetap menimpa tepi bawah. */}
      <section
        className="relative overflow-hidden pt-12 sm:pt-16 pb-20 sm:pb-24"
        style={{ backgroundColor: TEAL }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-conic-gradient(rgba(255,255,255,0.07) 0% 25%, transparent 0% 50%)",
            backgroundSize: "36px 36px",
            WebkitMaskImage:
              "radial-gradient(circle at 0 0, transparent 50%, black 100%)",
            maskImage: "radial-gradient(circle at 0 0, transparent 50%, black 100%)",
          }}
        />
        <Section className="relative">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            {tr("text247")}<span className="text-amber-400">{tr("text248")}</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm sm:text-base leading-relaxed text-[#fdecce]">
            {tr("text249")}</p>
        </Section>
      </section>

      <Section className="-mt-10 relative z-10">
        {/* Enter pada input = submit (implicit submission, satu-satunya field teks) — tanpa tombol Cari.
            Jenjang tidak lagi jadi dropdown di sini; filter-nya pindah ke baris chip di bawah. */}
        <Form action={locale === 'en' ? '/en/classes' : '/classes'} prefetch={false} className="flex items-stretch rounded-2xl border border-border bg-white p-2 shadow-lg">
          <input type="hidden" name="sort" value={sort} />
          <input type="hidden" name="jenjang" value={jenjang} />
          <label className="flex flex-1 items-center gap-2 rounded-full px-3 focus-within:ring-2 focus-within:ring-brand/20">
            <svg className="h-4 w-4 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              key={q}
              type="search"
              enterKeyHint="search"
              maxLength={100}
              name="q"
              defaultValue={q}
              placeholder={tr("text250")}
              aria-label={tr("text251")}
              className="w-full bg-transparent py-2.5 text-[16px] sm:text-sm outline-none placeholder:text-muted"
            />
          </label>
        </Form>
      </Section>

      <Section className="pt-6 pb-8 sm:pb-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4 text-sm">
          <p className="text-muted">{tr("classOfflineNotice")}</p>
          <Link href="/contact" className="inline-flex min-h-11 items-center font-semibold text-brand hover:underline">
            {tr("classLocationCatalog")}
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={tr("text252")}>
            {JENJANG.map((j) => {
              const n = j === "Semua" ? semua : (jumlahJenjang[j] ?? 0);
              const on = jenjang === j;
              return (
                <Link
                  key={j}
                  href={urlKatalog(current, { jenjang: j, page: 1 })}
                  prefetch={false}
                  aria-current={on ? "true" : undefined}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    on ? "border-brand bg-brand text-white" : "border-border bg-white text-muted hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {j === "Semua" ? tr("allLevels") : j} <span className="tabular-nums opacity-75">({n})</span>
                </Link>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-sm text-muted">{tr("classesFound", {count: total})}</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label={tr("text256")}>
              {SORTS.map((s) => (
                <Link
                  key={s.value}
                  href={urlKatalog(current, { sort: s.value, page: 1 })}
                  prefetch={false}
                  aria-pressed={sort === s.value}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${sort === s.value ? "bg-brand text-white border-brand" : "bg-white border-border text-muted hover:border-foreground hover:text-foreground"}`}
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
