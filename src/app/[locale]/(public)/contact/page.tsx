import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Phone, Mail, Clock, MapPin, ExternalLink } from "lucide-react";
import { Section } from "@/components/ui/section";
import ContactForm from "@/components/ContactForm";
import PetaCabangExplorer from "@/components/contact/PetaCabangExplorer";
import { CabangScrollTrigger } from "@/components/contact/CabangScrollTrigger";
import { KANTOR_PUSAT } from "@/lib/cabang";
import { MAPS_SEARCH_URL, SITE } from "@/lib/site";
import { publicMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const tr = await getTranslations({ locale, namespace: "public" });
  return publicMetadata({
    title: tr("contactTitle"),
    description: tr("text287"),
    path: "/contact",
  });
}

interface ContactPageProps {
  searchParams?: Promise<{ cabang?: string; tab?: string }>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const tr = await getTranslations("public");
  const sp = searchParams ? await searchParams : undefined;
  const initialCabangId = sp?.cabang;
  const initialTab = sp?.tab === "map" || sp?.tab === "list" ? sp.tab : undefined;
  const telpHref = `tel:${SITE.telepon.replace(/\D/g, "")}`;
  const waHref = `https://wa.me/${SITE.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    tr("contactWaText")
  )}`;

  return (
    <div className="relative min-h-full bg-slate-50">
      {/* 1. HERO SECTION: Pola visual & ukuran persis halaman classes */}
      <section className="relative overflow-hidden bg-[#1d4ed8] pt-6 pb-16 text-white shadow-xs sm:pt-8 sm:pb-20 lg:pt-10 lg:pb-24">
        {/* Gelombang sudut tanpa gradient (persis halaman classes) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <svg
            className="absolute -right-8 -top-8 w-72 sm:w-96 md:w-[480px]"
            viewBox="0 0 400 280"
            fill="none"
          >
            <path d="M120 0 C200 45, 290 110, 400 240 L400 0 Z" fill="white" fillOpacity="0.05" />
            <path d="M190 0 C260 40, 330 95, 400 180 L400 0 Z" fill="white" fillOpacity="0.07" />
            <path d="M270 0 C325 30, 365 65, 400 120 L400 0 Z" fill="white" fillOpacity="0.09" />
          </svg>

          <svg
            className="absolute -left-8 -bottom-8 w-64 sm:w-80 md:w-[420px]"
            viewBox="0 0 360 260"
            fill="none"
          >
            <path d="M0 60 C90 105, 180 175, 280 260 L0 260 Z" fill="white" fillOpacity="0.05" />
            <path d="M0 120 C75 155, 145 205, 210 260 L0 260 Z" fill="white" fillOpacity="0.07" />
            <path d="M0 180 C50 205, 100 230, 140 260 L0 260 Z" fill="white" fillOpacity="0.08" />
          </svg>
        </div>

        <Section className="relative flex flex-col items-center px-4 text-center">
          <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
            {tr("text289")}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100 sm:text-base">
            {tr("text290")}
          </p>
        </Section>
      </section>

      {/* 2. SALURAN KONTAK CEPAT & FORMULIR PESAN: Overlap persis pola halaman classes (-mt-14 sm:-mt-16) */}
      <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-14 sm:-mt-16">
        <h2 className="sr-only">{tr("contactInfoHeading")}</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 items-start">
          {/* Kolom Kiri: 4 Kartu Info Kontak Terpadu */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5 sm:gap-4">
            {/* 1. Kartu Lokasi */}
            <div className="group rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all">
              <div className="mb-3.5 flex items-center gap-2.5">
                <MapPin className="size-5 shrink-0 text-slate-700" strokeWidth={2} />
                <h3 className="font-bold text-slate-900 text-base">{tr("contactLocationHeading")}</h3>
              </div>
              <div className="space-y-4 text-sm text-slate-600">
                <div>
                  <span className="font-semibold text-slate-900 block">{tr("contactHeadOffice")}</span>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {tr("contactHeadOfficeDesc")}
                  </p>
                  <p className="mt-2 leading-relaxed text-slate-600">
                    {KANTOR_PUSAT.alamat}
                  </p>
                  <a
                    href={MAPS_SEARCH_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
                  >
                    <ExternalLink className="size-4" />
                    <span>{tr("openGoogleMaps")}</span>
                  </a>
                </div>
                <div className="pt-3 border-t border-dashed border-slate-200">
                  <span className="font-semibold text-slate-900 block">{tr("contactBranchOffice")}</span>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    {tr("contactBranchDesc")}
                  </p>
                  <div className="mt-2.5">
                    <CabangScrollTrigger />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Kartu Telepon Kami */}
            <div className="group rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all">
              <div className="mb-3.5 flex items-center gap-2.5">
                <Phone className="size-5 shrink-0 text-slate-700" strokeWidth={2} />
                <h3 className="font-bold text-slate-900 text-base">{tr("contactPhoneHeading")}</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                    {tr("contactCardOfficeLabel")}
                  </span>
                  <a
                    href={telpHref}
                    className="mt-1 inline-block text-sm font-semibold text-slate-900 hover:text-brand hover:underline transition-colors"
                  >
                    {SITE.telepon}
                  </a>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                    {tr("contactCardWaLabel")}
                  </span>
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm font-semibold text-slate-900 hover:text-brand hover:underline transition-colors"
                  >
                    {SITE.whatsapp}
                  </a>
                </div>
              </div>
            </div>

            {/* 3. Kartu Email Kami */}
            <div className="group rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all">
              <div className="mb-3.5 flex items-center gap-2.5">
                <Mail className="size-5 shrink-0 text-slate-700" strokeWidth={2} />
                <h3 className="font-bold text-slate-900 text-base">{tr("contactEmailHeading")}</h3>
              </div>
              <div className="text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  {tr("contactCardEmailLabel")}
                </span>
                <a
                  href={`mailto:${SITE.email}`}
                  className="mt-1 inline-block text-sm font-semibold text-slate-900 hover:text-brand hover:underline transition-colors break-all"
                >
                  {SITE.email}
                </a>
              </div>
            </div>

            {/* 4. Jam Operasional */}
            <div className="group rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all">
              <div className="mb-3.5 flex items-center gap-2.5">
                <Clock className="size-5 shrink-0 text-slate-700" strokeWidth={2} />
                <h3 className="font-bold text-slate-900 text-base">{tr("contactHoursHeading")}</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                    {tr("contactCardHoursLabel")}
                  </span>
                  <p className="mt-1 font-semibold text-slate-900">{tr("contactHoursWeekdays")}</p>
                </div>
                <p className="text-xs text-slate-500 pt-2 border-t border-dashed border-slate-200">
                  {tr("contactHoursClosed")}
                </p>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Card Kirim Pesan */}
          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </div>
      </div>

      {/* 3. PETA LOKASI & EXPLORER CABANG: Section dengan Heading Lengkap Referensi Landing Page */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-16 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-28">
        <div className="mx-auto max-w-2xl text-center mb-8 sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-2.5">
            {tr("contactMapHeading")}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {tr("branchExplorerTitle")}
          </h2>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-muted">
            {tr("branchModalSubtitle")}
          </p>
        </div>
        <PetaCabangExplorer
          initialCabangId={initialCabangId}
          initialTab={initialTab}
        />
      </section>
    </div>
  );
}
