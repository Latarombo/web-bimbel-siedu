# Spec: Desain UI/UX & Alur Mengajar Portal Guru (Teacher Portal)

> **Status**: Landed (Terverifikasi & Bersih)  
> **Modul Terkait**: `teacher-classes`, `teacher-attendance`, `teacher-grading`, `teacher-corrections`  
> **Dokumen Audit Terkait**: [Artifact: audit-dan-spesifikasi-portal-guru.md](file:///home/un0t_l1ed/.gemini/antigravity-cli/brain/485ff8a5-f092-4ee9-a83e-0433e57364bb/audit-dan-spesifikasi-portal-guru.md)

---

## 1. Objective & Scope

Menyusun spesifikasi komprehensif untuk 14 halaman pada **Portal Guru**, dengan penekanan khusus pada **Alur Mengajar Harian** (Presensi & Jurnal Pertemuan) dan **Alur Input Nilai** (SpeedGrader Drawer & Batch Assessment Form), sesuai panduan UI/UX profesional (Icon Restraint, Clean Typography, Tabular Nums, dan Aksesibilitas WCAG AA).

---

## 2. Pemetaan 14 Halaman Portal Guru

1. **Dashboard Guru** (`/teacher/dashboard`): Agenda hari ini, antrean penilaian yang belum dikoreksi, metrik rombel aktif.
2. **Kalender Mengajar** (`/teacher/calendar`): Jadwal mingguan & bulanan terpadu.
3. **Daftar Kelas Binaan** (`/teacher/classes`): Katalog rombel yang diampu, kapasitas, dan jadwal.
4. **Detail Kelas & Roster Siswa** (`/teacher/classes/[classId]`): Tab Roster, Tab Jadwal Sesi, dan **SpeedGrader Drawer** (Quick Grade Drawer).
5. **Lembar Presensi & Jurnal Sesi** (`/teacher/classes/[classId]/sessions/[date]/attendance`): Segmented status button (H/I/S/A), catatan per anak, jurnal materi & tugas/PR, kuncian 7 hari (BR#18).
6. **Pusat Penilaian Guru** (`/teacher/grades`): Tab Asesmen Rombel & Tab Rekapitulasi Rapor Siswa.
7. **Form Asesmen Baru** (`/teacher/grades/new`): Pembuatan tugas/kuis rombel dengan bobot skor fleksibel.
8. **Pengisian Nilai Rombel Massal** (`/teacher/grades/assessment/[id]`): Form koreksi massal sekelas sekaligus (draf vs terbitkan).
9. **Rapor & Evaluasi Murid Individual** (`/teacher/grades/[enrollmentId]`): Riwayat perkembangan, histori nilai, dan catatan naratif.
10. **Rapor Pembelajaran Resmi** (`/teacher/classes/[classId]/report/[enrollmentId]`): Dokumen formal siap cetak (A4 PDF-friendly).
11. **Sertifikat Kelulusan Siswa** (`/teacher/classes/[classId]/certificate/[enrollmentId]`): Sertifikat kelulusan formal.
12. **Pengajuan Koreksi Terkunci** (`/teacher/corrections`): Formulir pengajuan perbaikan data > 7 hari ke Admin (BR#18).
13. **Jurnal & Status Pembelajaran Publik** (`/teacher/status`): Update materi & dokumentasi foto dengan persetujuan orang tua.
14. **Profil Akun Guru** (`/teacher/profile`): Data pribadi, kontak, dan keahlian mapel.

---

## 3. Alur Pengujian & Acceptance Criteria

- **Skenario A (Mengajar Harian):** Dashboard $\rightarrow$ Masuk Kelas $\rightarrow$ Isi Presensi H/I/S/A $\rightarrow$ Simpan Jurnal Materi & PR.
- **Skenario B (Penilaian Massal):** Buat Asesmen Baru $\rightarrow$ Input Nilai Seluruh Rombel $\rightarrow$ Terbitkan ke Orang Tua.
- **Skenario C (Penilaian Cepat SpeedGrader):** Buka Roster $\rightarrow$ Buka Drawer $\rightarrow$ Input Nilai Murid #1 $\rightarrow$ Next Murid $\rightarrow$ Simpan.
- **Skenario D (Kuncian 7 Hari & Alur Koreksi):** Buka entri > 7 hari $\rightarrow$ Muncul label Terkunci $\rightarrow$ Klik Ajukan Koreksi $\rightarrow$ Formulir terisi otomatis $\rightarrow$ Kirim ke Admin.

---

## 4. Konfirmasi & Persetujuan

Implementasi perubahan kode dan pengujian teknis hanya akan dieksekusi setelah pengguna menyetujui seluruh dokumen spesifikasi ini.
