# SPEC: Aksi Roster Siswa di Detail Kelas (`/teacher/classes/[classId]`)

> **Status:** Approved (via interactive grill)  
> **Tanggal:** 2026-11-21  
> **Author:** Antigravity  
> **Skills Terkait:** `spec-driven-development`, `web-design-guidelines`, `ui-ux-pro-max`, `frontend-design`

---

## 1. Objective & User Story
Sebagai guru pengampu kelas di halaman detail rombongan belajar (`/teacher/classes/[classId]`), saya ingin memiliki akses aksi yang jelas untuk setiap murid di tabel roster:
1. **Input Nilai:** Tombol cepat untuk membuka `QuickGradeDrawer` guna mengisi/memperbarui capaian nilai tugas asesmen kelas secara cepat.
2. **Rincian Siswa:** Tombol navigasi langsung menuju halaman rincian rekapitulasi siswa (`/teacher/grades/[enrollmentId]`), memuat seluruh riwayat asesmen, capaian nilai berkala, dan rekapitulasi kehadiran siswa dalam rombel ini.

---

## 2. Rencana Implementasi Minimalis (Ponytail Mode)
- Menambahkan tombol kedua `Rincian Siswa` berdampingan dengan tombol `Input Nilai` pada kolom Aksi tabel desktop dan kartu mobile di `src/components/teacher/classes/class-detail-view.tsx`.
- Desain konsisten dengan aturan Siedu:
  - Tanpa ikon dekoratif (Icon Restraint).
  - Menggunakan `rounded-lg` (10px).
  - Kontras border 3:1 at rest (`border-slate-300 dark:border-slate-700`).
  - Responsif: Berjajar rapi horizontal di desktop (`gap-2`), dan 2 kolom seimbang di mobile (`grid grid-cols-2 gap-2 h-10`).

---

## 3. Verification Command
```powershell
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```
Toleransi error TypeScript: **0**.

---

## 4. Acceptance Criteria (Given-When-Then)
- **Given** guru berada di tab "Roster Siswa" halaman `/teacher/classes/[classId]`,
- **When** melihat kolom Aksi pada salah satu murid,
- **Then** guru melihat dua opsi aksi:
  1. Tombol `Rincian Siswa` yang mengarahkan ke `/teacher/grades/${student.id}`.
  2. Tombol `Input Nilai` yang memicu drawer `QuickGradeDrawer`.
- **When** dilihat pada layar mobile (< 768px),
- **Then** kedua tombol tersusun rapi dalam grid 2 kolom dengan target sentuh ergonomis (tinggi 40px / `h-10`).
