import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import ContactForm from "@/components/ContactForm";
import PetaLokasi from "@/components/contact/PetaLokasi";
import { SITE, LOKASI_LAT, LOKASI_LNG, PETA_INTERAKTIF, mapsEmbed, MAPS_SEARCH_URL, MAPS_ATTRIBUTION_URL } from "@/lib/site";


export async function generateMetadata(): Promise<Metadata> {
 const tr = await getTranslations("public");
 return {
  title: tr("contactTitle"),
  description:
    tr("text287"),
};
}

// Ikon feather-style inline, stroke currentColor, nol dependency.
function Icon({ d, className = "w-5 h-5" }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const P = {
  pin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z",
  phone:
    "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  mail: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
};

function InfoRow({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon d={icon} />
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="mt-1 text-sm leading-relaxed text-muted">{children}</div>
      </div>
    </div>
  );
}

/* A7, Kontak publik. Dua kolom mengikuti struktur halaman kontak referensi:
 * info institusi di kiri, formulir kirim pesan di kanan. Header flat, tanpa
 * gradient (aturan desain baru 12 Sep). */
export default async function ContactPage() {
 const tr = await getTranslations("public");
 const map = mapsEmbed();
 const telpHref = `tel:${SITE.telepon.replace(/[^+\d]/g, "")}`;
  const waHref = `https://wa.me/${SITE.telepon.replace(/\D/g, "")}`;

  return (
    <div>
      <div className="border-b border-slate-100 bg-slate-50">
        <Section className="py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{tr("text289")}</h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-muted">
            {tr("text290")}</p>
        </Section>
      </div>

      <Section className="pt-14 pb-10 sm:pt-20 sm:pb-12">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-2 md:gap-8 lg:gap-12">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{tr("text291")}</h2>

            <div className="mt-6 space-y-6">
              <InfoRow icon={P.pin} title={tr("text292")}>
              <address className="not-italic">
              {SITE.alamat.map((baris) => (
              <span key={baris} className="block">
              {baris}
              </span>
              ))}
              </address>
              <a
              href={MAPS_SEARCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 font-medium text-brand hover:underline"
              >
              {tr("text293")}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
              <path d="M7 17L17 7M17 7H8M17 7v9" />
              </svg>
              </a>
              </InfoRow>
              <InfoRow icon={P.phone} title={tr("text294")}>
                <a href={telpHref} className="font-medium text-brand hover:underline">
                  {SITE.telepon}
                </a>
                <span className="mx-1.5 text-slate-300">/</span>
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">
                  {tr("text296")}</a>
              </InfoRow>
              <InfoRow icon={P.mail} title={tr("text297")}>
                <a href={`mailto:${SITE.email}`} className="font-medium text-brand hover:underline">
                  {SITE.email}
                </a>
              </InfoRow>
              <InfoRow icon={P.clock} title={tr("text298")}>
                {tr("text299")}</InfoRow>
            </div>
          </div>

          <div>
          <ContactForm />
          </div>
          </div>
          </Section>

          {/* Peta lokasi — pita full-width di bawah info + form (pola halaman kontak
          * umum; referensi NF sendiri tidak embed, jadi pakai pola standar). */}
          <Section className="pb-14 sm:pb-20">
          {PETA_INTERAKTIF ? (
            <PetaLokasi lat={LOKASI_LAT} lng={LOKASI_LNG} mapsHref={MAPS_SEARCH_URL} />
          ) : (
            <>
          <iframe
          src={map.url}
          title={tr("mapTitle")}
          className="h-80 w-full rounded-lg border border-slate-200 sm:h-96"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          />
          {map.provider === "osm" ? (
          <p className="mt-2 text-xs text-muted">
          {tr("text300")}{" "}
          <a
          href={MAPS_ATTRIBUTION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
          >
          OpenStreetMap
          </a>{" "}
          {tr("text304")}{" "}
          <a href={MAPS_SEARCH_URL} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
          Google Maps
          </a>
          .
          </p>
          ) : null}
            </>
          )}
          </Section>
          </div>
  );
}
