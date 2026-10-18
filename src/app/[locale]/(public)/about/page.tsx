import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/section";
import TestimonialSection from "@/components/TestimonialTeacher";
import FinalCta from "@/components/landing/FinalCta";
import { Link } from "@/i18n/navigation";
import { kelasAktifPublik, guruDariKelasAktif } from "@/lib/kelas";
import { ArrowRight } from "lucide-react";
import TransformasiTimeline from "@/components/about/TransformasiTimeline";
import HeroScrollPrompt from "@/components/about/HeroScrollPrompt";
import HeroIllustrationVisual from "@/components/about/HeroIllustrationVisual";
import type { Metadata } from "next";
import { publicMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const tr = await getTranslations({ locale, namespace: "public" });
  return publicMetadata({
    title: tr("metaAboutTitle"),
    description: tr("metaAboutDescription"),
    path: "/about",
  });
}



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
      {/* ─── 1. HERO (Proper & Balanced Presentation) ─────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-50/60 via-white to-white">
        {/* Ambient lighting halus di latar belakang */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 left-1/2 -z-10 h-[480px] w-full -translate-x-1/2 max-w-7xl bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(37,99,235,0.08),transparent_70%)] blur-3xl"
        />

        <Section className="relative z-10 flex min-h-[calc(100vh-5rem)] flex-col justify-center py-16 sm:py-20 lg:py-24 xl:py-28">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-12 xl:gap-16">
            {/* Teks kiri */}
            <div className="order-1 space-y-6 sm:space-y-7 lg:order-1">
              {/* H1 — Mengikuti standar font-bold dan text-foreground Landing */}
              <h1 className="max-w-xl text-balance text-3xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-4xl lg:max-w-none lg:text-5xl xl:text-[3.35rem]">
                {t("story.titleBefore")}{" "}
                <span className="text-brand">
                  {t("story.titleHighlight")}
                </span>
              </h1>

              {/* Body */}
              <div className="max-w-xl space-y-4 text-base leading-relaxed text-muted sm:text-lg">
                <p>{t("story.p1")}</p>
                <p className="hidden sm:block">{t("story.p2")}</p>
              </div>

              {/* CTA link (Khusus Mobile, Desktop tetap bersih dan fokus pada HeroScrollPrompt di bawah) */}
              <div className="pt-2 lg:hidden">
                <Link
                  href="#evolusi"
                  className="group inline-flex items-center gap-3 text-sm font-semibold text-foreground transition-colors sm:text-base hover:text-brand"
                >
                  {t("story.ctaCompare")}
                  <span className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-foreground transition-all group-hover:translate-x-1.5 group-hover:bg-blue-50 group-hover:text-brand">
                    <ArrowRight className="size-4 sm:size-5" />
                  </span>
                </Link>
              </div>
            </div>

            {/* Ilustrasi kanan / bawah — Proporsional & Responsif dengan Animasi Cosmic Orbit System */}
            <div className="order-2 flex items-center justify-center px-4 sm:px-6 lg:order-2 lg:px-0">
              <HeroIllustrationVisual photoAlt={t("story.photoAlt") || "Ilustrasi platform Siedu"} />
            </div>
          </div>

          {/* CTA link (Desktop: Tengah Bawah melayang interaktif dengan mouse scroll & fade-out saat scroll) */}
          <HeroScrollPrompt
            text={t("story.ctaCompare")}
            targetId="evolusi"
          />
        </Section>
      </div>

      {/* ─── 2. EVOLUSI (Cara Lama → Siedu: Animated Timeline Scroll) ── */}
      <TransformasiTimeline
        kicker="Transformasi"
        titleBefore={t("compare.titleBefore")}
        titleHighlight="Siedu"
        lead={t("compare.lead")}
        rows={banding}
      />

      {/* ─── 3. VISI & MISI ──────────────────────────────────────────────
          bg: #ebf3ff (selaras banner CTA)  |  Border: border-blue-200/70
          H2: NAVY (#0f235f) + highlight TEAL (#2563eb)
          Visi: label TEAL + pull-quote border-l TEAL + teks slate-800 + catatan slate-600
          Misi: label TEAL, divide-blue-200/70, nomor TEAL, teks slate-700
      ─────────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-y border-blue-200/70 bg-[#ebf3ff]">
        {/* Dekorasi lengkungan ribbon halus selaras banner CTA */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 bottom-0 w-72 sm:w-80 lg:w-[420px] overflow-hidden opacity-35"
        >
          <svg
            className="size-full"
            viewBox="0 0 500 300"
            fill="none"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 215 -20 C 220 40, 250 80, 315 75 C 375 70, 415 30, 450 30 C 480 30, 483 75, 470 125 C 455 170, 430 205, 385 235 C 330 265, 255 260, 205 270 C 165 280, 140 295, 120 325"
              stroke="#5b94e2"
              strokeWidth="36"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <Section className="relative z-10 py-10 sm:py-12 lg:py-16">
          {/* Heading */}
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-2 sm:mb-2.5">
              Komitmen Kami
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              {t("mission.titleBefore")}{" "}
              <span className="text-brand">
                {t("mission.titleHighlight")}
              </span>
            </h2>
          </div>

          <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-12 lg:gap-10 xl:gap-12 items-start">
            {/* Visi (5 cols on lg) */}
            <div className="lg:col-span-5">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-brand sm:mb-3">
                {t("mission.visionLabel")}
              </p>
              <div className="border-l-2 border-brand pl-4 sm:pl-5">
                <p className="text-base font-bold leading-relaxed text-foreground sm:text-lg lg:text-xl">
                  {t("mission.vision")}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted sm:text-sm">
                  {t("mission.visionNote")}
                </p>
              </div>
            </div>

            {/* Misi (7 cols on lg) */}
            <div className="lg:col-span-7">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-brand sm:mb-3">
                {t("mission.missionLabel")}
              </p>
              <ul className="border-t border-blue-400">
                {misi.map((m, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3.5 py-2.5 sm:py-3 border-b border-blue-400"
                  >
                    {/* Nomor polos */}
                    <span className="shrink-0 pt-0.5 text-xs font-bold tabular-nums text-brand sm:text-sm">
                      0{idx + 1}
                    </span>
                    {/* Teks misi */}
                    <span className="text-xs leading-relaxed text-body sm:text-sm lg:text-[15px]">
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
          bg: putih  |  kicker: text-brand  |  H2: text-foreground + span text-brand
          body: text-muted
      ─────────────────────────────────────────────────────────────────── */}
      {guruTampil.length > 0 && (
        <section className="bg-white py-14 sm:py-18 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-10 sm:mb-14 lg:mb-16">
              {/* Kicker */}
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-brand">
                {t("teachers.kicker")}
              </p>
              {/* H2 — Mengikuti standar font-bold dan text-foreground Landing */}
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {t("teachers.titleBefore")}{" "}
                <span className="text-brand">
                  {t("teachers.titleHighlight")}
                </span>
              </h2>
              {/* Body — text-muted standar landing */}
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted max-w-xl mx-auto">
                {t("teachers.lead")}
              </p>
            </div>

            <TestimonialSection gurus={guruTampil} />
          </div>
        </section>
      )}

      {/* ─── 5. FINAL CTA ────────────────────────────────────────────── */}
      <FinalCta />
    </div>
  );
}
