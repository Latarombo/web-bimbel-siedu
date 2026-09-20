import { getTranslations } from "next-intl/server";
/**
 * Section 06 — Testimoni orang tua (landing).
 *
 * 13 Sep: background krem #fdecce dihapus, section ikut putih halaman supaya
 * menyambung dengan katalog kelas di atasnya. Kartu auto-scroll pelan lewat
 * TestimonialCarousel (jalan sendiri, jeda saat hover/drag/fokus; tanpa tombol
 * kontrol), masih bisa digeser tangan: drag mouse, swipe sentuh, keyboard.
 * Warna kartu #d7f2fe dipertahankan (bagian dari bahasa visual landing).
 * Data testimoni masih statis (belum ada sumber DB).
 */
import TestimonialCarousel, { type Testimoni } from "./TestimonialCarousel";



export default async function TestimonialsSection() {
 const tr = await getTranslations("public");
const testi: Testimoni[] = [
  {
    nama: "Ibu Sari",
    peran: tr("text113"),
    foto: "/images/02_Teacher.png",
    kutip:
      tr("text114"),
  },
  {
    nama: "Bapak Hendra",
    peran: tr("text116"),
    foto: "/images/03_Teacher.png",
    kutip:
      tr("text117"),
  },
  {
    nama: "Ibu Anisa",
    peran: tr("text119"),
    foto: "/images/01_Teacher.png",
    kutip:
      tr("text120"),
  },
  {
    nama: "Bapak Yusuf",
    peran: tr("text122"),
    foto: "/images/02_Teacher.png",
    kutip:
      tr("text123"),
  },
  {
    nama: "Ibu Ratna",
    peran: tr("text125"),
    foto: "/images/03_Teacher.png",
    kutip:
      tr("text126"),
  },
  {
    nama: "Bapak Danny",
    peran: tr("text128"),
    foto: "/images/01_Teacher.png",
    kutip:
      tr("text129"),
  },
];

  return (
    <section id="testimoni" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {tr("text130")}</h2>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted">
            {tr("text131")}</p>
        </div>

        <TestimonialCarousel items={testi} />
      </div>
    </section>
  );
}
