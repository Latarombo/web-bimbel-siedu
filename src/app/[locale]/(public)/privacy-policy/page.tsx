import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/section";
import { BlokHukumView } from "@/components/ui/legal-block";
import { TableOfContents } from "@/components/ui/table-of-contents";
import { getPrivasi } from "@/lib/privacy-policy";
import { LegalHeader } from "@/components/legal/legal-header";
import { BackToTop } from "@/components/ui/back-to-top";

export default async function PrivacyPage() {
  const tr = await getTranslations("public");
  const { meta: PRIVASI_META, sections: PRIVASI_SECTIONS } = getPrivasi(tr);

  return (
    <div className="relative min-h-screen bg-slate-50/70">
      {/* Ambient Lighting Glow Bersih & Elegan */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-24 -right-24 size-[650px] rounded-full bg-linear-to-bl from-blue-500/15 via-sky-400/10 to-transparent blur-[110px]" />
        <div className="absolute -bottom-32 -left-32 size-[600px] rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      <Section className="relative z-10 py-10 lg:py-14">
        {/* Header Terintegrasi */}
        <LegalHeader
          currentDoc="privacy"
          title={PRIVASI_META.judul}
          summary={PRIVASI_META.ringkasan}
          updatedAt={PRIVASI_META.diperbarui}
          readTime={PRIVASI_META.waktuBaca}
          privacyLabel={tr("legalPrivacyTab")}
          termsLabel={tr("legalTermsTab")}
          lastUpdatedLabel={tr("text308")}
          readTimeLabel={tr("text309")}
          pills={false}
        />

        {/* Layout Dokumen Utama (TOC Sidebar + Konten Satu Card) */}
        <div className="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10 items-start">
          <TableOfContents
            title={tr("text314")}
            sections={PRIVASI_SECTIONS.map((s) => ({
              id: s.id,
              judul: s.judul,
            }))}
            searchPlaceholder={tr("legalSearchPlaceholder")}
            emptySearchText={tr("legalSearchEmpty")}
          />

          {/* Satu Card Utuh */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-2xs">
            {PRIVASI_SECTIONS.map((s, idx) => (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                {idx > 0 && (
                  <hr className="my-6 border-t border-slate-100" />
                )}
                <h2 className="text-lg font-bold leading-snug tracking-tight text-foreground sm:text-xl">
                  {s.judul}
                </h2>
                <div className="mt-3 space-y-4 text-sm leading-relaxed text-body sm:text-base sm:leading-7">
                  {s.blok.map((b, i) => (
                    <BlokHukumView key={i} blok={b} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </Section>

      {/* Floating Back to Top Button */}
      <BackToTop label={tr("legalBackToTop")} />
    </div>
  );
}
