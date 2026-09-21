import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowUpRight, Blocks, Backpack, School, GraduationCap } from "lucide-react";
import { Section } from "@/components/ui/section";
import type { JenjangKatalog } from "@/lib/kelas";

/**
 * Section "Pilih jenjang" di landing page, letaknya di antara ServicesCards dan FeatureSplit.
 * Combo referensi (hunt 14 Sep): struktur baris 4 kartu rata ala Kidedu,
 * (dribbble.com/shots/25907604) + perilaku pertanyaan jenjang + jumlah nyata ala
 * pembuka ruangguru.com + skin tint pastel per jenjang yang sudah dipakai kartu
 * katalog /classes (kelas-card.tsx TEMA) supaya satu keluarga.
 * Jumlah kelas per jenjang dari DB (prop), bukan angka hiasan; jenjang 0 kelas
 * tetap tampil tapi bilang jujur "Belum ada kelas dibuka".
 */

type JenjangInfo = {
  j: JenjangKatalog;
  usia: string;
  desc: string;
  blok: string;
  aksen: string;
  /** varian gelap aksen utk teks kecil (usia); aksen asli lolos 3:1 saja,
      cukup utk ikon/arrow, tidak utk teks. Semua pasangan teksAksen/blok >= 5:1 */
  teksAksen: string;
  Icon: typeof Blocks;
};

/* TEMA disalin dari kelas-card.tsx supaya katalog dan section ini tak pernah drift
   warnanya; keduanya hex literal, bukan token globals (pola yang sama). */


export default async function JenjangCards({
  counts,
}: {
  counts: Partial<Record<JenjangKatalog, number>>;
}) {
 const tr = await getTranslations("public");
const JENJANG: JenjangInfo[] = [
  {
    j: "TK",
    usia: tr("text78"),
    desc: tr("text79"),
    blok: "#fde7f0",
    aksen: "#db4d84",
    teksAksen: "#a92f66",
    Icon: Blocks,
  },
  {
    j: "SD",
    usia: tr("text80"),
    desc: tr("text81"),
    blok: "#e1ecfd",
    aksen: "#2563eb",
    teksAksen: "#1d4ed8",
    Icon: Backpack,
  },
  {
    j: "SMP",
    usia: tr("text82"),
    desc: tr("text83"),
    blok: "#ddf3e7",
    aksen: "#128a52",
    teksAksen: "#0d6e41",
    Icon: School,
  },
  {
    j: "SMA",
    usia: tr("text84"),
    desc: tr("text85"),
    blok: "#fdf0d4",
    aksen: "#c07803",
    teksAksen: "#8a5a00",
    Icon: GraduationCap,
  },
];

  return (
    <Section className="py-14 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          {tr("text86")}<span className="text-brand">{tr("text87")}</span>
        </h2>
        <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted">
          {tr("text88")}</p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {JENJANG.map(({ j, usia, desc, blok, aksen, teksAksen, Icon }) => {
          const n = counts[j] ?? 0;
          return (
            <Link
              key={j}
              href={`/classes?jenjang=${j}`}
              className="group relative flex min-h-[200px] flex-col overflow-hidden rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: blok }}
              aria-label={tr("levelClasses", {level: j, availability: n === 0 ? tr("text89") : tr("activeClasses", {count: n})})}
            >
              {/* Ikon Watermark Latar Belakang (Lebih Besar & Terlihat Jelas) */}
              <Icon
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-4 -right-4 size-28 sm:size-32 transition-all duration-300 group-hover:scale-105 group-hover:opacity-35"
                style={{ color: aksen, opacity: 0.25 }}
                strokeWidth={1.75}
              />
              <div className="relative flex items-center justify-between">
                <p className="text-2xl font-extrabold leading-none text-[#16213a]">{j}</p>
                {/* Expanding Pill Button */}
                <div
                  className="flex h-9 items-center rounded-full text-white shadow-2xs transition-all duration-300 ease-out pl-0 pr-0 group-hover:pl-3.5 group-hover:pr-2.5"
                  style={{ backgroundColor: aksen }}
                  aria-hidden="true"
                >
                  <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-bold opacity-0 transition-all duration-300 ease-out group-hover:max-w-[100px] group-hover:opacity-100 group-hover:mr-1.5">
                    {tr("text145")}
                  </span>
                  <span className="grid size-9 place-items-center shrink-0">
                    <ArrowUpRight
                      className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      strokeWidth={2.5}
                    />
                  </span>
                </div>
              </div>
              <p className="relative mt-2 text-[13px] font-semibold" style={{ color: teksAksen }}>
                {usia}
              </p>
              <p className="relative mt-1.5 text-[13px] leading-snug text-[#5b6472]">{desc}</p>
              <p className="relative mt-auto pt-3 text-[13px] font-bold text-[#16213a]">
                {n === 0 ? tr("text90") : tr("activeClasses", {count: n})}
              </p>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}
