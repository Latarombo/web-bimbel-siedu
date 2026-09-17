import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { SITE, MAPS_SEARCH_URL } from "@/lib/site";
import { Card, CardPad } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { SkemaPembayaran } from "@/components/kelas/skema-pembayaran";
import { kelasAktifPublik, toKelasKatalog } from "@/lib/kelas";

export const dynamic = "force-dynamic";

/* Band dekorasi statis (pengganti wave teal Ruangguru) — flat, tanpa gradient. */
async function BandKelas({ judul }: { judul: string }) {
 const tr = await getTranslations("public");
  return (
    <div className="relative overflow-hidden bg-[#227195]">
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-14 w-full text-white/10"
        viewBox="0 0 2400 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,60 C300,110 600,20 900,60 C1200,100 1500,20 1800,55 C2100,90 2300,40 2400,60 L2400,120 L0,120 Z"
          fill="currentColor"
        />
      </svg>
      <Section className="relative py-8">
        <Link
          href="/classes"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white/85 hover:text-white"
        >
          <span className="grid size-8 place-items-center rounded-full bg-white">
            <ArrowLeft className="size-4 text-[#227195]" aria-hidden />
          </span>
          {tr("text258")}</Link>
        <h1 className="mt-3 text-xl sm:text-2xl font-black tracking-tight text-white">{judul}</h1>
      </Section>
    </div>
  );
}

export default async function ClassDetail({ params }: { params: Promise<{ id: string }> }) {
 const tr = await getTranslations("public");
 const locale = (await getLocale()) === "en" ? "en" : "id";
  const { id } = await params;
  const kelasId = Number(id);
  const all = await kelasAktifPublik();
  const k = all.find((x) => x.id === kelasId);
  if (!k) return notFound();
  const kc = toKelasKatalog(k, locale);
  const sisaKuota = Math.max(0, kc.kuota.maksimum - kc.kuota.terisi);

  const manfaat = [
    tr("text259"),
    tr("text260"),
    tr("teacher", {value: kc.guru}),
    tr("schedule", {value: kc.jadwal}),
  ];

  return (
    <div className="pb-24 lg:pb-0">
      <BandKelas judul={`${kc.mapel} · ${kc.jenjang}`} />

      <Section className="py-6">
        {/* Chip konteks, seperti 'Kelas 4' di Ruangguru — data nyata, bukan filter palsu */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex min-h-9 items-center rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground">
            {kc.jenjang}
          </span>
          <span className="inline-flex min-h-9 items-center rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground">
            {kc.periode}
          </span>
          <span className="inline-flex min-h-9 items-center rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground">
            {tr("seats", {count: sisaKuota})}
          </span>
        </div>

        {kc.mapelDeskripsi ? (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">{kc.mapelDeskripsi}</p>
        ) : null}

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <CardPad>
              <h2 className="text-lg font-bold">{tr("classScheduleHeading")}</h2>
              <dl className="mt-4 space-y-4 text-sm">
                {[
                  [tr("text283"), kc.jadwal],
                  [tr("text282"), kc.guru],
                  [tr("classTermLabel"), kc.periode],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted">{label}</dt>
                    <dd className="mt-1 font-semibold leading-relaxed">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardPad>
          </Card>
          <Card>
            <CardPad>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <MapPin className="size-5 shrink-0 text-brand" aria-hidden />
                {tr("classLocationHeading")}
              </h2>
              <p className="mt-4 text-sm font-semibold">{SITE.nama}</p>
              <address className="mt-1 text-sm not-italic leading-relaxed text-muted">
                {SITE.alamat.join(", ")}
              </address>
              <a href={MAPS_SEARCH_URL} target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-brand hover:border-brand">
                {tr("classMapsLink")}
              </a>
              <p className="mt-3 text-sm text-muted">{tr("classLocationNote")}</p>
              <Link href="/contact" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-brand hover:underline">
                {tr("classLocationContact")}
              </Link>
            </CardPad>
          </Card>
        </div>

        <div className="mt-6">
          <SkemaPembayaran
            kelasId={kc.id}
            periode={kc.periode}
            biayaPeriode={kc.biayaPeriode}
            biayaDp={kc.biayaDp}
            tenorMaksimum={kc.tenorMaksimum}
            sisaKuota={sisaKuota}
            kuotaTerisi={kc.kuota.terisi}
            kuotaMaksimum={kc.kuota.maksimum}
            manfaat={manfaat}
          />
        </div>

        <Card className="mt-6">
          <CardPad>
            <h2 className="font-bold">{tr("text263")}</h2>
            <ul className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
              <li>{tr("classMinimum", {count: kc.kuotaMinimum})}</li>
              <li>{tr("text266")}</li>
              <li>{tr("text267")}</li>
              <li>{tr("text268")}</li>
            </ul>
          </CardPad>
        </Card>
      </Section>
    </div>
  );
}
