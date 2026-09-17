import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BookOpen, Calculator, Check, GraduationCap } from "lucide-react";
import { rupiah } from "@/lib/format";
import type { JenjangKatalog, KelasKatalog } from "@/lib/kelas";

/**
 * Kartu katalog /classes — struktur meniru kartu produk bayar.ruangguru.com:
 * blok atas berwarna (judul + deskripsi di DALAM blok), daftar manfaat bercentang
 * hijau tanpa scroll internal agar jadwal dan biaya langsung terbaca,
 * pemisah putus-putus, harga merah, CTA oranye selebar kartu.
 * Warna: HEX literal di komponen ini (bukan token globals), konsisten dgn pola
 * ClassCatalog landing. Ilustrasi watermark = ikon lucide opacity rendah (flat).
 */
const TEMA: Record<JenjangKatalog, { blok: string; aksen: string }> = {
  TK: { blok: "#fde7f0", aksen: "#db4d84" },
  SD: { blok: "#e1ecfd", aksen: "#2563eb" },
  SMP: { blok: "#ddf3e7", aksen: "#128a52" },
  SMA: { blok: "#fdf0d4", aksen: "#c07803" },
};

const ORANYE = "#f26d0f"; // CTA, selevel dgn tombol produk di referensi

function daftarFitur(k: KelasKatalog, tr: (key: string, values?: Record<string, string | number>) => string): string[] {
  const skema =
    k.biayaDp !== null
      ? tr("cardDown", {amount: rupiah(k.biayaDp), installments: k.tenorMaksimum ? tr("cardInstallments", {count: Math.max(0, k.tenorMaksimum - 1)}) : ""})
      : tr("text185");
  return [
    tr("schedule", {value: k.jadwal}),
    tr("teacher", {value: k.guru}),
    tr("term", {value: k.periode}),
    tr("cardAvailableSeats", {available: Math.max(0, k.kuota.maksimum - k.kuota.terisi), total: k.kuota.maksimum}),
    skema,
  ];
}

export async function KelasCardView({ k }: { k: KelasKatalog }) {
 const tr = await getTranslations("public");
  const t = TEMA[k.jenjang];
  const penuh = k.kuota.terisi >= k.kuota.maksimum;
  const hampir = !penuh && k.kuota.terisi / k.kuota.maksimum >= 0.85;

  return (
    <Link
      href={`/classes/${k.id}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Blok atas berwarna: badge + judul + deskripsi, watermark ikon samar */}
      <div className="relative overflow-hidden px-5 pb-5 pt-5" style={{ backgroundColor: t.blok }}>
        <BookOpen aria-hidden className="absolute -right-4 -top-4 size-24 text-white/50" strokeWidth={1.5} />
        <Calculator aria-hidden className="absolute bottom-2 right-10 size-14 text-white/40" strokeWidth={1.5} />
        <div className="relative flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-bold"
            style={{ color: t.aksen }}
          >
            <GraduationCap className="size-3.5" /> {k.jenjang}
          </span>
          {penuh ? (
            <span className="rounded-full bg-slate-700 px-3 py-1 text-[11px] font-bold text-white">{tr("text188")}</span>
          ) : hampir ? (
            <span className="rounded-full px-3 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: t.aksen }}>
              {tr("text189")}</span>
          ) : null}
        </div>
        <h3 className="relative mt-3 text-[19px] font-extrabold leading-tight text-[#16213a]">{k.mapel}</h3>
        <p className="relative mt-1 text-[13px] leading-snug text-[#5b6472]">
          {k.mapelDeskripsi?.trim() || `${k.guru} · ${k.periode}`}
        </p>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {/* Informasi kelas tetap terlihat; harga rata bawah mengikuti tinggi baris. */}
        <ul className="space-y-3 pb-5">
          {daftarFitur(k, tr).map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm leading-relaxed text-gray-700">
              <span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full bg-emerald-500" aria-hidden="true">
                <Check className="size-3 text-white" strokeWidth={3} />
              </span>
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-auto border-t border-dashed border-gray-300 pt-4">
          <p className="text-xs font-medium text-gray-500">{tr("text190")}</p>
          <p className="mt-0.5 text-xl font-extrabold leading-none text-[#e11d48]">
            {rupiah(k.biayaPeriode)}
            <span className="ml-1 text-xs font-semibold text-gray-500">{tr("text191")}</span>
          </p>
          <span
            className={`mt-4 flex min-h-11 w-full items-center justify-center rounded-lg py-3 text-sm font-bold transition-[filter] group-hover:brightness-95 ${penuh ? "text-slate-700" : "text-white"}`}
            style={{ backgroundColor: penuh ? "#e5e7eb" : ORANYE }}
          >
            {penuh ? tr("text192") : tr("text193")}
          </span>
        </div>
      </div>
    </Link>
  );
}

export async function KelasGrid({ items }: { items: KelasKatalog[] }) {
 const tr = await getTranslations("public");
  if (items.length === 0)
    return <p className="text-sm text-muted py-8 text-center border border-dashed border-border rounded-2xl">{tr("text194")}</p>;
  return (
    <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((k) => (
        <KelasCardView key={k.id} k={k} />
      ))}
    </div>
  );
}
