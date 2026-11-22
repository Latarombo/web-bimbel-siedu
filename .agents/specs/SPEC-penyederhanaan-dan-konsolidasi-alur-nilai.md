# Spec: Penyederhanaan & Konsolidasi Alur Nilai (Single Source of Truth)

> **Status:** Draft (Menunggu Konfirmasi & Persetujuan)  
> **Modul Terkait:** `teacher-grades`, `teacher-classes`, `parent-dashboard`, `parent-schedule-attendance`, `admin-corrections`  
> **Pola Arsitektur:** Spec-Driven Development (SDD), Ponytail (Minimal Viable Diff), Single Source of Truth

---

## 1. Objective & User Story

### Objective
Menyederhanakan alur kerja guru dalam memasukkan dan mengelola nilai siswa, mengonsolidasikan arsitektur data nilai menjadi satu model tunggal (`Penilaian` & `HasilPenilaian`), mengeliminasi model ganda (`NilaiProgres` legacy), menghapus birokrasi penguncian koreksi admin untuk nilai, serta menyinkronkan tampilan progres nilai antara Portal Guru dan Portal Orang Tua.

### Problem Statement
1. **Dualitas Model Data (Dual Data Models):** Terdapat dua model data nilai yang berjalan paralel:
   - `NilaiProgres`: Nilai per siswa per tanggal tanpa nama tugas, dipakai di Quick Grade Drawer, profil siswa, dan grafik tren dashboard Orang Tua.
   - `Penilaian` + `HasilPenilaian`: Entitas tugas/asesmen kelas berbasis rombongan belajar dengan status draf/terbit, dipakai di halaman rekap nilai guru dan tab nilai jadwal Orang Tua.
   Dualitas ini membingungkan guru, menyebabkan data terpecah, dan rawan desinkronisasi.
2. **Friksi Alur Kerja Guru:** Tombol "Input Nilai" pada roster detail kelas tidak terhubung dengan tugas/asesmen kelas yang sedang berjalan. Guru harus berpindah-pindah antara form individual dan form tugas kelas.
3. **Birokrasi Penguncian Nilai:** Penguncian 7 hari (BR#18) yang sebelumnya diterapkan pada nilai mewajibkan guru mengajukan tiket koreksi ke Admin hanya untuk mengubah nilai tugas harian. Hal ini membebani operasional bimbel harian.
4. **Inkonsistensi Tampilan Orang Tua:** Grafik tren di Dashboard Orang Tua (`/home`) mengambil data `NilaiProgres`, sementara tab Nilai di `/schedule-attendance?tab=nilai` mengambil `HasilPenilaian`. Jika guru menginput salah satu, tampilan di sisi orang tua menjadi tidak konsisten.

### User Stories
- **Sebagai Guru:** Saya dapat dengan mudah memberi nilai siswa langsung dari roster kelas (melalui drawer cepat yang terhubung ke tugas kelas aktif) atau melalui form massal satu rombel, serta mengoreksi nilai siswa kapan saja tanpa terhambat penguncian birokratis.
- **Sebagai Orang Tua:** Saya dapat memantau riwayat tugas, nilai kuantitatif, dan catatan guru anak saya secara transparan dan konsisten, baik dalam bentuk grafik tren perkembangan belajar (skala 0–100) maupun daftar rincian tugas.
- **Sebagai Admin:** Saya tidak lagi dibebani review pengajuan koreksi nilai harian guru, dan fokus review persetujuan koreksi hanya untuk data kehadiran/presensi resmi (BR#18).

---

## 2. Command Verifikasi

```bash
# 1. Bersihkan cache Next.js
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npm run clean" < /dev/null

# 2. Verifikasi tipe TypeScript tanpa error (Wajib lolos 100%)
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. Data Contracts & Arsitektur Nilai

### A. Single Source of Truth
Model data nilai distandarkan sepenuhnya ke:
1. `Penilaian` (Header Tugas/Asesmen):
   - `id`: Int (PK)
   - `kelasId`: Int (FK ke Kelas)
   - `nama`: String (e.g. "Kuis Pertemuan 3", "Latihan Pecahan", "Evaluasi Harian")
   - `tanggal`: DateString (YYYY-MM-DD)
   - `nilaiMaksimum`: Decimal (default: 100)
   - `draf`: Boolean (false jika sudah diterbitkan)
   - `diterbitkanPada`: TimestamptzString?
   - `dibuatOleh`: Int (FK ke User/Guru)
2. `HasilPenilaian` (Nilai Per Siswa):
   - `id`: Int (PK)
   - `penilaianId`: Int (FK ke Penilaian)
   - `pendaftaranId`: Int (FK ke Pendaftaran)
   - `statusHasil`: `belum_dinilai` | `dinilai` | `tidak_ikut`
   - `nilai`: Decimal? (null jika belum dinilai / tidak ikut)
   - `catatan`: String? (catatan kualitatif guru untuk siswa)

### B. Migrasi Data `NilaiProgres` Legacy
- Skrip migrasi/injeksi aman akan memeriksa entitas `NilaiProgres` yang sudah ada:
  - Dikelompokkan per `kelasId` dan `tanggal`.
  - Dibuatkan entitas `Penilaian` berstatus terbit (`draf: false`, `nama: "Evaluasi Progres Belajar [tanggal]"`).
  - Dibuatkan entitas `HasilPenilaian` untuk setiap pendaftaran terkait dengan nilai dan catatan yang sesuai.
- Action server dan komponen pembaca beralih sepenuhnya ke `Penilaian` & `HasilPenilaian`.

### C. Normalisasi Tren & Kalkulasi Rata-Rata
- **Grafik Tren Dashboard Orang Tua (`NilaiTrendChart`):**
  - Mengambil data dari `HasilPenilaian` milik anak yang berstatus `dinilai` dan berinduk pada `Penilaian` yang telah diterbitkan (`draf === false`).
  - Nilai dinormalisasikan ke skala 100:
    $$\text{skala100} = \operatorname{round}\left(\frac{\text{nilai}}{\text{nilaiMaksimum}} \times 100\right)$$
- **Kalkulasi Rata-Rata Siswa:**
  - Status `tidak_ikut` **dikecualikan** dari pembagi rata-rata (hanya hasil dengan status `dinilai` yang dihitung ke rata-rata).
  - Formula: $\text{Rata-Rata} = \frac{\sum \text{skala100}}{\text{jumlah tugas berstatus 'dinilai'}}$.

### D. Penghapusan Birokrasi Penguncian Nilai
- Penguncian 7 hari (BR#18) **HANYA** berlaku untuk `Presensi` (kehadiran siswa).
- Guru dapat mengedit dan memperbarui `HasilPenilaian` siswa kapan saja secara langsung.
- Pengajuan koreksi guru (`/teacher/corrections`) dan persetujuan koreksi admin (`/admin/corrections`) disederhanakan murni untuk entitas `presensi`.

---

## 4. Alur Kerja & Penyederhanaan UI Guru

### Alur 1: SpeedGrader Drawer di Detail Kelas (`/teacher/classes/[classId]`)
- Pada tabel Roster Siswa, klik "Input Nilai" membuka `QuickGradeDrawer`.
- Drawer menampilkan:
  - Selector Tugas/Asesmen Kelas (daftar tugas kelas yang sudah ada, atau opsi "+ Buat Tugas Baru").
  - Skor siswa untuk tugas terpilih (input angka 0..nilaiMaksimum).
  - Catatan evaluasi guru untuk siswa tersebut.
  - Tombol toggle status: `Dinilai` / `Tidak Ikut`.
  - Tombol navigasi cepat "Sebelumnya" & "Berikutnya" (Next Student) dengan simpan otomatis / instant save.

### Alur 2: Pengisian Nilai Rombel Massal (`/teacher/grades/assessment/[id]`)
- Guru dapat mengisi nilai seluruh siswa dalam satu kelas sekaligus dalam format tabel daftar hadir/nilai:
  - Kolom nilai & status per baris siswa.
  - Opsi simpan sebagai "Draf" atau langsung "Terbitkan".

### Alur 3: Pusat Penilaian Guru (`/teacher/grades`)
- Tab 1: **Daftar Asesmen Kelas** — Kartu/tabel tugas per kelas dengan indikator kelengkapan penilaian (misal: 12/15 dinilai) dan status Draf/Terbit.
- Tab 2: **Rekap Murid** — Daftar seluruh siswa bimbingan guru dengan rata-rata nilai riil, jumlah tugas dinilai, dan link langsung ke rekap murid individual.

### Alur 4: Rekap Murid Individual (`/teacher/grades/[enrollmentId]`)
- Menampilkan riwayat seluruh asesmen kelas yang diikuti oleh siswa tersebut.
- Guru dapat mengedit nilai dan catatan langsung dari halaman ini tanpa perlu masuk ke form terpisah.

---

## 5. Acceptance Criteria (Given-When-Then)

### AC-1: Single Source of Truth & Konsolidasi Data
- **Given** guru menginput atau memperbarui nilai siswa melalui SpeedGrader Drawer maupun Form Asesmen Massal,
- **When** data disimpan,
- **Then** data tersimpan ke tabel `HasilPenilaian` & `Penilaian`, dan langsung tercermin baik pada Portal Guru maupun Portal Orang Tua tanpa divergensi.

### AC-2: Alur SpeedGrader Drawer Guru
- **Given** guru membuka halaman detail kelas (`/teacher/classes/[classId]`) dan membuka QuickGradeDrawer untuk siswa tertentu,
- **When** guru memilih tugas kelas dan menginput skor serta catatan,
- **Then** skor tersimpan pada tugas tersebut, dan guru dapat menekan tombol "Berikutnya" untuk langsung menilai siswa selanjutnya tanpa menutup drawer.

### AC-3: Penghapusan Friksi Penguncian Nilai
- **Given** guru ingin memperbarui nilai tugas yang dibuat lebih dari 7 hari yang lalu,
- **When** guru mengedit nilai dan menyimpan,
- **Then** sistem langsung menyimpan perubahan nilai tanpa memblokir atau mewajibkan pengajuan koreksi ke admin.

### AC-4: Normalisasi Tren & Rata-Rata di Portal Orang Tua
- **Given** seorang siswa memiliki beberapa nilai tugas dengan nilai maksimum bervariasi (misal kuis maks 10 dapat 9, ujian maks 100 dapat 85, dan satu tugas berstatus `tidak_ikut`),
- **When** Orang Tua membuka Dashboard (`/home`) dan Jadwal Nilai (`/schedule-attendance?tab=nilai`),
- **Then** grafik tren menampilkan nilai dalam skala seragam 0–100 (kuis menjadi 90, ujian menjadi 85), dan status `tidak_ikut` tidak menurunkan rata-rata siswa menjadi nol.

### AC-5: Verifikasi Bebas Error
- **Given** seluruh modifikasi kode selesai diimplementasikan,
- **When** menjalankan `npx tsc --noEmit`,
- **Then** tidak ada error tipe TypeScript di seluruh codebase.

---

## 6. Out of Scope
1. Pembuatan format cetak rapor resmi sekolah atau ijazah kelulusan (tetap berpegang pada keputusan decommissioning sebelumnya).
2. Perubahan pada alur presensi atau payment gateway.
3. Penambahan bobot persentase kalkulasi otomatis (misal UTS 30%, UAS 40%) — sistem menggunakan rata-rata terstandarisasi skala 100 murni.

---

## 7. Rencana Irisan Vertikal (Tracer-Bullet Slices)

- **Slice 1 (Data Layer & Server Actions):**
  - Buat skrip migrasi data dari `NilaiProgres` ke `Penilaian` & `HasilPenilaian`.
  - Refaktor `src/app/actions/teacher.ts` (`saveNilai`, `savePenilaianBatch`, `saveSingleStudentGrade`).
  - Hapus entitas `nilai` dari alur `ajukanKoreksi` di `teacher.ts` dan `prosesKoreksi` di `admin.ts` (difokuskan khusus `presensi`).
- **Slice 2 (Portal Guru UI):**
  - Refaktor `QuickGradeDrawer` di `/teacher/classes/[classId]` agar terhubung ke entitas `Penilaian` kelas.
  - Sederhanakan halaman rekap murid individual `/teacher/grades/[enrollmentId]` ke entitas `HasilPenilaian`.
  - Bersihkan `/teacher/grades` agar konsisten membaca satu model data.
- **Slice 3 (Portal Orang Tua UI & Lib Sync):**
  - Perbarui `src/lib/orang-tua-dashboard.ts` untuk membaca `HasilPenilaian` (dengan normalisasi skala 100 dan catatan guru).
  - Sinkronkan tab Nilai di `/schedule-attendance` dan `NilaiTrendChart` di `/home`.
- **Slice 4 (Audit & Verifikasi):**
  - Jalankan `npx tsc --noEmit` via PowerShell Windows.
  - Uji alur end-to-end guru & orang tua.
