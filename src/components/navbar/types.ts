export interface NavbarProps {
  /** Dashboard sesuai role kalau user sudah login — null saat guest. */
  dashboardHref?: string | null;
}

export interface JenjangItem {
  id: string;
  labelKey: 'levelTK' | 'levelSD' | 'levelSMP' | 'levelSMA';
  href: string;
}

export interface ProgramCategory {
  titleId: string;
  titleEn: string;
  items: {
    labelId: string;
    labelEn: string;
    href: string;
  }[];
}

export const PROGRAM_CATEGORIES: ProgramCategory[] = [
  {
    titleId: 'Jenjang Dasar',
    titleEn: 'Primary',
    items: [
      { labelId: 'TK (Taman Kanak-kanak)', labelEn: 'Kindergarten (TK)', href: '/classes?jenjang=TK' },
      { labelId: 'SD Kelas 1–3 (Dasar)', labelEn: 'Elementary Grade 1–3', href: '/classes?jenjang=SD&tingkat=Kelas+1' },
      { labelId: 'SD Kelas 4–6 (Lanjutan)', labelEn: 'Elementary Grade 4–6', href: '/classes?jenjang=SD&tingkat=Kelas+4' },
      { labelId: 'Calistung & Matematika', labelEn: 'Math & Reading Foundation', href: '/classes?jenjang=SD' },
    ],
  },
  {
    titleId: 'Jenjang Menengah',
    titleEn: 'Secondary',
    items: [
      { labelId: 'SMP (Kelas 7, 8, 9)', labelEn: 'Junior High (Grade 7–9)', href: '/classes?jenjang=SMP' },
      { labelId: 'SMA (Kelas 10, 11, 12)', labelEn: 'Senior High (Grade 10–12)', href: '/classes?jenjang=SMA' },
      { labelId: 'Persiapan Ujian Sekolah', labelEn: 'School Exam Preparation', href: '/classes?jenjang=SMP' },
      { labelId: 'Intensif UTBK & SNBT', labelEn: 'Intensive College Exam', href: '/classes?jenjang=SMA' },
    ],
  },
  {
    titleId: 'Layanan Belajar',
    titleEn: 'Services',
    items: [
      { labelId: 'Bimbingan PR & Tugas', labelEn: 'Daily Homework Help', href: '/classes' },
      { labelId: 'Modul Cetak & Bank Soal', labelEn: 'Printed Modules & Bank', href: '/classes' },
      { labelId: 'Simulasi Tryout Berkala', labelEn: 'Periodic Tryouts', href: '/classes' },
      { labelId: 'Konsultasi & Remedial', labelEn: '1-on-1 Consultation', href: '/classes' },
    ],
  },
];

