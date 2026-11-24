---
name: Siedu
description: Sistem Informasi & Manajemen Bimbingan Belajar Modern
version: 2.3.0
colors:
    brand: '#2563eb'
    brand-strong: '#1d4ed8'
    brand-soft: '#dbeafe'
    accent: '#f59e0b'
    success: '#10b981'
    danger: '#e11d48'
    background: '#ffffff'
    surface: '#ffffff'
    surface-alt: '#f8fafc'
    foreground: '#0f172a'
    body: '#475569'
    muted: '#64748b'
    border: '#e2e8f0'
    ring: '#2563eb'
typography:
    display:
        fontFamily: 'var(--font-jakarta), sans-serif'
        fontSize: 'clamp(2rem, 5vw, 3.5rem)'
        fontWeight: 700
        lineHeight: 1.15
        letterSpacing: '-0.025em'
    h1:
        fontFamily: 'var(--font-jakarta), sans-serif'
        fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)'
        fontWeight: 700
        lineHeight: 1.2
        letterSpacing: '-0.02em'
    h2:
        fontFamily: 'var(--font-jakarta), sans-serif'
        fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)'
        fontWeight: 600
        lineHeight: 1.3
        letterSpacing: '-0.015em'
    h3:
        fontFamily: 'var(--font-jakarta), sans-serif'
        fontSize: '1.125rem'
        fontWeight: 600
        lineHeight: 1.4
        letterSpacing: '-0.01em'
    body:
        fontFamily: 'var(--font-inter), sans-serif'
        fontSize: '1rem'
        fontWeight: 400
        lineHeight: 1.6
    body-sm:
        fontFamily: 'var(--font-inter), sans-serif'
        fontSize: '0.875rem'
        fontWeight: 400
        lineHeight: 1.5
    label:
        fontFamily: 'var(--font-inter), sans-serif'
        fontSize: '0.75rem'
        fontWeight: 600
        letterSpacing: '0.05em'
rounded:
    sm: '6px'
    md: '8px'
    lg: '10px'
    xl: '14px'
    full: '9999px'
spacing:
    xs: '4px'
    sm: '8px'
    md: '16px'
    lg: '24px'
    xl: '32px'
    2xl: '48px'
    3xl: '64px'
components:
    button-primary:
        backgroundColor: '{colors.brand}'
        textColor: '#ffffff'
        rounded: '{rounded.lg}'
        padding: '10px 18px'
    button-secondary:
        backgroundColor: '{colors.surface}'
        textColor: '{colors.foreground}'
        rounded: '{rounded.lg}'
    card:
        backgroundColor: '{colors.surface}'
        rounded: '{rounded.lg}'
        padding: '24px'
---

# Siedu Design System & UI Specification

> **Spesifikasi Standar Desain Resmi Siedu v2.3**
> Mengikuti spesifikasi resmi Google Labs `DESIGN.md`, prinsip _Modern Clean SaaS_ (ala Stripe, Linear, Vercel), integrasi Tailwind CSS v4, dan komponen Shadcn UI (Preset Nova).

---

## 1. Overview

Siedu adalah sistem manajemen bimbingan belajar (bimbel) akademik fisik (tatap muka) terpadu untuk jenjang TK hingga SMA di Indonesia. Antarmuka Siedu melayani tiga kelompok pengguna utama:

1. **Orang Tua (Parent):** Membutuhkan kejelasan informasi kelas, transparansi jadwal, kemudahan pendaftaran mandiri, pembayaran cicilan yang jelas, serta rekap presensi dan perkembangan anak secara instan.
2. **Guru (Teacher):** Membutuhkan antarmuka yang cepat dan minim hambatan untuk input presensi per pertemuan, input nilai, pencatatan hasil belajar kualitatif, serta pengelolaan jadwal ajar.
3. **Admin (Operations):** Membutuhkan panel kontrol terpusat untuk mengelola master data (mapel, kelas, periode, guru), mencegah bentrok jadwal, dan memantau status operasional secara akurat.

### Filosofi Visual: Modern Clean SaaS

- **Whitespace Lega (_Generous Breathing Room_):** Memberikan ruang napas antar blok data. Kerapatan informasi diatur secara cerdas tanpa memadatkan elemen secara berlebihan.
- **Subtle Borders & Ambient Shadows:** Menghindari garis tebal yang kaku. Kontur batas dibuat halus (`border-slate-200/60` di mode terang dan `border-slate-800` di mode gelap) berpadu dengan bayangan ambient bertingkat (`shadow-xs`, `shadow-sm`).
- **Tipografi Berwibawa (_Confident Typography_):** Judul dan metrik mengandalkan kekuatan jenis huruf, bobot tegas, dan kontras tajam, bukan dekorasi berlebihan.
- **Guardrails vs. Creative Freedom:**
    - **Wajib Konsisten (_Guardrails_):** Token warna semantik, jenis font (Plus Jakarta Sans & Inter), radius 10px (`rounded-lg`), touch target mobile minimal 44px, dan aturan anti-clutter.
    - **Bebas Dieksplorasi (_Creative Freedom_):** Tata letak kartu data, variasi komposisi hero section, mikro-interaksi transisi, dan visualisasi diagram.

---

## 2. Colors

Seluruh warna antarmuka dikelola melalui token semantik. Dilarang menggunakan nilai warna hex sembarangan (_raw hex_) di dalam komponen; selalu gunakan kelas semantik Tailwind atau variabel CSS yang telah terdaftar.

### A. Palet Warna Utama (Light & Dark Theme)

| Token Semantik   | Light Mode (Hex / Class)  | Dark Mode (Hex / Class)   | Peruntukan & Panduan Penggunaan                                 |
| :--------------- | :------------------------ | :------------------------ | :-------------------------------------------------------------- |
| `--brand`        | `#2563eb` (`blue-600`)    | `#3b82f6` (`blue-500`)    | Aksi utama, tombol CTA primer, link aktif, status fokus         |
| `--brand-strong` | `#1d4ed8` (`blue-700`)    | `#60a5fa` (`blue-400`)    | State hover tombol primer, aksen aktif                          |
| `--brand-soft`   | `#dbeafe` (`blue-100`)    | `#1e293b` (`slate-800`)   | Background badge aktif, highlight baris tabel terpilih          |
| `--accent`       | `#f59e0b` (`amber-500`)   | `#f59e0b` (`amber-500`)   | Status 'Menunggu Pembayaran', tag promo, perhatian khusus       |
| `--success`      | `#10b981` (`emerald-500`) | `#10b981` (`emerald-500`) | Status 'Lunas', 'Hadir', verifikasi berhasil, indikator positif |
| `--danger`       | `#e11d48` (`rose-600`)    | `#f43f5e` (`rose-500`)    | Aksi destruktif, alert error, status 'Alpa' / 'Dibatalkan'      |
| `--background`   | `#ffffff` (Putih Murni)   | `#090d16` (Kanvas Pekat)  | Background kanvas utama aplikasi                                |
| `--surface`      | `#ffffff`                 | `#0f172a` (`slate-900`)   | Permukaan kontainer kartu, modal, popover, drawer               |
| `--surface-alt`  | `#f8fafc` (`slate-50`)    | `#090d16`                 | Background sidebar, alternating section, baris tabel zebra      |
| `--foreground`   | `#0f172a` (`slate-900`)   | `#f8fafc` (`slate-50`)    | Heading utama, judul halaman, teks berbobot kontras tinggi      |
| `--body`         | `#475569` (`slate-600`)   | `#94a3b8` (`slate-400`)   | Teks paragraf, nilai data tabel, deskripsi sekunder             |
| `--muted`        | `#64748b` (`slate-500`)   | `#64748b` (`slate-500`)   | Label keterangan kecil, metadata tanggal, placeholder input     |
| `--border`       | `#e2e8f0` (`slate-200`)   | `#1e293b` (`slate-800`)   | Garis pemisah halus antar komponen dan border kontainer         |

### B. Kontras & Aksesibilitas (WCAG AA)

- Seluruh teks isi (body copy) dan label wajib memenuhi rasio kontras minimal **4.5:1** terhadap latar belakang.
- Teks judul besar (`text-2xl` ke atas) wajib memenuhi rasio kontras minimal **3.0:1**.
- Dilarang menggunakan teks abu-abu terang pada permukaan putih (contoh dilarang: `text-slate-300` di atas latar putih).

---

## 3. Typography

Tipografi memadukan keramahan modern pada judul dengan keterbacaan tinggi pada penyajian data:

- **Display & Headings:** `Plus Jakarta Sans` (`font-display`) dengan _tighter letter-spacing_ (`tracking-tight`) untuk kesan modern, kokoh, dan berwibawa.
- **Body, Data, & UI Copy:** `Inter` (`font-sans`) dengan _line-height_ proporsional agar nyaman dibaca oleh orang tua dari berbagai rentang usia.

### A. Skala Hirarki Tipografi

| Peran Tipografi            | Ukuran Desktop    | Ukuran Mobile | Bobot          | Tracking   | Tailwind Class Standar                                                     |
| :------------------------- | :---------------- | :------------ | :------------- | :--------- | :------------------------------------------------------------------------- |
| **Display / Hero**         | 44px – 56px       | 32px – 40px   | Bold (700)     | `-0.025em` | `text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900` |
| **Page Title (H1)**        | 28px – 32px       | 24px – 26px   | Bold (700)     | `-0.02em`  | `text-2xl md:text-3xl font-bold tracking-tight text-slate-900`             |
| **Section Title (H2)**     | 20px – 24px       | 18px – 20px   | Semibold (600) | `-0.015em` | `text-xl md:text-2xl font-semibold tracking-tight text-slate-900`          |
| **Card / Subsection (H3)** | 16px – 18px       | 16px          | Semibold (600) | `-0.01em`  | `text-base md:text-lg font-semibold text-slate-900`                        |
| **Body Utama**             | 16px (`1rem`)     | 16px (`1rem`) | Normal (400)   | Normal     | `text-base text-slate-600 leading-relaxed`                                 |
| **Body Sekunder / Meta**   | 14px (`0.875rem`) | 14px          | Normal (400)   | Normal     | `text-sm text-slate-500`                                                   |
| **Micro-Label / Badge**    | 12px (`0.75rem`)  | 12px          | Semibold (600) | `+0.05em`  | `text-xs font-semibold uppercase tracking-wider`                           |
| **Tabular Numbers**        | Sesuai peran      | Sesuai peran  | Medium (500)   | Normal     | Tambahkan kelas `tabular-nums` untuk angka statistik/harga                 |

### B. Aturan Panjang Baris & Pemenggalan (_Optical Rhythm_)

1. **Panjang Baris Baca (_Reading Measure_):** Batasi lebar paragraf panjang pada rentang **45 hingga 75 karakter** (`max-w-prose` atau `max-w-2xl`). Teks yang membentang terlalu panjang melelahkan mata pembaca saat berpindah baris.
2. **Pemenggalan Judul (_Optical Wrapping_):** Selalu terapkan `text-wrap: balance` pada judul atau heading agar baris tidak menyisakan kata tunggal menggantung (_orphan word_).
3. **Pemenggalan Body (_Pretty Wrapping_):** Terapkan `text-wrap: pretty` pada paragraf deskripsi agar alinea tersusun rapi.

---

## 4. Layout & Responsive

### A. Sistem Kisi & Jarak Spasi 8-Point (_8-pt Spacing Grid_)

Semua nilai padding, margin, dan celah antar elemen wajib mengacu pada kelipatan 4px atau 8px:

- `gap-1` (4px) / `gap-2` (8px) : Jarak mikro (ikon tombol mandiri, jarak dot status ke teks).
- `gap-3` (12px) / `gap-4` (16px) : Jarak antar input field form, padding internal kartu kecil.
- `gap-6` (24px) / `gap-8` (32px) : Celah antar kartu grid, jarak antar seksi konten data.
- `py-10` (40px) / `py-16` (64px) : Padding vertikal blok seksi halaman utama.
- **Container:** Kontainer utama dibatasi `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` agar tidak melebar ekstrem di monitor ultrawide.

### B. Strategi Adaptasi Responsif per Perangkat

Responsivitas **bukan mengecilkan ukuran piksel secara paksa**, melainkan memikirkan ulang tata letak sesuai konteks perangkat:

```
Mobile (< 640px)          Tablet (640px - 1024px)        Desktop (> 1024px)
┌─────────────────┐       ┌────────┬────────┐            ┌───────┬───────┬───────┐
│  Single Column  │       │ Card A │ Card B │            │ Col 1 │ Col 2 │ Col 3 │
├─────────────────┤  ──►  ├────────┴────────┤     ──►    ├───────┴───────┴───────┤
│  Vertical Stack │       │ Master-Detail   │            │ Side Nav + Content    │
└─────────────────┘       └─────────────────┘            └───────────────────────┘
```

1. **Mobile (< 640px):**
    - Tata letak: Kolom tunggal vertikal (_single-column vertical stack_).
    - Area Sentuh (_Touch Target_): Seluruh tombol, link tab, dan tombol ikon wajib memiliki area tap minimal **44 × 44 piksel**.
    - Dialog & Drawer: Gunakan _bottom sheet_ geser ke atas (`Drawer`), bukan popup modal kecil di tengah layar.
    - Tabel Data: Bungkus tabel dengan kontainer horizontal scroll (`overflow-x-auto`) atau transformasikan baris menjadi kartu ringkasan mandiri.
2. **Tablet (640px – 1024px):**
    - Tata letak: Grid 2 kolom seimbang. Mendukung orientasi portrait dan landscape.
    - Master-detail view: Daftar sesi/siswa di kolom kiri, rincian data di kolom kanan.
3. **Desktop (> 1024px):**
    - Tata letak: Grid 3 hingga 4 kolom kartu. Sidebar navigasi permanen yang dapat dipindai cepat.
    - Menyajikan data lebih kaya tanpa menyembunyikannya di dalam tab berjenjang.

---

## 5. Elevation & Depth

Antarmuka Siedu mengadopsi kedalaman bertingkat yang bersih dan tenang, menggantikan bayangan gelap tebal:

| Lapisan Kedalaman               | Elevasi & Shadow             | Border Kontur                | Kasus Penggunaan                                               |
| :------------------------------ | :--------------------------- | :--------------------------- | :------------------------------------------------------------- |
| **Lapis 0: Kanvas Dasar**       | `shadow-none`                | Tanpa border                 | Kanvas dasar halaman (`bg-background` / `bg-surface-alt`)      |
| **Lapis 1: Kartu & Panel**      | `shadow-xs` atau `shadow-sm` | `border border-slate-200/70` | Kartu data, container tabel, panel widget                      |
| **Lapis 2: Hover & Interaktif** | `shadow-md`                  | `border-slate-300`           | Kartu kelas yang dapat diklik (dengan efek `-translate-y-0.5`) |
| **Lapis 3: Popover & Menu**     | `shadow-lg`                  | `border border-slate-200/80` | Dropdown menu, tooltip, filter picker                          |
| **Lapis 4: Dialog & Drawer**    | `shadow-2xl`                 | `border border-slate-200/80` | Modal konfirmasi, quick grade drawer, slideover sheet          |

### Efek Permukaan Kaca (_Subtle Backdrop Blur_)

- Sticky header navbar menggunakan `bg-white/80 backdrop-blur-md border-b border-slate-200/80`.
- Backdrop overlay modal menggunakan `bg-slate-900/40 backdrop-blur-xs` untuk memfokuskan perhatian pengguna secara elegan.

---

## 6. Shapes & Geometry

Bentuk dan sudut komponen memiliki aturan ketat untuk menjaga kesan antarmuka profesional modern:

- **Tombol, Input Form, Kartu, & Dialog:** Wajib seragam menggunakan sudut membulat sedang **`rounded-lg` (10px / `0.625rem`)**.
- **Pensiun Tombol Kapsul:** Bentuk tombol bulat telur/kapsul penuh (`rounded-full`) **TIDAK LAGI DIGUNAKAN** untuk tombol aksi, agar tampilan tidak kekanak-kanakan dan sejalan dengan standar aplikasi web SaaS profesional.
- **Pengecualian `rounded-full`:** Bentuk kapsul/lingkaran penuh HANYA diizinkan untuk 4 elemen:
    1. Avatar profil pengguna / foto siswa.
    2. Status dot indikator (misal: titik hijau penanda kelas aktif).
    3. Badge kategori kecil dan tag filter teks.
    4. Tombol ikon bulat mandiri (misal: tombol tutup modal silang `X`).

---

## 7. Components & UI Patterns

Gunakan komponen berbasis `@/components/ui/*` (Shadcn UI Nova) yang telah disesuaikan ke token Siedu:

### A. Tombol & Tingkat Aksi (_Button Hierarchy_)

1. **Primary Button:** Latar belakang biru brand (`bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium rounded-lg px-4 py-2`). HANYA boleh ada maksimal satu tombol primer per seksi visual agar hierarki aksi jelas.
2. **Secondary Outline Button:** Latar putih dengan border halus (`border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2`).
3. **Ghost / Tertiary Button:** Tanpa border atau latar awal (`hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-lg px-3 py-2`).
4. **Destructive Button:** Latar merah tegas (`bg-rose-600 hover:bg-rose-700 text-white shadow-sm rounded-lg px-4 py-2`) khusus aksi yang tidak dapat dibatalkan (misal: hapus data anak, batalkan pendaftaran).

### B. Formulir & Masukan Data (_Forms & Inputs_)

- **Input Box:** Tinggi standar 40px (desktop) hingga 44px (mobile), border `border-slate-200`, sudut `rounded-lg`, teks `text-slate-900`.
- **State Fokus:** Border berubah tegas ke warna brand disertai ring fokus lembut (`focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:border-blue-600 outline-none`).
- **Penyajian Error:** Pesan error diletakkan tepat di bawah input terkait dengan teks `text-rose-600 text-xs mt-1`, bukan ditumpuk di bagian atas halaman.
- **Label:** Label form harus selalu terlihat di atas input (`text-sm font-medium text-slate-700 mb-1.5`); dilarang mengandalkan placeholder sebagai pengganti label.

### C. Kartu Data & Kartu Metrik KPI (_Data & KPI Cards_)

- **Kartu Metrik KPI:** Mengandalkan kekuatan tipografi angka yang jujur (_"KPIs are type, not tiles"_).
    - Angka metrik berukuran besar (`text-2xl md:text-3xl font-bold tracking-tight text-slate-900`).
    - Label deskripsi metrik di atas atau bawah angka (`text-sm font-medium text-slate-500`).
    - Tren/keterangan tambahan disajikan sebagai teks kecil di bawahnya.
- **Kartu Kelas (Katalog):**
    - Rasio gambar ilustrasi 16:9 dengan sudut membulat rapi.
    - Badge jenjang (`SD`, `SMP`, `SMA`) di sudut kartu.
    - Judul kelas tebal dan jelas.
    - Meta baris: nama guru, jadwal pertemuan mingguan, dan kuota tersisa.
    - Harga kelas menonjol di kiri bawah bersandingan dengan tombol pendaftaran di kanan bawah.

### D. Badge Status

Badge status menggunakan padding `px-2.5 py-0.5`, sudut `rounded-full`, teks `text-xs font-medium`:

- **Lunas / Hadir (Sukses):** `bg-emerald-50 text-emerald-700 border border-emerald-200/60`
- **Menunggu Pembayaran (Perhatian):** `bg-amber-50 text-amber-700 border border-amber-200/60`
- **Tertunggak / Batal / Alpa (Gagal/Bahaya):** `bg-rose-50 text-rose-700 border border-rose-200/60`
- **Netral / Draft:** `bg-slate-100 text-slate-700 border border-slate-200/60`

### E. Standar Bahasa UI, Internasionalisasi (i18n) & Glosarium

Siedu mendukung sistem multi-bahasa terpadu (_bilingual_) melalui `next-intl` dengan dua locale resmi:

- **`id` (Bahasa Indonesia — Default, URL root tanpa prefix):** Ditujukan untuk kemudahan orang tua, guru, dan admin lokal.
- **`en` (English — Opsional dengan URL prefix `/en/...`):** Ditujukan untuk ekspatriat atau preferensi bahasa Inggris.

**Aturan Kebahasaan Antarmuka:**

1. **Anti-Indoglish pada Locale `id`:** Saat pengguna berada pada locale Bahasa Indonesia, antarmuka wajib 100% menggunakan Bahasa Indonesia yang hangat, natural, dan baku. **DILARANG KERAS** mencampuradukkan bahasa Indonesia dengan istilah Inggris secara serampangan di dalam kalimat atau navigasi.
2. **Kamus Terpusat:** Seluruh label teks UI wajib dipanggil melalui kamus pesan terpusat (`src/i18n/messages/{locale}/*.json`). Dilarang menuliskan teks statis langsung (_hardcoded strings_) di dalam komponen.

| Istilah Bahasa Asing       | Standar UI Siedu (Locale `id`) | Contoh Penempatan              |
| :------------------------- | :----------------------------- | :----------------------------- |
| _Browse Classes / Catalog_ | **Katalog Kelas**              | Menu navigasi navbar utama     |
| _Payment History_          | **Riwayat Pembayaran**         | Menu portal orang tua          |
| _Schedule & Attendance_    | **Jadwal & Presensi**          | Menu portal guru & orang tua   |
| _Manage Children_          | **Kelola Data Anak**           | Dropdown profil keluarga       |
| _Enrollment Detail_        | **Rincian Pendaftaran**        | Halaman status & tagihan kelas |
| _Upcoming Sessions_        | **Kelas Mendatang**            | Widget agenda di dashboard     |
| _Grades & Report_          | **Nilai & Hasil Belajar**      | Laporan perkembangan akademik  |
| _Correction Approvals_     | **Persetujuan Koreksi**        | Menu admin review data guru    |
| _Proceed to Pay_           | **Lanjutkan Pembayaran**       | Tombol CTA transaksi checkout  |

### F. Pola Kontainer: Modal / Dialog, Sheet & Halaman Penuh

Pilih jenis kontainer interaksi berdasarkan kompleksitas data, waktu penyelesaian tugas, dan konteks pengguna:

| Jenis Kontainer                  | Kriteria Pemilihan                                                                                                                                                                                                                      | Contoh Kasus di Siedu                                                                                                                                                                                        | Perilaku & Responsif Mobile                                                                                                                                                                                                         |
| :------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dialog / Modal Center**        | • Tugas atomik selesai cepat (<30 detik)<br>• Konfirmasi aksi destruktif/kritis<br>• Formulir ringkas (1–3 kolom input)<br>• Alert/preview cepat tanpa butuh URL mandiri                                                                | 1. Konfirmasi Hapus Data Anak<br>2. Form Tambah/Edit Mata Pelajaran (Admin)<br>3. Form Tambah/Edit Periode Pendaftaran (Admin)<br>4. Dialog Persetujuan Koreksi Presensi/Nilai (Admin BR#18)                 | Muncul di tengah layar desktop (`max-w-md` atau `max-w-lg`) dengan backdrop blur (`backdrop-blur-sm bg-slate-900/40`).<br>**Di Mobile (<768px):** Bertransformasi otomatis menjadi Bottom Drawer/Sheet agar mudah dijangkau jempol. |
| **Sheet / Slide-over Drawer**    | • Formulir menengah (3–6 input) yang butuh konteks tabel/daftar tetap terlihat di latar belakang<br>• Panel tinjauan sekunder/detail cepat<br>• Filter katalog atau opsi sortir di perangkat layar kecil                                | 1. Form Tambah / Edit Profil Anak (Parent)<br>2. Panel Rekap Cepat Presensi Sesi Kelas (Teacher)<br>3. Drawer Filter Katalog Kelas (Mobile)                                                                  | Meluncur mulus dari sisi kanan layar desktop (`w-full sm:max-w-md md:max-w-lg`).<br>**Di Mobile (<768px):** Meluncur dari bawah (_Bottom Sheet_) dengan pegangan seret (_drag handle_).                                             |
| **Halaman Penuh (_Full Route_)** | • Alur bertahap / multi-langkah (_wizard_)<br>• Formulir panjang dengan validasi kompleks (>6 field)<br>• Transaksi pembayaran kritis (_checkout flow_)<br>• Halaman yang butuh URL unik untuk dibagikan (_shareable_) atau di-bookmark | 1. Registrasi Akun Multi-Step (`/register` step 1–3)<br>2. Rincian Pendaftaran & Pembayaran (`/enrollments/[id]`)<br>3. Katalog & Detail Kelas (`/classes/[id]`)<br>4. Dashboard & Laporan Analitik Keuangan | Memiliki URL mandiri di Next.js App Router, mendukung SSR, navigasi riwayat browser (tombol _Back_), dan SEO publik.                                                                                                                |

### G. Standar Empty State (Zero-Data States)

Kondisi saat data belum tersedia atau hasil filter nihil wajib ditangani dengan pola visual yang bersahabat, jelas, dan memberikan jalan keluar langsung (_action-oriented_):

1. **Struktur Kontainer:**
    - Gunakan kontainer dengan latar belakang netral halus (`bg-slate-50/50`) dan kontur garis putus-putus halus (`border border-dashed border-slate-200 rounded-xl`).
    - Padding vertikal lega (`py-12 px-6 sm:py-16 sm:px-8`) dengan perataan tengah (_center aligned_).
2. **Elemen Visual & Ilustrasi:**
    - Ikon penanda monokrom netral (`text-slate-400 size-10 mb-3`). Dilarang menggunakan ilustrasi kartun warna-warni yang kekanak-kanakan atau berukuran raksasa.
3. **Tipografi & Pesan Solutif:**
    - **Judul Keadaan (H3):** Jelas dan tenang (`text-base font-semibold text-slate-800 mb-1`). Contoh: `"Belum Ada Anak Terdaftar"` atau `"Tidak Ada Jadwal Mengajar Hari Ini"`.
    - **Teks Penjelas (Body):** Memberitahu apa yang harus dilakukan selanjutnya (`text-sm text-slate-500 max-w-sm mb-4`).
4. **Tombol Solutif (Call-to-Action):**
    - Sertakan tombol aksi primer atau sekunder langsung di bawah teks (misal: tombol `"Tambah Data Anak"` atau `"Reset Filter"`). Jika pengguna tidak memiliki wewenang menambah data, hilangkan tombol CTA tanpa merusak tata letak.

### H. Standar Loading States & Skeleton Shimmer

Mendukung arsitektur React 19 Streaming SSR dan `Suspense` boundary untuk menghindari _Layout Shift_ (CLS) saat data dimuat:

1. **Larangan Spinner Layar Penuh:** Dilarang menggunakan _fullscreen generic spinner_ yang memblokir interaksi dan membuat aplikasi terasa lambat.
2. **Pola Skeleton Shimmer:**
    - Gunakan elemen skeleton yang merefleksikan geometri asli komponen yang sedang dimuat.
    - Kelas Tailwind standar: `bg-slate-100 animate-pulse rounded-lg` di mode terang dan `bg-slate-800/60` di mode gelap.
    - **Skeleton Kartu KPI:** Blok judul kecil (`h-4 w-24 mb-3`), blok angka besar (`h-8 w-16 mb-2`), blok meta kecil (`h-3 w-32`).
    - **Skeleton Tabel:** Render 3 hingga 5 baris dummy skeleton dengan tinggi baris konsisten (`h-12 border-b border-slate-100`).
3. **State Tombol Saat Submit:**
    - Tombol yang sedang memproses data dinonaktifkan (`disabled:opacity-70 disabled:cursor-not-allowed`).
    - Ubah label teks menjadi bentuk progresif (misal: `"Menyimpan..."` atau `"Memproses..."`) didampingi spinner mikro inline (`size-4 animate-spin`).

### I. Standar Tabel Data (Data Table UX)

Tabel data adalah instrumen operasional utama bagi guru dan admin. Wajib memenuhi prinsip tata letak angka dan responsivitas:

1. **Penjajaran Kolom (_Column Alignment_):**
    - **Kolom Teks (Nama, Subjek, Deskripsi):** Wajib rata kiri (`text-left`).
    - **Kolom Angka, Nominal, & Tanggal:** Wajib rata kanan (`text-right`) dan selalu sertakan kelas `tabular-nums` agar lebar karakter angka seragam dan sejajar vertikal saat dibandingkan antar baris.
    - **Kolom Status / Badge:** Rata tengah (`text-center`).
    - **Kolom Aksi (Tombol/Menu):** Rata kanan (`text-right`).
2. **Kerapatan Baris (_Cell Density_):**
    - Padding baris default: `py-3.5 px-4`.
    - Baris header (`<thead>`): Menggunakan huruf kecil kapital semibold (`text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-200`).
    - Garis pemisah baris halus: `divide-y divide-slate-100`.
3. **Adaptasi Mobile (< 640px):**
    - **Metode A (Horizontal Scroll):** Bungkus tabel dengan `<div className="overflow-x-auto -mx-4 sm:mx-0">` dengan indikator bayangan tepi halus jika konten terpotong.
    - **Metode B (Card Transformation):** Untuk daftar pendaftaran atau profil anak di perangkat bergerak, transformasikan baris tabel menjadi kartu individu bertumpuk (_card stacked list_) yang menampilkan informasi kunci secara hierarkis.

### J. Pola Sistem Feedback & Notifikasi (Toast, Alert, & Dialog)

Berikan umpan balik instan atas setiap aksi pengguna dengan memilih mekanisme yang proporsional:

| Jenis Feedback                | Sifat Interaksi                 | Durasi & Posisi                                                     | Kasus Penggunaan di Siedu                                                                                                                   |
| :---------------------------- | :------------------------------ | :------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **Toast (Sonner / Radix)**    | Non-blokir (_asynchronous_)     | 3000 – 4000 ms<br>Desktop: Sudut kanan bawah<br>Mobile: Atas tengah | • Sukses simpan nilai/presensi siswa<br>• Berhasil memperbarui data profil anak<br>• Link reset password berhasil dikirim                   |
| **Inline Alert Banner**       | Kontekstual di dalam form/kartu | Menetap hingga status berubah                                       | • Peringatan kuota kelas tersisa 1 slot<br>• Keterlambatan pembayaran cicilan (masa tenggang)<br>• Kesalahan input formulir validasi server |
| **Modal / Dialog Konfirmasi** | Memblokir (_modal/blocking_)    | Tetap aktif sampai tombol konfirmasi/batal ditekan                  | • Aksi hapus data anak (destruktif)<br>• Persetujuan koreksi presensi guru oleh Admin<br>• Batalkan sesi pertemuan kelas                    |

---

## 8. Do's and Don'ts

Pedoman ini mengikat seluruh pengembang dan agen AI coding untuk mencegah _AI slop_ dan menjaga keindahan visual antarmuka:

| Kategori                           | ✅ LAKUKAN (Standar Emas Siedu)                                                                               | ❌ HINDARI (Anti-Pattern / Dilarang Keras)                                                                                                  |
| :--------------------------------- | :------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **Ikonografi (_Icon Restraint_)**  | Gunakan ikon hanya untuk navigasi baris sidebar, tombol mandiri dengan `aria-label`, dan status alert kritis. | **DILARANG** menambahkan ikon dekoratif/pemanis pada tombol teks standar (misal tombol `"Simpan Data"` tidak perlu ikon floppy disk).       |
| **Kartu Metrik KPI**               | Sajikan angka metrik murni mengandalkan tipografi tebal dan kontras (_"KPIs are type, not tiles"_).           | **DILARANG** membuat ikon dekoratif di dalam lingkaran/kotak berwarna-warni (_tinted circles_) di samping angka metrik.                     |
| **Deskripsi & Counter**            | Jelaskan makna visualisasi secara bersih. Angka total berdiri sendiri di elemen KPI atau badge terpisah.      | **DILARANG** menyisipkan counter dinamis ke dalam kalimat subtitle (contoh dilarang: `"Daftar kelas aktif · 5 kelas"`).                     |
| **Header Halaman**                 | Biarkan judul `h1` berdiri bersih dan percaya diri mengandalkan tipografi tegas.                              | **DILARANG** menumpuk badge/pill/chip status (contoh dilarang: pill `"5 Siswa"`, pill `"Kelas Aktif"`) berjejer di samping kanan teks `h1`. |
| **Geometri Tombol**                | Gunakan sudut `rounded-lg` (10px) yang seragam dan modern untuk semua tombol aksi.                            | **DILARANG** membuat tombol aksi berbentuk kapsul penuh (_pill / rounded-full_).                                                            |
| **Ruang & Tata Letak**             | Berikan jeda spasi lega (_whitespace_) antar kelompok data untuk kenyamanan mata.                             | Menjejali layar dengan kotak bergaris tebal tanpa ruang bernapas (_visual clutter_).                                                        |
| **Bahasa Antarmuka**               | Gunakan Bahasa Indonesia yang baku, bersahabat, dan konsisten di seluruh layar.                               | Mencampuradukkan istilah Bahasa Inggris dan Indonesia secara serampangan di navigasi.                                                       |
| **Aksesibilitas**                  | Pastikan area sentuh tombol mobile minimal 44×44px dan teks memiliki rasio kontras 4.5:1.                     | Membuat tombol mini yang sulit ditekan jempol di ponsel atau teks abu-abu pudar di atas putih.                                              |
| **Keadaan Kosong (_Empty State_)** | Gunakan kotak putus-putus lembut (`border-dashed`), teks tenang, dan tombol aksi pemulihan.                   | Menampilkan halaman kosong melompong tanpa petunjuk arah atau menaruh ilustrasi kartun raksasa.                                             |
| **Tabel Data (_Data Table_)**      | Rata kanankan angka/nominal dengan `tabular-nums` dan rata kirikan teks nama/judul.                           | Meratakan tengah semua angka dan teks sehingga kolom terlihat acak-acakan dan sulit dibandingkan.                                           |
| **Indikator Muat (_Loading_)**     | Gunakan skeleton shimmer yang proporsional dengan bentuk elemen asli yang dimuat.                             | Menaruh spinner generic bulat di tengah layar yang menyebabkan pergeseran layout mendadak (_CLS_).                                          |
