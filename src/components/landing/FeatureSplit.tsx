import { getTranslations } from "next-intl/server";
/**
 * Section 04 — "Kenali layanan Siedu" (desain: D:\Screenshot 2026-09-14 222032.png).
 * Tiga baris zig-zag di latar grid halus. Tiap baris: foto dimiringkan dengan bingkai
 * warna asimetris + kartu UI putih melayang (isi = fakta alur sistem, tanpa angka
 * karangan) dan teks (eyebrow berwarna, heading, paragraf, checklist 4 poin dua kolom).
 * Ungu/oranye dari mockup di-skin ulang ke sistem warna landing: biru #2563eb,
 * amber #f59e0b, teal #227195. Ilustrasi per baris dari public/svg (unDraw MIT,
 * sudah di-recolor ke mustard #f7b13c senada ketiga SVG lama).
 */
import { ArrowRight, Bell, CalendarDays, Check, Lock, Star } from "lucide-react";

type Baris = {
  eyebrow: string;
  eyebrowColor: string;
  heading: string;
  body: string;
  bullets: string[];
  /** hex bingkai warna di belakang foto */
  accent: string;
  /** tint lingkaran centang + warna ikonnya */
  tintBg: string;
  tintFg: string;
  img: string;
  imgAlt: string;
  /** true → gambar di kiri; false → gambar di kanan */
  imgLeft: boolean;
  /** arah kemiringan blok gambar */
  tilt: string;
  /** kelas border-radius bingkai — asimetris per desain */
  blob: string;
  /** posisi offset bingkai */
  blobPos: string;
  /** kartu UI melayang (dekoratif, aria-hidden) */
  mocks: React.ReactNode;
};

const kartuDasar =
  "absolute z-20 rounded-lg border border-slate-100 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.14)]";



function Feature({ b }: { b: Baris }) {
  const gambar = (
    <div className="relative mx-auto w-full max-w-lg">
      <div className={`relative ${b.tilt}`}>
        {/* bingkai warna asimetris di belakang foto */}
        <span
          aria-hidden
          className={`absolute inset-0 ${b.blob} ${b.blobPos}`}
          style={{ backgroundColor: b.accent }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={b.img}
          alt={b.imgAlt}
          className="relative w-full rounded-[44px] border-[10px] border-white bg-white object-cover shadow-sm"
        />
        {b.mocks}
      </div>
    </div>
  );

  const teks = (
    <div className="max-w-lg">
      <p
        className="text-sm font-bold tracking-widest uppercase"
        style={{ color: b.eyebrowColor }}
      >
        {b.eyebrow}
      </p>
      <h3 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{b.heading}</h3>
      <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted">{b.body}</p>
      <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {b.bullets.map((t) => (
          <li key={t} className="flex items-center gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full" style={{ backgroundColor: b.tintBg }}>
              <Check className="size-3.5" strokeWidth={3} style={{ color: b.tintFg }} />
            </span>
            <span className="text-sm text-body">{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
      {b.imgLeft ? (
        <>
          {gambar}
          {teks}
        </>
      ) : (
        <>
          {/* di mobile teks dulu, gambar setelahnya */}
          <div className="order-2 lg:order-1">{teks}</div>
          <div className="order-1 lg:order-2">{gambar}</div>
        </>
      )}
    </div>
  );
}

export default async function FeatureSplit() {
 const tr = await getTranslations("public");
const baris: Baris[] = [
  {
    eyebrow: tr("text25"),
    eyebrowColor: "#2563eb",
    heading: tr("text26"),
    body: tr("text27"),
    bullets: [
      tr("text28"),
      tr("text29"),
      tr("text30"),
      tr("text31"),
    ],
    accent: "#2563eb",
    tintBg: "#e1ecfd",
    tintFg: "#1d4ed8",
    img: "/svg/portal-monitor.svg",
    imgAlt: tr("text32"),
    imgLeft: true,
    tilt: "-rotate-2",
    blob: "rounded-t-[80px] rounded-tr-[80px] rounded-br-[80px] rounded-bl-[16px]",
    blobPos: "-bottom-6 -left-6",
    mocks: (
      <>
        {/* kartu skeleton progres — sudut kiri atas, gaya mockup */}
        <div aria-hidden="true" className={`${kartuDasar} left-0 top-6 w-40 rotate-2 p-3.5`}>
          <span className="block h-2.5 w-16 rounded-full bg-slate-200" />
          <div className="mt-3 space-y-2.5">
            {[
              "w-full",
              "w-11/12",
              "w-3/5",
            ].map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="grid size-4 shrink-0 place-items-center rounded" style={{ backgroundColor: "#e1ecfd" }}>
                  <Check className="size-2.5" strokeWidth={3.5} style={{ color: "#1d4ed8" }} />
                </span>
                <span className={`h-2 rounded-full bg-slate-100 ${w}`} />
              </div>
            ))}
          </div>
        </div>
        {/* kartu presensi — sudut kanan bawah */}
        <div aria-hidden="true" className={`${kartuDasar} -bottom-7 right-0 w-56 -rotate-1 p-4`}>
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: "#e1ecfd" }}>
              <CalendarDays className="size-4.5" style={{ color: "#227195" }} />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">{tr("text35")}</p>
              <p className="mt-1 text-[11px] leading-snug text-slate-500">{tr("text36")}</p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <Check className="size-2.5" strokeWidth={3.5} /> {tr("text37")}</span>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    eyebrow: tr("text38"),
    eyebrowColor: "#d97706",
    heading: tr("text39"),
    body: tr("text40"),
    bullets: [
      tr("text41"),
      tr("text42"),
      tr("text43"),
      tr("text44"),
    ],
    accent: "#f59e0b",
    tintBg: "#fbf1d8",
    tintFg: "#8a6208",
    img: "/svg/jenjang-belajar.svg",
    imgAlt: tr("text45"),
    imgLeft: false,
    tilt: "rotate-2",
    blob: "rounded-t-[80px] rounded-tr-[16px] rounded-br-[80px] rounded-bl-[80px]",
    blobPos: "-top-6 -right-6",
    mocks: (
      <>
        {/* pil kurikulum — sudut kiri atas */}
        <div aria-hidden="true" className={`${kartuDasar} -top-4 left-0 flex -rotate-2 items-center gap-2 rounded-full px-3.5 py-2.5`}>
          <Star className="size-4" fill="#f59e0b" stroke="#f59e0b" />
          <span className="text-[11px] font-bold text-slate-900">{tr("text48")}</span>
        </div>
        {/* kartu jadwal latihan — sudut kanan bawah, gaya kartu &ldquo;schedule&rdquo; mockup */}
        <div aria-hidden="true" className={`${kartuDasar} -bottom-8 left-2 w-60 rotate-1 p-4`}>
          <p className="text-xs font-bold text-slate-900">{tr("text49")}</p>
          <div className="mt-3 space-y-3">
            {[
              { nama: tr("math"), lebar: "w-3/4", warna: "#f59e0b" },
              { nama: tr("text50"), lebar: "w-1/2", warna: "#10b981" },
            ].map((j) => (
              <div key={j.nama}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600">{j.nama}</span>
                  <span className="h-2 w-10 rounded-full bg-slate-100" />
                </div>
                <span className="mt-1.5 block h-1.5 rounded-full bg-slate-100">
                  <span className={`block h-full rounded-full ${j.lebar}`} style={{ backgroundColor: j.warna }} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </>
    ),
  },
  {
    eyebrow: tr("text51"),
    eyebrowColor: "#227195",
    heading: tr("text52"),
    body: tr("text53"),
    bullets: [
      tr("text54"),
      tr("text55"),
      tr("text56"),
      tr("text57"),
    ],
    accent: "#227195",
    tintBg: "#d7f2fe",
    tintFg: "#15566f",
    img: "/svg/jadwal-daftar.svg",
    imgAlt: tr("text58"),
    imgLeft: true,
    tilt: "-rotate-2",
    blob: "rounded-t-[80px] rounded-tr-[80px] rounded-br-[16px] rounded-bl-[80px]",
    blobPos: "-bottom-6 -right-6",
    mocks: (
      <>
        {/* kartu kursi terkunci — sudut kanan atas */}
        <div aria-hidden="true" className={`${kartuDasar} -top-6 right-2 w-44 rotate-2 p-3.5`}>
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: "#d7f2fe" }}>
              <Lock className="size-4" style={{ color: "#15566f" }} />
            </span>
            <div>
              <p className="text-[11px] font-bold text-slate-900">{tr("text61")}</p>
              <p className="text-[10px] leading-snug text-slate-500">{tr("text62")}</p>
            </div>
          </div>
        </div>
        {/* pil pengumuman — sudut kiri bawah, gaya pil statistik mockup */}
        <div aria-hidden="true" className={`${kartuDasar} -bottom-7 left-0 flex max-w-[17rem] -rotate-1 items-center gap-3 rounded-full py-2.5 pl-3.5 pr-4`}>
          <span className="grid size-8 shrink-0 place-items-center rounded-full" style={{ backgroundColor: "#d7f2fe" }}>
            <Bell className="size-4" style={{ color: "#15566f" }} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-slate-900">{tr("text63")}</p>
            <p className="text-[10px] text-slate-500">{tr("text64")}</p>
          </div>
          <ArrowRight className="size-4 shrink-0" style={{ color: "#15566f" }} />
        </div>
      </>
    ),
  },
];

  return (
    <section className="relative overflow-x-clip bg-white">
      {/* Kisi kotak-kotak yang bergeser pelan satu kotak penuh (loop mulus),
          pola + ukuran sama dengan HeroSection; ditenggelamkan di tepi lewat mask. */}
      <div
        aria-hidden
        className="animate-grid-drift pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        {/* Header tengah: heading biasa tanpa coretan */}
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {tr("text66")}<span className="text-brand">Siedu</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm sm:text-base leading-relaxed text-muted">
            {tr("text68")}</p>
        </div>

        <div className="mt-20 space-y-24">
          {baris.map((b) => (
            <Feature key={b.eyebrow} b={b} />
          ))}
        </div>
      </div>
    </section>
  );
}
