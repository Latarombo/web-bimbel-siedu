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
    nama: "Sari Wulandari",
    peran: tr("text113"),
    foto: "/images/parents/parent_01.webp",
    kutip:
      tr("text114"),
  },
  {
    nama: "Hendra Pratama",
    peran: tr("text116"),
    foto: "/images/parents/parent_02.webp",
    kutip:
      tr("text117"),
  },
  {
    nama: "Anisa Rahmawati",
    peran: tr("text119"),
    foto: "/images/parents/parent_03.webp",
    kutip:
      tr("text120"),
  },
  {
    nama: "Yusuf Maulana",
    peran: tr("text122"),
    foto: "/images/parents/parent_04.webp",
    kutip:
      tr("text123"),
  },
  {
    nama: "Ratna Dewi",
    peran: tr("text125"),
    foto: "/images/parents/parent_05.webp",
    kutip:
      tr("text126"),
  },
  {
    nama: "Danny Hermawan",
    peran: tr("text128"),
    foto: "/images/parents/parent_06.webp",
    kutip:
      tr("text129"),
  },
];

  return (
    <section id="testimoni" className="scroll-mt-20 bg-slate-50/70 border-y border-slate-100/80 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {tr("text130")}{" "}
            <span className="text-brand">{tr("text130_brand")}</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted">
            {tr("text131")}</p>
        </div>

        <TestimonialCarousel items={testi} />
      </div>
    </section>
  );
}
