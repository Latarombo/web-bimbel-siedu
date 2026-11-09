# SPEC: Teacher Class Detail Page Full Refactor (`/teacher/classes/[classId]`)

## 1. Objective & User Story
Sebagai guru pengampu kelas, saya ingin melihat dan mengelola detail kelas (roster murid, jadwal tatap muka, tugas asesmen, dan ringkasan kelas) dalam tampilan antarmuka yang tenang, profesional, berkecepatan tinggi, dan bebas dari distraksi visual (*pill soup*, ikon dekoratif yang tidak perlu), sehingga saya dapat mencatat presensi dan memasukkan nilai siswa secara efisien.

---

## 2. Verification Command
Verifikasi TypeScript wajib exit code 0:
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. Data Contracts
Kompatibilitas penuh dengan antarmuka yang ada pada `ClassDetailViewProps`:
```typescript
export interface StudentRosterItem {
  id: number; // pendaftaranId
  anakId: number;
  nama: string;
  status: "terdaftar" | "tertunggak" | string;
  nNilai: number;
  rata: number | null;
  hadir: number;
  tercatat: number;
  tingkat?: string | null;
}

export interface ScheduleSlotItem {
  id: number;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  nextSessionDate?: string;
  nextSessionTime?: string;
}

export interface ClassAssessmentItem {
  id: number;
  nama: string;
  tanggal: string;
  nilaiMaksimum: number;
  draf: boolean;
  diterbitkanPada?: string | null;
  countDinilai: number;
  countTidakIkut: number;
  countBelum: number;
  totalSiswa: number;
}

export interface ClassDetailViewProps {
  classId: number;
  className: string;
  jenjang: string;
  tingkat?: string | null;
  classStatus: string;
  kuotaMaksimum: number;
  kuotaMinimum: number;
  periodeNama?: string;
  students: StudentRosterItem[];
  schedules: ScheduleSlotItem[];
  assessments: ClassAssessmentItem[];
  firstTodaySession?: {
    jadwalItemId: number;
    jamMulai: string;
    jamSelesai: string;
  } | null;
  activeAttendanceSession?: {
    jadwalItemId: number;
    tanggalPertemuan: string;
    jamMulai: string;
    jamSelesai: string;
    isToday: boolean;
  } | null;
  todayStr: string;
  locale: string;
  stats: {
    activeStudents: number;
    totalGradeEntries: number;
    totalRecordedAttendance: number;
  };
}
```

---

## 4. Acceptance Criteria (Given-When-Then)

### AC1: Header & Area Aksi Utama
- **Given** guru membuka halaman `/teacher/classes/[classId]`.
- **When** halaman dimuat:
  - Breadcrumb tampil minimalis (`Dashboard / Kelas Diampu / {className}`).
  - Judul halaman `h1` tampil tegas tanpa badge/pill berjejer di sampingnya.
  - Subtitle menjelaskan konteks meta secara tenang (mis. `Periode: {periodeNama} · {jenjang} {tingkat}`).
  - Aksi utama terfokus:
    1. Tombol solid blue `Catat Presensi Hari Ini` (atau `Isi Presensi` jika ada sesi terdekat).
    2. Tombol outline `Buat Tugas`.
    3. Tombol utilitas tenang `Ekspor`.

### AC2: Tab Navigasi Horizontal (Linear Style)
- **Given** navigasi antar tab konten.
- **When** guru melihat tab:
  - Terdapat 4 tab: `Roster Siswa`, `Jadwal & Sesi`, `Tugas & Asesmen`, `Ringkasan & Aksi`.
  - Tampilan underline tab modern (`border-b-2`) tanpa pill badge angka counter.
  - Active tab ditandai dengan aksen warna primer yang tenang dan kontras.

### AC3: Tab 1 - Roster Siswa & Kolom Aksi Cepat
- **Given** tab `Roster Siswa` aktif.
- **When** guru melihat daftar siswa:
  - Toolbar berisi judul seksi yang tenang dan search bar dengan input yang rapi.
  - Tabel memuat kolom: `Siswa`, `Status`, `Kehadiran`, `Nilai Rata-rata`, `Entri Tugas`, `Aksi`.
  - Kolom Aksi menyediakan tombol cepat langsung `Input Nilai` (primary/subtle action) serta menu dropdown 3-titik untuk aksi lanjutan (`Lihat Rapor Siswa`, `Unduh Sertifikat`).
  - Baris siswa memiliki avatar minimalis, tipografi nama yang jelas, dan status registrasi (`Terdaftar` / `Tertunggak`) dengan styling badge status yang tenang.
  - Paginasi rapi di bagian bawah tabel.

### AC4: Tab 2 - Jadwal & Sesi Mingguan
- **Given** tab `Jadwal & Sesi` aktif.
- **When** guru melihat daftar jadwal:
  - Menampilkan kartu/baris sesi tatap muka mingguan dengan waktu dan sesi terdekat.
  - Tombol aksi `Presensi` mengarah langsung ke tanggal sesi berikutnya.

### AC5: Tab 3 - Tugas & Asesmen
- **Given** tab `Tugas & Asesmen` aktif.
- **When** guru melihat daftar tugas:
  - Menampilkan tabel asesmen yang mencakup nama tugas, tanggal, nilai maksimum, status kemajuan penilaian (`X/Y Dinilai`), status penerbitan (`Draf` / `Terbit`), dan tombol langsung `Nilai Siswa`.
  - Empty state yang rapi jika belum ada tugas dengan CTA `Buat Tugas Pertama`.

### AC6: Tab 4 - Ringkasan & Aksi Kelas
- **Given** tab `Ringkasan & Aksi` aktif.
- **When** guru melihat ringkasan:
  - Statistik kelas mengusung prinsip *"KPIs are type, not tiles"* menggunakan definition list (`dl`, `dt`, `dd`) yang presisi tanpa kotak ikon berwarna.
  - Progress bar kapasitas kuota kelas terintegrasi dengan bersih.
  - Tautan unduhan rekap presensi dan rekap nilai tersusun rapi.

### AC7: Kepatuhan Standar Kualitas & Desain
- **Given** aturan dalam `AGENTS.md` dan `CONSTRAINTS.md`.
- **When** implementasi diperiksa:
  - Dilarang keras ada pill counter / badge clutter di samping heading.
  - Dilarang keras ada ikon dekoratif pada tombol teks.
  - Tidak ada supresi `@ts-ignore` / `eslint-disable`.
  - Dukungan mode terang dan gelap (*dark mode*) yang konsisten.

---

## 5. Out-of-Scope
- Perubahan skema basis data PostgreSQL/Prisma.
- Perubahan endpoint backend ekspor CSV.
