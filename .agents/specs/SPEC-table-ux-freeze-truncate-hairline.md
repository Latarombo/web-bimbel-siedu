# SPEC: Tabel Data UI/UX Enhancement — Pinned Context, Hairline Hover, Truncate & Action Reveal

> **Status:** Approved (Konfirmasi User 22 Nov 2026)  
> **Modul Terkait:**  
> - `src/components/teacher/attendance/attendance-table.tsx`  
> - `src/components/teacher/classes/class-detail-view.tsx`  
> - `src/components/teacher/grades/teacher-grades-view.tsx`  
> - `src/components/teacher/penilaian-form.tsx`  
> - `src/components/ui/data-table.tsx`  
> **Skills Terkait:** `modern-web-guidance`, `ui-ux-pro-max`, `frontend-design`, `spec-driven-development`, `ponytail`

---

## 1. Objective & User Story

### Objective
Meningkatkan UI/UX seluruh tabel guru (portal guru) dan komponen universal `DataTable` agar:
1. Kolom data tidak melar berlebihan ke kanan (*never wrap, truncate single-line dengan ellipsis*).
2. Konteks baris (kolom nama/identitas utama) tetap terlihat di layar (*sticky pinned left*) dan kolom aksi tetap mudah diakses (*sticky pinned right*) saat tabel di-scroll secara horizontal.
3. Row hover memiliki efek garis/hairline halus yang elegan tanpa visual clutter (*one hairline hover does the rest*).
4. Tombol aksi tenang pada kondisi diam (*opacity-70*) dan bertransisi tajam (*opacity-100*) saat baris di-hover atau tombol menerima fokus keyboard (*focus-within*).
5. Teks terpotong dapat dibaca secara penuh melalui tooltip/title saat hover atau fokus.

### User Stories
- **Sebagai Guru:** Saat saya meninjau rekap siswa atau asesmen di layar laptop atau tablet, kolom nama siswa tetap terkunci di kiri saat saya menggeser tabel ke kanan untuk melihat nilai atau status, sehingga saya tidak bingung baris data milik siapa.
- **Sebagai Guru:** Saat nama siswa atau catatan sangat panjang, baris tabel tetap rapi dan konsisten setinggi satu baris, dan saya dapat membaca nama/catatan lengkapnya cukup dengan mengarahkan kursor (hover) atau fokus keyboard.
- **Sebagai Pengguna Keyboard & Pembaca Layar:** Tombol aksi pada kolom aksi langsung terlihat jelas ketika saya menekan tombol `Tab`, dan tidak ada informasi yang tersembunyi bagi screen reader.

---

## 2. Command Verifikasi

Sesuai aturan environment WSL + Windows Interop (Aturan 1):
```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL/siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. Data Contracts & Visual Standards

### A. Kontrak Pinned Column (Sticky Context)
1. **Sticky Header (`<thead> <th>`)**:
   - Kolom No: `sticky left-0 z-30 bg-slate-50 dark:bg-slate-800`
   - Kolom Siswa/Nama (konteks): `sticky left-12 z-30 bg-slate-50 dark:bg-slate-800 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]`
   - Kolom Aksi (jika ada): `sticky right-0 z-30 bg-slate-50 dark:bg-slate-800 border-l border-slate-200/80 dark:border-slate-800/80 shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)]`
2. **Sticky Body (`<tbody> <td>`)**:
   - Kolom No: `sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/80 dark:group-hover/row:bg-slate-800/40 transition-colors`
   - Kolom Siswa/Nama: `sticky left-12 z-10 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/80 dark:group-hover/row:bg-slate-800/40 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)] transition-colors`
   - Kolom Aksi: `sticky right-0 z-10 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/80 dark:group-hover/row:bg-slate-800/40 border-l border-slate-200/80 dark:border-slate-800/80 shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)] transition-colors`

### B. One Hairline Hover
- Baris tabel: `group/row relative transition-all duration-150 border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/40`
- Garis batas halus (hairline) dipertahankan tanpa border tebal yang mengganggu.

### C. Truncate & Never Wrap
- Sel teks: `whitespace-nowrap truncate max-w-[180px] sm:max-w-[240px] lg:max-w-[300px]`
- Wajib memiliki atribut `title={teksLengkap}` untuk keterbacaan saat hover.
- Nilai angka, tanggal, dan status tetap `whitespace-nowrap tabular-nums`.

### D. Action Reveal on Hover / Focus
- Kontainer aksi: `opacity-70 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity duration-150 max-sm:opacity-100`

---

## 4. Vertical Slices & Task Breakdown

### Slice 1: Upgrade `src/components/ui/data-table.tsx`
- Tambahkan dukungan sticky context pada kolom pertama (left pinned) dan kolom aksi (right pinned).
- Sinkronisasikan background cell saat row hover pada cell yang berstatus sticky.
- Tambahkan truncate & title otomatis pada cell teks biasa.
- Tambahkan styling hairline hover dan aksi reveal pada kolom `aksi`.

### Slice 2: Implementasi pada `src/components/teacher/attendance/attendance-table.tsx`
- Terapkan sticky column pada `No` (`left-0`) dan `Siswa` (`left-12`).
- Batasi lebar nama siswa dengan `truncate max-w-[200px]` dan `title={s.nama}`.
- Buat input catatan memiliki `truncate` saat tidak fokus dan tidak meregangkan tabel.
- Terapkan hairline hover pada row.

### Slice 3: Implementasi pada `src/components/teacher/classes/class-detail-view.tsx`
- **Tab Roster Siswa**:
  - Pinned `No` (`left-0`), `Siswa` (`left-12`) di kiri.
  - Pinned `Aksi` (`right-0`) di kanan.
  - Truncate nama siswa (`max-w-[220px] truncate` + `title={s.nama}`).
  - Action reveal: Tombol `Rincian Siswa` dan `Input Nilai` transisi opacity pada hover/focus.
  - Hairline hover pada baris.
- **Tab Tugas & Asesmen**:
  - Pinned `No` (`left-0`), `Nama Tugas` (`left-12`) di kiri.
  - Pinned `Aksi` (`right-0`) di kanan.
  - Truncate nama tugas (`max-w-[240px] truncate` + `title={a.nama}`).
  - Hairline hover dan action reveal.

### Slice 4: Implementasi pada `src/components/teacher/grades/teacher-grades-view.tsx`
- **Tabel 1: Rekap Tugas dan Asesmen**:
  - Pinned `No` (`left-0`), `Nama Asesmen` (`left-12`) di kiri.
  - Pinned `Aksi` (`right-0`) di kanan.
  - Truncate judul asesmen (`max-w-[240px] truncate` + `title={a.nama}`).
  - Hairline hover & action reveal.
- **Tabel 2: Rekap Nilai Siswa**:
  - Pinned `No` (`left-0`), `Siswa` (`left-12`) di kiri.
  - Pinned `Aksi` (`right-0`) di kanan.
  - Truncate nama siswa (`max-w-[200px] truncate` + `title={s.nama}`).
  - Hairline hover & action reveal.

### Slice 5: Audit & Penyempurnaan `src/components/teacher/penilaian-form.tsx`
- Pastikan hairline hover halus dan terkoordinasi dengan sticky cells `No` dan `Siswa`.
- Tambahkan `title={s.nama}` pada nama siswa.

---

## 5. Acceptance Criteria

1. **Given** guru membuka tabel Roster Siswa atau Rekap Nilai dengan banyak kolom.
   **When** tabel di-scroll ke kanan.
   **Then** kolom No dan Nama Siswa tetap terlihat di sisi kiri layar dengan bayangan hairline halus, dan kolom Aksi tetap terlihat di sisi kanan.

2. **Given** data siswa atau nama asesmen sangat panjang.
   **When** tabel dirender di layar desktop maupun mobile.
   **Then** kolom tidak melebar tak beraturan; teks diakhiri `...` (*ellipsis*) tanpa pemotongan baris vertikal (*never wrap*).
   **And** saat kursor diarahkan ke teks tersebut atau difokuskan, teks lengkap muncul melalui `title` / tooltip.

3. **Given** baris tabel dalam kondisi idle (tidak di-hover).
   **When** dilihat di layar desktop.
   **Then** tombol aksi tampak tenang (`opacity-70`).
   **When** kursor mouse melintas di atas baris (*hover*) atau pengguna menekan `Tab` ke tombol aksi (*focus-within*).
   **Then** tombol aksi langsung bertransisi tajam menjadi `opacity-100`, dan seluruh baris disorot dengan hairline hover yang halus.

---

## 6. Out-of-Scope
- Tidak mengganti tabel dengan library pihak ketiga (TanStack Table, AG Grid).
- Tidak mengubah logika kalkulasi nilai, presensi, atau database query.
