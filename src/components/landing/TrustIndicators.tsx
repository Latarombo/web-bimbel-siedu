import { getTranslations } from "next-intl/server";
/**
 * Section 02 — Trust Indicators (mockup baru: D:\Screenshot 2026-09-14 210952.png).
 * Kartu putih memanjang, border abu tipis, sudut membulat, TANPA shadow;
 * 4 kolom sama rata, angka gelap besar di tengah, label abu di bawahnya,
 * pemisah vertikal pendek antar kolom (tidak sampai penuh tingginya).
 * Mobile: grid 2x2, pemisah garis penuh (versi desktop melepas border
 * seluler supaya tidak dobel dengan garis pendek).
 * Angka naik dari 0 saat section terlihat (ala statistik Dicoding).
 * Angka siswa/kelas/guru dari DB; rating 4.8 statis (belum ada sumber data rating).
 */
import CountUp from "@/components/landing/CountUp";

export default async function TrustIndicators({
  siswa,
  kelas,
  guru,
}: {
  siswa: number;
  kelas: number;
  guru: number;
}) {
 const tr = await getTranslations("public");
  const ITEMS = [
    { value: siswa, decimals: 0, label: tr("text132") },
    { value: kelas, decimals: 0, label: tr("text133") },
    { value: guru, decimals: 0, label: tr("text134") },
    { value: 4.8, decimals: 1, label: tr("text135") },
  ];

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl grid-cols-2 rounded-2xl border border-border bg-white lg:grid-cols-4">
          {ITEMS.map((it, i) => (
            <div
              key={it.label}
              className={[
                "relative flex flex-col items-center justify-center px-4 py-9 text-center sm:px-6",
                // pemisah mobile: garis penuh 2x2; di desktop dilepas,
                // tinggal garis pendek di tengah (lihat span di bawah)
                i % 2 === 1 ? "border-l border-border lg:border-l-0" : "",
                i >= 2 ? "border-t border-border lg:border-t-0" : "",
              ].join(" ")}
            >
              {/* pemisah desktop: pendek, tidak menyentuh tepi kartu */}
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 hidden h-14 w-px -translate-y-1/2 bg-border lg:block"
                />
              )}
              <p className="text-3xl font-black tracking-tight text-slate-900 tabular-nums sm:text-4xl">
                <CountUp value={it.value} decimals={it.decimals} />
              </p>
              <p className="mt-1.5 text-sm text-slate-500">{it.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
