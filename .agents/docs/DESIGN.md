# Siedu Living Design System & UI Guidelines

> **Status:** Aktif & Diselaraskan (September 2026)  
> **Pendekatan:** *Living Design System* — Mengutamakan fleksibilitas kontekstual, UX modern, dan modularitas komponen (Shadcn UI + Tailwind CSS v4).  
> **Inspirasi Visual:** Modern Clean SaaS (ala Stripe, Linear, Vercel) yang disesuaikan untuk keramahan platform edukasi anak (TK–SMA) dengan fokus pengguna utama **Orang Tua** dan **Guru**.

---

## 1. Filosofi & Kebebasan Berkreasi (*Creative Freedom*)

Dokumen ini berfungsi sebagai **pedoman (guardrails) dan fondasi konsistensi**, **BUKAN cetak biru piksel kaku (*pixel-locked blueprint*)**. Pengembang dan AI desainer memiliki kebebasan kreatif penuh untuk mengeksplorasi tata letak visual terbaik sesuai dengan konteks dan dinamika data riil.

### Pembagian "Fondasi Wajib" vs "Area Eksplorasi Bebas"

| Kategori | Yang Wajib Konsisten (*Guardrails*) | Yang Bebas Dieksplorasi (*Creative Freedom*) |
| :--- | :--- | :--- |
| **Warna & Token** | Nilai hex `--brand`, `--accent`, `--success`, `--danger`, dan rasio kontras WCAG (min 4.5:1). | Penggunaan gradien halus, variasi opacity background, aksen glow/lighting subtle. |
| **Tipografi** | Font Family (Plus Jakarta Sans untuk Heading, Inter untuk Body). | Penyesuaian ukuran spesifik (fluid typography), tracking, dan komposisi hierarki per layar. |
| **Tata Letak** | Responsivitas mobile-first, grid yang rapi, touch-target minimum 44px di mobile. | Variasi komposisi hero (split, centered, floating preview), card grid (2, 3, 4 kolom), urutan visual data. |
| **Komponen** | Radius dasar tombol/card (`rounded-lg` / 10px), state lengkap (hover, focus, active, loading, error). | Tata letak internal card, penambahan badge dekoratif, mikro-interaksi, ikon pelengkap, layout tabs. |
| **Bahasa UI** | Bahasa Indonesia yang natural, ramah, dan profesional untuk orang tua. | Variasi copy pendukung yang kontekstual, pesan empty state yang empatik dan suportif. |

---

## 2. Karakter Brand & Gaya Visual

* **Personality:** *Professional, Trustworthy, Encouraging, and Effortless.*
* **Target Pengguna:** 
  * **Orang Tua (Parent):** Membutuhkan kepastian, kemudahan pendaftaran, transparansi biaya, dan visualisasi progres anak yang jelas dalam hitungan detik.
  * **Guru (Teacher):** Membutuhkan efisiensi pencatatan presensi, input nilai, dan manajemen kelas yang cepat tanpa friksi.
  * *Catatan:* Anak adalah penerima manfaat layanan, bukan pengguna yang login langsung.
* **Gaya Visual (Modern Clean SaaS):**
  * **Whitespace Lega:** Memberi ruang bernapas antar elemen, menghindari kepadatan informasi yang melelahkan mata.
  * **Subtle Borders & Soft Shadows:** Menggantikan garis tebal dengan border transparan lembut (`border-border/60` atau `border-slate-200`) dan ambient shadow berlapis (`shadow-sm`, `shadow-md`).
  * **Aksen Modern:** Sentuhan *backdrop-blur* halus pada sticky header, kartu ringkas dengan transisi mikro saat di-hover, dan hierarki visual yang tegas.

---

## 3. Design Tokens (Single Source of Truth)

Token ini disinkronkan langsung dengan kode konfigurasi proyek di `src/app/globals.css` dan integrasi **Shadcn UI (Preset Nova)**.

### A. Palet Warna Semantik

```css
:root {
  /* Brand Utama */
  --brand: #2563eb;          /* Tailwind blue-600 — Aksi utama, link aktif, brand identity */
  --brand-strong: #1d4ed8;   /* Tailwind blue-700 — State hover tombol utama */
  --brand-soft: #dbeafe;     /* Tailwind blue-100 — Background badge aktif, highlight lembut */
  
  /* Status & Aksen */
  --accent: #f59e0b;         /* Tailwind amber-500 — Tag promo, perhatian khusus, rating bintang */
  --success: #10b981;        /* Tailwind emerald-500 — Status 'Lunas', 'Hadir', verifikasi sukses */
  --danger: #e11d48;         /* Tailwind rose-600 — Tombol destruktif, error alert, status gagal */
  
  /* Permukaan & Teks */
  --background: #ffffff;     /* Putih murni — latar belakang utama halaman */
  --surface: #ffffff;        /* Kontainer kartu dan modal */
  --surface-alt: #f8fafc;    /* Tailwind slate-50 — Background section selang-seling / sidebar */
  --foreground: #0f172a;     /* Tailwind slate-900 — Judul utama & heading dengan kontras tinggi */
  --body: #475569;           /* Tailwind slate-600 — Teks paragraf dan deskripsi sekunder */
  --muted: #64748b;          /* Tailwind slate-500 — Label bantuan, metadata tanggal, placeholder */
  --border: #e2e8f0;         /* Tailwind slate-200 — Border halus pemisah konten */
  --ring: #2563eb;           /* Fokus aksesibilitas ring */
  
  /* Geometri & Sudut (Keputusan Desain) */
  --radius: 0.625rem;        /* 10px — rounded-lg untuk seluruh Button, Input, dan Card */
}
```

### B. Aturan Bentuk (Geometry & Radii)

* **Tombol, Input, & Kontainer Card:** Wajib seragam menggunakan `rounded-lg` (10px / `0.625rem`). *Catatan:* Gaya tombol bentuk kapsul (*pill / rounded-full*) telah dipensiunkan agar tampilan lebih tegas dan modern ala SaaS kontemporer.
* **Badge, Chip, Status Dots, & Avatar:** Tetap menggunakan `rounded-full` untuk membedakannya secara visual dari tombol interaktif biasa.

---

## 4. Tipografi

Tipografi memadukan keramahan modern pada judul dengan keterbacaan tinggi pada teks data:

| Peran | Font Family | Tailwind Class | Rekomendasi Karakter |
| :--- | :--- | :--- | :--- |
| **Headings & Displays** | **Plus Jakarta Sans** | `font-display` | Bobot `font-bold` (700) atau `font-semibold` (600). Tighter tracking (`tracking-tight`) untuk kesan modern dan percaya diri. |
| **Body, Data, & UI Copy** | **Inter** | `font-sans` | Bobot `font-normal` (400) atau `font-medium` (500). Line-height proporsional (`leading-relaxed` atau `leading-normal`) agar nyaman dibaca orang tua. |

### Panduan Hierarki (Ukuran bersifat responsif & fleksibel)
* **Hero Display:** `text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900`
* **Section Title:** `text-2xl md:text-3xl font-bold tracking-tight text-slate-900`
* **Card Title / Subsection:** `text-lg md:text-xl font-semibold text-slate-900`
* **Body Utama:** `text-base text-slate-600 leading-relaxed`
* **Keterangan Kecil / Meta:** `text-sm text-slate-500`
* **Badge / Micro-label:** `text-xs font-semibold uppercase tracking-wider`

---

## 5. Standar Bahasa & UI Copywriting

Untuk memastikan keramahan dan kemudahan pemahaman bagi orang tua dan tenaga pendidik di Indonesia, **seluruh antarmuka publik dan portal pengguna menggunakan Bahasa Indonesia yang komunikatif, lugas, dan baku natural**:

### Glosarium Padanan Istilah UI

| Istilah Lama / Teknis | Standar UI Siedu | Contoh Penggunaan |
| :--- | :--- | :--- |
| *Browse Classes / Catalog* | **Katalog Kelas** | Menu navigasi: *"Katalog Kelas"* |
| *Payment History & Status* | **Riwayat Pembayaran** | Menu navigasi: *"Riwayat Pembayaran"* |
| *Schedule & Attendance* | **Jadwal & Presensi** | Menu navigasi: *"Jadwal & Presensi"* |
| *Manage Children* | **Kelola Data Anak** | Dropdown profil orang tua |
| *Enrollment Detail* | **Rincian Pendaftaran** | Halaman invoice / status pendaftaran |
| *Login / Register* | **Masuk / Daftar** | Tombol navigasi auth |
| *Submit / Proceed to Pay* | **Lanjutkan Pembayaran** | Tombol CTA transaksi |
| *Upcoming Class* | **Kelas Mendatang** | Widget dashboard orang tua |
| *Grades & Report* | **Nilai & Hasil Belajar** | Modul progres akademik |

---

## 6. Pola Komponen Modern (Shadcn UI Native)

Gunakan komponen berbasis `@/components/ui/*` (Shadcn UI Nova) dengan penyesuaian gaya berikut:

### A. Navigasi & Header
* **Karakter:** Bersih, minimalis, dengan efek *sticky* dan *backdrop-blur* saat di-scroll (`bg-white/80 backdrop-blur-md border-b border-slate-200/80`).
* **Desktop:** Navigasi horizontal dengan link berjarak lega, aksen hover halus, dan kelompok tombol aksi di sisi kanan.
* **Mobile (< 768px):** Menu drawer samping yang responsif, transisi geser mulus, dengan touch target yang ramah jari.

### B. Hero Section (Inspirasi SaaS Modern)
* **Elemen Kunci:**
  1. *Subtle Pill Badge* di atas judul (misal: `"✨ Pendaftaran Periode Semester Baru Telah Dibuka"`).
  2. Judul utama tegas (*High-contrast H1*) dengan kontras tajam.
  3. Subjudul yang fokus pada solusi bagi orang tua (maks. 2–3 baris).
  4. Pasangan tombol CTA: Tombol utama berlatar `brand` (`bg-blue-600 text-white hover:bg-blue-700 shadow-sm`) berdampingan dengan tombol sekunder outline (`border-slate-200 hover:bg-slate-50`).
  5. *Visual Element:* Mockup kartu interaktif atau dashboard preview dengan bayangan lembut bertingkat (`shadow-xl shadow-blue-500/5 ring-1 ring-slate-900/5 rounded-2xl`).

### C. Kartu (Cards) & Wadah Informasi
* **Dasar:** Latar putih murni, border tipis (`border border-slate-200/70`), radius `rounded-lg` (atau `rounded-xl` untuk container utama), dan bantalan (*padding*) yang adaptif (misal: `p-5 md:p-6`).
* **Interaktivitas:** Kartu yang dapat diklik diberi efek hover halus (`hover:border-blue-300 hover:shadow-md transition-all duration-200 -translate-y-0.5`).
* **Anatomi Kartu Kelas:**
  * Gambar ilustrasi atau foto rasio `16:9` dengan sudut membulat.
  * Badge jenjang (misal: `SD`, `SMP`, `SMA`) di pojok kartu.
  * Judul kelas yang tebal dan jelas.
  * Meta baris: Ikon nama pengajar, kuota tersedia, dan jadwal sesi.
  * Harga kelas yang menonjol di kiri bawah, bersandingan dengan tombol aksi pendaftaran di kanan bawah.

### D. Formulir & Input Data
* **Input Box:** Tinggi ideal 40–44px, border `border-slate-200`, sudut `rounded-lg`, teks slate-900.
* **State Fokus:** Border berubah ke `blue-600` dengan ring fokus halus (`ring-2 ring-blue-100`).
* **Pesan Validasi:** Ikon peringatan kecil di bawah input dengan teks merah `rose-600` untuk kesalahan, atau teks bantuan abu-abu `slate-500`.

### E. Status & Feedback (Badge, Toast, Modal)
* **Badge Status:** Bentuk kapsul (`rounded-full`), teks semi-tebal (`font-medium text-xs`), padding nyaman (`px-2.5 py-0.5`).
  * Sukses/Lunas: `bg-emerald-50 text-emerald-700 border border-emerald-200/60`
  * Menunggu/Proses: `bg-amber-50 text-amber-700 border border-amber-200/60`
  * Ditolak/Batal: `bg-rose-50 text-rose-700 border border-rose-200/60`
  * Netral/Info: `bg-slate-100 text-slate-700 border border-slate-200/60`
* **Empty States:** Sertakan ilustrasi minimalis atau ikon Lucide berukuran `w-12 h-12` berwarna abu-abu lembut, judul lugas, deskripsi singkat, dan tombol aksi pemulihan (misal: *"Jelajahi Katalog Kelas"*).

---

## 7. Prinsip Aksesibilitas & Responsivitas

1. **Aksesibilitas Warna (WCAG AA):**
   * Seluruh teks utama memiliki kontras minimal 4.5:1 terhadap latar belakang.
   * Hindari menempatkan teks abu-abu terang pada permukaan putih.
2. **Sentuhan Mobile (*Touch Targets*):**
   * Setiap elemen interaktif (tombol, link, icon tab) pada layar ponsel berukuran minimal 44 × 44 piksel agar mudah disentuh oleh orang tua dari berbagai usia.
3. **Gerakan & Transisi (*Micro-interactions*):**
   * Transisi antarmuka berada di rentang optimal 150ms–250ms (`transition-colors`, `transition-transform ease-out`).
   * Hormati preferensi sistem `prefers-reduced-motion`.

---

## 8. Ringkasan Do's & Don'ts

| ✅ LAKUKAN (Modern & Fleksibel) | ❌ HINDARI (Kaku & Usang) |
| :--- | :--- |
| Gunakan whitespace yang lega untuk memisahkan section data. | Menjejali layar dengan kotak bergaris tebal tanpa ruang jeda. |
| Sesuaikan tata letak kartu secara adaptif sesuai kekayaan data. | Memaksakan ukuran tinggi/lebar piksel yang kaku pada elemen dinamis. |
| Utamakan komponen siap pakai dari Shadcn UI yang konsisten. | Membuat komponen custom dari nol dengan style yang terisolasi. |
| Berikan umpan balik instan (loading skeleton, hover state, toast). | Membiarkan tombol atau aksi klik menggantung tanpa indikator visual. |
| Gunakan Bahasa Indonesia yang hangat, jelas, dan ramah orang tua. | Mencampuradukkan istilah Inggris dan Indonesia secara acak di navigasi. |

---

*Dengan panduan ini, Siedu memiliki fondasi visual yang konsisten, modern, dan profesional, sekaligus memberi ruang gerak seluas-luasnya bagi pengembang dan AI untuk menyajikan antarmuka terbaik bagi orang tua, guru, dan admin.*

