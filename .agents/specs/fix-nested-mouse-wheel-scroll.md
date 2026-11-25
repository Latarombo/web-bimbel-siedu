# Spec: Perbaikan Scroll Mouse Wheel pada Dropdown, Dialog, dan Kontainer Bersarang

## 1. Objective & User Story
Sebagai Pengguna (Guru, Orang Tua, Siswa, Admin), saat saya berinteraksi dengan elemen antarmuka yang memiliki scrollbar internal (seperti dropdown menu pilihan kelas/status, select picker, dialog modal, drawer, saran pencarian, dan tabel data), saya ingin dapat menggulir (*scroll*) kontennya secara lancar menggunakan roda mouse (*mouse wheel / roll mouse*), tanpa terhalang atau di-hijack oleh smooth scroll Lenis.

## 2. Verification Commands
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

## 3. Data Contracts & UI Changes
- **Konfigurasi Smooth Scroll Global (`src/components/common/smooth-scroll.tsx`)**:
  - Aktifkan opsi `allowNestedScroll: true` pada instans Lenis.
  - Tambahkan fungsi predikat `prevent: (node: Element) => boolean` yang memeriksa:
    1. Atribut penanda eksplisit `data-lenis-prevent`.
    2. Elemen di dalam `<dialog>`, `[role="dialog"]`, `[role="menu"]`, `[role="listbox"]`, `[role="combobox"]`, `[data-radix-popper-content-wrapper]`, `[data-slot="dropdown-menu-content"]`.
    3. Elemen kontainer bersarang yang memiliki class overflow (`.overflow-y-auto`, `.overflow-y-scroll`, `.overflow-x-auto`, dll.) dengan konten yang meluap (`scrollHeight > clientHeight` atau `scrollWidth > clientWidth`).
- **Primitif UI Dropdown & Dialog**:
  - `src/components/ui/dropdown-menu.tsx`:
    - Tambahkan `data-lenis-prevent` pada `DropdownMenuPrimitive.Content`, `DropdownMenuPrimitive.SubContent`, dan `DropdownMenuPrimitive.RadioGroup`.
    - Tambahkan batas tinggi maksimal responsif (`max-h-[var(--radix-dropdown-menu-content-available-height,calc(100dvh-2rem))]`) dan `overflow-y-auto overscroll-contain` bawaan pada `DropdownMenuContent`.
  - `src/components/ui/select.tsx` & `src/components/ui/filter-dropdown.tsx`:
    - Tambahkan `data-lenis-prevent` pada kontainer scrollable option list (`DropdownMenuRadioGroup`).
  - `src/components/common/native-dialog.tsx`:
    - Tambahkan `data-lenis-prevent` pada elemen `<dialog>`.
  - `src/components/parent/child-switcher-dropdown.tsx` & `src/components/katalog/katalog-filter-bar.tsx`:
    - Tambahkan `data-lenis-prevent` pada kontainer dropdown scrollable.
- **CSS Global (`src/app/globals.css`)**:
  - Tambahkan `overscroll-behavior: contain` pada selector `[data-lenis-prevent]` dan popover wrappers agar scroll wheel tidak bocor ke kanvas utama (*scroll chaining*).

## 4. Acceptance Criteria (Given-When-Then)
- **AC1: Mouse Wheel Bekerja pada Dropdown Menu & Select**
  - **Given**: Pengguna membuka dropdown menu atau select dengan banyak opsi (misal: FilterDropdown di kalender atau detail kelas).
  - **When**: Kursor diletakkan di atas daftar opsi dan pengguna memutar roda mouse (*roll mouse*).
  - **Then**: Daftar opsi bergulir ke atas dan ke bawah dengan lancar tanpa macet dan tanpa menggerakkan halaman latar belakang secara tak terduga.
- **AC2: Mouse Wheel Bekerja pada Dialog & Drawer Modal**
  - **Given**: Pengguna membuka dialog modal (misal: NativeDialog, profil siswa drawer, quick grade drawer).
  - **When**: Pengguna menggulir konten modal dengan roda mouse.
  - **Then**: Konten modal bergulir normal.
- **AC3: Kontainer Overflow Lainnya Tetap Scrollable**
  - **Given**: Terdapat kontainer overflow (sidebar, suggestions pencarian kelas, tabel data).
  - **When**: Pengguna menggulir dengan mouse wheel.
  - **Then**: Kontainer merespons perputaran roda mouse sesuai standar peramban.
- **AC4: TypeScript Type Check Bersih**
  - **Given**: Semua file diimplementasikan.
  - **When**: Menjalankan `npx tsc --noEmit`.
  - **Then**: Kompilasi sukses tanpa error (exit code 0).

## 5. Out-of-Scope
- Menghapus Lenis secara keseluruhan (Lenis tetap dipertahankan untuk smooth scrolling halaman utama).
