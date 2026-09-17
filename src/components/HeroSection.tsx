import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import HeroRain from "@/components/HeroRain";

/**
 * Hero (14 Sep): konten dipindah ke DALAM frame rectange penuh satu lebar
 * layar — tepi rata kiri/kanan, sudut bawah sangat bulat (meniru struktur
 * hero bimbelnurulfikri.id: radius bawah ~6rem, sudut atas 0). Isi masih sama
 * (heading, sub, CTA, foto siswa); dekorasi SVG lanjut nanti.
 */
export default async function HeroSection() {
 const tr = await getTranslations("public");
  return (
    <section className="relative">
      {/* Frame rectange — full-bleed, nempel di bawah navbar, sudut bawah bulat */}
      <div className="relative overflow-hidden rounded-b-[2rem] bg-[#0f235f] sm:rounded-b-[3.5rem] md:rounded-b-[5rem] lg:rounded-b-[6rem]">
        {/* Latar 1 — foto ruang kelas (Wikimedia Commons, Andrew Classroom,
        De La Salle University, CC BY). Terang di tengah, meredup ke tepi. */}
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/hero-bg.webp')" }}
          aria-hidden
        ></div>
        {/* Latar 2 — overlay radial BIRU (mengikuti brand Siedu blue-600 →
        blue-900): foto paling terang di tengah, menebal ke tepi/sudut */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 78% 72% at 50% 45%, rgba(29,78,216,0.35) 0%, rgba(30,58,138,0.72) 48%, rgba(15,35,95,0.97) 100%)",
          }}
          aria-hidden
        ></div>

        {/* Latar 3 — hujan garis tipis, di bawah teks, terpotong oleh frame */}
        <HeroRain />

        {/* Content Container — flex + min-h: frame tinggi sinematik (meniru
        proporsi bimbelnurulfikri.id ~72% lebar), teks ditengahkan secara
        vertikal; siswi absolut di dasar frame ikut tinggi frame ini. */}
        <div className="relative mx-auto flex min-h-[420px] max-w-7xl flex-col justify-center px-4 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-14 md:min-h-[540px] lg:px-8 lg:min-h-[700px] xl:min-h-[720px]">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
            {/* Left Column - Text Content */}
            <div className="order-2 text-center lg:order-1 lg:text-left">
              {/* Heading — skala mobile lebih hemat, naik bertahap; tracking
              diketatkan biar aman satu suara dengan h2 section lain */}
              <h1 className="mx-auto max-w-xl text-3xl font-bold leading-[1.15] tracking-tight text-balance sm:mx-0 sm:text-4xl lg:max-w-none lg:text-5xl xl:text-[3.4rem] 2xl:text-6xl">
                <span className="text-white">{tr("text139")}</span>
                <br className="hidden sm:block" />
                <span className="text-white">{tr("text140")}</span>
                <span className="text-amber-500">{tr("text141")}</span>
                <br className="hidden sm:block" />
                <span className="text-amber-500">{tr("text142")}</span>
              </h1>

              {/* Subheading — satu level di bawah h1, lebar baca dijaga */}
              <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-slate-300 sm:mx-0 sm:text-lg lg:mt-6">
                {tr("text143")}</p>

              {/* Buttons */}
              <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4 lg:mt-12 lg:justify-start">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-lg bg-[#f26d0f] px-8 py-3.5 font-semibold text-white shadow-md transition-colors duration-200 hover:brightness-95 hover:shadow-lg sm:min-w-[180px]"
                >
                  {tr("text144")}</Link>
                <Link
                  href="/classes"
                  className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3.5 font-semibold text-gray-900 transition-colors duration-200 hover:bg-slate-100 sm:min-w-[180px]"
                >
                  {tr("text145")}</Link>
              </div>
            </div>

            {/* Right Column — gambar siswi. lg ke atas di-posisikan absolut ke
            dasar frame (menempel batas bawah, seperti siswi di bimbelnurulfikri.id);
            mobile tetap mengalir di atas teks. */}
            <div className="relative order-1 flex justify-center lg:static lg:order-2 lg:justify-end">
              <div className="relative w-full max-w-[300px] sm:max-w-sm lg:absolute lg:bottom-0 lg:right-[10%] lg:h-[560px] lg:w-auto lg:max-w-none xl:right-[13%] xl:h-[580px]">
                {/* Blue Blob Shape (SVG) */}
                <svg
                  className="absolute top-1/2 left-1/2 -z-10 h-[115%] w-[115%] -translate-x-1/2 -translate-y-1/2"
                  viewBox="0 0 500 500"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <path
                    d="M250,50 C350,50 420,100 440,180 C460,260 430,340 370,400 C310,460 220,470 150,430 C80,390 40,320 50,240 C60,160 150,50 250,50 Z"
                    fill="#2563eb"
                  />
                </svg>

                {/* Student Image */}
                <img
                  src="/images/hero_actor.png"
                  alt={tr("text146")}
                  className="relative mx-auto block h-auto w-full object-contain drop-shadow-xl lg:h-full lg:w-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
