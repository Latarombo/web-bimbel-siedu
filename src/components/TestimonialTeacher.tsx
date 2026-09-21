import { getTranslations } from "next-intl/server";
/**
 * Section "Kata guru" di halaman /about.
 *
 * 16 Sep: layout mengacu guru.png / ruangkelas.com/ruangkelas — panggung PUTIH,
 * kartu tumpang tindih 3 lapis (badge mengampu di tepi atas foto, foto potret di
 * latar lavender, kotak kutipan menutupi bawah foto, ikon kutip menonjol di sudut).
 * Kulitnya palet brand Siedu (blue-600 + blue-100 chip), konsisten dengan landing.
 *
 * Perubahan data penting: identitas kartu TIDAK lagi hardcoded. Nama, mapel,
 * jenjang, dan jumlah kelas diambil dari DB lewat guruDariKelasAktif (guru yang
 * benar-benar mengampu kelas aktif). Yang tetap tulisan redaksional: kutipan
 * (pool 3 catatan, dirotasi per indeks) dan foto (stok headshot 01-03, dirotasi;
 * ganti dengan foto pengajar asli di /public/images bila ada).
 */
import Image from "next/image";
import { Quote, School } from "lucide-react";
import type { GuruKatalog } from "@/lib/kelas";

const BRAND = "#2563eb";
const CHIP = "#dbeafe";
const LAVENDER = "#bfdbfe"; // latar foto; headshot putih menyatu via multiply

/* Catatan redaksional — dirotasi ke guru sesuai urutan kartu. */


const FOTO = ["/images/01_Teacher.png", "/images/02_Teacher.png", "/images/03_Teacher.png"];

async function KartuGuru({ guru, index }: { guru: GuruKatalog; index: number }) {
 const tr = await getTranslations("public");
const KUTIPAN = [
  tr("text147"),
  tr("text148"),
  tr("text149"),
];

  const kutip = KUTIPAN[index % KUTIPAN.length];
  const foto = FOTO[index % FOTO.length];
  const jenjang = guru.jenjang.join(", ");

  return (
    <div className="relative w-full max-w-[440px] pt-9 sm:min-w-[300px] sm:grow sm:basis-0">
      {/* HP: w-full saja (satu kartu per baris). grow/basis-0 dikhususkan sm+ supaya
          3 kartu membagi rata — kalau tidak, dua kartu di HP berdampingan ±159px
          karena flex-basis:0 mengalahkan width:100% saat dihitung ruang utama. */}
      {/* Badge mengampu — rata KIRI KARTU (left-0), sejajar tepi kiri kotak
          kutipan di bawahnya; dulu nempel tepi foto (12.5%) jadi terlihat
          menyendiri ke tengah. */}
      <div className="absolute left-0 top-0 z-20">
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:px-4 sm:py-2.5">
          <span
            aria-hidden="true"
            className="grid size-7 shrink-0 place-items-center rounded-lg sm:size-8"
            style={{ backgroundColor: CHIP }}
          >
            <School className="size-4" style={{ color: BRAND }} />
          </span>
          <div>
            <p className="text-xs leading-tight text-slate-500">{tr("text151")}</p>
            <p className="text-[13px] font-semibold leading-tight text-slate-900 sm:text-sm">{guru.mapel.join(", ")}</p>
          </div>
        </div>
      </div>

      {/* Foto potret — lebar 75% kartu (ukur dari guru.png & DOM ruangkelas: img
          256px di dalam kartu 340px), RATA TENGAH lewat mx-auto supaya kotak
          kutipan menjorok sama besar di kiri-kanan. Latar lavender; headshot
          berlatar putih menyatu lewat multiply. */}
      <div className="mx-auto w-[75%]">
        <div className="overflow-hidden rounded-2xl border border-slate-200" style={{ backgroundColor: LAVENDER }}>
          <div className="relative aspect-498/516">
            <Image
              src={foto}
              alt={tr("teacherPhoto", {name: guru.nama})}
              fill
              sizes="(max-width: 768px) 75vw, (max-width: 1024px) 38vw, 28vw"
              className="object-cover object-top mix-blend-multiply"
            />
          </div>
        </div>
      </div>

      {/* Kotak kutipan — lebar penuh kartu, menutupi bawah foto, ikon kutip di sudut.
          -mt dalam % (margin % dihitung dari LEBAR containing block = kartu), sehingga
          tumpang tindih tetap ±21% tinggi foto di semua lebar. Angka tetap (72px) bikin
          foto HP yang lebih pendek ketutupan sampai 31%. */}
      <div className="relative -mt-[16.5%] z-10">
        <div className="relative rounded-2xl border-2 bg-white px-5 pb-5 pt-7 shadow-[0_14px_30px_rgba(15,35,95,0.10)] sm:px-6 sm:pb-6 sm:pt-8" style={{ borderColor: BRAND }}>
          <span
            aria-hidden="true"
            className="absolute -top-5 left-4 grid size-10 place-items-center rounded-full shadow-md sm:left-5"
            style={{ backgroundColor: BRAND }}
          >
            <Quote className="size-5 text-white" fill="currentColor" />
          </span>
          <p className="text-sm font-medium leading-relaxed text-slate-700 sm:text-[15px]">
            &ldquo;{kutip}&rdquo;
          </p>
          <div className="mt-5 border-t border-dashed border-slate-200 pt-4">
            <p className="text-base font-bold text-slate-900">{guru.nama}</p>
            <p className="mt-0.5 text-sm text-slate-500">
              {tr("teacherLevels", {level: jenjang, count: guru.jumlahKelas})}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function TestimonialSection({ gurus }: { gurus: GuruKatalog[] }) {
 const tr = await getTranslations("public");
  // Tidak ada guru dengan kelas aktif? Section disembunyikan, bukan diisi nama palsu.
  if (gurus.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Lengkung dekorasi tipis di pojok kanan atas (pola latar ruangkelas) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        className="pointer-events-none absolute -right-24 -top-24 w-[420px] text-[#cfe0ef]"
        fill="none"
      >
        <circle cx="330" cy="70" r="120" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="330" cy="70" r="180" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="330" cy="70" r="240" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {tr("text158")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            {tr("text159")}</p>
        </div>

        {/* Flex terpusat, bukan grid 3 kolom: jumlah guru dari DB (bisa 1 atau 2),
            grid tetap membuat kartu tunggal mengambang kiri dengan ruang kosong lebar. */}
        <div className="mt-2 flex flex-wrap justify-center gap-x-10 gap-y-14 sm:gap-y-20">
          {gurus.map((g, i) => (
            <KartuGuru key={g.id} guru={g} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
