import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/section";
import { BlokHukumView } from "@/components/ui/legal-block";
import { TableOfContents } from "@/components/ui/table-of-contents";
import { getPrivasi } from "@/lib/privacy-policy";
import { LegalHeader } from "@/components/legal/legal-header";
import { LegalTakeaways } from "@/components/legal/legal-takeaways";
import { LegalSectionCard } from "@/components/legal/legal-section-card";
import { LegalContactCard } from "@/components/legal/legal-contact-card";
import { BackToTop } from "@/components/ui/back-to-top";
import {
  ShieldCheck,
  HeartHandshake,
  CreditCard,
  UserCheck,
  Database,
  CheckCircle2,
  BookOpen,
  Share2,
  UserCog,
  Lock,
  RefreshCw,
  Mail,
  LucideIcon,
} from "lucide-react";

// Pemetaan ikon untuk tiap bagian klausul privasi
const PRIVACY_ICON_MAP: Record<string, LucideIcon> = {
  data: Database,
  anak: ShieldCheck,
  persetujuan: CheckCircle2,
  penggunaan: BookOpen,
  pembayaran: CreditCard,
  "pihak-ketiga": Share2,
  "retensi-hak": UserCog,
  keamanan: Lock,
  perubahan: RefreshCw,
  kontak: Mail,
};

export default async function PrivacyPage() {
  const tr = await getTranslations("public");
  const { meta: PRIVASI_META, sections: PRIVASI_SECTIONS } = getPrivasi(tr);

  // 4 Poin Kunci Keamanan & Hak Privasi
  const privacyTakeaways = [
    {
      icon: ShieldCheck,
      title: tr("privacyTakeaway1Title"),
      description: tr("privacyTakeaway1Desc"),
    },
    {
      icon: HeartHandshake,
      title: tr("privacyTakeaway2Title"),
      description: tr("privacyTakeaway2Desc"),
    },
    {
      icon: CreditCard,
      title: tr("privacyTakeaway3Title"),
      description: tr("privacyTakeaway3Desc"),
    },
    {
      icon: UserCheck,
      title: tr("privacyTakeaway4Title"),
      description: tr("privacyTakeaway4Desc"),
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
          currentDoc="privacy"
          title={PRIVASI_META.judul}
          summary={PRIVASI_META.ringkasan}
          updatedAt={PRIVASI_META.diperbarui}
          readTime={PRIVASI_META.waktuBaca}
          privacyLabel={tr("legalPrivacyTab")}
          termsLabel={tr("legalTermsTab")}
          lastUpdatedLabel={tr("text308")}
          readTimeLabel={tr("text309")}
        />

        {/* 4 Kartu Poin Kunci (TL;DR) */}
        <div className="mt-8">
          <LegalTakeaways
            sectionTitle={tr("legalTakeawaysTitle")}
            sectionSubtitle={tr("legalTakeawaysSubtitle")}
            items={privacyTakeaways}
          />
        </div>

        {/* Layout Dokumen Utama (TOC Sidebar + Pasal Terstruktur) */}
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

          <article className="min-w-0 space-y-6">
            {PRIVASI_SECTIONS.map((s) => {
              const Icon = PRIVACY_ICON_MAP[s.id] || ShieldCheck;
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
                badge={tr("legalBadge")}
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
