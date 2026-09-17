import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { Section } from "@/components/ui/section";
import TestimonialSection from "@/components/TestimonialTeacher";
import FinalCta from "@/components/landing/FinalCta";
import { Link } from "@/i18n/navigation";
import { collect } from "@/lib/collect";
import { db } from "@/prisma/db";
import { kelasAktifPublik, toKelasKatalog, guruDariKelasAktif } from "@/lib/kelas";
import { ArrowRight, BookOpen, CalendarCheck, Check, GraduationCap, Library, Minus, Quote, Users } from "lucide-react";

export const dynamic = "force-dynamic";

/* Sistem warna = persis yang dipakai komponen landing (desain user), tidak menambah hue baru:
   krem #fdecce = panggung hangat | teal #227195 = band/label | biru #2563eb = aksi | amber = coretan dekorasi
   #e1ecfd = chip jenjang (pola katalog lama).
   Ritme: teal(hero) - putih(kartu bukti) - navy(kutipan) - putih - krem(prinsip) - navy(guru) - putih(tabs) - biru CTA.
   Tidak ada dua panggung sama yang bertetangga. */
const KREM = "#fdecce";
const TEAL = "#227195";
const NAVY = "#0e2f45";

/* Ornamen — SVG inline, gaya coretan (pola bimbel.ai / Lektorat) */
function Doodle({ className, kind }: { className: string; kind: "star" | "squiggle" | "cross" | "loop" }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" fill="none">
      {kind === "star" && (
        <path d="M20 2l3.6 11.4L35 20l-11.4 3.6L20 35l-3.6-11.4L5 20l11.4-3.6z" fill="currentColor" />
      )}
      {kind === "squiggle" && (
        <path d="M4 26c6-14 10-14 16 0s10 14 16 0" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      )}
      {kind === "cross" && (
        <path d="M8 8l24 24M32 8L8 32" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      )}
      {kind === "loop" && (
        <path d="M6 30c-6-10 4-22 12-16s2 18 8 14 6-14-2-16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      )}
    </svg>
  );
}

/* Bingkai foto ala FeatureSplit landing: border putih tebal + blob asimetris di belakang */
function BingkaiBlob({
  src,
  alt,
  blobColor,
  blokKelas,
}: {
  src: string;
  alt: string;
  blobColor: string;
  blokKelas?: string;
}) {
  return (
    <div className={`relative ${blokKelas ?? ""}`}>
      <span
        aria-hidden="true"
        className="absolute inset-0 -bottom-5 -left-5 rounded-t-[60px] rounded-tr-[60px] rounded-br-[60px]"
        style={{ backgroundColor: blobColor }}
      />
      <div className="relative w-full rounded-[44px] border-[10px] border-white bg-white shadow-sm">
        {/* sizes + lazy: gambar full-width, dua pemakaian (max-w-xl hero / kolom grid) */}
        <Image
          src={src}
          alt={alt}
          width={800}
          height={560}
          loading="lazy"
          sizes="(min-width: 1024px) 40vw, 92vw"
          className="h-auto w-full rounded-[34px]"
        />
      </div>
    </div>
  );
}

/* Warna kartu nilai inti tetap di kode (desain), teksnya dari kamus 'about'. */
const warnaTiga = [
  { latar: "#e7f1fd", aksenChip: "#cfe2fb", chipTeks: "#1d4ed8", body: "#2e4559" },
  { latar: "#fbf1d8", aksenChip: "#f6e3ba", chipTeks: "#8a6208", body: "#474e5c" },
  { latar: "#e3f2ec", aksenChip: "#cde8db", chipTeks: "#0f6c42", body: "#2f4a3a" },
];
const warnaHero = { inisialBg: "rgba(255,255,255,0.12)", label: "#8fd0f2", body: "#bcd6ea" };

export default async function AboutPage() {
  const t = await getTranslations("about");
 const locale = (await getLocale()) === "en" ? "en" : "id";

  /* Angka statistik: dari DB riil (pola TrustIndicators landing, tanpa rating palsu). */
  const [kelasRows, users, anaks, mapels] = await Promise.all([
    kelasAktifPublik(),
    collect(db.orm.public.User.all()),
    collect(db.orm.public.Anak.all()),
    collect(db.orm.public.MataPelajaran.all()),
  ]);
  const statistik = [
    { ikon: Users, angka: anaks.length, label: t("stats.children") },
    { ikon: BookOpen, angka: kelasRows.map((row) => toKelasKatalog(row, locale)).length, label: t("stats.classes") },
    { ikon: GraduationCap, angka: users.filter((u) => u.role === "guru").length, label: t("stats.teachers") },
    { ikon: Library, angka: mapels.length, label: t("stats.subjects") },
  ];
  /* Tabel perbandingan + list: kamus menyimpan array, t.raw mengembalikan JSON-nya. */
  const banding = t.raw("compare.rows") as { aspek: string; lama: string; baru: string }[];
  const masalah = t.raw("problems.items") as string[];
  const jawaban = t.raw("answers.items") as string[];
  const misi = t.raw("mission.missionItems") as string[];
  const nilaiTiga = (t.raw("values.items") as { initial: string; title: string; body: string }[]).map((n, i) => ({
    ...n,
    ...warnaTiga[i],
  }));
  /* Kartu "Kata guru": pengajar berkelas aktif, maksimal 3 (grid 3 kolom),
     urut kelas terbanyak — hasil agregasi DB, bukan nama karangan. */
  const guruTampil = guruDariKelasAktif(kelasRows).slice(0, 3);

  return (
    <div>
      {/* 1. HERO — band teal solid + pernyataan tengah besar dengan satu kata di-highlight
          + ornamen geometris berserak (pola Eduvance) + foto dibingkai putih di bawahnya. */}
      <div className="relative overflow-hidden" style={{ backgroundColor: TEAL }}>
        <Doodle kind="star" className="absolute left-[7%] top-24 hidden w-9 text-[#fdecce]/60 lg:block" />
        <Doodle kind="cross" className="absolute right-[9%] top-16 hidden w-6 text-white/25 lg:block" />
        <Doodle kind="loop" className="absolute bottom-44 left-[13%] hidden w-12 text-white/15 lg:block" />
        <span aria-hidden="true" className="absolute right-[15%] top-40 hidden size-5 rotate-12 bg-[#fdecce]/50 lg:block" />
        <span aria-hidden="true" className="absolute left-[26%] top-14 hidden size-3 rotate-45 bg-white/30 lg:block" />
        <Section className="pt-14 pb-32 text-center sm:pt-20 sm:pb-36">
          {/* Ukuran heading turun di HP (aturan heading <640px), kembali ke 5xl di layar besar */}
          <h1 className="mx-auto max-w-4xl text-3xl text-balance font-black leading-[1.06] tracking-tight text-white sm:text-4xl lg:text-5xl">
            {t("hero.titleBefore")}{" "}
            <span className="relative inline-block text-amber-400">
              <span className="relative">{t("hero.titleHighlight")}</span>
              <svg viewBox="0 0 120 12" className="absolute -bottom-1.5 left-0 w-full text-amber-400" aria-hidden="true" fill="none">
                <path d="M2 9c30-6 60-7 116-3" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </span>
            {t("hero.titleAfter")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#fdecce] sm:text-lg">
            {t("hero.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-bold text-gray-900 hover:bg-amber-400"
            >
              {t("hero.ctaRegister")} <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/classes"
              className="rounded-lg border border-white/60 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              {t("hero.ctaClasses")}
            </Link>
          </div>

          <div className="mx-auto mt-12 max-w-xl">
            <BingkaiBlob src="/images/right-hero.png" alt={t("hero.photoAlt")} blobColor="#2563eb" />
          </div>
        </Section>
      </div>

      {/* 2+3. KARTU BUKTI di batas band + PULL QUOTE navy. Kartu absolute menempel di tepi
          atas band navy dengan -translate-y-1/2 sehingga selalu separuh di teal separuh di
          navy (pola stats-bridge halaman About IT Institute) tanpa margin-collapse. */}
      <div className="relative">
        <Section className="absolute inset-x-0 top-0 z-10 -translate-y-1/2">
          <div className="mx-auto grid max-w-3xl gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(14,47,69,0.16)] sm:grid-cols-2 sm:p-7">
            <p className="flex items-center gap-3 text-sm font-bold text-foreground sm:text-base">
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: "#e1ecfd" }}>
                <Check className="size-5 text-[#227195]" />
              </span>
              {t("proof.quota")}
            </p>
            <p className="flex items-center gap-3 text-sm font-bold text-foreground sm:text-base">
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: "#e1ecfd" }}>
                <CalendarCheck className="size-5 text-[#227195]" />
              </span>
              {t("proof.attendance")}
            </p>
          </div>
        </Section>
        <div className="relative overflow-hidden" style={{ backgroundColor: NAVY }}>
          <Quote className="absolute left-[5%] top-1/2 hidden size-24 -translate-y-1/2 text-white/10 lg:block" fill="currentColor" />
          <Quote className="absolute right-[5%] bottom-4 hidden size-14 rotate-180 text-white/10 md:block" fill="currentColor" />
          <Section className="pt-24 pb-14 text-center sm:pt-28 sm:pb-16">
            <p className="mx-auto max-w-3xl text-xl leading-snug font-black text-balance text-white sm:text-2xl xl:text-3xl">
              &ldquo;{t("quote.text")}&rdquo;
            </p>
            <p className="mt-4 text-sm font-semibold text-[#fdecce]">{t("quote.caption")}</p>
          </Section>
        </div>
      </div>

      {/* 3b. STAT BAR — angka dari DB riil, gaya Dicoding About (ikon + angka besar + label).
          Panggung krem biar ritme teal-navy-krem-putih terjaga; tiap angka bisa dicek admin. */}
      <div className="border-y border-[#e8c587]" style={{ backgroundColor: KREM }}>
        <Section className="py-10 sm:py-12">
          <div className="grid grid-cols-2 gap-y-8 lg:grid-cols-4">
            {statistik.map(({ ikon: Ikon, angka, label }) => (
              <div key={label} className="flex items-center justify-center gap-3 lg:justify-start">
                <span
                  aria-hidden="true"
                  className="grid size-11 shrink-0 place-items-center rounded-lg bg-white"
                >
                  <Ikon className="size-5" style={{ color: TEAL }} />
                </span>
                <div>
                  <p className="text-2xl font-black tracking-tight tabular-nums text-foreground sm:text-3xl">{angka}</p>
                  <p className="text-sm text-slate-600">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* 4. CERITA + MASALAH — luka orang tua dulu, baru solusinya */}
      <Section className="py-14 sm:py-16">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {t("story.titleBefore")} <span className="text-brand">{t("story.titleHighlight")}</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              {t("story.p1")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              {t("story.p2")}
            </p>
            <div className="mt-8">
              <BingkaiBlob src="/images/hero-illustration.png" alt={t("story.photoAlt")} blobColor="#f59e0b" />
            </div>
          </div>
          <div className="rounded-lg border border-[#e8c587] p-6 sm:p-8" style={{ backgroundColor: KREM }}>
            <h3 className="text-lg font-black text-foreground">{t("problems.title")}</h3>
            <ul className="mt-5 space-y-4">
              {masalah.map((m) => (
                <li key={m} className="flex items-start gap-3 text-sm leading-relaxed text-slate-700">
                  <Minus className="mt-0.5 size-4 shrink-0 text-[#db4d84]" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
            <div className="my-6 h-px bg-[#e8b96b]" />
            <p className="text-sm font-bold" style={{ color: TEAL }}>
              {t("problems.bridge")}
            </p>
            <ul className="mt-4 space-y-4">
              {jawaban.map((j) => (
                <li key={j} className="flex items-start gap-3 text-sm leading-relaxed text-slate-700">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                  <span>{j}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* 5. TABEL PERBANDINGAN — cara lama vs Siedu */}
      <div className="border-y border-border bg-white">
        <Section className="py-14 sm:py-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {t("compare.titleBefore")} <span className="text-brand">Siedu</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {t("compare.lead")}
            </p>
          </div>
          <div className="mt-8 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">{t("compare.caption")}</caption>
              <thead>
                <tr>
                  <th scope="col" className="bg-surface px-4 py-3 text-left font-bold text-slate-600 sm:px-6">{t("compare.colAspect")}</th>
                  <th scope="col" className="bg-surface px-4 py-3 text-left font-bold text-slate-600 sm:px-6">{t("compare.colOld")}</th>
                  <th scope="col" className="bg-brand px-4 py-3 text-left font-bold text-white sm:px-6">Siedu</th>
                </tr>
              </thead>
              <tbody>
                {banding.map((r) => (
                  <tr key={r.aspek} className="border-t border-border">
                    <th scope="row" className="bg-surface px-4 py-4 text-left align-top font-bold text-foreground sm:px-6">
                      {r.aspek}
                    </th>
                    <td className="px-4 py-4 align-top leading-relaxed text-slate-600 sm:px-6">{r.lama}</td>
                    <td className="bg-[#e1ecfd] px-4 py-4 align-top font-medium leading-relaxed text-foreground sm:px-6">
                      {r.baru}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      {/* 6. NILAI INTI — bento: hero card navy + tiga kartu tint */}
      <Section className="py-14 sm:py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t("values.titleBefore")} <span className="text-brand">{t("values.titleHighlight")}</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {t("values.lead")}
          </p>
        </div>

        <div className="mt-10 grid items-stretch gap-4 lg:grid-cols-[1.15fr_1fr]">
          {/* Hero card — nilai utama, ukuran paling besar */}
          <div
            className="relative flex flex-col justify-between overflow-hidden rounded-lg p-6 sm:p-10"
            style={{ backgroundColor: NAVY }}
          >
            <Doodle kind="star" className="absolute right-6 top-6 w-8 text-[#8fd0f2]/40" />
            <div>
              <span
                className="inline-flex size-12 items-center justify-center rounded-lg text-xl font-black text-white"
                style={{ backgroundColor: warnaHero.inisialBg }}
              >
                {t("values.hero.initial")}
              </span>
              <h3 className="mt-6 text-2xl font-black leading-tight text-white">{t("values.hero.title")}</h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed" style={{ color: warnaHero.body }}>
                {t("values.hero.body")}
              </p>
            </div>
            <p className="mt-10 text-xs font-bold" style={{ color: warnaHero.label }}>
              {t("values.hero.footnote")}
            </p>
          </div>

          {/* Trio kartu tint — satu keluarga warna pastel, chip huruf sebagai aksen */}
          <div className="grid gap-4 lg:grid-rows-3">
            {nilaiTiga.map((n) => (
              <div key={n.title} className="rounded-lg p-6 sm:p-7" style={{ backgroundColor: n.latar }}>
                <div className="flex items-start gap-4">
                  <span
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-base font-black"
                    style={{ backgroundColor: n.aksenChip, color: n.chipTeks }}
                  >
                    {n.initial}
                  </span>
                  <div>
                    <h3 className="font-bold text-foreground">{n.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed" style={{ color: n.body }}>
                      {n.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 6b. VISI & MISI — kerangka LearningRoom/Bintang Pelajar (pernyataan visi + misi
          bertanda), kulit sendiri: panggung krem, dua panel kartu, register formal. */}
      <div style={{ backgroundColor: KREM }}>
        <div className="border-y border-[#e8c587]">
          <Section className="py-14 sm:py-16">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {t("mission.titleBefore")} <span className="text-brand">{t("mission.titleHighlight")}</span>
              </h2>
            </div>
            <div className="mt-8 grid items-stretch gap-5 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
                <h3 className="text-lg font-black" style={{ color: TEAL }}>{t("mission.visionLabel")}</h3>
                <p className="mt-4 text-sm leading-relaxed text-slate-700 sm:text-base">
                  {t("mission.vision")}
                </p>
                <p className="mt-6 border-t border-dashed border-slate-200 pt-5 text-sm leading-relaxed text-slate-600">
                  {t("mission.visionNote")}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
                <h3 className="text-lg font-black" style={{ color: TEAL }}>{t("mission.missionLabel")}</h3>
                <ul className="mt-4 space-y-4">
                  {misi.map((m) => (
                    <li key={m} className="flex items-start gap-3 text-sm leading-relaxed text-slate-700 sm:text-base">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-white ring-1 ring-slate-200"
                      >
                        <Check className="size-3.5" style={{ color: TEAL }} />
                      </span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>
        </div>
      </div>

      {/* 7. PENGAJAR — TestimonialTeacher: panggung putih, kartu tumpang tindih
          ala ruangkelas (badge + foto lavender + kotak kutipan). Data guru dari DB. */}
      <TestimonialSection gurus={guruTampil} />

      {/* 8. CTA AKHIR — pakai komponen landing persis (FinalCta), bukan fork */}
      <FinalCta />
    </div>
  );
}
