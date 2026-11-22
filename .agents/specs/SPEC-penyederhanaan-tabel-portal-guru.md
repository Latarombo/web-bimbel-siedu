# SPEC: Penyederhanaan & Modernisasi UX Tabel Portal Guru (Adaptive Hybrid Tables)

> **Status:** Approved (via SDD Grill & User Alignment)  
> **Tanggal:** 2026-11-21  
> **Author:** Antigravity  
> **Modul Terkait:** `class-detail-view.tsx`, `teacher-grades-view.tsx`, `attendance-table.tsx`  
> **Skills Terkait:** `spec-driven-development`, `constraint-driven-development`, `ui-ux-pro-max`, `impeccable`, `web-design-guidelines`, `ponytail`

---

## 1. Objective & User Story

### Objective
Menyederhanakan seluruh tabel utama pada Portal Guru Siedu agar tidak lagi rumit dan padat (mengurangi kelebihan kolom, membersihkan badge berlebih, dan menyatukan metadata), serta memberikan pengalaman pengguna (UX) yang prima di perangkat mobile/smartphone melalui pendekatan **Hybrid/Adaptive UI** (tabel bersih di layar desktop `>= 768px`, otomatis bertransformasi menjadi daftar kartu terstruktur di layar mobile `< 768px`).

### User Story
- **Sebagai Guru:**
  - Saat membuka portal di laptop/desktop, saya melihat tabel yang bersih, berjarak lega, dengan jumlah kolom yang fokus dan hierarki tipografi yang jelas tanpa semak badge/ikon berlebih.
  - Saat membuka portal di ponsel pintar (smartphone) di dalam kelas, saya tidak perlu menggeser horizontal secara canggung (*awkward horizontal scrolling*). Saya dapat melihat daftar siswa/tugas dalam bentuk kartu yang ramah sentuhan dengan target sentuh minimal 44px, dapat menandai presensi (H/I/S/A) dengan cepat, dan dapat mengakses aksi utama langsung tanpa terselip.
- **Sebagai Administrator / Pengembang:**
  - Komponen tabel tetap type-safe, mematuhi seluruh batasan kualitas di `CONSTRAINTS.md`, dan mengikuti prinsip desain Siedu (`Icon Restraint`, `Anti-Header Pill Clutter`, dan `Clean Typography`).

---

## 2. Command Verifikasi

```bash
# 1. Verifikasi Type Check TypeScript (Wajib 0 error)
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null

# 2. Verifikasi Build Next.js
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npm run build" < /dev/null
```

---

## 3. Data Contracts & UX Design Specs

### A. Prinsip Desain UI/UX (Sesuai `DESIGN.md` & `CONSTRAINTS.md`)
1. **Icon Restraint & Typography First:**
   - Dilarang membuat ikon dalam kotak/lingkaran berwarna pada metrik atau data cell.
   - Angka nilai, jumlah sesi, dan persentase disajikan dengan font `tabular-nums` yang jujur dan kontras kuat.
   - Menghilangkan badge pill warna-warni yang bertumpuk (*badge soup*).
2. **Pemisahan Kolom Bersih & Prinsip "1 Cell = 1 Data" (Atomic Data Points):**
   - **Aturan 1 Cell = 1 Data:** Setiap cell pada tabel data wajib memuat tepat **satu data tunggal atomik**. Dilarang menumpuk dua atau lebih data berbeda dalam satu cell (misalnya menggabungkan rasio sesi dan persentase, menggabungkan skor nilai dan jumlah tugas, atau menggabungkan nama tugas dan tanggal).
   - **Kolom No Urut Terpisah:** Setiap tabel memiliki kolom `No` eksplisit (1, 2, 3...) yang terhitung dinamis dari pagination.
   - **Kolom Siswa Murni:** Hanya menampilkan Nama lengkap siswa. Seluruh ID database teknis (`ID: ... · Anak #...`) dan avatar inisial dekoratif dihilangkan dari tabel data/spreadsheet.
   - **Eliminasi Status Pembayaran ("Tertunggak"):** Tagihan dan pembayaran adalah urusan privat antara Orang Tua dan Admin. Siswa berstatus `tertunggak` tetap memiliki hak belajar di kelas dan ditampilkan setara tanpa label finansial apapun di portal Guru.
3. **Hybrid / Adaptive Table Pattern:**
   - Desktop (`md:block` / `md:table`): Tabel terstruktur, sticky header, hover rows halus (`hover:bg-slate-50/70 dark:hover:bg-slate-800/40`), border tipis berstandar rasio kontras 3:1.
   - Mobile (`block md:hidden`): Tampilan kartu (stacked card view) dengan border halus `border-slate-200 dark:border-slate-800`, latar belakang kartu putih/dark surface, jarak sentuh nyaman, dan tombol aksi berukuran ergonomis (`min-h-[40px]`).

---

## 4. Rencana Irisan Vertikal (*Vertical Slices*)

### Slice 1: Roster Siswa & Asesmen di Detail Kelas (`class-detail-view.tsx`)
- **Tabel Roster Siswa (1 Cell = 1 Data):**
  - Desktop: Susunan 7 kolom terpisah:
    1. `No` (Nomor urut berbasis pagination).
    2. `Siswa` (Nama siswa murni).
    3. `Sesi Hadir` (Rasio hadir per sesi, misal `4/4`).
    4. `Kehadiran (%)` (Persentase kehadiran tabular-nums, misal `100%`).
    5. `Tugas Dinilai` (Jumlah tugas dinilai, misal `3 tugas`).
    6. `Nilai Rata-rata` (Angka nilai rata-rata, misal `85`).
    7. `Aksi` (Tombol "Rincian Siswa" & "Input Nilai").
- **Tabel Tugas & Asesmen Kelas (1 Cell = 1 Data):**
  - Desktop: Susunan 6 kolom terpisah:
    1. `No` (Nomor urut tugas 1, 2, 3...).
    2. `Nama Tugas` (Nama tugas/asesmen murni).
    3. `Tanggal` (Tanggal pelaksanaan YYYY-MM-DD).
    4. `Siswa Dinilai` (Rasio dinilai, misal `3/5`).
    5. `Status` (Status Draf / Terbit).
    6. `Aksi` (Tombol "Nilai Siswa").
  - *Catatan:* Kolom `Nilai Maks.` dihilangkan karena seluruh nilai terstandarisasi skala 0–100 dan tidak perlu membebani tabel.

### Slice 2: Rekap Asesmen & Nilai Siswa (`teacher-grades-view.tsx`)
- **Tab 1: Asesmen Kelas (1 Cell = 1 Data):**
  - Desktop: Susunan 7 kolom terpisah:
    1. `No` (Nomor urut berbasis pagination).
    2. `Nama Asesmen` (Nama tugas murni).
    3. `Kelas` (Nama kelas murni).
    4. `Tanggal` (Tanggal pelaksanaan format lokal).
    5. `Siswa Dinilai` (Rasio jumlah siswa dinilai, misal `3/5`).
    6. `Status` (Status Draf / Terbit).
    7. `Aksi` (Tombol aksi).
  - *Catatan:* Kolom `Skala Maks.` dihilangkan agar tabel fokus pada progres penilaian siswa.
- **Tab 2: Rekap Nilai Siswa (1 Cell = 1 Data):**
  - Desktop: Susunan 7 kolom terpisah:
    1. `No` (Nomor urut).
    2. `Siswa` (Nama siswa murni).
    3. `Kelas` (Nama kelas murni).
    4. `Tugas Dinilai` (Jumlah tugas dinilai).
    5. `Rata-rata Nilai` (Angka nilai bersih tabular-nums).
    6. `Terakhir Dinilai` (Tanggal penilaian terakhir).
    7. `Aksi` (Tombol Kelola / Input Nilai).

### Slice 3: Tabel Spreadsheet Presensi Pertemuan (`attendance-table.tsx`)
- Desktop: Kolom `Siswa` murni hanya teks nama siswa (1 cell 1 data); indikator kunci/koreksi dialokasikan khusus pada kolom `Status`.

### Slice 3: Tabel Spreadsheet Presensi Pertemuan (`attendance-table.tsx`)
- **Desktop Table:**
  - Tetap format spreadsheet cepat dengan nomor, nama siswa, toggle H/I/S/A, input catatan, dan status gembok/koreksi.
- **Mobile Card View:**
  - Kartu per siswa di layar HP (< md):
    - Baris atas: Avatar siswa, nama lengkap, dan indikator status gembok (jika terkunci).
    - Baris tengah: Tombol pilihan status H (Hadir), I (Izin), S (Sakit), A (Alpa) berukuran besar dan nyaman ditekan ibu jari (`h-10 w-full` / segmented control adaptif).
    - Baris bawah: Input catatan khusus per anak dengan ukuran teks anti-zoom (`text-base sm:text-xs`).
  - Menghilangkan keharusan guru menggeser layar 700px ke kanan dan kiri di smartphone.

---

## 5. Acceptance Criteria (Given-When-Then)

### Skenario 1: Responsivitas Roster Siswa di Detail Kelas
- **Given** guru membuka halaman detail kelas di layar desktop (`>= 768px`),
- **When** melihat daftar siswa,
- **Then** tampil tabel 4 kolom yang ringkas dan bersih tanpa pill berlebih.
- **Given** guru membuka halaman detail kelas di smartphone (`< 768px`),
- **When** melihat tab Roster Siswa,
- **Then** daftar siswa otomatis beralih menjadi format kartu yang rapi tanpa horizontal scroll bar yang terpotong.

### Skenario 2: Responsivitas Input Presensi di Layar HP
- **Given** guru berada di kelas membuka form presensi di ponsel (`< 768px`),
- **When** menandai kehadiran siswa,
- **Then** guru melihat kartu siswa dengan tombol radio H/I/S/A yang besar dan responsif, serta kolom catatan yang tidak memicu auto-zoom browser.

### Skenario 3: Konsistensi Tipografi & Anti-Visual Clutter
- **Given** guru membuka tab Rekap Nilai Siswa di `/teacher/grades`,
- **When** meninjau nilai rata-rata siswa,
- **Then** angka nilai ditampilkan dengan tipografi angka yang bersih (`tabular-nums`), bukan badge pill ber-border warna-warni yang mencolok.

---

## 6. Out-of-Scope (YAGNI)
- Tidak mengubah skema basis data Prisma atau API Server Actions yang sudah berjalan.
- Tidak menambahkan library tabel pihak ketiga (seperti TanStack Table atau MUI) yang menambah dependensi bundle.
- Tidak mengubah fungsionalitas logika bisnis (perhitungan rata-rata, filter pencarian, pagination).
