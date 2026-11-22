# SPEC: Standarisasi UI/UX Input Field, Dropdown & Pickdate di Halaman Guru

> **Status:** Approved (via interactive grill & user guidance)  
> **Tanggal:** 2026-11-21  
> **Author:** Antigravity  
> **Skills Terkait:** `web-design-guidelines`, `ui-ux-pro-max`, `modern-web-guidance`, `spec-driven-development`, `constraint-driven-development`

---

## 1. Objective & User Story

Sebagai Guru yang mengakses portal Siedu di perangkat mobile (iPhone/Android) maupun desktop, saya ingin seluruh kontrol formulir (*input text*, *number*, *textarea*), *dropdown/select*, dan pemilihan tanggal (*date picker*) memiliki interaksi yang nyaman, aksesibel, dan berstandar internasional:
1. **Dropdown / Select:**
   - Jelas dapat diklik (*clickable affordance*): ikon caret chevron yang berotasi saat terbuka, state hover visual yang responsif.
   - Otomatis membalik posisi (*flip on edge*) saat berada di tepi batas layar (*viewport*) agar tidak terpotong.
   - Navigasi keyboard penuh (Panah Atas/Bawah, Enter, Space, Escape, Tab).
   - Fitur pencarian otomatis (*auto-search / combobox*) jika opsi memiliki **10+ item**.
   - Animasi buka/tutup halus berdurasi **150ms** (`duration-150`).
2. **Input Text / Number / Textarea:**
   - Label tetap tampak (*label stays*), terhubung erat dengan input via `htmlFor` dan `id`.
   - **Anti-zoom di iPhone:** Ukuran font masukan minimal 16px di mobile (`text-base sm:text-sm`) agar iOS Safari tidak melakukan *auto-zoom* otomatis saat input aktif.
   - *Real focus ring* yang tegas dan kontras tinggi (`focus-visible:ring-2 focus-visible:ring-blue-600/20 focus-visible:border-blue-600`).
   - Kontras border minimum **3:1 at rest** (`border-slate-300 dark:border-slate-600`) sesuai WCAG 2.2 AA SC 1.4.11.
   - Validasi error muncul setelah *blur* (*errors after blur*), bukan saat pengguna baru mulai mengetik.
   - Tipe dan papan ketik yang tepat (*right type, right keyboard*): `inputMode="decimal"`, `inputMode="numeric"`, `inputMode="tel"`, `autoComplete`, dan karakter elipsis baku (`…`).
3. **Pickdate (Date Picker):**
   - Menggantikan seluruh `<input type="date">` native dengan komponen `DatePicker` terpusat (`@/components/ui/date-picker.tsx`).
   - Tampilan seragam, bilingual (`id` / `en`), modal bottom-sheet di mobile, dan popover keyboard-friendly di desktop.

---

## 2. Rencana Irisan Vertikal (*Vertical Slices*)

```
[Slice 1: UI Primitives Hardening]
  - Upgrade @/components/ui/field.tsx (Label htmlFor/id linkage, text-base sm:text-sm anti-zoom, border-slate-300, focus ring)
  - Create/Upgrade @/components/ui/select.tsx & @/components/ui/filter-dropdown.tsx (Caret icon, hover, flip-on-edge, 10+ items auto-search, 150ms animate, 3:1 border)
  - Refine @/components/ui/date-picker.tsx (border-slate-300 3:1 contrast at rest, rounded-lg, focus ring)
       ⬇
[Slice 2: Standarisasi Dropdown & DatePicker di Halaman Guru]
  - teacher-classes-view.tsx (Ganti select jenjang ke Select/FilterDropdown, search input label & anti-zoom)
  - teacher-grades-view.tsx (Ganti select kelas & status ke Select/FilterDropdown, search inputs)
  - quick-assessment-modal.tsx (Ganti input type="date" ke DatePicker, number inputMode, 150ms)
  - quick-grade-drawer.tsx (Ganti select tugas ke Select/FilterDropdown dengan auto-search untuk kelas dengan banyak asesmen, number inputMode)
  - nilai-form.tsx & penilaian-form.tsx (Ganti input date ke DatePicker, inputMode decimal, table cell accessible labels)
       ⬇
[Slice 3: Input Text & Textarea Hardening di Seluruh Komponen Guru]
  - teacher-quick-search.tsx (aria-label, placeholder …, clear button aria-label)
  - class-detail-view.tsx & attendance-table.tsx (Accessible table cell inputs, search label, mobile touch target)
  - student-grade-item-editor.tsx & pengajuan-koreksi-form.tsx & status-form.tsx (Label htmlFor linkage, inputMode, rounded-lg)
  - session-journal-form.tsx (Placeholder …, border contrast, rounded-lg)
       ⬇
[Slice 4: Verifikasi & Audit Kualitas]
  - Verifikasi TypeScript: npx tsc --noEmit (0 error)
  - Verifikasi WCAG & web-design-guidelines compliance
```

---

## 3. Data Contracts & Component Specs

### A. `@/components/ui/select.tsx` (Combobox / Select with Auto-search)
```typescript
export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SelectProps<T extends string = string> {
  id?: string;
  name?: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly SelectOption<T>[];
  placeholder?: string;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
  required?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  triggerClassName?: string;
  align?: 'start' | 'end' | 'center';
  enableSearch?: boolean; // Default: true if options.length >= 10
}
```

### B. Standard Input Styling Tokens (`DESIGN.md` Conformity)
- **Tinggi:** Desktop `h-10` (`sm:h-9` jika compact), Mobile `h-11` (target sentuh 44px).
- **Tipografi:** Mobile `text-base` (>= 16px untuk anti-zoom iOS Safari), Desktop `sm:text-sm`.
- **Sudut:** Wajib `rounded-lg` (10px).
- **Border at rest:** `border border-slate-300 dark:border-slate-600` (memenuhi rasio kontras 3:1 terhadap kanvas putih/gelap).
- **Focus ring:** `focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20`.
- **Animasi Dropdown:** `animate-in fade-in-0 zoom-in-95 duration-150`.

---

## 4. Verification Command

```powershell
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```
Toleransi error TypeScript: **0**.

---

## 5. Acceptance Criteria (Given-When-Then)

1. **Dropdown Caret & Hover:**
   - **Given** pengguna melihat elemen *select/dropdown*,
   - **When** mengarahkan kursor (*hover*), dropdown memberikan umpan balik latar belakang dan border yang jelas;
   - **Then** ikon chevron berputar halus 180° saat terbuka dan kembali saat tertutup.

2. **Dropdown Flip on Edge & Keyboard Navigation:**
   - **Given** pengguna membuka dropdown di dekat tepi bawah layar,
   - **When** menu dropdown dibuka,
   - **Then** menu otomatis melompat ke atas (*flip*) tanpa terpotong batas *viewport*, dan opsi dapat dipilih menggunakan tombol Panah dan Enter.

3. **Dropdown Auto-search (10+ Items):**
   - **Given** daftar opsi berjumlah >= 10 item (misal: daftar rombel atau daftar siswa),
   - **When** dropdown dibuka,
   - **Then** kolom pencarian otomatis tampil di dalam menu popover untuk memfilter opsi secara instan.

4. **Input Anti-Zoom di iPhone:**
   - **Given** pengguna membuka form guru di browser iOS Safari (iPhone),
   - **When** pengguna menyentuh (*tap*) input teks atau angka,
   - **Then** ukuran font dihitung minimal 16px sehingga halaman tidak mengalami pembesaran otomatis (*no auto-zoom*).

5. **Date Picker Integration:**
   - **Given** form yang membutuhkan tanggal (misal pembuatan asesmen baru atau catatan jurnal),
   - **When** pengguna memilih tanggal,
   - **Then** komponen `DatePicker` terpusat tampil seragam dengan dukungan kalender popover desktop dan bottom sheet mobile yang bebas tabrakan scroll.

---

## 6. Out-of-Scope
- Perubahan skema basis data PostgreSQL / Prisma.
- Modifikasi logika backend Server Actions (selain penyesuaian payload input yang sudah ada).
- Halaman portal Parent dan Admin (fokus tiket ini adalah area Portal Guru).
