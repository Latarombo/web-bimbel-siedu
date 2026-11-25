# Spec: Pembaruan Header Penilaian & Standardisasi Nilai Maksimum Guru

## 1. Objective & User Story
Sebagai guru yang menilai tugas/asesmen siswa di halaman `/teacher/grades/assessment/[id]` (baik dengan parameter `?from=class` maupun umum):
- Saya ingin melihat ringkasan informasi tugas di bagian header dalam format daftar vertikal sederhana (Key: Value) yang bersih dan langsung ke intinya:
  - **Nama Tugas**: nama asesmen
  - **Mata Pelajaran**: nama mata pelajaran
  - **Kelas**: jenjang atau nama kelas (misal: "SD")
  - **Sesi Pertemuan**: nomor pertemuan terkait (misal: "Pertemuan #1" atau "-")
  - **Tanggal Pertemuan**: tanggal sesi pertemuan (`YYYY-MM-DD` atau "-")
  - **Tanggal Penilaian**: tanggal asesmen (YYYY-MM-DD)
  - **Jumlah Siswa**: total siswa yang aktif/terdaftar pada asesmen tersebut
- Saya tidak lagi dibebani atau diizinkan mengatur nilai maksimum (karena sistem telah membakukan nilai maksimum ke skala tetap 100), baik di tab pengaturan penilaian maupun modal pembuatan/perubahan asesmen cepat.

## 2. Command Verifikasi
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

## 3. Data Contracts
- Nilai maksimum (`nilaiMaksimum`) pada skema database tetap dipertahankan dengan default `100` (`Decimal @default("100")`), tanpa migrasi skema destruktif.
- Server Action `savePenilaianBatch` dan `simpanPenilaianCepat` mematok `nilaiMaksimum` selalu bernilai `100` (validasi skor rentang 0..100).
- Frontend props:
  - `PenilaianForm`: tidak lagi mengekspos field input `nilaiMaksimum` pada tab Pengaturan Asesmen. Skor maksimum default dibakukan menjadi 100.
  - `QuickAssessmentModal`: menghapus field input `nilai_maksimum`, mengirim default "100" ke action.

## 4. Acceptance Criteria (Given-When-Then)

### AC 1: Format Header Daftar Vertikal Sederhana (Tanpa Card, Tanda Titik Dua Lurus)
- **Given** guru membuka halaman `/teacher/grades/assessment/[id]` (misal `/teacher/grades/assessment/18?from=class`),
- **When** halaman dirender,
- **Then** di bawah breadcrumb, halaman menampilkan ringkasan informasi secara langsung (tanpa card box/background) dengan grid 3-kolom sehingga tanda titik dua (`:`) lurus vertikal:
  - `Nama Tugas         : [nama]`
  - `Mata Pelajaran     : [mapel]`
  - `Kelas              : [jenjang/tingkat]`
  - `Sesi Pertemuan     : [sesi atau -]`
  - `Tanggal Pertemuan  : [tanggal pertemuan atau -]`
  - `Tanggal Penilaian  : [tanggal]`
  - `Jumlah Siswa       : [jumlah siswa]`
- **And** tabel lembar penilaian siswa (`PenilaianForm`) di bawahnya tetap aktif dan dapat digunakan untuk menginput nilai siswa.

### AC 2: Penghapusan Pengaturan Nilai Maksimum di Form Penilaian
- **Given** guru membuka tab "Pengaturan Asesmen" pada form penilaian,
- **When** guru melihat form pengaturan,
- **Then** input "Nilai Maksimum" sudah tidak ada.
- **And** aksi "Beri Nilai Maks Semua" secara otomatis mengisi nilai 100 untuk siswa yang belum dinilai.
- **And** validasi nilai siswa membatasi skor maksimal 100.

### AC 3: Penghapusan Input Nilai Maksimum di Modal Penilaian Cepat
- **Given** guru membuka modal pembuatan/pengubahan asesmen cepat di halaman kelas (`QuickAssessmentModal`),
- **When** modal terbuka,
- **Then** tidak ada field input "Nilai Maksimum".
- **And** saat form disubmit, sistem menyimpan nilai maksimum sebagai 100.

### AC 4: Keamanan Nilai Maksimum di Server Action
- **Given** request mutasi dikirim ke `savePenilaianBatch`,
- **When** data diproses di server,
- **Then** nilai maksimum selalu dipatok 100 tanpa bergantung pada input form guru.
- **And** validasi memastikan skor siswa berada dalam rentang `0 <= nilai <= 100`.

### AC 5: Tabel Penilaian dengan Radio Button & Clean Inline Inputs (Gaya Tabel Kelas)
- **Given** guru membuka lembar nilai siswa pada tab "Daftar Nilai Siswa",
- **When** tabel siswa ditampilkan,
- **Then** kolom "Status Penilaian" menyajikan 2 opsi radio button horizontal: "Dinilai" dan "Tidak Ikut".
- **And** kolom "Nilai" dan "Catatan & Umpan Balik Guru" menggunakan clean inline input (tanpa kotak border tebal / card-in-card, berlatar transparan menyatu dengan baris tabel) mengikuti gaya tabel Tugas & Asesmen pada `/teacher/classes/18`.
- **And** saat guru mengetikkan nilai, status radio otomatis berpindah ke "Dinilai"; jika guru memilih "Tidak Ikut", input nilai dinonaktifkan dan dikosongkan.

### AC 6: Tata Letak Toolbar Penilaian & Tombol Aksi
- **Given** guru berada di tab lembar penilaian siswa,
- **When** toolbar kontrol di atas tabel dirender,
- **Then** search bar nama siswa berada di sisi kiri dengan styling konsisten (`h-9`, border teratur).
- **And** tombol aksi berada di sisi kanan dengan kontras dan keterbacaan tinggi:
  - Tombol "Beri Nilai Maks Semua" dengan teks netral kontras jelas.
  - Tombol "Reset" dengan teks merah (`text-rose-600`) dan hover merah halus.

## 5. Out-of-Scope
- Drop kolom `nilai_maksimum` dari tabel database PostgreSQL (tetap dipertahankan dengan default 100 demi integritas data lama dan modul rapor).
- Perubahan alur atau status penilaian (draf/terbit) selain penghapusan konfigurasi nilai maksimum.
