import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ExternalLink,
  MapPin,
  Users,
  BookOpen,
  Target,
  ShieldCheck,
} from "lucide-react";
import { SITE, MAPS_SEARCH_URL } from "@/lib/site";
import { SkemaPembayaran } from "@/components/kelas/skema-pembayaran";
import { kelasAktifPublik, toKelasKatalog } from "@/lib/kelas";
import { labelHari } from "@/lib/label";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { ModalPilihKelas } from "@/components/kelas/modal-pilih-kelas";

export const dynamic = "force-dynamic";

function durasiMenit(mulai: string | Date, selesai: string | Date): number {
  const [h1, m1] = String(mulai).split(":").map(Number);
  const [h2, m2] = String(selesai).split(":").map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 90;
  const d = (h2 * 60 + m2) - (h1 * 60 + m1);
  return d > 0 ? d : 90;
}

function targetPembelajaran(mapel: string, jenjang: string): string[] {
  const m = mapel.toLowerCase();
  if (m.includes("matematika")) {
    if (jenjang === "TK") {
      return [
        "Pengenalan angka, hitung dasar, serta logika pola dan bentuk secara ceria dan interaktif.",
        "Stimulasi pemecahan masalah sederhana dan keterampilan motorik halus anak.",
        "Membangun rasa suka, percaya diri, dan antusiasme belajar berhitung sejak usia dini.",
      ];
    }
    if (jenjang === "SD") {
      return [
        "Penguasaan konsep berhitung esensial (pecahan, desimal, operasi hitung campuran, KPK & FPB).",
        "Kecakapan menalar soal cerita berbasis literasi numerasi AKM dan penerapan logika matematika.",
        "Kesiapan optimal menghadapi ulangan harian, ujian sekolah, dan asesmen kenaikan kelas.",
      ];
    }
    if (jenjang === "SMP") {
      return [
        "Pemahaman mendalam aljabar, geometri, persamaan linear, statistika, dan fungsi relasi.",
        "Kemampuan menyelesaikan latihan soal analitis tipe HOTS (Higher Order Thinking Skills).",
        "Kesiapan menghadapi asesmen sumatif semester dan pemantapan dasar matematika SMA.",
      ];
    }
    if (jenjang === "SMA") {
      return [
        "Penguasaan materi kalkulus, trigonometri analitik, matriks, dan peluang statistik.",
        "Latihan intensif pemecahan pola soal penalaran matematika untuk persiapan ujian dan seleksi PTN.",
        "Peningkatan penguasaan konsep penting guna mendukung peningkatan nilai rapor akademik.",
      ];
    }
  }
  if (m.includes("ipa") || m.includes("biologi") || m.includes("fisika") || m.includes("kimia")) {
    return [
      `Pemahaman konsep fundamental sains & materi kurikulum sekolah jenjang ${jenjang}.`,
      "Kemampuan analisis eksperimen, pemahaman rumus, dan penalaran ilmiah berbasis bukti.",
      "Kesiapan menghadapi ulangan harian, ujian semester, serta praktikum sekolah.",
    ];
  }
  if (m.includes("inggris") || m.includes("english")) {
    return [
      "Peningkatan kosakata (vocabulary), tata bahasa (grammar), dan kelancaran membaca teks.",
      "Kecakapan memahami teks bacaan (reading comprehension) dan menyusun kalimat terstruktur.",
      "Kesiapan menghadapi ujian sekolah, asesmen bahasa, dan tugas presentasi.",
    ];
  }
  return [
    `Penguasaan konsep inti kurikulum mata pelajaran ${mapel} jenjang ${jenjang}.`,
    "Pembahasan latihan soal variatif, penyelesaian tugas sekolah, dan konsultasi PR harian.",
    "Kesiapan matang menghadapi ulangan harian, asesmen tengah semester, dan ujian sekolah.",
  ];
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
  const allClasses = all.map((item) => toKelasKatalog(item, locale));
  const sisaKuota = Math.max(0, kc.kuota.maksimum - kc.kuota.terisi);
  const pct = Math.round((kc.kuota.terisi / kc.kuota.maksimum) * 100);
  const kuotaTone =
    pct >= 85
      ? { bar: "bg-rose-500", text: "text-rose-600" }
      : pct >= 50
        ? { bar: "bg-amber-500", text: "text-amber-600" }
        : { bar: "bg-emerald-500", text: "text-emerald-600" };
  const targets = targetPembelajaran(kc.mapel, kc.jenjang);

  const session = await auth();
  const isOrtu = session?.user?.role === "orang_tua";
  const ortuId = Number(session?.user?.id);

  let anakList: Array<{ id: number; nama: string; jenjangTerakhir: string }> = [];
  if (isOrtu && ortuId) {
    const anakRecords = await collect(
      db.orm.public.Anak.where((a) => a.orangTuaId.eq(ortuId)).all()
    );
    anakList = anakRecords.map((a) => ({
      id: a.id,
      nama: a.nama,
      jenjangTerakhir: a.jenjangTerakhir ?? "",
    }));
  }

  const manfaat = [
    tr("text259"),
    tr("text260"),
    tr("schedule", { value: kc.jadwal }),
  ];

  const namaTingkat = kc.tingkat
    ? (kc.tingkat.toLowerCase().startsWith("kelas") ? kc.tingkat : `Kelas ${kc.tingkat}`)
    : "Kelas";
  const judulKelas = `${kc.mapel} - ${kc.jenjang} - ${namaTingkat}`;

  return (
    <div className="min-h-full bg-slate-50 pb-20">
      {/* Header Kelas: Warna Biru Murni Brand Siedu (Blue-800 -> Blue-700 -> Blue-600) */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#1e40af] via-[#1d4ed8] to-[#2563eb] pt-6 pb-16 sm:pt-8 sm:pb-20 lg:pt-10 lg:pb-24 text-white border-b border-blue-900/20 shadow-xs">
        {/* Vektor kurva gelombang organik berlapis (clean & elegan di tepi sudut) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {/* Gelombang sudut kanan atas */}
          <svg
            className="absolute -right-8 -top-8 w-72 sm:w-96 md:w-[480px] h-auto text-white"
            viewBox="0 0 400 280"
            fill="none"
          >
            <path
              d="M120 0 C200 45, 290 110, 400 240 L400 0 Z"
              fill="currentColor"
              fillOpacity="0.05"
            />
            <path
              d="M190 0 C260 40, 330 95, 400 180 L400 0 Z"
              fill="currentColor"
              fillOpacity="0.07"
            />
            <path
              d="M270 0 C325 30, 365 65, 400 120 L400 0 Z"
              fill="currentColor"
              fillOpacity="0.09"
            />
          </svg>

          {/* Gelombang sudut kiri bawah */}
          <svg
            className="absolute -left-8 -bottom-8 w-64 sm:w-80 md:w-[420px] h-auto text-white"
            viewBox="0 0 360 260"
            fill="none"
          >
            <path
              d="M0 60 C90 105, 180 175, 280 260 L0 260 Z"
              fill="currentColor"
              fillOpacity="0.05"
            />
            <path
              d="M0 120 C75 155, 145 205, 210 260 L0 260 Z"
              fill="currentColor"
              fillOpacity="0.07"
            />
            <path
              d="M0 180 C50 205, 100 230, 140 260 L0 260 Z"
              fill="currentColor"
              fillOpacity="0.08"
            />
          </svg>
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Bar Atas: Tombol Bulat Putih di Kiri & Judul Kelas di Tengah */}
          <div className="relative flex items-center justify-center min-h-11 sm:min-h-12">
            <Link
              href="/classes"
              className="absolute left-0 grid size-9 sm:size-10 place-items-center rounded-full bg-white text-slate-800 hover:bg-slate-50 shadow-sm transition-transform active:scale-95 z-10 shrink-0"
              aria-label={tr("text258")}
            >
              <ArrowLeft className="size-4 sm:size-5" aria-hidden />
            </Link>

            <div className="text-center px-10 sm:px-14 max-w-2xl mx-auto">
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-white tracking-tight leading-snug">
                {judulKelas}
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm font-medium text-white/85">
                {kc.periode}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Konten Utama: 2 Kolom Layout, Melayang Masuk ke Hero */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12 lg:-mt-14 pb-20 lg:pb-16">
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-12 items-start">
          {/* Kolom Kiri (Lebar 7): Card Utama Terpadu */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              {/* Header Card */}
              <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-7 sm:py-5 border-b border-slate-100 bg-white">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Detail Pelaksanaan Kelas
                </h2>
                <ModalPilihKelas
                  currentClassId={kc.id}
                  currentJenjang={kc.jenjang}
                  currentTingkat={kc.tingkat}
                  currentMapel={kc.mapel}
                  classes={allClasses}
                />
              </div>

              {/* Body Card */}
              <div className="p-5 sm:p-7 space-y-6">
                {/* 1. Jadwal & Kuota */}
                <div className="space-y-3">
                  {/* Jadwal Sesi Belajar */}
                  <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
                        <CalendarDays className="size-4 text-blue-600" strokeWidth={1.8} aria-hidden="true" />
                        Jadwal Sesi Belajar
                      </h3>
                      <span className="text-xs text-slate-500">
                        {k.jadwalItem?.length ?? 0} {locale === "en" ? "sessions / week" : "sesi per minggu"}
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
                      {k.jadwalItem && k.jadwalItem.length > 0 ? (
                        k.jadwalItem.map((item) => {
                          const menit = durasiMenit(item.jamMulai, item.jamSelesai);
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between px-3.5 py-3 sm:px-4 text-xs sm:text-sm"
                            >
                              <div className="flex items-center gap-3 sm:gap-6">
                                <span className="w-16 sm:w-20 font-bold text-slate-900">
                                  {labelHari(item.hari, locale)}
                                </span>
                                <span className="font-semibold text-slate-700">
                                  {String(item.jamMulai).slice(0, 5)} - {String(item.jamSelesai).slice(0, 5)} WIB
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 shrink-0">
                                {menit} menit
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-500">
                          {locale === "en" ? "Schedule to follow" : "Jadwal menyusul"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Kuota & Ketersediaan Kelas */}
                  <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <h3 className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                        <Users className="size-4 text-blue-600" strokeWidth={1.8} aria-hidden="true" />
                        {tr("text208")}
                      </h3>
                      <span className="text-xs text-slate-600">
                        <strong className={`font-bold ${kuotaTone.text}`}>{kc.kuota.terisi}</strong> dari{" "}
                        <strong className="font-bold text-slate-800">{kc.kuota.maksimum}</strong>{" "}
                        {locale === "en" ? "students" : "siswa"}
                      </span>
                    </div>

                    <div
                      className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={tr("text210")}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${kuotaTone.bar}`}
                        style={{ width: `${Math.min(100, Math.max(8, pct))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
                      <span>
                        {sisaKuota > 0
                          ? locale === "en"
                            ? `Available ${sisaKuota} empty seats for this semester.`
                            : `Tersedia ${sisaKuota} kursi kosong untuk semester ini.`
                          : locale === "en"
                          ? "Class is fully booked."
                          : "Kuota telah terisi penuh."}
                      </span>
                      <span className={`font-bold ${kuotaTone.text}`}>{pct}%</span>
                    </div>
                  </div>
                </div>

                {/* 2. Fasilitas & Pendampingan Belajar */}
                <div className="border-t border-slate-100 pt-5 space-y-3">
                  <h3 className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
                    <BookOpen className="size-4 text-blue-600" strokeWidth={1.8} aria-hidden="true" />
                    Fasilitas & Pendampingan Belajar
                  </h3>
                  <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-slate-50 p-4 sm:p-5">
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5">
                      <li className="flex items-start gap-2.5">
                        <span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full bg-emerald-500" aria-hidden="true">
                          <Check className="size-3 text-white" strokeWidth={3} />
                        </span>
                        <div>
                          <strong className="text-xs sm:text-sm font-semibold text-slate-900 block">Tatap Muka Kelas Intensif</strong>
                          <span className="text-xs text-slate-500 leading-relaxed block mt-0.5">
                            Ruang kelas ber-AC dengan rasio tutor dan murid terukur.
                          </span>
                        </div>
                      </li>

                      <li className="flex items-start gap-2.5">
                        <span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full bg-emerald-500" aria-hidden="true">
                          <Check className="size-3 text-white" strokeWidth={3} />
                        </span>
                        <div>
                          <strong className="text-xs sm:text-sm font-semibold text-slate-900 block">Modul Cetak & Bank Soal</strong>
                          <span className="text-xs text-slate-500 leading-relaxed block mt-0.5">
                            Bahan ajar kurikulum sekolah terkini dan latihan variatif.
                          </span>
                        </div>
                      </li>

                      <li className="flex items-start gap-2.5">
                        <span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full bg-emerald-500" aria-hidden="true">
                          <Check className="size-3 text-white" strokeWidth={3} />
                        </span>
                        <div>
                          <strong className="text-xs sm:text-sm font-semibold text-slate-900 block">Bimbingan PR & Tugas Sekolah</strong>
                          <span className="text-xs text-slate-500 leading-relaxed block mt-0.5">
                            Pendampingan langsung menyelesaikan kesulitan PR harian.
                          </span>
                        </div>
                      </li>

                      <li className="flex items-start gap-2.5">
                        <span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full bg-emerald-500" aria-hidden="true">
                          <Check className="size-3 text-white" strokeWidth={3} />
                        </span>
                        <div>
                          <strong className="text-xs sm:text-sm font-semibold text-slate-900 block">Laporan Progres ke Orang Tua</strong>
                          <span className="text-xs text-slate-500 leading-relaxed block mt-0.5">
                            Presensi dan rekap nilai terpantau lewat portal wali.
                          </span>
                        </div>
                      </li>

                      <li className="flex items-start gap-2.5">
                        <span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full bg-emerald-500" aria-hidden="true">
                          <Check className="size-3 text-white" strokeWidth={3} />
                        </span>
                        <div>
                          <strong className="text-xs sm:text-sm font-semibold text-slate-900 block">Simulasi Ujian & Tryout</strong>
                          <span className="text-xs text-slate-500 leading-relaxed block mt-0.5">
                            Latihan berkala menjelang PTS, PAS, atau ujian sekolah.
                          </span>
                        </div>
                      </li>

                      <li className="flex items-start gap-2.5">
                        <span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full bg-emerald-500" aria-hidden="true">
                          <Check className="size-3 text-white" strokeWidth={3} />
                        </span>
                        <div>
                          <strong className="text-xs sm:text-sm font-semibold text-slate-900 block">Konsultasi Personal & Remedial</strong>
                          <span className="text-xs text-slate-500 leading-relaxed block mt-0.5">
                            Sesi tanya jawab ekstra untuk materi yang belum tuntas.
                          </span>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* 3. Target Pembelajaran */}
                <div className="border-t border-slate-100 pt-5 space-y-3">
                  <h3 className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
                    <Target className="size-4 text-blue-600" strokeWidth={1.8} aria-hidden="true" />
                    Target Pembelajaran ({kc.mapel} {kc.jenjang})
                  </h3>
                  <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-slate-50 p-4 sm:p-5">
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                      {targets.map((t) => (
                        <li key={t} className="flex items-start gap-2.5">
                          <span
                            className="mt-1.5 size-1.5 rounded-full bg-blue-600 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="leading-relaxed">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 4. Lokasi Belajar */}
                <div className="border-t border-slate-100 pt-5 space-y-3">
                  <h3 className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
                    <MapPin className="size-4 text-blue-600" strokeWidth={1.8} aria-hidden="true" />
                    Lokasi Belajar
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-slate-900 block">{SITE.nama}</strong>
                      <span className="text-xs text-slate-500 block leading-relaxed mt-0.5">{SITE.alamat.join(", ")}</span>
                    </div>
                    <a
                      href={MAPS_SEARCH_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 shrink-0 transition-colors shadow-2xs"
                    >
                      <ExternalLink className="size-3.5 text-slate-500" />
                      Buka di Maps
                    </a>
                  </div>
                </div>

                {/* 5. Ketentuan Kelas & Pembayaran */}
                <div className="border-t border-slate-100 pt-5 space-y-3">
                  <h3 className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
                    <ShieldCheck className="size-4 text-amber-600" strokeWidth={1.8} aria-hidden="true" />
                    Ketentuan Pendaftaran & Pembayaran
                  </h3>
                  <div className="rounded-xl sm:rounded-2xl bg-amber-50/80 border border-amber-200/80 p-4 sm:p-5">
                    <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                      <li className="flex items-start gap-2.5">
                        <span className="font-bold shrink-0 text-amber-600 leading-5">•</span>
                        <span className="leading-relaxed">
                          <strong className="text-slate-900 font-semibold">Batas Waktu Pembayaran:</strong>{" "}
                          Pembayaran harus diselesaikan maksimal 24 jam setelah invoice dibuat agar pendaftaran tidak otomatis dibatalkan sistem.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="font-bold shrink-0 text-amber-600 leading-5">•</span>
                        <span className="leading-relaxed">
                          <strong className="text-slate-900 font-semibold">Kuota Minimum Kelas:</strong>{" "}
                          Kelas dimulai efektif setelah kuota minimum {kc.kuotaMinimum} siswa terpenuhi sebelum jadwal sesi perdana.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="font-bold shrink-0 text-amber-600 leading-5">•</span>
                        <span className="leading-relaxed">
                          <strong className="text-slate-900 font-semibold">Pengambilan Modul Materi:</strong>{" "}
                          Buku panduan dan modul cetak langsung dibagikan kepada siswa pada pertemuan tatap muka pertama di lokasi bimbel.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="font-bold shrink-0 text-amber-600 leading-5">•</span>
                        <span className="leading-relaxed">
                          <strong className="text-slate-900 font-semibold">Skema Pelunasan & Cicilan:</strong>{" "}
                          Pendaftar yang memilih opsi DP wajib melunasi angsuran berikutnya secara mandiri sebelum tanggal jatuh tempo tiap bulan.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Kanan (Lebar 5): Skema Pembayaran & Sticky Checkout Box */}
          <div className="lg:col-span-5">
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
              jenjang={kc.jenjang}
              isLoggedIn={Boolean(session?.user)}
              isOrangTua={isOrtu}
              anak={anakList}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
