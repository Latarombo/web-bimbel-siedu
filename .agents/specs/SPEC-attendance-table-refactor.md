# Spec: Refactor Desain Lembar Presensi Guru (Unified Toolbar & Embedded Form Footer)

## 1. Objective & User Story
- **Masalah:** 
  1. Halaman presensi guru (`/teacher/classes/[classId]/sessions/[date]/attendance`) memiliki toolbar terpisah berupa card mengambang di atas tabel yang menampung tombol *"Tandai semua hadir"*, *"Kosongkan semua"*, dan *Searchbar*. Ini menciptakan visual "kotak di atas kotak" (*stacked disjointed card*) yang terfragmentasi.
  2. Tombol *"Tandai semua hadir"* menggunakan warna hijau tebal mencolok yang bersaing merebut fokus visual dari tombol simpan utama.
  3. Terdapat card melayang di bawah layar (`AttendanceStickyBar`) yang menutupi baris data tabel dan berisi deretan 5 pill counter warna-warni (*pill soup*), padahal di bagian atas halaman sudah ada `SessionStatStrip`.
- **Pengguna:** Guru pengampu rombongan belajar.
- **Outcome:** 
  1. Toolbar terintegrasi langsung ke dalam satu kontainer tabel spreadsheet yang kokoh dan rapi.
  2. Tombol utilitas *"Tandai Semua Hadir"* dan *"Kosongkan Semua"* tampil dengan gaya *ghost/muted action button* yang tenang di kiri atas tabel.
  3. Searchbar minimalis terintegrasi di kanan atas tabel.
  4. Kartu mengambang di bawah (*floating bottom card*) dan seluruh pill counter dihapus. Sebagai gantinya, tombol **`Simpan Presensi`** dan ringkasan progres tipografi tenang (misal: `"8 dari 8 siswa terisi (Lengkap)"`) menyatu secara alami di footer tabel (*embedded form footer*).

---

## 2. Command Verifikasi
- Typecheck: `powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null`

---

## 3. Data Contracts & Interfaces
- **Komponen Utama:** `AttendanceTable` di `src/components/teacher/attendance/attendance-table.tsx`.
- **Komponen Terdampak:** `AttendanceStickyBar` di `src/components/teacher/attendance/attendance-sticky-bar.tsx` digantikan oleh footer terintegrasi di dalam `AttendanceTable`.
- **Interface Tetap (Tanpa Breaking Changes):**
  ```typescript
  export type SiswaPresensi = {
    pendaftaranId: number;
    nama: string;
    anakId?: number;
    jenjangTerakhir?: string | null;
    status?: string;
    catatan?: string;
    terkunci: boolean;
  };

  interface AttendanceTableProps {
    kelasId: number;
    jadwalItemId: number;
    tanggal: string;
    siswa: SiswaPresensi[];
  }
  ```

---

## 4. Acceptance Criteria (Given - When - Then)
- [x] **AC 1: Unified Table Container & Header Toolbar**
  - **Given** guru membuka lembar presensi sesi kelas.
  - **When** halaman dimuat,
  - **Then** toolbar aksi cepat dan searchbar berada di dalam satu kontainer terpadu dengan tabel (bukan card terpisah di atasnya).
  - **Then** tombol *"Tandai Semua Hadir"* dan *"Kosongkan Semua"* menggunakan gaya utilitas netral (`text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-md px-2.5 py-1.5`).
- [x] **AC 2: Embedded Clean Form Footer (Tanpa Sticky Bar / Tanpa Pill Soup)**
  - **Given** guru mengisi atau mengubah status kehadiran siswa di tabel.
  - **When** guru melihat bagian bawah tabel,
  - **Then** tidak ada card mengambang (*no floating/sticky card*) yang menutupi baris tabel.
  - **Then** tidak ada deretan pill counter warna-warni (*no pill soup*).
  - **Then** terdapat footer terintegrasi di dasar kontainer tabel yang memuat ringkasan teks tenang di kiri (misal: `"X dari Y siswa terisi"` dan pesan peringatan tenang bila ada yang kosong) serta tombol primer `"Simpan Presensi"` di kanan.
- [x] **AC 3: Fungsionalitas Presensi Utuh**
  - **Given** guru mengklik *"Tandai Semua Hadir"*, *"Kosongkan Semua"*, mengetik di searchbar, atau memilih radio status kehadiran (H/I/S/A).
  - **When** aksi dilakukan dan form disubmit via tombol `"Simpan Presensi"`,
  - **Then** seluruh data presensi tersimpan dengan benar melalui Server Action `savePresensi` dengan indikator loading state dan feedback pesan sukses/error.

---

## 5. Out of Scope (Batasan)
- Mengubah alur Server Action `savePresensi` atau skema database `Presensi` / `SesiPertemuan`.
- Mengubah logika validasi 7 hari (`dalamJendela7Hari`).
- Mengubah tab *Jurnal Pembelajaran / Catatan Pertemuan*.
