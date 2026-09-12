import Link from "next/link";
import { Section } from "@/components/ui/section";
import { KelasGrid } from "@/components/kelas-card";
import { JenjangSelect } from "@/components/jenjang-select";
import { kelasAktifPublik, toKelasKatalog, type KelasKatalog } from "@/lib/kelas";

export const dynamic = "force-dynamic";

const JENJANG = ["Semua", "TK", "SD", "SMP", "SMA"] as const;
const SORTS = [
  { value: "terbaru", label: "Terbaru" },
  { value: "termurah", label: "Termurah" },
  { value: "termahal", label: "Termahal" },
] as const;

export default async function ClassesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const jenjang = typeof sp.jenjang === "string" ? sp.jenjang : "Semua";
  const sort = typeof sp.sort === "string" ? sp.sort : "terbaru";

  let items: KelasKatalog[] = (await kelasAktifPublik()).map(toKelasKatalog);
  items = items.filter((k) => {
    const okJenjang = jenjang === "Semua" || k.jenjang === jenjang;
    const okQ = !q || `${k.mapel} ${k.guru} ${k.jadwal}`.toLowerCase().includes(q.toLowerCase());
    return okJenjang && okQ;
  });
  if (sort === "termurah") items = [...items].sort((a, b) => a.biayaPeriode - b.biayaPeriode);
  if (sort === "termahal") items = [...items].sort((a, b) => b.biayaPeriode - a.biayaPeriode);

  const qs = (over: Record<string, string>) =>
    new URLSearchParams({ ...(q ? { q } : {}), ...(jenjang !== "Semua" ? { jenjang } : {}), ...(over.sort && over.sort !== "terbaru" ? { sort: over.sort } : {}) }).toString();

  return (
    <div className="bg-slate-50 min-h-full">
      {/* Hero oranye ramping — search bar melayang menimpa tepi bawah */}
      <section className="bg-accent pt-12 sm:pt-16 pb-20 sm:pb-24">
        <Section>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Katalog kelas</h1>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-amber-50 max-w-2xl">
            Temukan program bimbingan belajar terbaik yang dirancang khusus
            untuk setiap jenjang pendidikan anak Anda.
          </p>
        </Section>
      </section>

      <Section className="-mt-10 relative z-10">
        {/* Enter pada input = submit (implicit submission, satu-satunya field teks) — tanpa tombol Cari */}
        <form action="/classes" method="get" className="flex flex-col sm:flex-row sm:items-stretch rounded-2xl border border-border bg-white p-2 shadow-lg">
          <input type="hidden" name="sort" value={sort} />
          <label className="flex flex-1 items-center gap-2 rounded-full px-3 focus-within:ring-2 focus-within:ring-brand/20">
            <svg className="h-4 w-4 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              name="q"
              defaultValue={q}
              placeholder="Cari mapel / guru / hari…"
              aria-label="Cari kelas"
              className="w-full bg-transparent py-2.5 text-[16px] sm:text-sm outline-none placeholder:text-muted"
            />
          </label>
          <div className="flex shrink-0 items-center gap-2 px-3 py-1">
            <div className="hidden sm:block w-px self-stretch bg-border my-1" aria-hidden="true" />
            <span className="text-sm font-semibold text-foreground shrink-0">Pilih Jenjang:</span>
            <span className="relative block flex-1 sm:flex-none">
              <JenjangSelect
                name="jenjang"
                value={jenjang}
                options={JENJANG.map((j) => ({ value: j, label: j === "Semua" ? "Semua jenjang" : j }))}
                className="w-full sm:w-auto cursor-pointer appearance-none rounded-full border border-brand bg-brand-soft py-2 pl-4 pr-10 text-[16px] sm:text-sm font-semibold text-foreground outline-none focus:border-brand-strong focus:ring-2 focus:ring-brand/20"
              />
              <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-brand" aria-hidden="true">
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </span>
          </div>
        </form>
      </Section>

      <Section className="py-8 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <p className="text-sm text-muted">{items.length} kelas ditemukan</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex gap-1.5" role="group" aria-label="Urutkan kelas">
              {SORTS.map((s) => (
                <Link
                  key={s.value}
                  href={`/classes?${qs({ sort: s.value })}`}
                  aria-pressed={sort === s.value}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${sort === s.value ? "bg-brand text-white border-brand" : "bg-white border-border text-muted hover:border-foreground hover:text-foreground"}`}
                >
                  {s.label}
                </Link>
              ))}
            </div>
            <Link href="/about" className="text-sm font-semibold text-brand hover:underline">Butuh bantuan memilih?</Link>
          </div>
        </div>
        <div className="mt-6">
          <KelasGrid items={items} />
        </div>
      </Section>
    </div>
  );
}
