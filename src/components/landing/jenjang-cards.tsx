import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowUpRight, Blocks, Backpack, School, GraduationCap } from "lucide-react";
import { Section } from "@/components/ui/section";
import type { JenjangKatalog } from "@/lib/kelas";

/**
 * Section "Pilih jenjang" di landing page.
 * Gaya Seamless Connected Grid (Tanpa jarak / gap-0, sudut tegas / sharp corners):
 * - 4 kartu jenjang menyatu dalam satu kontainer bingkai presisi dengan pembatas garis 1px
 * - Sudut tegas tanpa rounded (rectangular modern / architectural look)
 * - Banner gambar tinggi (aspect-4/3) dengan badge usia di pojok gambar
 * - Logo tiap jenjang sebagai watermark halus di latar belakang kartu putih
 * - Interaksi mikro dinamis saat hover (elevasi kartu, zoom gambar, highlight bar)
 */

type JenjangTheme = {
  j: JenjangKatalog;
  usia: string;
  desc: string;
  highlight: string;
  subjects: string[];
  imageSrc: string;
  badgeClass: string;
  hoverTitleClass: string;
  hoverChipClass: string;
  hoverFooterClass: string;
  hoverBarClass: string;
  watermarkColor: string;
  Icon: typeof Blocks;
};

export default async function JenjangCards({
  counts,
}: {
  counts: Partial<Record<JenjangKatalog, number>>;
}) {
  const tr = await getTranslations("public");

  const JENJANG: JenjangTheme[] = [
    {
      j: "TK",
      usia: tr("text78"),
      desc: tr("text79"),
      highlight: tr("jenjangHighlightTK"),
      subjects: tr("jenjangSubjectsTK").split(", "),
      imageSrc: "/images/jenjang/tk.jpg",
      badgeClass:
        "bg-white/95 text-rose-700 border-rose-200/80 group-hover:scale-105 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600 group-hover:shadow-md group-hover:shadow-rose-600/25",
      hoverTitleClass: "group-hover:text-rose-600",
      hoverChipClass: "group-hover:border-rose-200 group-hover:bg-rose-50/70 group-hover:text-rose-700",
      hoverFooterClass: "group-hover:bg-rose-50/90 group-hover:text-rose-700 group-hover:border-rose-200/80",
      hoverBarClass: "bg-rose-500",
      watermarkColor: "#e11d48",
      Icon: Blocks,
    },
    {
      j: "SD",
      usia: tr("text80"),
      desc: tr("text81"),
      highlight: tr("jenjangHighlightSD"),
      subjects: tr("jenjangSubjectsSD").split(", "),
      imageSrc: "/images/jenjang/sd.jpg",
      badgeClass:
        "bg-white/95 text-blue-700 border-blue-200/80 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 group-hover:shadow-md group-hover:shadow-blue-600/25",
      hoverTitleClass: "group-hover:text-blue-600",
      hoverChipClass: "group-hover:border-blue-200 group-hover:bg-blue-50/70 group-hover:text-blue-700",
      hoverFooterClass: "group-hover:bg-blue-50/90 group-hover:text-blue-700 group-hover:border-blue-200/80",
      hoverBarClass: "bg-blue-600",
      watermarkColor: "#2563eb",
      Icon: Backpack,
    },
    {
      j: "SMP",
      usia: tr("text82"),
      desc: tr("text83"),
      highlight: tr("jenjangHighlightSMP"),
      subjects: tr("jenjangSubjectsSMP").split(", "),
      imageSrc: "/images/jenjang/smp.jpg",
      badgeClass:
        "bg-white/95 text-emerald-700 border-emerald-200/80 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 group-hover:shadow-md group-hover:shadow-emerald-600/25",
      hoverTitleClass: "group-hover:text-emerald-600",
      hoverChipClass: "group-hover:border-emerald-200 group-hover:bg-emerald-50/70 group-hover:text-emerald-700",
      hoverFooterClass: "group-hover:bg-emerald-50/90 group-hover:text-emerald-700 group-hover:border-emerald-200/80",
      hoverBarClass: "bg-emerald-600",
      watermarkColor: "#059669",
      Icon: School,
    },
    {
      j: "SMA",
      usia: tr("text84"),
      desc: tr("text85"),
      highlight: tr("jenjangHighlightSMA"),
      subjects: tr("jenjangSubjectsSMA").split(", "),
      imageSrc: "/images/jenjang/sma.jpg",
      badgeClass:
        "bg-white/95 text-amber-800 border-amber-200/80 group-hover:scale-105 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600 group-hover:shadow-md group-hover:shadow-amber-600/25",
      hoverTitleClass: "group-hover:text-amber-600",
      hoverChipClass: "group-hover:border-amber-200 group-hover:bg-amber-50/70 group-hover:text-amber-800",
      hoverFooterClass: "group-hover:bg-amber-50/90 group-hover:text-amber-800 group-hover:border-amber-200/80",
      hoverBarClass: "bg-amber-600",
      watermarkColor: "#d97706",
      Icon: GraduationCap,
    },
  ];

  return (
    <Section className="py-14 sm:py-18">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {tr("text86")}<span className="text-brand">{tr("text87")}</span>
        </h2>
        <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted">
          {tr("text88")}
        </p>
      </div>

      {/* Kontainer Grid Menyatu (Tanpa Jarak & Tanpa Sudut Membulat) */}
      <div className="mt-12 border border-slate-200/90 bg-slate-200/90 shadow-sm">
        <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4">
          {JENJANG.map(
            ({
              j,
              usia,
              desc,
              highlight,
              subjects,
              imageSrc,
              badgeClass,
              hoverTitleClass,
              hoverChipClass,
              hoverFooterClass,
              hoverBarClass,
              watermarkColor,
              Icon,
            }) => {
              const n = counts[j] ?? 0;
              return (
                <Link
                  key={j}
                  href={`/classes?jenjang=${j}`}
                  className="group relative flex flex-col justify-between overflow-hidden bg-white shadow-xs transition-all duration-300 hover:z-20 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  aria-label={tr("levelClasses", {
                    level: j,
                    availability: n === 0 ? tr("comingSoonBadge") : tr("openedClassesBadge", { count: n }),
                  })}
                >
                  {/* Garis indikator aksen atas saat hover */}
                  <div
                    className={`absolute top-0 left-0 z-20 h-1 w-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${hoverBarClass}`}
                    aria-hidden="true"
                  />

                  {/* Top Image Banner dengan Floating Badges & Hover Caption Overlay */}
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100">
                    <Image
                      src={imageSrc}
                      alt={`${j} - ${usia}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-slate-950/10 to-transparent" />

                    {/* Overlay Transparan Halus dengan Kalimat Pesan (Gambar tetap terlihat jelas) */}
                    <div
                      className="absolute inset-0 z-10 flex flex-col justify-center bg-gradient-to-t from-slate-950/70 via-slate-950/35 to-slate-950/20 p-5 pb-14 opacity-0 backdrop-blur-[1.5px] transition-all duration-300 ease-out group-hover:opacity-100"
                      aria-hidden="true"
                    >
                      <p className="translate-y-2 text-xs sm:text-[13px] font-semibold leading-relaxed text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] transition-transform duration-300 ease-out group-hover:translate-y-0">
                        “{highlight}”
                      </p>
                    </div>

                    {/* Floating Age Badge di pojok kiri bawah banner dengan Efek Hover Dinamis */}
                    <div className="absolute bottom-3 left-3 z-20">
                      <span
                        className={`inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold shadow-2xs backdrop-blur-md transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-md ${badgeClass}`}
                      >
                        {usia}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="relative flex flex-1 flex-col justify-between p-5 sm:p-6 pb-6">
                    {/* Ikon Jenjang sebagai Watermark Latar Belakang Kartu Putih (Lebih Terlihat) */}
                    <Icon
                      aria-hidden="true"
                      className="pointer-events-none absolute -bottom-4 -right-4 size-28 sm:size-32 opacity-20 transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-3 group-hover:opacity-30"
                      style={{ color: watermarkColor }}
                      strokeWidth={1.75}
                    />

                    <div className="relative z-10">
                      {/* Header: Jenjang Name dengan warna hover khas tiap jenjang */}
                      <h3
                        className={`font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground transition-colors duration-200 ${hoverTitleClass}`}
                      >
                        {j}
                      </h3>

                      {/* Deskripsi */}
                      <p className="mt-3 text-[13.5px] leading-relaxed text-body">
                        {desc}
                      </p>

                      {/* Chip Mata Pelajaran Populer */}
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {subjects.map((sub) => (
                          <span
                            key={sub}
                            className={`inline-flex items-center border border-slate-200/90 bg-slate-50/80 px-2 py-0.5 text-[11px] font-medium text-slate-600 transition-colors duration-200 ${hoverChipClass}`}
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Unified Full-Width Action Bar */}
                  <div
                    className={`relative z-10 flex w-full items-center justify-between border-t border-slate-200/90 bg-slate-50/70 px-5 py-3 text-xs font-semibold text-slate-700 transition-all duration-200 sm:px-6 sm:py-3.5 ${hoverFooterClass}`}
                    aria-hidden="true"
                  >
                    <span>
                      {n > 0 ? tr("openedClassesBadge", { count: n }) : tr("comingSoonBadge")}
                    </span>
                    <ArrowUpRight
                      className="size-4 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      strokeWidth={2.2}
                    />
                  </div>
                </Link>
              );
            }
          )}
        </div>
      </div>
    </Section>
  );
}
