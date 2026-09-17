import { getTranslations } from "next-intl/server";
/**
 * Section 03 — "Cara Siedu bekerja" (mockup: D:\section.png).
 * Heading tengah + 3 kartu biru denim (#3c5a99) stagger (tengah turun),
 * tiap kartu: judul putih kiri atas, tombol bundar kuning ↗ kanan atas,
 * ilustrasi SVG (public/svg) langsung di latar kartu tanpa inset.
 */
import { Link } from "@/i18n/navigation";
import { ArrowUpRight } from "lucide-react";

type Card = {
  title: string;
  href: string;
  src: string;
  alt: string;
  offset?: boolean;
};



export default async function ServicesCards() {
 const tr = await getTranslations("public");
const CARDS: Card[] = [
  {
    title: tr("text94"),
    href: "/register",
    src: "/svg/mobile-login.svg",
    alt: tr("text95"),
  },
  {
    title: tr("text96"),
    href: "/about",
    src: "/svg/exams.svg",
    alt: tr("text97"),
    offset: true,
  },
  {
    title: tr("text98"),
    href: "/classes",
    src: "/svg/time-management.svg",
    alt: tr("text99"),
  },
];

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0b1c30]">
            {tr("text100")}<span className="text-brand">{tr("text101")}</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-gray-500">
            {tr("text102")}</p>
        </div>

        <div className="mt-12 grid items-start gap-5 md:grid-cols-3">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className={
                "relative flex min-h-[420px] flex-col rounded-3xl bg-[#3c5a99] p-7 shadow-[0_24px_48px_-16px_rgba(60,90,153,0.5)]" +
                (card.offset ? " md:mt-16" : "")
              }
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="max-w-[75%] text-xl font-bold leading-snug text-white">
                  {card.title}
                </h3>
                <Link
                  href={card.href}
                  aria-label={tr("serviceMore", {title: card.title})}
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-400 text-gray-900 transition-transform hover:scale-105"
                >
                  <ArrowUpRight className="size-5" strokeWidth={2.5} />
                </Link>
              </div>
              <div className="flex flex-1 items-center justify-center px-2 pb-2 pt-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.src}
                  alt={card.alt}
                  width={298}
                  height={298}
                  className="h-auto w-full max-w-[280px]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
