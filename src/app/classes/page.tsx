import Link from "next/link";
import { Section } from "@/components/ui/section";
import { KelasGrid } from "@/components/kelas-card";
import { KELAS } from "@/lib/placeholder";

const JENJANG = ["Semua", "TK", "SD", "SMP", "SMA"] as const;

export default async function ClassesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const jenjang = typeof sp.jenjang === "string" ? sp.jenjang : "Semua";
  const sort = typeof sp.sort === "string" ? sp.sort : "terbaru";

  let items = KELAS.filter((k) => {
    const okJenjang = jenjang === "Semua" || k.jenjang === jenjang;
    const okQ = !q || `${k.mapel} ${k.guru} ${k.hari}`.toLowerCase().includes(q.toLowerCase());
    return okJenjang && okQ;
  });
  if (sort === "termurah") items = [...items].sort((a, b) => a.biayaPeriode - b.biayaPeriode);
  if (sort === "termahal") items = [...items].sort((a, b) => b.biayaPeriode - a.biayaPeriode);

  return (
    <div className="bg-background">
      <div className="bg-white border-b border-border">
        <Section className="py-8">
          <h1 className="text-2xl font-black tracking-tight">Katalog kelas</h1>
          <p className="mt-2 text-sm text-muted max-w-2xl">
           Reuse untuk Guest (A2) & Parent (C2). Saat daftar, kelas difilter jenjang anak (BR#13). Kelas tanpa biaya DP hanya lunas (BR#12).
          </p>

          <form className="mt-6 flex flex-col lg:flex-row gap-3" action="/classes" method="get">
            <input
              name="q"
              defaultValue={q}
              placeholder="Cari mapel / guru / hari…"
              className="flex-1 rounded-full border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
            <div className="flex gap-2 overflow-x-auto">
              {JENJANG.map((j) => (
                <Link
                  key={j}
                  href={`/classes?${new URLSearchParams({ ...(q ? { q } : {}), ...(j !== "Semua" ? { jenjang: j } : {}), ...(sort !== "terbaru" ? { sort } : {}) }).toString()}`}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold border ${jenjang === j ? "bg-brand text-white border-brand" : "bg-white border-border hover:border-foreground"}`}
                >
                  {j}
                </Link>
              ))}
            </div>
            <select name="sort" defaultValue={sort} className="rounded-full border border-border bg-white px-4 py-2.5 text-sm">
              <option value="terbaru">Terbaru</option>
              <option value="termurah">Termurah</option>
              <option value="termahal">Termahal</option>
            </select>
            <button type="submit" className="rounded-full bg-brand text-white px-6 py-2.5 text-sm font-semibold hover:bg-blue-700">Cari</button>
          </form>
        </Section>
      </div>

      <Section className="py-8">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">{items.length} kelas ditemukan</p>
          <Link href="/about" className="text-sm font-semibold text-brand hover:underline">Butuh bantuan memilih?</Link>
        </div>
        <div className="mt-6">
          <KelasGrid items={items} />
        </div>
      </Section>
    </div>
  );
}
