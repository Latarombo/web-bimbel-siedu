# Spec: Decommission Rapor Resmi, Sertifikat Kelulusan & Laporan Perkembangan Naratif

> **Status**: Landed  
> **Tipe**: Penghapusan Fitur / Decommissioning & Penyederhanaan Domain  
> **Modul Terkait**: `teacher-portal`, `parent-portal`, `academic-reporting`  
> **Keputusan User**: Hapus total dari seluruh sistem (Portal Guru, Portal Orang Tua, komponen cetak, lib, serta sistem Laporan Perkembangan naratif guru).

---

## 1. Objective & Rationale

### Objective
Menghapus seluruh fitur Rapor Resmi (`report`), Sertifikat Kelulusan (`certificate`), dan Laporan Perkembangan Naratif (`LaporanPerkembangan`) dari modul Guru dan modul Orang Tua beserta komponen dan utility pendukungnya.

### Rationale & Keputusan Domain
1. **Fokus Inti Siedu:** Siedu berfokus pada pendaftaran bimbel mandiri, manajemen kelas, presensi real-time, dan penilaian tugas harian/progres.
2. **Eliminasi Fitur Spekulatif (YAGNI):** Format cetak formal rapor sekolah dan sertifikat kelulusan belum menjadi kebutuhan mendesak lembaga bimbel dan menimbulkan kompleksitas ganda antara nilai kuantitatif tugas vs dokumen cetak formal.
3. **Penyederhanaan Alur Guru & Orang Tua:** Menghilangkan kebingungan antara "Nilai Tugas", "Laporan Perkembangan", dan "Rapor Resmi" sehingga alur pelaporan belajar fokus pada satu sumber kebenaran (*single source of truth*): Jadwal, Presensi, dan Nilai Tugas/Asesmen.

---

## 2. Command Verifikasi

```bash
# 1. Bersihkan cache Next.js setelah menghapus rute halaman
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npm run clean" < /dev/null

# 2. Verifikasi tipe TypeScript tanpa error
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. Scope of Deletion & Changes

### A. File / Rute yang Dihapus
1. **Rute Portal Guru:**
   - `src/app/[locale]/(teacher)/teacher/classes/[classId]/report/[enrollmentId]/page.tsx`
   - `src/app/[locale]/(teacher)/teacher/classes/[classId]/certificate/[enrollmentId]/page.tsx`
2. **Rute Portal Orang Tua:**
   - `src/app/[locale]/(parent)/enrollments/[id]/report/page.tsx`
   - `src/app/[locale]/(parent)/enrollments/[id]/certificate/page.tsx`
3. **Komponen Cetak Bersama:**
   - `src/components/common/official-report-card.tsx`
   - `src/components/common/official-certificate.tsx`
4. **Komponen Form Guru:**
   - `src/components/teacher/laporan-perkembangan-form.tsx`
5. **Library & Helper:**
   - `src/lib/report-card.ts`
   - `src/lib/certificate.ts`
   - `src/lib/laporan-perkembangan.ts`

### B. Komponen & Halaman yang Dimodifikasi
1. `src/components/teacher/classes/class-detail-view.tsx`:
   - Hapus dropdown menu "Lihat Rapor Siswa" dan "Unduh Sertifikat" pada kolom aksi tabel roster siswa.
   - Kolom aksi difokuskan murni pada tombol "Input Nilai".
2. `src/app/[locale]/(teacher)/teacher/grades/[enrollmentId]/page.tsx`:
   - Hapus tombol "Rapor" di header siswa.
   - Hapus tab `perkembangan` dan form `LaporanPerkembanganForm`.
   - Tab disederhanakan menjadi 2: `nilai` (nilai progres) dan `penilaian` (tugas kelas).
3. `src/app/[locale]/(parent)/enrollments/[id]/page.tsx`:
   - Hapus tombol "Lihat E-Rapor" di banner pendaftaran sukses.
4. `src/app/[locale]/(parent)/schedule-attendance/page.tsx`:
   - Hapus tab `laporan` (Laporan Perkembangan), ubah tab switcher menjadi 3 tab: `jadwal`, `presensi`, `nilai`.
   - Hapus query dan pemrosesan `LaporanPerkembangan`.
5. `src/app/actions/teacher.ts`:
   - Hapus action `saveLaporanPerkembangan` dan `tarikLaporanPerkembangan`.
   - Hapus import `validateLaporanInput`.

### C. Dokumentasi yang Diperbarui
- `DAFTAR_HALAMAN.md`: Catat penghapusan rute-rute terkait.
- `PRD.md`: Perbarui cakupan pelaporan akademik.

---

## 4. Acceptance Criteria (Given-When-Then)

### AC-1: Rute Terhapus Bersih
- **Given** pengguna mencoba mengakses `/teacher/classes/[classId]/report/[id]` atau `/certificate/[id]`,
- **When** rute dibuka,
- **Then** Next.js merespons dengan 404 Not Found.

### AC-2: UI Bersih dari Tombol/Link Menuju Fitur Tersebut
- **Given** guru membuka detail kelas atau detail nilai siswa,
- **When** melihat daftar aksi siswa,
- **Then** tidak ada opsi Rapor/Sertifikat atau tab Laporan Perkembangan.

### AC-3: Verifikasi Bebas Error
- **Given** seluruh penghapusan dan modifikasi selesai,
- **When** menjalankan `npx tsc --noEmit`,
- **Then** kompilasi TypeScript bersih tanpa error tipe.
