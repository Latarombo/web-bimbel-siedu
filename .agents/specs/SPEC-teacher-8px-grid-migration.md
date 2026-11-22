# SPEC: Standarisasi Sistem Spasi 8-pt Grid & Konsistensi UI/UX di Portal Guru

> **Status:** Draft / Approved by Grill  
> **Tanggal:** 2026-11-22  
> **Author:** Antigravity  
> **Skills Terkait:** `ui-ux-pro-max`, `web-design-guidelines`, `impeccable`, `spec-driven-development`, `constraint-driven-development`  
> **Referensi Standar:** [DESIGN.md](file:///mnt/d/projek_react/PJBL/siedu/.agents/docs/DESIGN.md) (Bagian 4A, 6, 7B, 7C, 7I), [CONSTRAINTS.md](file:///mnt/d/projek_react/PJBL/siedu/CONSTRAINTS.md), [AGENTS.md](file:///mnt/d/projek_react/PJBL/siedu/AGENTS.md).

---

## 1. Objective & Latar Belakang

Berdasarkan audit komprehensif pada direktori Portal Guru (`src/app/[locale]/(teacher)/` dan `src/components/teacher/`), aturan sistem kisi spasi 8-point (*8-pt spacing grid*) sebagaimana diwajibkan dalam [DESIGN.md](file:///mnt/d/projek_react/PJBL/siedu/.agents/docs/DESIGN.md) Bagian 4A **belum diterapkan secara konsisten**.

Ditemukan **lebih dari 120 insiden deviasi pecahan non-grid** (seperti `1.5` = 6px, `2.5` = 10px, `3.5` = 14px) dan *arbitrary pixel heights/sizes* (seperti `min-h-[38px]`, `size-6.5` = 26px) yang merusak irama visual (*visual rhythm*), harmoni spasi, dan konsistensi antarmuka.

Tujuan spesifikasi ini adalah menetapkan **kontrak standar spasi hibrida 8-pt / 4-pt**, aturan konversi token pecahan, standar tinggi kontrol interaktif, serta peta jalan refaktor 5 irisan vertikal (*vertical slices*) untuk membersihkan seluruh deviasi di portal guru.

---

## 2. Aturan Kontrak Spasi & Ukuran (Spacing & Sizing Contract)

### A. Sistem Kisi Hibrida 8-pt / 4-pt
1. **8-pt Primary Grid (Skala Utama Tata Letak & Komponen):**
   Semua margin, padding kontainer, gap antar kartu, dan spasi antar seksi wajib menggunakan kelipatan 8px:
   - `2` (8px): Spasi antar elemen kecil, jarak ikon ke teks (`gap-2`), padding internal tombol kecil.
   - `4` (16px): Padding internal kartu standar (`p-4`), gap form (`gap-4`), spasi baris (`space-y-4`).
   - `6` (24px): Gap grid kartu (`gap-6`), padding kartu besar (`p-6`), jarak antar seksi sedang.
   - `8` (32px): Celah antar blok besar (`gap-8`, `space-y-8`), padding kontainer utama.
   - `10` (40px): Padding vertikal seksi (`py-10`), tinggi input/tombol standar desktop (`h-10`).
   - `12` (48px): Padding vertikal besar (`py-12`), touch target longgar (`h-12`).
   - `16` (64px): Padding vertikal hero/seksi utama (`py-16`).

2. **4-pt Sub-grid (Hanya untuk Mikro-Spasi & Kerapatan Terukur):**
   Diizinkan khusus untuk elemen mikro di mana kelipatan 8px terlalu renggang:
   - `1` (4px): Gap mikro (`gap-1`), padding vertikal badge kompak (`py-0.5 px-2` = 2px vertikal, 8px horizontal).
   - `3` (12px): Padding sel tabel padat (`py-3 px-4`), gap tombol navigasi rapat (`gap-3`).
   - `5` (20px): Gap khusus jika 16px terlalu sempit dan 24px memecah baris.

3. **Larangan Keras (Zero Tolerance):**
   - **DILARANG** menggunakan token fractional Tailwind: `.5` (`1.5` = 6px, `2.5` = 10px, `3.5` = 14px, `4.5` = 18px).
   - **DILARANG** menggunakan arbitrary pixel values untuk spasi dan dimensi: `min-h-[38px]`, `size-6.5`, `p-[10px]`, `gap-[14px]`.

### B. Standardisasi Tinggi Elemen Interaktif & Touch Target
Mengacu pada panduan aksesibilitas WCAG 2.2 AA (SC 2.5.8) dan Apple Human Interface Guidelines:
- **Desktop Input & Button:** Tinggi standar `h-10` (40px, kelipatan 8) atau `h-9` (36px, kelipatan 4 untuk varian compact).
- **Mobile Touch Target:** Wajib memenuhi target sentuh minimum **44 × 44 piksel** (`min-h-[44px]` atau `h-11` di mobile, `sm:h-10`).
- **Icon Sizing:** Wajib menggunakan token seragam `size-4` (16px), `size-5` (20px), atau `size-6` (24px). Dilarang menggunakan `size-3.5` (14px) atau `size-6.5` (26px).

---

## 3. Matriks Konversi & Pemetaan Deviasi (Remediation Mapping)

| Token Lama (Deviasi) | Ukuran (px) | Token Pengganti Standar | Alasan & Rekomendasi Penempatan |
|:---|:---|:---|:---|
| `gap-1.5`, `space-y-1.5` | 6px | `gap-2` (8px) atau `gap-1` (4px) | `gap-2` untuk jarak teks & badge; `gap-1` untuk icon inline |
| `py-1.5` | 6px | `py-2` (8px) atau `py-1` (4px) | `py-2` untuk tombol/chip interaktif; `py-1` untuk dropdown item |
| `px-1.5` | 6px | `px-2` (8px) | Padding horizontal chip / badge status |
| `mb-1.5`, `mt-1.5` | 6px | `mb-2` (8px) atau `mb-1` (4px) | Jarak label form ke input field (`mb-1.5` -> `mb-2`) |
| `p-2.5`, `pt-2.5` | 10px | `p-3` (12px) atau `p-2` (8px) | `p-3` untuk kartu informasi kecil; `pt-2` untuk batas separator |
| `gap-2.5`, `space-y-2.5`| 10px | `gap-2` (8px) atau `gap-3` (12px) | `space-y-3` untuk item sidebar/form; `gap-2` untuk row actions |
| `px-2.5` | 10px | `px-3` (12px) atau `px-2` (8px) | `px-2.5` pada badge diganti `px-2.5` (tetap diperbolehkan HANYA jika badge token DESIGN.md) atau `px-3` |
| `p-3.5`, `px-3.5` | 14px | `p-4` (16px) atau `px-4` (16px) | Standar padding kartu dan tombol aksi horizontal |
| `gap-3.5` | 14px | `gap-4` (16px) | Grid kolom dashboard & cards |
| `size-3.5` | 14px | `size-4` (16px) | Ukuran ikon arrow, chevron, atau status dot |
| `size-6.5` | 26px | `size-7` (28px) atau `size-6` (24px) | Tombol toggle sidebar collapse |
| `min-h-[38px]` | 38px | `h-10` / `min-h-[40px]` (40px) | Standar tinggi tombol aksi & tab filter |
| `ml-3.5` | 14px | `ml-3` (12px) atau `ml-4` (16px) | Posisi tooltip popover sidebar collapse |
| `p-5`, `gap-5` | 20px | `p-4` (16px) atau `p-6` (24px) | Grid dan padding kartu utama di dashboard & dialog |

---

## 4. Pembagian 5 Irisan Vertikal (*Vertical Slices*)

```
┌─────────────────────────────────────────────────────────────┐
│ Slice 1: Foundation Shell & Layout Navigasi                 │
│ (teacher-shell, teacher-sidebar, quick-search, theme-switch)│
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ Slice 2: Dashboard Guru & Metrik Jadwal                     │
│ (/teacher/dashboard, schedule-widget, dashboard-charts)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ Slice 3: Halaman Kelas & Presensi Pertemuan                 │
│ (/teacher/classes, attendance-table, session-stat-strip)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ Slice 4: Nilai & Asesmen Siswa                              │
│ (/teacher/grades, teacher-grades-view, quick-grade-drawer)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ Slice 5: Profil, Formulir & Halaman Pendukung               │
│ (corrections, profile, status, calendar, modal & dialog)    │
└─────────────────────────────────────────────────────────────┘
```

### Slice 1: Foundation Shell & Layout Navigasi
- **File Target:**
  - `src/components/teacher/teacher-shell.tsx`
  - `src/components/teacher/teacher-sidebar.tsx`
  - `src/components/teacher/teacher-quick-search.tsx`
  - `src/components/teacher/teacher-theme-switch.tsx`
  - `src/app/[locale]/(teacher)/layout.tsx`
  - `src/app/[locale]/(teacher)/loading.tsx`
- **Pekerjaan Spesifik:**
  - Ubah toggle button sidebar `size-6.5` (26px) menjadi `size-7` (28px) atau `size-6` (24px).
  - Standarkan tooltip offset `ml-3.5` menjadi `ml-3` atau `ml-4`.
  - Bersihkan `space-y-2.5` dan `gap-2.5` di footer profil sidebar menjadi `space-y-3` dan `gap-2`.
  - Normalisasi `loading.tsx` (`pb-5` -> `pb-4` atau `pb-6`, `space-y-1.5` -> `space-y-2`).

### Slice 2: Dashboard Guru & Metrik Jadwal
- **File Target:**
  - `src/app/[locale]/(teacher)/teacher/dashboard/page.tsx`
  - `src/components/teacher/dashboard/teacher-schedule-widget.tsx`
  - `src/components/teacher/dashboard-charts.tsx`
- **Pekerjaan Spesifik:**
  - Ubah grid gap `gap-3.5` menjadi `gap-4`.
  - Ubah padding quick action kartu `p-3.5` menjadi `p-4`.
  - Ganti `min-h-[38px]` pada tombol status presensi menjadi `h-10` / `min-h-[40px]`.
  - Ubah `size-3.5` pada panah navigasi menjadi `size-4`.
  - Ubah `gap-1.5` pada badge kelas menjadi `gap-2`.

### Slice 3: Halaman Kelas & Presensi Pertemuan
- **File Target:**
  - `src/app/[locale]/(teacher)/teacher/classes/page.tsx`
  - `src/app/[locale]/(teacher)/teacher/classes/[classId]/page.tsx`
  - `src/app/[locale]/(teacher)/teacher/classes/[classId]/sessions/[date]/attendance/page.tsx`
  - `src/components/teacher/classes/teacher-classes-view.tsx`
  - `src/components/teacher/classes/class-detail-view.tsx`
  - `src/components/teacher/attendance/attendance-table.tsx`
  - `src/components/teacher/attendance/attendance-sticky-bar.tsx`
  - `src/components/teacher/attendance/session-stat-strip.tsx`
  - `src/components/teacher/attendance/session-journal-form.tsx`
- **Pekerjaan Spesifik:**
  - Normalisasi padding `pb-5` header menjadi `pb-4` atau `pb-6`.
  - Bersihkan `py-1.5` dan `px-3.5` pada tab filter kelas menjadi `py-2 px-4`.
  - Ubah `p-2.5` pada kartu sesi pertemuan menjadi `p-3` atau `p-4`.
  - Standarkan input cell catatan dan radio presensi ke padding kelipatan 4/8 (`py-2 px-3`).

### Slice 4: Nilai & Asesmen Siswa
- **File Target:**
  - `src/app/[locale]/(teacher)/teacher/grades/page.tsx`
  - `src/app/[locale]/(teacher)/teacher/grades/assessment/[id]/page.tsx`
  - `src/app/[locale]/(teacher)/teacher/grades/[enrollmentId]/page.tsx`
  - `src/components/teacher/grades/teacher-grades-view.tsx`
  - `src/components/teacher/grades/student-grade-item-editor.tsx`
  - `src/components/teacher/classes/quick-grade-drawer.tsx`
  - `src/components/teacher/classes/quick-assessment-modal.tsx`
  - `src/components/teacher/nilai-form.tsx`
  - `src/components/teacher/penilaian-form.tsx`
- **Pekerjaan Spesifik:**
  - Bersihkan `gap-1.5`, `py-1.5`, dan `px-3.5` pada filter status nilai dan tombol tambah nilai.
  - Normalisasi drawer dan modal `p-5` / `p-2.5` menjadi `p-6` / `p-4`.
  - Standarkan input angka nilai siswa dengan tinggi `h-10` (`sm:h-9`) dan padding `px-3`.

### Slice 5: Profil, Formulir & Halaman Pendukung
- **File Target:**
  - `src/app/[locale]/(teacher)/teacher/calendar/page.tsx`
  - `src/components/teacher/calendar/teacher-calendar-view.tsx`
  - `src/app/[locale]/(teacher)/teacher/corrections/page.tsx`
  - `src/components/teacher/pengajuan-koreksi-form.tsx`
  - `src/app/[locale]/(teacher)/teacher/profile/page.tsx`
  - `src/components/teacher/guru-profil-form.tsx`
  - `src/app/[locale]/(teacher)/teacher/status/page.tsx`
  - `src/components/teacher/status-form.tsx`
- **Pekerjaan Spesifik:**
  - Ubah `gap-5` pada layout dua kolom koreksi menjadi `gap-6`.
  - Normalisasi `p-2.5` dan `p-5` pada kotak info ketentuan 7 hari menjadi `p-3` dan `p-6`.
  - Ubah seluruh label form `mb-1.5` menjadi `mb-2`.
  - Bersihkan input form `px-3.5 py-2.5` menjadi `px-3 py-2` atau `px-4 py-2.5` -> `px-4 py-2` (h-10).

---

## 5. Acceptance Criteria & Quality Gates

### A. Acceptance Criteria (Given-When-Then)
1. **Given** pengembang memeriksa kode di direktori `src/app/[locale]/(teacher)/` dan `src/components/teacher/`,  
   **When** automated regex scan untuk token pecahan dijalankan,  
   **Then** tidak ada satupun kemunculan class `gap-1.5`, `gap-2.5`, `gap-3.5`, `p-1.5`, `p-2.5`, `p-3.5`, `px-3.5`, `py-1.5`, `space-y-1.5`, atau `space-y-2.5` (Hasil: 0 temuan).
2. **Given** pengembang memeriksa elemen ikon dan tombol toggle di layout shell guru,  
   **When** selector ukuran tombol diperiksa,  
   **Then** tidak ada nilai sembarang seperti `min-h-[38px]` atau `size-6.5`; seluruh ukuran mengacu pada skala Tailwind standar (`size-4`, `size-6`, `size-7`, `h-10`).
3. **Given** guru membuka portal di layar ponsel (< 640px),  
   **When** guru berinteraksi dengan tombol aksi, field input, dan filter tab,  
   **Then** area sentuh (*touch target*) memiliki tinggi minimum 44px dan tidak ada pergeseran tata letak horizontal (*no horizontal scrollbar*).

### B. Automated Verification Commands
```bash
# 1. Verifikasi Nol Deviasi Spasi Pecahan (Wajib 0 hasil):
grep -rnE "(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|space-y|space-x)-(1\.5|2\.5|3\.5)" src/app/\[locale\]/\(teacher\)/ src/components/teacher/

# 2. Verifikasi Nol Arbitrary Dimensi di Portal Guru (Wajib 0 hasil):
grep -rnE "size-6\.5|min-h-\[38px\]" src/app/\[locale\]/\(teacher\)/ src/components/teacher/

# 3. Verifikasi Bebas Type Error (Wajib Bersih):
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

---

## 6. Out of Scope
- Halaman Publik (Guest) dan Portal Orang Tua / Admin (difokuskan khusus Portal Guru).
- Perubahan skema basis data Prisma, migrasi database, atau perubahan server actions backend.
- Penambahan fitur bisnis baru di luar standardisasi spasi visual dan perbaikan aksesibilitas kontrol.
