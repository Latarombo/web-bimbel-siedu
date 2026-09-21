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
    "Halo Admin Siedu, saya ingin bertanya seputar bimbingan belajar Siedu."
  )}`;

  return (
    <div className="relative min-h-full bg-slate-50">
      {/* Hero: pola visual mengikuti hero katalog dan detail produk */}
      <section className="relative z-10 overflow-hidden bg-[#1d4ed8] pt-6 pb-16 text-white shadow-xs sm:pt-8 sm:pb-20 lg:pt-10 lg:pb-24">
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
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            {tr("text289")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-base">
            {tr("text290")}
          </p>
        </Section>
      </section>

      {/* Peta Lokasi & Explorer Cabang: Split View Showcase (Overlap Halus dengan Hero) */}
      <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10">
        <PetaCabangExplorer />
      </div>

      {/* Section Informasi & Form: 2 Kolom (4 Kartu Info di Kiri + Form Pesan di Kanan) */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pt-14 sm:pb-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-8 items-start">
          {/* Kolom Kiri: 4 Kartu Modular (Gaya Referensi Nurul Fikri) */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {/* 1. Kartu Lokasi (Pusat & Cabang) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="mb-3.5 flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-900 border border-slate-200 shadow-2xs shrink-0">
                  <MapPin className="size-4.5" strokeWidth={2.2} />
                </span>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Lokasi:</h3>
              </div>
              <div className="space-y-3.5 text-xs sm:text-sm text-slate-600">
                <div>
                  <span className="font-bold text-slate-900 block">(Kantor Pusat)</span>
                  <p className="mt-1 leading-relaxed">
                    {KANTOR_PUSAT.alamat}
                  </p>
                  <a
                    href={MAPS_SEARCH_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
                  >
                    <ExternalLink className="size-3.5 text-slate-900" />
                    Buka di Google Maps
                  </a>
                </div>
                <div className="pt-3 border-t border-dashed border-slate-200/80">
                  <span className="font-bold text-slate-900 block">(Kantor Cabang)</span>
                  <div className="mt-0.5">
                    <CabangScrollTrigger />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Kartu Telepon Kami */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="mb-3.5 flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-900 border border-slate-200 shadow-2xs shrink-0">
                  <Phone className="size-4.5" strokeWidth={2.2} />
                </span>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Telepon Kami:</h3>
              </div>
              <div className="space-y-1.5 text-xs sm:text-sm">
                <div>
                  <a
                    href={telpHref}
                    className="font-medium text-slate-700 hover:text-brand hover:underline transition-colors"
                  >
                    {SITE.telepon}
                  </a>
                </div>
                <div>
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-slate-700 hover:text-brand hover:underline transition-colors"
                  >
                    {SITE.whatsapp} (WA)
                  </a>
                </div>
              </div>
            </div>

            {/* 3. Kartu Email Kami */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="mb-3.5 flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-900 border border-slate-200 shadow-2xs shrink-0">
                  <Mail className="size-4.5" strokeWidth={2.2} />
                </span>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Email Kami:</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                <a
                  href={`mailto:${SITE.email}`}
                  className="font-medium text-slate-700 hover:text-brand hover:underline transition-colors"
                >
                  {SITE.email}
                </a>
              </p>
            </div>

            {/* 4. Kartu Jam Kerja */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="mb-3.5 flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-900 border border-slate-200 shadow-2xs shrink-0">
                  <Clock className="size-4.5" strokeWidth={2.2} />
                </span>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Jam Kerja:</h3>
              </div>
              <div className="text-xs sm:text-sm text-slate-600 space-y-0.5">
                <p className="font-medium text-slate-800">Senin hingga Sabtu, 09.00 – 17.00 WIB</p>
                <p className="text-xs text-slate-500">Minggu & Libur Nasional: Tutup</p>
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
