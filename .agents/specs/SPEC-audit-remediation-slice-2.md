# Spec: Audit Remediation — Slice 2: Pembersihan Design Constraints

- **Status:** In Progress
- **Author:** Antigravity (Google DeepMind)
- **Reference:** [`AUDIT_REPORT.md`](file:///home/un0t_l1ed/.gemini/antigravity-cli/brain/36adccf8-2d8e-4805-833f-50e65643d012/AUDIT_REPORT.md), [`CONSTRAINTS.md`](file:///mnt/d/projek_react/PJBL/siedu/CONSTRAINTS.md), [`DESIGN.md`](file:///mnt/d/projek_react/PJBL/siedu/.agents/docs/DESIGN.md)

---

## 1. Objective & User Story

### Objective
Menegakkan standar kualitas antarmuka pengguna sesuai [`CONSTRAINTS.md`](file:///mnt/d/projek_react/PJBL/siedu/CONSTRAINTS.md) dengan:
1. Menghapus kotak/lingkaran ikon berwarna pada kartu KPI Admin Dashboard (*"KPIs are type, not tiles"*).
2. Menghilangkan penempatan badge/pill di samping heading utama `<h1>` pada Beranda Orang Tua (*Anti-Header Pill Clutter*).
3. Membersihkan penyisipan counter angka ke dalam string subtitle/deskripsi (*Anti-Redundant Counter*).

### User Story
- **Sebagai Administrator**, saya ingin kartu ringkasan metrik (KPI) menampilkan tipografi angka yang berwibawa, jujur, dan mudah dipindai tanpa terdistraksi kotak ikon berwarna-warni yang redundan.
- **Sebagai Orang Tua Murid**, saya ingin judul utama halaman beranda (`<h1>`) tampil bersih dan percaya diri, dengan status pendaftaran anak diletakkan pada posisi yang semestinya (panel metadata terpisah), bukan menempel sebagai pill di samping nama anak.
- **Sebagai Pengguna Siedu**, saya ingin teks subtitle dan label di seluruh sistem menjelaskan konteks secara tenang tanpa pengulangan angka counter dinamis.

---

## 2. Command Verifikasi

Verifikasi wajib lolos tanpa error sebelum kode di-*commit*:
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit; npm run lint" < /dev/null
```

---

## 3. Komponen & Perubahan Desain

### 3.1 Redesain Kartu KPI Admin (`src/app/[locale]/admin/dashboard/page.tsx`)
- Hapus kamus `TILE` dan pembungkus `<span className="grid h-9 w-9 place-items-center rounded-lg ${TILE[s.kategori]}">`.
- Terapkan tata letak tipografi bersih:
  - Label metrik: `text-xs font-semibold uppercase tracking-wider text-slate-500`.
  - Nilai angka: `font-display text-2xl font-extrabold leading-none tracking-tight tabular-nums text-slate-900 sm:text-[28px]`.
  - Tautan navigasi detail: Ikon panah eksternal yang tenang dengan `focus-visible:ring-2`.

### 3.2 Reposisi Status Badge (`src/app/[locale]/(parent)/home/page.tsx`)
- Lepaskan `<StatusBadge />` dari baris yang sejajar dengan `<h1>{dipilih.nama}</h1>`.
- Pindahkan elemen status pendaftaran ke sisi kanan header blok identitas anak atau panel ringkasan data terpisah (`sm:self-center shrink-0`), menjaga `<h1>` bersih tanpa pill clutter.

### 3.3 Pemisahan Counter Dinamis (`public.json` & `testimonial-teacher.tsx`)
- Ubah string `"teacherLevels"` pada `messages/id/public.json` dan `messages/en/public.json` menjadi deskripsi profesi murni tanpa penggabungan jumlah kelas di subtitle.

---

## 4. Acceptance Criteria (Given-When-Then)

1. **KPI Cards Tanpa Ikon Kotak Berwarna:**
   - **Given** Pengguna berada di `/admin/dashboard`,
   - **When** Kartu metrik KPI dimuat,
   - **Then** Kartu tidak mengandung elemen kotak/lingkaran berwarna (`TILE`), dan angka metrik tampil dominan menggunakan `tabular-nums`.

2. **Heading `<h1>` Bersih dari Pill:**
   - **Given** Pengguna berada di `/home`,
   - **When** Hero profil anak aktif ditampilkan,
   - **Then** Judul `<h1>{dipilih.nama}</h1>` tidak memiliki komponen pill/badge di sampingnya.
   - **Then** Status pendaftaran tetap dapat dilihat dengan jelas pada baris/elemen data sekunder.

3. **Subtitle Tanpa Counter Redundan:**
   - **Given** Pengguna melihat kartu profil pengajar pada beranda publik,
   - **When** Subtitle pengajar dirender,
   - **Then** Teks hanya menjelaskan peran/jenjang tanpa menggabungkan angka counter ke dalam kalimat deskripsi.

---

## 5. Out-of-Scope (Dialokasikan ke Slice 3)
- Migrasi tag `<img>` native ke komponen `<Image />` (*Slice 3*).
- Penggantian karakter elipsis tiga titik `...` menjadi `…` (*Slice 3*).
