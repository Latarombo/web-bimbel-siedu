import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/section";
import TestimonialSection from "@/components/TestimonialTeacher";
import FinalCta from "@/components/landing/FinalCta";
import { Link } from "@/i18n/navigation";
import { kelasAktifPublik, guruDariKelasAktif } from "@/lib/kelas";
import { ArrowRight } from "lucide-react";
import TransformasiTimeline from "@/components/about/TransformasiTimeline";

export const dynamic = "force-dynamic";

// === PALET ABOUT (brand blue) ===
// Mengikuti landing page: blue-600 sebagai aksen, navy hero untuk bidang gelap,
// dan blue-300 agar aksen tetap terbaca di atas navy.
const TEAL    = "#2563eb";
const TEAL_LT = "#93c5fd";
const NAVY    = "#0f235f";

export default async function AboutPage() {
  const t = await getTranslations("about");
  const [kelasRows] = await Promise.all([kelasAktifPublik()]);

  const banding = t.raw("compare.rows") as {
    aspek: string;
    lama: string;
    baru: string;
  }[];
  const misi = t.raw("mission.missionItems") as string[];
  const guruTampil = guruDariKelasAktif(kelasRows).slice(0, 3);

  return (
    <div className="overflow-x-hidden bg-white">
      {/* ─── 1. HERO ─────────────────────────────────────────────────────
          bg: putih  |  kicker: TEAL  |  H1: NAVY + TEAL
          body: slate-600  |  CTA link: NAVY hover→TEAL
      ─────────────────────────────────────────────────────────────────── */}
      <Section className="pt-12 pb-14 sm:pt-16 sm:pb-18 lg:pt-20 lg:pb-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-12 xl:gap-16">
          {/* Teks kiri */}
          <div className="order-1 space-y-6 sm:space-y-7 lg:order-1">
            {/* Kicker — TEAL di bg terang */}
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: TEAL }}
            >
              Cerita di balik Siedu
            </p>

            {/* H1 — NAVY, aksen TEAL */}
            <h1
              className="max-w-xl text-balance text-3xl font-black leading-[1.15] tracking-tight sm:text-4xl lg:max-w-none lg:text-5xl xl:text-6xl"
              style={{ color: NAVY }}
            >
              {t("story.titleBefore")}{" "}
              <span style={{ color: TEAL }}>
                {t("story.titleHighlight")}
              </span>
            </h1>

            {/* Body — slate-600 (= token --body #475569) */}
            <div className="max-w-xl space-y-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              <p>{t("story.p1")}</p>
              <p className="hidden sm:block">{t("story.p2")}</p>
            </div>

            {/* CTA link — NAVY default, hover TEAL */}
            <div className="pt-2">
              <Link
                href="#evolusi"
                className="group inline-flex items-center gap-3 text-sm font-bold transition-colors sm:text-base"
                style={{ color: NAVY }}
              >
                Lihat transformasi kami
                <span className="flex size-9 items-center justify-center rounded-full bg-slate-100 transition-all group-hover:translate-x-1.5 group-hover:bg-slate-200">
                  <ArrowRight className="size-4 sm:size-5" />
                </span>
              </Link>
            </div>
          </div>

          {/* Ilustrasi kanan / bawah — tanpa frame/card putih, proporsional */}
          <div className="order-2 flex items-center justify-center px-2 sm:px-6 lg:order-2 lg:px-0">
            <div className="relative w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[520px] xl:max-w-[560px]">
              <Image
                src="/images/about_hero_ilustration.png"
                alt={t("story.photoAlt") || "Ilustrasi platform Siedu"}
                width={1000}
                height={1086}
                priority
                className="h-auto w-full object-contain select-none"
                sizes="(min-width: 1280px) 560px, (min-width: 1024px) 50vw, (min-width: 640px) 480px, 92vw"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ─── 2. EVOLUSI (Cara Lama → Siedu: Animated Timeline Scroll) ── */}
      <TransformasiTimeline
        kicker="Transformasi"
        titleBefore={t("compare.titleBefore")}
        titleHighlight="Siedu"
        lead={t("compare.lead")}
        rows={banding}
      />

      {/* ─── 3. VISI & MISI ──────────────────────────────────────────────
          bg: NAVY  |  H2: putih + highlight TEAL_LT (di bg gelap)
          Visi: label TEAL_LT + pull-quote border-l TEAL_LT + catatan slate-400
          Misi: label TEAL_LT, list divide-white/10, nomor TEAL_LT polos
      ─────────────────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: NAVY }}>
        <Section className="py-12 text-white sm:py-16 lg:py-20">
          {/* Heading */}
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {t("mission.titleBefore")}{" "}
              <span style={{ color: TEAL_LT }}>
                {t("mission.titleHighlight")}
              </span>
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 sm:mt-10 lg:mt-12 lg:grid-cols-12 lg:gap-12 xl:gap-16 items-start">
            {/* Visi (5 cols on lg) */}
            <div className="lg:col-span-5">
              <p
                className="mb-3 text-xs font-bold uppercase tracking-wider sm:mb-3.5"
                style={{ color: TEAL_LT }}
              >
                {t("mission.visionLabel")}
              </p>
              <div
                className="border-l-2 pl-4 sm:pl-5"
                style={{ borderColor: TEAL_LT }}
              >
                <p className="text-base font-bold leading-relaxed text-slate-100 sm:text-lg lg:text-xl">
                  {t("mission.vision")}
                </p>
                <p className="mt-3.5 text-xs leading-relaxed text-slate-400 sm:text-sm">
                  {t("mission.visionNote")}
                </p>
              </div>
            </div>

            {/* Misi (7 cols on lg) */}
            <div className="lg:col-span-7">
              <p
                className="mb-3 text-xs font-bold uppercase tracking-wider sm:mb-3.5"
                style={{ color: TEAL_LT }}
              >
                {t("mission.missionLabel")}
              </p>
              <ul className="divide-y divide-white/10 border-t border-white/10">
                {misi.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-3.5 py-3 sm:py-3.5">
                    {/* Nomor polos */}
                    <span
                      className="shrink-0 pt-0.5 text-xs font-bold tabular-nums sm:text-sm"
                      style={{ color: TEAL_LT }}
                    >
                      0{idx + 1}
                    </span>
                    {/* Teks misi */}
                    <span className="text-xs leading-relaxed text-slate-300 sm:text-sm lg:text-[15px]">
                      {m}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>
      </div>

      {/* ─── 4. GURU ─────────────────────────────────────────────────────
          bg: putih  |  kicker: TEAL  |  H2: NAVY + span TEAL
          body: slate-500
      ─────────────────────────────────────────────────────────────────── */}
      {guruTampil.length > 0 && (
        <div className="bg-white">
          <Section className="pb-4 pt-16 sm:pt-20 lg:pt-28">
            <div className="mx-auto max-w-2xl text-center">
              {/* Kicker — TEAL di bg putih */}
              <p
                className="mb-4 text-xs font-bold uppercase tracking-widest"
                style={{ color: TEAL }}
              >
                {t("teachers.kicker")}
              </p>
              {/* H2 — NAVY + aksen TEAL */}
              <h2
                className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl"
                style={{ color: NAVY }}
              >
                {t("teachers.titleBefore")}{" "}
                <span style={{ color: TEAL }}>
                  {t("teachers.titleHighlight")}
                </span>
              </h2>
              {/* Body — slate-500 (= token --muted) */}
              <p className="mt-4 text-sm leading-relaxed text-slate-500 sm:text-base lg:mt-5">
                {t("teachers.lead")}
              </p>
            </div>
          </Section>

          <TestimonialSection gurus={guruTampil} />
        </div>
      )}

      {/* ─── 5. FINAL CTA ────────────────────────────────────────────── */}
      <FinalCta />
    </div>
  );
}
