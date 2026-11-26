# Spec: Redesain Dashboard Admin — Adaptasi Bahasa Desain Dashboard Guru

**Status:** Draft · Menunggu Eksekusi
**Tanggal:** 2026-11-26
**Referensi Desain:** Dashboard Guru (`/teacher/dashboard/page.tsx`)

---

## 1. Objective

Menyeragamkan bahasa desain dashboard admin (`/admin/dashboard`) agar konsisten dengan pola visual dashboard guru yang sudah dipoles. Bukan merombak total konten/data — admin tetap menyajikan data admin (pendaftaran, pembayaran, kelas, guru). Yang berubah adalah **cara menyajikannya**.

### User Story

> Sebagai admin, saya ingin dashboard memiliki kualitas visual yang sama dengan dashboard guru — bersih, tipografi percaya diri, hierarki jelas — sehingga pengalaman antarmuka terasa konsisten di seluruh peran.

---

## 2. Current State (Admin Dashboard)

**File:** [`src/app/[locale]/admin/dashboard/page.tsx`](file:///mnt/d/projek_react/PJBL/siedu/src/app/%5Blocale%5D/admin/dashboard/page.tsx) (748 baris)

### Struktur Saat Ini

```
┌─────────────────────────────────────────────────────────┐
│ HEADER: H1 + deskripsi + 2 ButtonLink (kanan)           │
├─────────────────────────────────────────────────────────┤
│ STRIP PERIODE: bar gelap slate-900 rounded-xl           │
├─────────────────────────────────────────────────────────┤
│ BANNER PERHATIAN: Panel amber (opsional)                │
├─────────────┬───────────┬───────────┬─────────┬─────────┤
│ KPI Card 1  │ KPI Card 2│ KPI Card 3│ KPI 4   │ KPI 5   │
│ (5 kolom, Panel + border-t-4 warna kategori)            │
├─────────────────────────────────────┬───────────────────┤
│ KIRI (2/3):                         │ KANAN (1/3):      │
│ ┌─ Tren Pendaftaran 6 Bulan ──────┐│ ┌─ Donut Bayar ─┐ │
│ │ H2 + EnrollmentTrendChart       ││ │ PaymentStatus  │ │
│ │ + dl 3-kolom sub-metri          ││ │ Chart          │ │
│ └─────────────────────────────────┘│ └────────────────┘ │
│ ┌─ Pendaftaran Terbaru ───────────┐│ ┌─ Antrean ──────┐ │
│ │ DataTable 6 baris               ││ │ 3 item link    │ │
│ └─────────────────────────────────┘│ └────────────────┘ │
└─────────────────────────────────────┴───────────────────┘
```

### Masalah Visual yang Teridentifikasi

1. **Header polos tanpa jangkar waktu** — Tidak ada konteks tanggal/hari seperti di teacher dashboard.
2. **Strip periode slate-900 asing** — Pola bar gelap ini tidak dipakai di dashboard guru, menimbulkan inkonsistensi.
3. **Banner amber inline** — Sudah ditangani dengan baik, tapi bisa lebih elegan via pola yang sama dengan teacher (atau notifikasi).
4. **KPI Card 5-kolom dengan `border-t-4` warna** — Pola "top-colored-border" per kategori tidak dipakai di teacher dashboard. KPI guru lebih bersih: label uppercase kecil → angka besar → subtitle.
5. **Panel wrapper duplikat** — `Panel` di dashboard dan `Panel` di `ui.tsx` identik; dashboard mendefinisikan ulang secara lokal.
6. **Tren chart sub-metri `dl` grid** — Sudah baik secara data, tapi styling berbeda dari teacher (teacher pakai rounded-lg cards kecil).
7. **Antrean panel kanan** — Card-in-card dengan badge amber per item. Bisa disetarakan dengan pola teacher yang lebih flat.

---

## 3. Target State — Pola Desain yang Diadopsi dari Teacher Dashboard

### 3A. Header Bersih dengan Konteks Waktu

**Referensi:** Teacher dashboard L252-261

```tsx
// BEFORE (admin):
<h1 className="font-display text-2xl font-extrabold ...">{t('text33')}</h1>
<p className="mt-1 text-sm text-slate-500">{t('text34')}</p>
// + 2 ButtonLink di kanan

// AFTER (target):
<div className="pb-4 border-b border-slate-200 dark:border-slate-800">
  <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
    {/* Judul kontekstual, misal: "Ringkasan Operasional" atau judul + jumlah periode aktif */}
  </h1>
  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
    {tanggalLengkap} {/* "Selasa, 26 November 2026" */}
  </p>
</div>
```

**Perubahan:**
- Tambah `border-b` separator bawah (pola teacher).
- Tambah tanggal lengkap di bawah judul.
- Pindahkan ButtonLink ("Buat Kelas Baru", "Lihat Laporan") ke bawah (pintasan cepat) atau tetap di kanan header — keputusan di fase eksekusi.
- **Hapus strip periode slate-900.** Informasi periode masuk ke sub-text header atau ke panel informasional terpisah.

### 3B. KPI Cards — Pola Teacher Metric Cards

**Referensi:** Teacher dashboard L283-308

Ganti grid 5-kolom `border-t-4` dengan:
- Grid `2 kolom mobile` / `4-5 kolom desktop`.
- Tiap kartu: `rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-2xs`.
- Label: `text-[11px] font-semibold uppercase tracking-wider text-slate-500`.
- Angka: `text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-slate-950`.
- Subtitle: `text-xs text-slate-500`.
- **Tanpa `border-t-4` warna kategori** — warna kategori hanya visual noise pada metrik yang sudah jelas labelnya.
- **Tanpa ikon dekoratif** (sesuai AGENTS.md: *"KPIs are type, not tiles"*).
- Progress bar kuota tetap dipertahankan di card Kelas Aktif (informatif, bukan dekoratif).

**KPI Cards yang dipertahankan (5 kartu):**

| # | Label | Value | Subtitle |
|---|-------|-------|----------|
| 1 | Siswa Aktif | `nSiswaAktif` | Total anak: `anak.length` |
| 2 | Guru | `nGuru` | Mengajar di `kelasAktif.length` kelas |
| 3 | Kelas Aktif | `kelasAktif.length` | Kapasitas `pctKuota`% terisi + progress bar |
| 4 | Pendaftaran Bulan Ini | `bulanIni` | Bulan lalu: `bulanLalu` |
| 5 | Total Pendapatan | `rupiah(...)` | `bayarBerhasil.length` pembayaran berhasil |

### 3C. Hero Section — Chart Tren + KPI Vertikal

**Referensi:** Teacher dashboard L264-309 (grid 12-kolom: chart 8 kolom, 2 KPI vertikal 4 kolom)

```
┌──────────────────────────────────┬──────────────────┐
│ Tren Pendaftaran 6 Bulan         │ KPI Vertikal:    │
│ (EnrollmentTrendChart)           │ - Pendaftaran    │
│ + sub-metri strip                │   Bulan Ini      │
│                                  │ - Perlu Tindakan │
│                                  │                  │
└──────────────────────────────────┴──────────────────┘
```

**Perubahan:**
- Wrapping chart tren dalam card yang sama dengan teacher (`TrenKehadiranCard` style).
- Sub-metri (`dl` grid 3-kolom) → ganti ke rounded-lg stat cards kecil (4-kolom grid) seperti teacher L303-331.
- Kolom kanan: 2 kartu vertikal (Pendaftaran Bulan Ini + Perlu Tindakan) sebagai angka operasional focal point.

### 3D. Konten Utama — Grid 12-Kolom

**Referensi:** Teacher dashboard L312-543

```
Grid 12 kolom:
├── KIRI (8 kolom):
│   ├── Pendaftaran Terbaru (tabel DataTable)
│   └── Pintasan Aksi Cepat (grid 2×2 atau 4-kolom)
│
├── KANAN (4 kolom):
│   ├── Donut Status Pembayaran
│   └── Antrean Perlu Tindakan
```

### 3E. Pintasan Aksi Cepat — Pola Teacher Quick Actions

**Referensi:** Teacher dashboard L472-532

Ganti 2 ButtonLink di header dengan grid pintasan visual:

| Pintasan | Href | Warna Hover |
|----------|------|-------------|
| Buat Kelas Baru | `/admin/classes/new` | blue |
| Kelola Pendaftaran | `/admin/enrollments` | amber |
| Daftar Guru | `/admin/teachers` | emerald |
| Laporan Keuangan | `/admin/reports` | indigo |

Setiap pintasan: card `rounded-xl border` + ikon navigasi (`ArrowUpRight`) + label bold + sub-teks kecil. Hover: border berubah warna + bg tinted.

### 3F. Antrean Perlu Tindakan — Flat List Style

**Referensi:** Pola teacher grading queue L389-469

Ganti card-in-card antrean saat ini dengan flat list `divide-y`:
- Tiap item: `flex justify-between py-3 hover:bg-slate-50/80 px-2 rounded-lg`.
- Label + hint kiri, counter badge kanan.
- Link "Lihat Semua" di bawah jika ada item.

### 3G. Banner Perhatian

**Opsi A (Recommended):** Pertahankan banner amber inline tapi gunakan styling yang lebih ringan — tanpa `Panel` wrapper, cukup `rounded-xl border border-amber-200 bg-amber-50 px-4 py-3`.

**Opsi B:** Pindahkan ke notification system seperti teacher. Tapi admin belum punya notification bell, jadi tetap inline untuk sekarang.

### 3H. Dark Mode Support

Dashboard guru sudah mendukung dark mode tokens (`dark:border-slate-800`, `dark:bg-slate-900`, `dark:text-slate-50`). Dashboard admin saat ini hardcode `bg-white`, `text-slate-900`, tanpa dark mode classes.

**Target:** Tambahkan dark mode tokens ke semua elemen baru. Ini tidak memerlukan toggle UI baru — hanya memastikan class-class yang benar ada di tempat saat dark mode diaktifkan.

---

## 4. Komponen yang Terpengaruh

| File | Aksi | Keterangan |
|------|------|------------|
| `src/app/[locale]/admin/dashboard/page.tsx` | **Rewrite besar** | Struktur JSX baru: header, KPI cards, grid 12-kolom, quick actions |
| `src/components/admin/enrollment-trend-chart.tsx` | Tidak berubah | Chart recharts tetap sama |
| `src/components/admin/payment-status-chart.tsx` | Tidak berubah | Donut tetap sama |
| `src/components/admin/ui.tsx` | Minor | `Panel` di dashboard harus menggunakan yang dari `ui.tsx` (hapus duplikat lokal) |
| `src/components/ui/data-table.tsx` | Tidak berubah | DataTable sudah dipakai, styling tetap |

### File TIDAK Terpengaruh

- `admin/layout.tsx` — Sidebar admin tetap (sudah bagus).
- Semua halaman admin lain (`classes/`, `enrollments/`, `teachers/`, dll.) — Scope hanya dashboard.
- Komponen teacher — Hanya referensi visual, tidak diubah.

---

## 5. Acceptance Criteria

### AC-1: Header Bersih dengan Tanggal
- [ ] H1 judul dashboard berdiri bersih tanpa pill/badge.
- [ ] Tanggal lengkap tampil di bawah judul (format: "Selasa, 26 November 2026").
- [ ] `border-b` separator bawah header.
- [ ] Strip periode `slate-900` dihapus; info periode masuk ke subtitle atau panel terpisah.

### AC-2: KPI Cards Tanpa Border-Top Warna
- [ ] 5 kartu KPI menggunakan styling seragam: `rounded-2xl border border-slate-200/80 bg-white shadow-2xs`.
- [ ] Label uppercase kecil → angka besar extrabold → subtitle.
- [ ] Tanpa `border-t-4` warna kategori.
- [ ] Progress bar kuota tetap ada di card Kelas Aktif.
- [ ] Grid responsive: `grid-cols-2 lg:grid-cols-5`.

### AC-3: Grid 12-Kolom Utama
- [ ] Layout grid `lg:grid-cols-12`: kiri 8 kolom, kanan 4 kolom.
- [ ] Kiri atas: chart tren pendaftaran dalam card teacher-style.
- [ ] Kiri bawah: tabel pendaftaran terbaru.
- [ ] Kanan atas: donut status pembayaran.
- [ ] Kanan bawah: antrean perlu tindakan (flat list).

### AC-4: Pintasan Aksi Cepat
- [ ] Grid 4 pintasan di bawah tabel (kiri) dengan hover states warna per aksi.
- [ ] Setiap pintasan: rounded-xl, label bold, sub-teks, ikon ArrowUpRight.

### AC-5: Antrean Flat List
- [ ] Antrean perlu tindakan bukan card-in-card, melainkan `divide-y` list flat.
- [ ] Counter badge per item tetap ada.

### AC-6: Sub-Metri Chart → Stat Cards
- [ ] `dl` grid 3-kolom di bawah chart diganti menjadi `rounded-lg` stat card kecil (pola teacher).
- [ ] 3-4 kolom: "Bulan Ini", "Rata-rata/Bulan", "Total Aktif".

### AC-7: Dark Mode Tokens
- [ ] Semua elemen baru memiliki class `dark:*` yang sesuai.
- [ ] Tidak ada hardcode `bg-white` atau `text-slate-900` tanpa pasangan dark.

### AC-8: TypeScript Bersih
- [ ] `npx tsc --noEmit` exit code 0.
- [ ] Tidak ada `@ts-ignore`, `@ts-expect-error`, atau `eslint-disable` baru.

### AC-9: Duplikasi Panel Dihapus
- [ ] Fungsi `Panel` lokal di `dashboard/page.tsx` dihapus.
- [ ] Gunakan `Panel` dari `@/components/admin/ui`.

---

## 6. Out-of-Scope

- **Notification bell untuk admin** — Ini fitur terpisah, bukan bagian redesain visual dashboard.
- **Halaman admin lain** — Hanya dashboard yang di-redesain.
- **Data/logika bisnis** — Query DB, perhitungan statistik tetap sama persis.
- **i18n keys baru** — Jika dibutuhkan label baru, tambahkan di file pesan yang sesuai. Tapi ini implementasi detail, bukan spec scope.
- **Admin sidebar redesign** — Sidebar admin sudah cukup baik.

---

## 7. Risiko & Catatan

1. **Admin dashboard lebar `max-w-6xl`** sementara teacher `max-w-7xl`. Perlu diputuskan apakah menyeragamkan ke `max-w-7xl` atau tetap `max-w-6xl` (lebih compact untuk data admin yang lebih dense).

2. **Strip periode berisi info penting** (nama periode, sisa hari, jumlah pendaftaran aktif). Jika dihapus, info ini harus tetap tampil di tempat lain — misal subtitle header atau KPI card periode.

3. **ButtonLink dependencies** — Tombol "Buat Kelas Baru" dan "Lihat Laporan" di header saat ini langsung visible. Jika dipindah ke grid pintasan, apakah admin kehilangan discoverability? Rekomendasi: tetap taruh minimal 1 CTA di header area.

---

## 8. Visual Comparison Summary

```
BEFORE (Admin)                     AFTER (Target — Teacher Style)
──────────────────────────────     ──────────────────────────────
H1 + 2 buttons (kanan)            H1 + tanggal + border-b
█ STRIP GELAP PERIODE █            (strip dihapus → info ke subtitle)
█ BANNER AMBER █                   █ BANNER AMBER (lebih ringan) █
[KPI][KPI][KPI][KPI][KPI]          [KPI][KPI][KPI][KPI][KPI]
 border-t-4 warna                   clean, no colored top border

┌─Chart────────┐┌─Donut──┐        ┌─Chart (8col)──┐┌─2 KPI──┐
│ dl sub-metri ││Antrean │        │ stat cards    ││vertikal│
├─Table────────┤│        │        ├─Table─────────┤├─Donut──┤
│              ││        │        │               ││Antrean │
└──────────────┘└────────┘        ├─Quick Actions─┤│(flat)  │
                                  └───────────────┘└────────┘
```
