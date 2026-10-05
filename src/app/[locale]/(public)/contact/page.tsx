import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Phone, Mail, Clock, MapPin, ExternalLink } from "lucide-react";
import { Section } from "@/components/ui/section";
import ContactForm from "@/components/ContactForm";
import PetaCabangExplorer from "@/components/contact/PetaCabangExplorer";
import { CabangScrollTrigger } from "@/components/contact/CabangScrollTrigger";
import { KANTOR_PUSAT } from "@/lib/cabang";
import { MAPS_SEARCH_URL, SITE } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getTranslations("public");
  return {
    title: tr("contactTitle"),
    description: tr("text287"),
  };
}

export default async function ContactPage() {
  const tr = await getTranslations("public");
  const telpHref = `tel:${SITE.telepon.replace(/\D/g, "")}`;
  const waHref = `https://wa.me/${SITE.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    tr("contactWaText")
  )}`;

  return (
    <div className="relative min-h-full bg-slate-50">
      {/* 1. HERO SECTION: Proporsional, Tipografi Halus, Background Dinamis */}
      <section className="relative z-10 overflow-hidden bg-[#1d4ed8] pt-10 pb-16 text-white shadow-xs sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-24">
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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
            {tr("text289")}
          </h1>
          <p className="mt-2.5 max-w-xl text-xs sm:text-sm lg:text-base leading-relaxed text-blue-100/90">
            {tr("text290")}
          </p>
        </Section>
      </section>

      {/* 2. PETA LOKASI & EXPLORER CABANG: Overlap Halus & Responsif */}
      <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10 lg:-mt-12">
        <PetaCabangExplorer />
      </div>

      {/* 3. INFORMASI & FORMULIR KONTAK: 2 Kolom Responsif */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-14 sm:pt-10 sm:pb-18 lg:pt-12 lg:pb-20">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 items-start">
          {/* Kolom Kiri: 4 Kartu Info Kontak Terpadu (p-4 sm:p-5, Aksen Warna Semantik) */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5 sm:gap-4">
            {/* 1. Kartu Lokasi */}
            <div className="group rounded-2xl border border-slate-200/90 bg-white p-4.5 sm:p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all">
              <div className="mb-3 flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80 shadow-2xs shrink-0 transition-transform group-hover:scale-105">
                  <MapPin className="size-4.5" strokeWidth={2} />
                </span>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">{tr("contactLocationHeading")}</h3>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-slate-600">
                <div>
                  <span className="font-bold text-slate-900 block">{tr("contactHeadOffice")}</span>
                  <p className="mt-1 leading-relaxed text-slate-600">
                    {KANTOR_PUSAT.alamat}
                  </p>
                  <a
                    href={MAPS_SEARCH_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
                  >
                    <ExternalLink className="size-3.5" />
                    <span>{tr("openGoogleMaps")}</span>
                  </a>
                </div>
                <div className="pt-2.5 border-t border-dashed border-slate-200">
                  <span className="font-bold text-slate-900 block">{tr("contactBranchOffice")}</span>
                  <div className="mt-0.5">
                    <CabangScrollTrigger />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Kartu Telepon Kami */}
            <div className="group rounded-2xl border border-slate-200/90 bg-white p-4.5 sm:p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all">
              <div className="mb-3 flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/80 shadow-2xs shrink-0 transition-transform group-hover:scale-105">
                  <Phone className="size-4.5" strokeWidth={2} />
                </span>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">{tr("contactPhoneHeading")}</h3>
              </div>
              <div className="space-y-2 text-xs sm:text-sm">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">Kantor:</span>
                  <a
                    href={telpHref}
                    className="font-bold text-slate-800 hover:text-brand hover:underline transition-colors"
                  >
                    {SITE.telepon}
                  </a>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">WhatsApp Resmi:</span>
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                  >
                    {SITE.whatsapp}
                  </a>
                </div>
              </div>
            </div>

            {/* 3. Kartu Email Kami */}
            <div className="group rounded-2xl border border-slate-200/90 bg-white p-4.5 sm:p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all">
              <div className="mb-3 flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100/80 shadow-2xs shrink-0 transition-transform group-hover:scale-105">
                  <Mail className="size-4.5" strokeWidth={2} />
                </span>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">{tr("contactEmailHeading")}</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                <a
                  href={`mailto:${SITE.email}`}
                  className="font-bold text-slate-800 hover:text-brand hover:underline transition-colors break-all"
                >
                  {SITE.email}
                </a>
              </p>
            </div>

            {/* 4. Kartu Jam Operasional */}
            <div className="group rounded-2xl border border-slate-200/90 bg-white p-4.5 sm:p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all">
              <div className="mb-3 flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 shadow-2xs shrink-0 transition-transform group-hover:scale-105">
                  <Clock className="size-4.5" strokeWidth={2} />
                </span>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">{tr("contactHoursHeading")}</h3>
              </div>
              <div className="text-xs sm:text-sm text-slate-600 space-y-1">
                <p className="font-medium text-slate-800">{tr("contactHoursWeekdays")}</p>
                <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                  {tr("contactHoursClosed")}
                </span>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Card Kirim Pesan */}
          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
