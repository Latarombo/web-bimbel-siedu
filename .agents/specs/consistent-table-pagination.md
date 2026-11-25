# Spesifikasi: Komponen Reusable TablePagination Konsisten

## 1. Objective & User Story
Sebagai guru yang menggunakan Siedu di berbagai modul (Detail Kelas `/teacher/classes/:id`, Daftar Nilai & Asesmen `/teacher/grades`, dan Portal Presensi `/teacher/attendance`), saya ingin antarmuka paginasi tabel tampil dan berperilaku seragam, terstandar, dan berbobot visual kontras tinggi sehingga pengalaman navigasi data tabel terasa kohesif, rapi, dan mudah digunakan.

## 2. Command Verifikasi
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

## 3. Data Contract & Komponen Baru
`src/components/ui/table-pagination.tsx`
```typescript
export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage?: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  className?: string;
  showWhenSinglePage?: boolean;
}
```

## 4. Acceptance Criteria
- **Given** tabel data dengan pagination di portal guru (`class-detail-view`, `teacher-grades-view`, `teacher-attendance-overview`),
- **When** data melebihi 1 halaman (`totalPages > 1`),
- **Then**:
  1. Bagian kiri menampilkan format: `Menampilkan {start} - {end} dari {total} {itemLabel}`.
  2. Bagian kanan menampilkan tombol: `[< Sebelumnya]` `Halaman {currentPage} dari {totalPages}` `[Berikutnya >]`.
  3. Tombol menggunakan styling tombol kontras tinggi: `rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-600`.
  4. Tombol dinonaktifkan (`disabled`) secara akurat ketika berada di halaman pertama (`currentPage === 1`) atau halaman terakhir (`currentPage === totalPages`).
  5. Layout responsif: `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`.

## 5. Out-of-Scope
- Paginasi berbasis rute URL publik (`KatalogPagination`) untuk pencarian katalog tetap independen.
- Mengubah ukuran default per halaman (tetap 10 item).
