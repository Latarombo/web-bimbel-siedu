# SPEC: Penyempurnaan & Standardisasi UI/UX Seluruh Tabel Data Siedu

> **Status:** Approved (Berdasarkan Audit `laporan-analisis-tabel-ui-ux.md`)  
> **Tanggal:** 2026-11-22  
> **Author:** Antigravity  
> **Modul Terkait:**  
> - `src/components/ui/data-table.tsx`  
> - `src/app/[locale]/admin/classes/page.tsx`  
> - `src/app/[locale]/admin/teachers/page.tsx`  
> - `src/app/[locale]/admin/periods/page.tsx`  
> - `src/app/[locale]/admin/reports/page.tsx`  
> - `src/app/[locale]/admin/enrollments/flagged/page.tsx`  
> - `src/components/teacher/classes/class-detail-view.tsx`  
> - `src/components/teacher/grades/teacher-grades-view.tsx`  
> - `src/components/teacher/attendance/attendance-table.tsx`  
> - `src/components/teacher/penilaian-form.tsx`  
> - `src/components/parent/official-receipt.tsx`  
> - `src/components/parent/payments/receipt-modal.tsx`  
> **Skills Terkait:** `ui-ux-pro-max`, `spec-driven-development`, `constraint-driven-development`, `web-design-guidelines`, `ponytail`

---

## 1. Objective & User Story

### Objective
Menstandarisasi seluruh komponen tabel data di Siedu agar 100% mematuhi panduan `DESIGN.md §7.I` (Standar Tabel Data), prinsip *Icon Restraint*, *Typographic First*, WCAG 2.1 AA (aksesibilitas keyboard dan pembaca layar), dan responsivitas mobile tanpa menambah dependensi library eksternal.

### User Stories
- **Sebagai Administrator & Pengguna Keyboard:** Saya dapat menavigasikan tabel data dengan tombol `Tab` dan menekan `Enter` atau `Space` pada header kolom untuk menyortir data naik/turun tanpa harus menggunakan mouse.
- **Sebagai Guru (Teacher):**
  - Saat melihat tabel rekap di desktop, angka persentase, desimal nilai, dan rasio sesi tersusun rata kanan (`text-right`) dengan font `tabular-nums` yang lurus dan mudah dibandingkan secara vertikal.
  - Saat mengisi nilai di ponsel pintar (`penilaian-form.tsx`), kolom nama siswa tetap terkunci/beku di sisi kiri saat tabel digeser horizontal sehingga saya tidak kehilangan konteks siapa yang sedang dinilai.
- **Sebagai Orang Tua (Parent):** Saya melihat kwitansi dan rincian transaksi dengan perataan nominal uang yang presisi dan struktur tabel yang ramah pembaca layar.

---

## 2. Command Verifikasi

Sesuai aturan environment WSL + Windows Interop (Aturan 1):
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. Data Contracts & Technical Specifications

### A. Kontrak Tipe `TableColumn` (`src/components/ui/data-table.tsx`)
```typescript
export type TableColumn = {
  key: string;
  header: string;
  className?: string;
  /** Perataan isi dan header kolom secara semantik */
  align?: "left" | "center" | "right";
  /** default true kalau values[key] ada */
  sortable?: boolean;
};
```

### B. Aturan Penjajaran Kolom Semantik (`DESIGN.md §7.I.1`)
- `align: "left"` (Default untuk teks: Nama, Mata Pelajaran, Uraian, Catatan).
- `align: "right"` (Wajib untuk angka, nominal uang rupiah, persentase, durasi, tanggal format pendek/relatif) didampingi kelas `tabular-nums`.
- `align: "center"` (Wajib untuk status, badge, nomor urut, tombol toggle tunggal).
- `aksi` (Wajib rata kanan: `align: "right"`).

### C. Aksesibilitas Sorting Header
Header sortable wajib dapat difokuskan (`tabIndex={0}`), memiliki `role="button"`, `aria-label`, dan listener tombol `onKeyDown` (`Enter` & `Space`) untuk memicu `toggleSort`.

### D. Semantik HTML5
- Elemen `<th>` wajib menyertakan `scope="col"`.
- Tabel menyertakan elemen `<caption>` tersembunyi secara visual (`sr-only`) untuk pembaca layar.

---

## 4. Vertical Slices & Task Breakdown

### Slice 1: Standardisasi Komponen Reusable `DataTable` (`data-table.tsx`)
1. Perluas tipe `TableColumn` dengan properti `align?: "left" | "center" | "right"`.
2. Map `align` ke kelas Tailwind yang konsisten pada `<th>` dan `<td>` (`text-left`, `text-center`, `text-right`).
3. Tambahkan aksesibilitas keyboard (`tabIndex={0}`, `role="button"`, `onKeyDown`) pada header sortir.
4. Tambahkan `scope="col"` pada semua `<th>`.
5. Pindahkan caption ke elemen `<caption className="sr-only">` resmi di dalam `<table>`.
6. Tambahkan tombol clear (`X`) pada search input ketika `q` tidak kosong.
7. Dukungan Dark Mode tokens (`dark:bg-slate-900`, `dark:border-slate-800`, `dark:text-slate-100`).

### Slice 2: Pembenahan Modul Admin
1. `/admin/classes`: Kolom `biaya` dan `kuota` diatur `align: "right"`, kolom `status` diatur `align: "center"`.
2. `/admin/teachers`: Kolom `telepon` diatur `align: "right"`, kolom `catatan` dan `nKelas` diatur `align: "center"`. Ganti tooltip disabled `title` dengan text helper yang eksplisit atau modal konfirmasi.
3. `/admin/reports`: Kolom `status` diatur `align: "center"`, angka nominal tetap `align: "right"`.
4. `/admin/periods`: Kolom `status` diatur `align: "center"`.
5. `/admin/enrollments/flagged`:
   - **Perbaiki bug navigasi:** Ganti tautan nama siswa agar tidak me-refresh filter status yang sama.
   - Kolom `status` diatur `align: "center"`, tanggal diatur `align: "right"`.

### Slice 3: Optimalisasi Tabel Operasional Guru
1. `class-detail-view.tsx` (Tab Roster):
   - Ubah kolom `Sesi Hadir`, `Kehadiran (%)`, `Tugas Dinilai`, dan `Nilai Rata-rata` dari `text-center` menjadi `text-right` dengan `tabular-nums`.
2. `class-detail-view.tsx` (Tab Asesmen):
   - Ubah kolom `Tanggal` dan `Siswa Dinilai` menjadi `text-right` dengan `tabular-nums`.
3. `teacher-grades-view.tsx`:
   - Perbaiki duplikasi `aria-label` (Tab 2 harus berlabel "Tabel rekap nilai siswa per kelas").
   - Ubah kolom `Tugas Dinilai`, `Rata-rata Nilai`, `Terakhir Dinilai` menjadi `text-right` dengan `tabular-nums`.
4. `attendance-table.tsx`:
   - Perluas area tap tombol toggle (H, I, S, A) dari 32px menjadi minimal 40px tanpa merusak kerapatan baris.

### Slice 4: Redesain Responsif `penilaian-form.tsx`
1. Terapkan *freeze column* / *sticky left column* pada kolom nomor (`No`) dan kolom `Siswa` (`sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-200 dark:border-slate-800`).
2. Perbesar ukuran tap target status segmented toggle (`px-3 py-1.5 min-h-[36px]`).
3. Ganti teks hardcoded (`"Belum"`, `"Absen"`, status dinilai) dengan kamus terjemahan `next-intl`.

### Slice 5: Semantik Kwitansi Orang Tua
1. `official-receipt.tsx`: Tambahkan `scope="col"` pada `<th>`, `<caption className="sr-only">`, dan bersihkan teks hardcoded.
2. `receipt-modal.tsx`: Tambahkan `scope="col"` pada `<th>`, perbaiki `<tfoot>` agar semantik.

---

## 5. Acceptance Criteria (Given-When-Then)

- **Scenario 1: Keyboard Sorting pada DataTable**
  - **Given** pengguna menavigasi halaman admin dengan tombol `Tab` keyboard.
  - **When** fokus mencapai header kolom yang dapat disortir dan pengguna menekan tombol `Enter` atau `Space`.
  - **Then** data tabel langsung tersortir naik (`asc`) atau turun (`desc`), indikator visual panah berubah, dan status `aria-sort` diperbarui.

- **Scenario 2: Alignment Vertikal Data Angka**
  - **Given** guru atau admin membuka halaman Roster Kelas, Rekap Nilai, atau Keuangan.
  - **When** pengguna memindai baris data ke bawah pada kolom nilai, persentase, atau uang rupiah.
  - **Then** seluruh digit angka, koma desimal, dan lambang persen berjejer lurus di sisi kanan sel (`text-right`) berkat kelas `tabular-nums`.

- **Scenario 3: Horizontal Scroll pada Lembar Penilaian Siswa**
  - **Given** guru membuka halaman penilaian spreadsheet di smartphone layar 360–412px.
  - **When** guru menggeser tabel ke arah kanan untuk mengetik nilai atau catatan.
  - **Then** kolom nama siswa tetap terkunci dan terlihat jelas di sisi kiri layar (*sticky freeze*), mencegah salah input nilai.

---

## 6. Out-of-Scope
- Tidak mengganti arsitektur dasar tabel dengan library pihak ketiga berukuran besar (seperti TanStack Table atau AG Grid).
- Tidak mengubah skema basis data PostgreSQL atau model Prisma.
- Tidak mengubah alur otentikasi atau Server Actions yang sudah berjalan.
