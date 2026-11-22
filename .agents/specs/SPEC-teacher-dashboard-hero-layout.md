# SPEC: Refactor Hero Layout Dashboard Guru (Tren Hadir 7 Hari & 4 Card Metrik Vertikal)

> **Status:** Implemented & Verified (Consolidated to 3 Cards)  
> **Tanggal:** 2026-11-22  
> **Skills Terkait:** `frontend-design`, `ui-ux-pro-max`, `impeccable`, `spec-driven-development`, `ponytail`  
> **Referensi Standar:** [DESIGN.md](file:///mnt/d/projek_react/PJBL/siedu/.agents/docs/DESIGN.md), [CONSTRAINTS.md](file:///mnt/d/projek_react/PJBL/siedu/CONSTRAINTS.md), [AGENTS.md](file:///mnt/d/projek_react/PJBL/siedu/AGENTS.md).

---

## 1. Objective & User Story

Sebagai seorang Guru di Siedu, saya ingin melihat grafik Tren Kehadiran Siswa 7 Hari Terakhir di sisi kiri yang bersandingan langsung dengan 4 kartu metrik utama di sisi kanan (tersusun berbaris ke bawah / vertikal) pada bagian atas (hero section) dashboard, sehingga saya dapat dengan cepat membaca performa kehadiran mingguan sekaligus metrik operasional mengajar harian dalam satu pandangan visual yang seimbang dan ergonomis.

---

## 2. Keputusan Arsitektur & Desain (Hasil Deliberasi / Grill)

1. **Rasio Grid Hero Section:**
   - Menggunakan Grid 12-kolom pada breakpoint `lg`:
     - **Sisi Kiri (`lg:col-span-8`):** Kartu grafik **Tren Hadir 7 Hari Terakhir** (`AktivitasMingguanBar`).
     - **Sisi Kanan (`lg:col-span-4`):** **4 Kartu Metrik** (Kelas Diampu, Total Murid, Perlu Dinilai, Sesi Hari Ini) berbaris ke bawah (`flex flex-col justify-between`).
   - Pada layar mobile (`< lg`):
     - Grafik Tren Hadir tampil penuh di atas.
     - 4 Kartu Metrik tersusun dalam grid 2x2 (`grid grid-cols-2 gap-4`).

2. **Height Alignment & Harmoni Visual:**
   - 4 kartu metrik di sisi kanan menggunakan auto-distribusi merata (`lg:h-full lg:flex lg:flex-col lg:justify-between`) sehingga tinggi total tumpukan kartu presisi sejajar dengan tinggi kartu grafik di sisi kiri.
   - Masing-masing kartu metrik memiliki padding `p-4` (16px) yang proporsional.

3. **Penempatan Donut Distribusi Presensi:**
   - Kartu grafik Donut "Distribusi Status Presensi" dipindahkan ke area konten operasional di bawah hero section (di atas antrean penilaian dan agenda sesi) sehingga bagian hero atas murni fokus pada Tren 7 Hari dan 4 Metrik.

4. **Penerapan Sistem Spasi 8-pt Grid:**
   - Semua spasi menggunakan kelipatan 8px: `gap-2` (8px), `gap-4` (16px), `gap-6` (24px), `p-4` (16px), `p-6` (24px), `space-y-4` (16px), `space-y-6` (24px).
   - Zero tolerance untuk deviasi pecahan non-grid (`p-5`, `p-3.5`, `gap-3.5`, `size-3.5`, dll.).

5. **Kepatuhan Aturan UI/UX Siedu:**
   - **Icon Restraint:** Kartu metrik murni berbasis tipografi (*"KPIs are type, not tiles"*). Tidak ada ikon dekoratif berlatar warna di kartu metrik.
   - **Anti-Redundant Counter:** Deskripsi/subtitle bersih dari angka total yang berulang.
   - **Anti-Header Pill Clutter:** Header tetap bersih, tanggal dalam subtext yang tenang.

---

## 3. Komponen & Data Contracts

### A. Refaktor Komponen `src/components/teacher/dashboard-charts.tsx`
Menyediakan kartu modular terpisah:
- `TrenKehadiranCard`: Kartu mandiri untuk visualisasi batang tren 7 hari terakhir dengan header dan ringkasan footer.
- `RekapPresensiCard`: Kartu mandiri untuk donut distribusi presensi beserta tabel rekap status (Hadir, Izin, Sakit, Alpa).
- Mempertahankan backward compatibility untuk `TeacherAnalyticsSection`.

### B. Halaman `src/app/[locale]/(teacher)/teacher/dashboard/page.tsx`
- Layout Hero:
  ```tsx
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
    {/* Kiri: Tren Hadir 7 Hari Terakhir */}
    <div className="lg:col-span-8 flex">
      <TrenKehadiranCard ... />
    </div>

    {/* Kanan: 4 Kartu Metrik Berbaris ke Bawah */}
    <div className="lg:col-span-4 grid grid-cols-2 lg:flex lg:flex-col lg:justify-between gap-4">
      {/* Card 1: Kelas Diampu */}
      {/* Card 2: Total Murid */}
      {/* Card 3: Perlu Dinilai */}
      {/* Card 4: Sesi Hari Ini */}
    </div>
  </div>
  ```

---

## 4. Acceptance Criteria (Given-When-Then)

1. **Scenario: Hero Layout di Layar Desktop (>= 1024px)**
   - **Given** guru membuka halaman `/teacher/dashboard` di layar desktop.
   - **When** halaman dimuat.
   - **Then** terlihat layout 2 kolom: grafik Tren Hadir 7 Hari Terakhir di sebelah kiri (8 kolom) dan 4 kartu metrik di sebelah kanan (4 kolom) berbaris ke bawah.
   - **And** batas atas dan bawah tumpukan 4 kartu metrik sejajar dengan kartu grafik Tren Hadir.

2. **Scenario: Hero Layout di Layar Mobile (< 1024px)**
   - **Given** guru membuka halaman `/teacher/dashboard` di layar smartphone atau tablet kecil.
   - **When** halaman dimuat.
   - **Then** grafik Tren Hadir tampil penuh di bagian atas, diikuti oleh 4 kartu metrik dalam format grid 2x2 yang kompak dan rapi tanpa overflow horizontal.

3. **Scenario: Kepatuhan Standar 8-pt Grid**
   - **Given** kode komponen `page.tsx` dan `dashboard-charts.tsx`.
   - **When** diinspeksi.
   - **Then** semua class padding, margin, dan gap mematuhi kelipatan 8px (`p-2`, `p-4`, `p-6`, `gap-2`, `gap-4`, `gap-6`, `space-y-4`, `space-y-6`).
   - **And** tidak ada pecahan token `.5` (`p-3.5`, `p-5`, dsb.).

4. **Scenario: Kepatuhan Verifikasi Type-Check**
   - **Given** semua perubahan kode selesai diaplikasikan.
   - **When** perintah verifikasi `npx tsc --noEmit` dijalankan melalui PowerShell Windows Interop.
   - **Then** proses keluar dengan status sukses (code 0) tanpa error kompilasi TypeScript.

---

## 5. Verification Command

```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```
