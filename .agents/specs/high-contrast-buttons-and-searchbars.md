# Spec: High-Contrast White Buttons & Searchbars across Teacher Portal

## Objective & User Story
Sebagai guru yang menggunakan Siedu Portal Guru, saya ingin seluruh tombol sekunder (tombol putih/surface) dan searchbar (bilah pencarian) memiliki kontras visual yang lebih tegas dan terlihat jelas (mengikuti standar tombol "Beri Nilai Maks Semua" pada halaman `/teacher/grades/assessment/[id]`), sehingga antarmuka mudah dipindai, memiliki *affordance* klik yang solid, dan tidak terlihat pudar atau menyatu dengan latar belakang kanvas putih.

## Verification Command
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL/siedu'; npx tsc --noEmit" < /dev/null
```

## Design Specifications

### 1. Standard Button Putih / Sekunder ("Beri Nilai Maks" Pattern)
Setiap tombol sekunder / outline berlatar putih wajib menerapkan kelas-kelas berikut:
- **Border:** `border border-slate-300 dark:border-slate-700`
- **Border Hover:** `hover:border-slate-400 dark:hover:border-slate-600`
- **Background:** `bg-white dark:bg-slate-800`
- **Background Hover:** `hover:bg-slate-50 dark:hover:bg-slate-700`
- **Typography:** `font-semibold text-slate-800 dark:text-slate-200`
- **Text Hover:** `hover:text-slate-950 dark:hover:text-white`
- **Shadow:** `shadow-2xs` (bayangan halus sebagai penegas kontur)
- **Focus:** `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20`
- **Cursor & Transition:** `cursor-pointer transition-colors select-none`

### 2. Standard Searchbar
Setiap elemen input pencarian wajib menerapkan:
- **Border:** `border border-slate-300 dark:border-slate-700`
- **Border Hover:** `hover:border-slate-400 dark:hover:border-slate-600`
- **Background:** `bg-white dark:bg-slate-900`
- **Typography:** `text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500`
- **Icon Search:** `text-slate-400`
- **Focus:** `focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20`
- **Shadow:** `shadow-2xs`

## Target Files
1. `src/components/ui/button.tsx` (Varian `outline`)
2. `src/components/ui/filter-dropdown.tsx` (Trigger button)
3. `src/components/teacher/classes/class-detail-view.tsx` (Searchbars di tab Roster, Presensi, Tugas; pagination; row action buttons)
4. `src/components/teacher/attendance/teacher-attendance-overview.tsx` (Searchbars, pagination, session action buttons)
5. `src/components/teacher/calendar/teacher-calendar-view.tsx` (Month navigation buttons, today button)
6. `src/components/teacher/attendance/attendance-table.tsx` (Quick fill & toggle buttons)

## Acceptance Criteria (Given-When-Then)
- **Given** guru berada di halaman detail kelas (`/teacher/classes/*`), presensi, kalender, atau penilaian
- **When** melihat searchbar pencarian siswa, sesi, atau tugas
- **Then** searchbar memiliki garis border `border-slate-300 dark:border-slate-700` yang tegas dan bayangan `shadow-2xs`
- **When** melihat tombol-tombol sekunder (pagination, filter, tombol aksi tabel, tombol unduh)
- **Then** tombol memiliki latar putih ber-border `border-slate-300 dark:border-slate-700`, teks berbobot `font-semibold text-slate-800 dark:text-slate-200`, dan `shadow-2xs` yang solid
- **And** saat di-hover, border berubah menjadi `border-slate-400 dark:border-slate-600` dan teks menjadi `text-slate-950 dark:text-white`.
