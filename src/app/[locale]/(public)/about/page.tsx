import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/section";
import TestimonialSection from "@/components/TestimonialTeacher";
import FinalCta from "@/components/landing/FinalCta";
import { Link } from "@/i18n/navigation";
import { kelasAktifPublik, guruDariKelasAktif } from "@/lib/kelas";
import { ArrowRight, Quote } from "lucide-react";

export const dynamic = "force-dynamic";

// === PALET ABOUT (brand blue) ===
// Mengikuti landing page: blue-600 sebagai aksen, navy hero untuk bidang gelap,
// dan blue-300 agar aksen tetap terbaca di atas navy.
const TEAL    = "#2563eb";
const TEAL_LT = "#93c5fd";
const NAVY    = "#0f235f";

/** Frame foto editorial: backdrop glow halus, border putih, shadow premium.
 *  Aspek ratio 3/2 di mobile (lebih landscape & hemat vertikal),
 *  4/5 di lg+ (portrait, seimbang dengan kolom teks di sebelahnya). */
function EditorialFrame({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className="relative w-full">
      {/* Soft blue backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-4 rounded-3xl bg-blue-200/40 blur-3xl"
      />
      {/* Frame putih — shadow mengikuti navy landing */}
      <div
        className="relative overflow-hidden rounded-2xl border border-white/80 bg-white p-2 lg:rounded-3xl lg:p-3"
        style={{ boxShadow: "0 20px 60px -12px rgba(15,35,95,0.12)" }}
      >
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-slate-100 lg:aspect-[4/5] lg:rounded-2xl">
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            className="object-cover object-top"
            sizes="(min-width: 1024px) 44vw, 92vw"
          />
        </div>
      </div>
    </div>
  );
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
      {/* ─── 1. HERO ─────────────────────────────────────────────────────
          bg: putih  |  kicker: TEAL  |  H1: NAVY + TEAL
          body: slate-600  |  CTA link: NAVY hover→TEAL
      ─────────────────────────────────────────────────────────────────── */}
      <Section className="pt-16 pb-14 sm:pt-20 sm:pb-20 lg:pt-28 lg:pb-32">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16 xl:gap-24">
          {/* Teks kiri */}
          <div className="order-1 space-y-7 lg:order-1">
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

          {/* Foto kanan / bawah */}
          <div className="order-2 px-4 sm:px-12 lg:order-2 lg:px-0">
            <EditorialFrame
              src="/images/hero_actor.png"
              alt="Orang tua dan anak belajar bersama"
              priority
            />
          </div>
        </div>
      </Section>

      {/* ─── 2. EVOLUSI (Cara Lama → Siedu) ─────────────────────────────
          bg: slate-50  |  kicker: TEAL  |  H2: NAVY
          aspek label: TEAL  |  teks lama: slate-400  |  teks baru: NAVY
          arrow: amber-500 (konsisten dengan landing page)
      ─────────────────────────────────────────────────────────────────── */}
      <div id="evolusi" className="border-y border-slate-100 bg-slate-50">
        <Section className="py-16 sm:py-20 lg:py-32">
          <div className="relative grid items-start gap-10 lg:grid-cols-[340px_1fr] lg:gap-20 xl:grid-cols-[380px_1fr] xl:gap-28">
            {/* Panel kiri — sticky di desktop */}
            <div className="space-y-4 lg:sticky lg:top-36">
              {/* Kicker — TEAL di bg slate-50 */}
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: TEAL }}
              >
                Transformasi
              </p>
              {/* H2 — NAVY */}
              <h2
                className="text-2xl font-black leading-[1.15] tracking-tight sm:text-3xl lg:text-4xl"
                style={{ color: NAVY }}
              >
                {t("compare.titleBefore")}{" "}
                <span style={{ color: TEAL }}>Siedu</span>
              </h2>
              {/* Lead — slate-500 (= token --muted #64748b) */}
              <p className="text-sm leading-relaxed text-slate-500 sm:text-base">
                {t("compare.lead")}
              </p>
            </div>

            {/* Panel kanan — items scrollable */}
            <div className="space-y-10 sm:space-y-14 lg:mt-2 lg:space-y-24 xl:space-y-32">
              {banding.map((item, idx) => (
                <div key={idx} className="group">
                  {/* Aspek label + divider — TEAL */}
                  <div className="mb-5 flex items-center gap-3 lg:mb-7">
                    <span
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: TEAL }}
                    >
                      {item.aspek}
                    </span>
                    <div className="h-px flex-grow bg-slate-200" />
                  </div>

                  <div className="space-y-4 lg:space-y-6">
                    {/* Cara lama — slate-400, dicoret */}
                    <p className="text-base font-medium leading-snug text-slate-400 line-through decoration-slate-300 sm:text-lg lg:text-2xl xl:text-3xl">
                      {item.lama}
                    </p>

                    {/* Siedu — NAVY, arrow amber */}
                    <div className="flex items-start gap-3 lg:gap-5">
                      <ArrowRight className="mt-0.5 size-5 shrink-0 text-amber-500 lg:mt-1 lg:size-7 xl:size-8" />
                      <p
                        className="text-lg font-black leading-snug tracking-tight sm:text-xl lg:text-2xl xl:text-[2rem]"
                        style={{ color: NAVY }}
                      >
                        {item.baru}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>

      {/* ─── 3. VISI & MISI ──────────────────────────────────────────────
          bg: NAVY  |  kicker Visi: TEAL_LT (di bg gelap)
          teks Visi: putih  |  kicker Misi: slate-400 (di bg gelap)
          nomor misi: bg TEAL/30 + teks TEAL_LT  |  teks misi: slate-300
          Divider Visi: TEAL
      ─────────────────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: NAVY }}>
        <Section className="py-16 text-white sm:py-20 lg:py-32">
          {/* Quote icon — TEAL di bg NAVY, hanya lg+ */}
          <Quote
            className="mb-8 hidden size-16 opacity-40 lg:mb-12 lg:block lg:size-20"
            fill="currentColor"
            style={{ color: TEAL }}
          />

          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20 xl:gap-28">
            {/* Visi */}
            <div>
              {/* Kicker — TEAL_LT di bg NAVY */}
              <p
                className="mb-5 text-xs font-bold uppercase tracking-widest lg:mb-6"
                style={{ color: TEAL_LT }}
              >
                {t("mission.visionLabel")}
              </p>
              {/* Pernyataan — putih, teks panjang skala realistis */}
              <p className="text-balance text-xl font-black leading-[1.25] tracking-tight text-white sm:text-2xl lg:text-3xl xl:text-4xl">
                &ldquo;{t("mission.vision")}&rdquo;
              </p>
              {/* Divider bar — TEAL */}
              <div
                className="mt-6 h-1 w-16 rounded-full"
                style={{ backgroundColor: TEAL }}
              />
            </div>

            {/* Misi */}
            <div>
              {/* Kicker Misi — slate-400 di bg gelap (netral, beda dari Visi) */}
              <p className="mb-6 border-b border-slate-700 pb-4 text-xs font-bold uppercase tracking-widest text-slate-400 lg:mb-8">
                {t("mission.missionLabel")}
              </p>
              <ul className="space-y-6 lg:space-y-8">
                {misi.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    {/* Nomor — bg TEAL/30 + teks TEAL_LT */}
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-black lg:size-10 lg:rounded-xl lg:text-base"
                      style={{
                        backgroundColor: `${TEAL}4d`, // TEAL + 30% opacity hex
                        color: TEAL_LT,
                      }}
                    >
                      0{idx + 1}
                    </span>
                    {/* Teks misi — slate-300 di bg gelap */}
                    <span className="text-sm leading-relaxed text-slate-300 sm:text-base lg:text-lg">
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
      <div className="bg-white">
        <Section className="pb-8 pt-16 sm:pt-20 lg:pt-28">
          <div className="mx-auto max-w-2xl text-center">
            {/* Kicker — TEAL di bg putih */}
            <p
              className="mb-4 text-xs font-bold uppercase tracking-widest"
              style={{ color: TEAL }}
            >
              Tim Pengajar
            </p>
            {/* H2 — NAVY + aksen TEAL */}
            <h2
              className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl"
              style={{ color: NAVY }}
            >
              Wajah di Balik{" "}
              <span style={{ color: TEAL }}>Kelas</span>
            </h2>
            {/* Body — slate-500 (= token --muted) */}
            <p className="mt-4 text-sm leading-relaxed text-slate-500 sm:text-base lg:mt-5">
              Merekalah yang mewujudkan visi dan misi kami di ruang belajar
              setiap harinya.
            </p>
          </div>
        </Section>

        <TestimonialSection gurus={guruTampil} />
      </div>

      {/* ─── 5. FINAL CTA ────────────────────────────────────────────── */}
      <FinalCta />
    </div>
  );
}
