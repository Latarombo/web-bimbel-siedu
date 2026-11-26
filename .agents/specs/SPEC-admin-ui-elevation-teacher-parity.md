# SPEC: Penyelarasan UI Portal Admin dengan Standar Desain Portal Guru (Teacher Parity)

> **Modul ID:** `admin-ui-elevation-teacher-parity`  
> **Aktor:** Administrator (`role: admin`)  
> **Status:** Approved (SDD Phase 2 - Ready for Implementation)  
> **Rujukan Aturan:** [AGENTS.md](../../AGENTS.md), [GEMINI.md](../../GEMINI.md), [CONSTRAINTS.md](../../CONSTRAINTS.md), [DESIGN.md](../docs/DESIGN.md), [DAFTAR_HALAMAN.md](../docs/DAFTAR_HALAMAN.md), [SPEC-penyederhanaan-tabel-portal-guru.md](SPEC-penyederhanaan-tabel-portal-guru.md).

---

## 1. Objective & User Story

### Konteks & Masalah
Portal Guru Siedu telah mengalami modernisasi UX tingkat tinggi:
1. **Adaptive Hybrid Tables:** Tampilan desktop berupa tabel bersih yang lega (`hidden md:block`), sedangkan pada smartphone otomatis bertransformasi menjadi **Stacked Card View** (`block md:hidden`) yang ramah sentuhan tanpa *awkward horizontal scroll*.
2. **UnderlineTabs:** Navigasi tab/filter berbasis garis bawah minimalis dengan counter badge terintegrasi, bukan pil/kapsul abu-abu tebal.
3. **FilterDropdown & Search Bar:** Filter kustom elegan dengan transisi popover halus menggantikan `<select>` bawaan browser; kolom pencarian dengan ikon dan tombol pembersih `X`.
4. **TablePagination:** Paginasi data konsisten dengan kontrol halaman (Previous/Next) dan info baris data yang transparan.

Saat ini sebagian besar halaman admin masih menggunakan tabel scroll biasa tanpa mode kartu di smartphone, tab filter bertipe kapsul `FilterTabs` pill, elemen `<select>` native, dan belum memiliki paginasi data yang seragam.

### User Story
*Sebagai Administrator*, saya ingin antarmuka seluruh halaman admin memiliki standar estetika, kenyamanan navigasi, dan ketangguhan responsif yang setara dengan Portal Guru—sehingga pengelolaan operasional, data master, dan laporan terasa mulus, modern, dan mudah dioperasikan baik di layar laptop maupun ponsel pintar.

---

## 2. Commands Verifikasi

```bash
# 1. Verifikasi Type Check TypeScript (Wajib 0 error)
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. Project Structure & Affected Files

```
src/
├── components/
│   ├── admin/
│   │   ├── ui.tsx                                    → Transformasi FilterTabs ke Underline Style
│   │   └── schedule-toolbar.tsx                      → [BARU] Toolbar Jadwal Master dengan FilterDropdown
│   └── ui/
│       └── data-table.tsx                            → Upgrade DataTable: TablePagination + Adaptive Mobile View
├── app/
│   └── [locale]/
│       └── admin/
│           ├── enrollments/
│           │   ├── page.tsx                          → Integrasi Adaptive Hybrid Table & UnderlineTabs
│           │   ├── flagged/page.tsx                  → Integrasi Adaptive Hybrid Table & UnderlineTabs
│           │   └── [id]/page.tsx                     → Card polish & table refinement
│           ├── schedule/page.tsx                     → Ganti select native dengan FilterDropdown toolbar
│           ├── parents/page.tsx                      → Integrasi Adaptive Hybrid Table & UnderlineTabs
│           ├── students/page.tsx                     → Integrasi Adaptive Hybrid Table & UnderlineTabs
│           ├── teachers/page.tsx                     → Penyelarasan tabel guru
│           ├── classes/page.tsx                      → FilterDropdown & table polish
│           ├── classes/[classId]/page.tsx            → UnderlineTabs & roster refinement
│           ├── subjects/page.tsx                     → Table polish
│           ├── periods/page.tsx                      → Table polish
│           ├── messages/page.tsx                     → Table polish & UnderlineTabs
│           ├── reports/page.tsx                      → Filter & table polish
│           └── audit-logs/page.tsx                   → Adaptive Hybrid Table & UnderlineTabs
```

---

## 4. Detailed Specification & Acceptance Criteria

### Slice 1: Standardisasi Komponen Dasar (`FilterTabs` & `DataTable`)
- **`src/components/admin/ui.tsx` (`FilterTabs`):**
  - Ubah kontainer dari pill kapsul `rounded-full bg-slate-200/70 p-1` menjadi **Underline Tab Nav** dengan `border-b border-slate-200 dark:border-slate-800`.
  - Tab aktif diberi aksen `text-blue-700 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-bold`.
  - Tab non-aktif memiliki warna `text-slate-600 hover:text-slate-900 dark:text-slate-400`.
  - Counter badge menggunakan badge angka tabular halus.
- **`src/components/ui/data-table.tsx`:**
  - Tambahkan integrasi `TablePagination` bawaan (default `pageSize: 10`, opsi paginasi aktif jika baris > `pageSize`).
  - Tambahkan prop `renderMobileCard?: (row: TableRowData) => React.ReactNode` dan fallback automatic mobile card.
  - Tampilan desktop (`hidden md:block`) mempertahankan tabel data lebar dengan sticky column.
  - Tampilan mobile (`block md:hidden`) menyajikan kartu bertumpuk dengan target sentuh lega dan pembagian border rapi.

### Slice 2: Penyelarasan Halaman Operasional
- **`/admin/enrollments` & `/admin/enrollments/flagged`:**
  - Tab status pendaftaran menggunakan `FilterTabs` underline yang baru.
  - Data pendaftaran mendukung paginasi dan kartu mobile (menampilkan nama anak, kelas, wali, metode bayar, dan status).
- **`/admin/schedule`:**
  - Toolbar filter Guru, Periode, dan Jenjang diganti menggunakan `FilterDropdown` interaktif ber-popover halus.

### Slice 3: Penyelarasan Halaman Data Master
- **`/admin/parents` & `/admin/students`:**
  - FilterTabs underline (status verifikasi untuk orang tua; jenjang TK/SD/SMP/SMA untuk siswa).
  - Paginasi `TablePagination` 10 item per halaman.
  - Mobile card view untuk daftar keluarga dan profil anak.
- **`/admin/classes`, `/admin/teachers`, `/admin/subjects`, `/admin/periods`:**
  - Penerapan paginasi dan tabel adaptif.

### Slice 4: Penyelarasan Komunikasi, Laporan & Log
- **`/admin/messages`:**
  - UnderlineTabs untuk filter pesan (Baru, Dibaca, Dibalas).
  - Paginasi data pesan masuk.
- **`/admin/audit-logs`:**
  - UnderlineTabs untuk tipe entitas.
  - Mobile card view untuk riwayat log audit.
- **`/admin/reports`:**
  - Peningkatan tabel keuangan dengan paginasi dan styling hover seragam.

---

## 5. Quality & Design Constraints
- [x] **Strict TypeScript:** Wajib lolos `powershell.exe ... npx tsc --noEmit` dengan 0 error.
- [x] **Zero Suppression:** Tidak ada `@ts-ignore` atau `as any`.
- [x] **Adaptive Layout:** Bersih di desktop (`md:block`), ramah sentuhan di ponsel (`block md:hidden`).
- [x] **Icon Restraint & Clean Typography:** Sesuai `CONSTRAINTS.md`.
