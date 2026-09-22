import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/section";
import { BlokHukumView } from "@/components/ui/legal-block";
import { TableOfContents } from "@/components/ui/table-of-contents";
import { getSyarat } from "@/lib/syarat-ketentuan";
import { LegalHeader } from "@/components/legal/legal-header";
import { LegalTakeaways } from "@/components/legal/legal-takeaways";
import { LegalSectionCard } from "@/components/legal/legal-section-card";
import { LegalContactCard } from "@/components/legal/legal-contact-card";
import { BackToTop } from "@/components/ui/back-to-top";
import {
  UserCheck,
  Receipt,
  RotateCcw,
  BookMarked,
  Compass,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  CalendarCheck,
  Building2,
  Scale,
  Shield,
  RefreshCw,
  Gavel,
  Mail,
  LucideIcon,
  FileText,
} from "lucide-react";

// Pemetaan ikon untuk tiap bagian syarat & ketentuan
const TERMS_ICON_MAP: Record<string, LucideIcon> = {
  cakupan: Compass,
  akun: UserCheck,
  penggunaan: BookOpen,
  pendaftaran: ClipboardCheck,
  pembayaran: CreditCard,
  pembatalan: RotateCcw,
  presensi: CalendarCheck,
  lembaga: Building2,
  "tanggung-jawab": Scale,
  privasi: Shield,
  perubahan: RefreshCw,
  hukum: Gavel,
  kontak: Mail,
};

export default async function TermsPage() {
  const tr = await getTranslations("public");
  const { meta: SYARAT_META, sections: SYARAT_SECTIONS } = getSyarat(tr);

  // 4 Poin Kunci Ketentuan Layanan
  const termsTakeaways = [
    {
      icon: UserCheck,
      title: tr("termsTakeaway1Title"),
      description: tr("termsTakeaway1Desc"),
    },
    {
      icon: Receipt,
      title: tr("termsTakeaway2Title"),
      description: tr("termsTakeaway2Desc"),
    },
    {
      icon: RotateCcw,
      title: tr("termsTakeaway3Title"),
      description: tr("termsTakeaway3Desc"),
    },
    {
      icon: BookMarked,
      title: tr("termsTakeaway4Title"),
      description: tr("termsTakeaway4Desc"),
    },
  ];

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
          currentDoc="terms"
          title={SYARAT_META.judul}
          summary={SYARAT_META.ringkasan}
          updatedAt={SYARAT_META.diperbarui}
          readTime={SYARAT_META.waktuBaca}
          privacyLabel={tr("legalPrivacyTab")}
          termsLabel={tr("legalTermsTab")}
          lastUpdatedLabel={tr("text316")}
          readTimeLabel={tr("text317")}
        />

        {/* 4 Kartu Poin Kunci (TL;DR) */}
        <div className="mt-8">
          <LegalTakeaways
            sectionTitle={tr("legalTakeawaysTitle")}
            sectionSubtitle={tr("legalTakeawaysSubtitle")}
            items={termsTakeaways}
          />
        </div>

        {/* Layout Dokumen Utama (TOC Sidebar + Pasal Terstruktur) */}
        <div className="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10 items-start">
          <TableOfContents
            title={tr("text322")}
            sections={SYARAT_SECTIONS.map((s) => ({
              id: s.id,
              judul: s.judul,
            }))}
            searchPlaceholder={tr("legalSearchPlaceholder")}
            emptySearchText={tr("legalSearchEmpty")}
          />

          <article className="min-w-0 space-y-6">
            {SYARAT_SECTIONS.map((s) => {
              const Icon = TERMS_ICON_MAP[s.id] || FileText;
              return (
                <LegalSectionCard
                  key={s.id}
                  id={s.id}
                  title={s.judul}
                  icon={Icon}
                  copyLinkLabel={tr("legalCopyLink")}
                  copiedLabel={tr("legalLinkCopied")}
                >
                  {s.blok.map((b, i) => (
                    <BlokHukumView key={i} blok={b} />
                  ))}
                </LegalSectionCard>
              );
            })}

            {/* Banner Kontak Legal di Akhir Dokumen */}
            <div className="pt-4">
              <LegalContactCard
                title={tr("legalNeedHelpTitle")}
                description={tr("legalNeedHelpDesc")}
                contactButtonText={tr("legalContactButton")}
              />
            </div>
          </article>
        </div>
      </Section>

      {/* Floating Back to Top Button */}
      <BackToTop label={tr("legalBackToTop")} />
    </div>
  );
}
