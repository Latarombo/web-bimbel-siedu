export type FasilitasItem = {
  id: string;
  judul: string;
  deskripsi: string;
};

/**
 * Daftar fasilitas standar paket bimbingan belajar Siedu.
 * Digunakan secara konsisten pada Halaman Detail Kelas (/classes/[id])
 * dan Halaman Checkout Draft Invoice (/classes/[id]/daftar).
 */
export const FASILITAS_KELAS: FasilitasItem[] = [
  {
    id: "tatap-muka",
    judul: "Tatap Muka Kelas Intensif",
    deskripsi: "Ruang kelas ber-AC dengan rasio tutor dan murid terukur.",
  },
  {
    id: "modul-cetak",
    judul: "Modul Cetak & Bank Soal",
    deskripsi: "Bahan ajar kurikulum sekolah terkini dan latihan variatif.",
  },
  {
    id: "bimbingan-pr",
    judul: "Bimbingan PR & Tugas Sekolah",
    deskripsi: "Pendampingan langsung menyelesaikan kesulitan PR harian.",
  },
  {
    id: "laporan-progres",
    judul: "Laporan Progres ke Orang Tua",
    deskripsi: "Presensi dan rekap nilai terpantau lewat portal wali.",
  },
  {
    id: "simulasi-ujian",
    judul: "Simulasi Ujian & Tryout",
    deskripsi: "Latihan berkala menjelang PTS, PAS, atau ujian sekolah.",
  },
  {
    id: "konsultasi-personal",
    judul: "Konsultasi Personal & Remedial",
    deskripsi: "Sesi tanya jawab ekstra untuk materi yang belum tuntas.",
  },
];

export type KetentuanItem = {
  judul: string;
  deskripsi: string;
};

export function getKetentuanPendaftaran(kuotaMinimum: number): KetentuanItem[] {
  return [
    {
      judul: "Batas Waktu Pembayaran",
      deskripsi:
        "Pembayaran harus diselesaikan maksimal 24 jam setelah invoice dibuat agar pendaftaran tidak otomatis dibatalkan sistem.",
    },
    {
      judul: "Kuota Minimum Kelas",
      deskripsi: `Kelas dimulai efektif setelah kuota minimum ${kuotaMinimum} siswa terpenuhi sebelum jadwal sesi perdana.`,
    },
    {
      judul: "Pengambilan Modul Materi",
      deskripsi:
        "Buku panduan dan modul cetak langsung dibagikan kepada siswa pada pertemuan tatap muka pertama di lokasi bimbel.",
    },
    {
      judul: "Skema Pelunasan & Cicilan",
      deskripsi:
        "Pendaftar yang memilih opsi DP wajib melunasi angsuran berikutnya secara mandiri sebelum tanggal jatuh tempo tiap bulan.",
    },
  ];
}

export function targetPembelajaran(mapel: string, jenjang: string): string[] {
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
