# Spesifikasi: Halaman Rekapitulasi Presensi Guru (/teacher/attendance)

## 1. Objective & User Story
Sebagai seorang guru di Siedu, saya ingin memiliki halaman rekapitulasi presensi terpusat (`/teacher/attendance`) agar dapat memantau tingkat kehadiran seluruh murid pada kelas binaan saya sepanjang periode belajar, melihat metrik agregat (Hadir, Izin, Sakit, Alpa, Persentase Kehadiran), serta memiliki akses cepat untuk mencatat presensi sesi tanpa perlu membuka atau mengubah halaman kalender.

## 2. Invariant & Batasan Kritis
- **Strict Isolation:** DILARANG mengubah file halaman lain (seperti `/teacher/calendar/page.tsx`, `/teacher/dashboard/page.tsx`, `/teacher/classes/[classId]/page.tsx`, dll.).
- **Sidebar Navigation:** Item menu "Presensi" ditambahkan ke `TeacherSidebar` di grup "Pembelajaran" (`/teacher/attendance`) dengan penanda rute aktif yang presisi.
- **Design Constraints (CONSTRAINTS.md):**
  - *Icon Restraint:* Tidak ada ikon di dalam kotak berwarna untuk KPI card ("KPIs are type, not tiles"). Tombol teks menggunakan label yang jelas tanpa ikon dekoratif.
  - *Anti-Header Pill Clutter:* Judul halaman H1 bersih dan berwibawa tanpa pill/badge menempel di samping judul.
  - *Data Alignment:* Angka dan persentase kehadiran menggunakan `tabular-nums` dan rata kanan (`text-right`).
  - *Zero Suppression:* Tidak ada `@ts-ignore` atau `as any`.

## 3. Data Contracts & Architecture
- **Route:** `src/app/[locale]/(teacher)/teacher/attendance/page.tsx`
- **Component:** `src/components/teacher/attendance/teacher-attendance-overview.tsx`
- **Data Queries (RSC):**
  - Mengambil kelas yang diampu oleh `guruId` yang sedang login (`db.orm.public.Kelas.where({ guruId })`).
  - Mengambil daftar pendaftaran aktif siswa di kelas tersebut (`Pendaftaran` -> `Anak`).
  - Mengambil daftar sesi pertemuan dan riwayat presensi (`Presensi` & `SesiPertemuan`).
  - Menghitung agregat per kelas: Total Sesi, Total Hadir, Izin, Sakit, Alpa, dan Rata-rata Kehadiran (%).
  - Menghitung rekap per siswa: Nama, Kelas, Jenjang, Hadir, Izin, Sakit, Alpa, % Kehadiran, Status Peringatan (misal jika alpa > 2 atau kehadiran < 75%).
  - Daftar sesi terdekat / butuh presensi dengan link langsung ke `/teacher/classes/[classId]/sessions/[date]/attendance?sesi=[jadwalItemId]`.

## 4. Acceptance Criteria (Given-When-Then)
- **AC-1:** Diberikan seorang guru yang login, ketika membuka menu "Presensi" di sidebar atau mengakses `/teacher/attendance`, maka sistem menampilkan ringkasan rekapitulasi kehadiran kelasnya.
- **AC-2:** Filter kelas memungkinkan guru menyaring rekapitulasi untuk seluruh kelas atau kelas tertentu.
- **AC-3:** Tabel rekapitulasi siswa menampilkan kolom Nama Murid, Kelas, Hadir, Izin, Sakit, Alpa, dan % Kehadiran dengan format `tabular-nums` rata kanan.
- **AC-4:** Bagian sesi pertemuan menampilkan sesi yang memerlukan presensi / sesi terakhir dengan tautan langsung ke halaman input presensi sesi terkait.
- **AC-5:** Navigasi sidebar guru menampilkan item "Presensi" dengan indikator aktif yang sesuai ketika berada di `/teacher/attendance`.
- **AC-6:** Tidak ada halaman kalender atau halaman lain yang dimodifikasi. Kompilasi TypeScript (`npx tsc --noEmit`) lolos bersih tanpa error.

## 5. Out-of-Scope
- Modifikasi pada alur halaman kalender atau dashboard yang sudah ada.
- Ekspor PDF/Excel khusus rekap (dapat ditambahkan di iterasi berikutnya).
