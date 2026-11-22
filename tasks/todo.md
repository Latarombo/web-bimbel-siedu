# Task List: Penyederhanaan & Konsolidasi Alur Nilai

> **Spec Reference:** [`.agents/specs/SPEC-penyederhanaan-dan-konsolidasi-alur-nilai.md`](../.agents/specs/SPEC-penyederhanaan-dan-konsolidasi-alur-nilai.md)

---

## Slice 1: Data Migration & Server Actions
- [x] Task 1.1: Buat dan jalankan skrip migrasi data `NilaiProgres` ke `Penilaian` & `HasilPenilaian`
  - Acceptance: Seluruh baris `NilaiProgres` yang ada memiliki representasi di `Penilaian` dan `HasilPenilaian`.
  - Verify: Jalankan skrip migrasi via tsx/node, periksa jumlah record. (Landed: 7 NilaiProgres dimigrasikan ke 4 Penilaian & 5 HasilPenilaian).
  - Files: `scripts/migrate-nilai-progres.ts`
- [x] Task 1.2: Refaktor Server Actions di `src/app/actions/teacher.ts`
  - Acceptance: Tambah action `saveSingleStudentGrade` untuk input cepat per siswa, perbarui `saveNilai` (sinkron ke model baru), dan batasi `ajukanKoreksi` hanya untuk `presensi`.
  - Verify: `npx tsc --noEmit` bersih.
  - Files: `src/app/actions/teacher.ts`, `src/app/actions/admin.ts`

## Slice 2: Teacher Portal UI Refactor
- [x] Task 2.1: Refaktor `QuickGradeDrawer` di Detail Kelas Guru
  - Acceptance: Drawer menampilkan selector tugas/asesmen kelas yang ada (atau opsi buat tugas cepat), input nilai 0..nilaiMaksimum, toggle dinilai/tidak_ikut, catatan, dan tombol "Berikutnya" (Next Student) terhubung ke `saveSingleStudentGrade`.
  - Verify: Buka drawer di detail kelas, simpan nilai siswa, navigasi antar siswa mulus.
  - Files: `src/components/teacher/classes/quick-grade-drawer.tsx`, `src/app/[locale]/(teacher)/teacher/classes/[classId]/page.tsx`, `src/components/teacher/classes/class-detail-view.tsx`
- [x] Task 2.2: Sederhanakan Halaman Rapor/Nilai Siswa Individual (`/teacher/grades/[enrollmentId]`)
  - Acceptance: Halaman menampilkan riwayat tugas/asesmen dari `HasilPenilaian`, guru dapat mengedit nilai/catatan langsung tanpa tab legacy dan tanpa kuncian 7 hari.
  - Verify: Halaman `/teacher/grades/[enrollmentId]` memuat riwayat tugas dengan benar.
  - Files: `src/app/[locale]/(teacher)/teacher/grades/[enrollmentId]/page.tsx`, `src/components/teacher/grades/student-grade-item-editor.tsx`
- [x] Task 2.3: Perbarui Rekap Nilai Guru (`/teacher/grades/page.tsx` & `teacher-grades-view.tsx`)
  - Acceptance: Tab Rekap Murid menghitung rata-rata nilai riil dari `HasilPenilaian` (skala 100, mengecualikan `tidak_ikut`).
  - Verify: Angka rata-rata dan status terisi sesuai `HasilPenilaian`.
  - Files: `src/app/[locale]/(teacher)/teacher/grades/page.tsx`, `src/components/teacher/grades/teacher-grades-view.tsx`

## Slice 3: Parent Portal UI & Lib Sync
- [x] Task 3.1: Perbarui Data Fetching di `src/lib/orang-tua-dashboard.ts`
  - Acceptance: Mengambil nilai dari `HasilPenilaian` (terbit & dinilai), dinormalisasi ke skala 100, catatan guru diambil dari `HasilPenilaian`.
  - Verify: Dashboard `/home` menampilkan grafik dan ringkasan nilai dengan data `HasilPenilaian`.
  - Files: `src/lib/orang-tua-dashboard.ts`
- [x] Task 3.2: Sinkronkan Komponen `NilaiTrendChart` & Halaman `/schedule-attendance`
  - Acceptance: Grafik tren dan tab nilai menampilkan data terstandarisasi skala 100 dan deskripsi tugas yang jelas.
  - Verify: Tidak ada mismatch antara `/home` dan `/schedule-attendance?tab=nilai`.
  - Files: `src/components/parent/nilai-trend-chart.tsx`, `src/app/[locale]/(parent)/schedule-attendance/page.tsx`

## Slice 4: Verification & Typecheck Gate
- [x] Task 4.1: Jalankan kompilasi TypeScript ketat
  - Acceptance: `npx tsc --noEmit` lolos 100% tanpa error dan tanpa supresi tipe (`@ts-ignore`).
  - Verify: `powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null` (Lolos exit code 0).
  - Files: Seluruh file yang dimodifikasi.
