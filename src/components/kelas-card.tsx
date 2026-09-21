import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BookOpen, Calculator, Check } from "lucide-react";
import { rupiah } from "@/lib/format";
import type { JenjangKatalog, KelasKatalog } from "@/lib/kelas";

/**
 * Kartu katalog /classes
 * Blok atas berwarna dengan judul dan deskripsi.
 * Daftar manfaat bercentang hijau, pemisah putus-putus, dan tombol CTA.
 */
const TEMA: Record<JenjangKatalog, { blok: string; aksen: string }> = {
  TK: { blok: "#fde7f0", aksen: "#db4d84" },
  SD: { blok: "#e1ecfd", aksen: "#2563eb" },
  SMP: { blok: "#ddf3e7", aksen: "#128a52" },
  SMA: { blok: "#fdf0d4", aksen: "#c07803" },
};

const ORANYE = "#f26d0f"; // CTA

function daftarFitur(k: KelasKatalog, tr: (key: string, values?: Record<string, string | number>) => string): string[] {
  const sisa = Math.max(0, k.kuota.maksimum - k.kuota.terisi);
  const kursiLabel = sisa <= 0
    ? "Kuota kelas sudah penuh"
    : sisa <= 5 && k.kuota.maksimum > 5
      ? `${tr("cardAvailableSeats", { available: sisa, total: k.kuota.maksimum })} (hampir penuh)`
      : tr("cardAvailableSeats", { available: sisa, total: k.kuota.maksimum });

  const skema =
    k.biayaDp !== null
      ? tr("cardDown", {
          amount: rupiah(k.biayaDp),
          installments: k.tenorMaksimum ? tr("cardInstallments", { count: Math.max(0, k.tenorMaksimum - 1) }) : "",
        })
      : "Pembayaran lunas satu kali";

  return [
    tr("schedule", { value: k.jadwal }),
    tr("teacher", { value: k.guru }),
    tr("term", { value: k.periode }),
    kursiLabel,
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
      {/* Blok atas berwarna */}
      <div className="relative overflow-hidden p-5" style={{ backgroundColor: t.blok }}>
        <BookOpen
          aria-hidden
          className="pointer-events-none absolute -right-3 -top-3 size-24 opacity-25 transition-transform duration-300 group-hover:scale-105"
          style={{ color: t.aksen }}
          strokeWidth={1.75}
        />
        <Calculator
          aria-hidden
          className="pointer-events-none absolute bottom-1 right-12 size-14 opacity-20 transition-transform duration-300 group-hover:scale-105"
          style={{ color: t.aksen }}
          strokeWidth={1.75}
        />

        {/* Judul mapel + jenjang sebagai teks biasa */}
        <div className="relative">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[19px] font-extrabold leading-tight text-[#16213a]">{k.mapel}</h3>
            <div className="flex shrink-0 flex-col items-end gap-1 text-right">
              <span className="text-xs font-bold text-[#16213a]">Jenjang {k.jenjang}</span>
              {penuh ? (
                <span className="text-xs font-bold text-slate-700">{tr("text188")}</span>
              ) : hampir ? (
                <span className="text-xs font-bold" style={{ color: t.aksen }}>{tr("text189")}</span>
              ) : null}
            </div>
          </div>
          {k.tingkat ? (
            <p className="mt-1 text-xs font-semibold" style={{ color: t.aksen }}>{k.tingkat}</p>
          ) : null}
        </div>

        <p className="relative mt-2 text-[13px] leading-snug text-[#5b6472]">
          {k.mapelDeskripsi?.trim() || `${k.guru} - ${k.periode}`}
        </p>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <ul className="space-y-3 pb-5">
          {daftarFitur(k, tr).map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-700">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-white shadow-2xs" aria-hidden="true">
                <Check className="size-3.5 text-white" strokeWidth={3} />
              </span>
              <span>{f}</span>
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
