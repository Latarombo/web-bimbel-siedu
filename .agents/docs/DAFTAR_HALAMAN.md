# Daftar Halaman & Kontainer Interaksi — Siedu (Next.js App Router)

> **Referensi Standar:** [`ATURAN_SISTEM.md`](.agents/docs/ATURAN_SISTEM.md), [`PRD.md`](.agents/docs/PRD.md), [`DESIGN.md`](.agents/docs/DESIGN.md).
> Seluruh antarmuka menggunakan Bahasa Indonesia baku dan pola kontainer (Halaman Penuh / Sheet / Dialog) mengikuti matriks keputusan di [`DESIGN.md`](.agents/docs/DESIGN.md) Bagian 7F.

---

## A. Public (Guest) — `app/(public)/`

| #   | Halaman / Fitur    | Route             | Tipe Kontainer | Keterangan                             |
| --- | ------------------ | ----------------- | -------------- | -------------------------------------- |
| A1  | Landing Page       | `/`               | Halaman Penuh  | Beranda publik, hero, katalog unggulan |
| A2  | Katalog Kelas      | `/classes`        | Halaman Penuh  | Filter jenjang (Drawer di mobile)      |
| A3  | Rincian Kelas      | `/classes/[id]`   | Halaman Penuh  | Silabus, jadwal, profil pengajar       |
| A4  | Tentang Kami       | `/about`          | Halaman Penuh  | Profil lembaga & metodologi belajar    |
| A5  | Kebijakan Privasi  | `/privacy-policy` | Halaman Penuh  | Dokumen hukum & persetujuan data       |
| A6  | Syarat & Ketentuan | `/terms`          | Halaman Penuh  | Ketentuan layanan & kebijakan refund   |
| A7  | Kontak             | `/contact`        | Halaman Penuh  | Formulir pesan publik                  |

---

## B. Autentikasi — `app/(auth)/`

| #   | Halaman / Fitur    | Route                     | Tipe Kontainer | Keterangan                                   |
| --- | ------------------ | ------------------------- | -------------- | -------------------------------------------- |
| B1  | Masuk (Login)      | `/login`                  | Halaman Penuh  | Email & password (Auth.js v5)                |
| B2  | Daftar — Langkah 1 | `/register`               | Halaman Penuh  | Registrasi awal (email & password)           |
| B3  | Daftar — Langkah 2 | `/register/account-info`  | Halaman Penuh  | Info akun wali & persetujuan consent (BR#25) |
| B4  | Daftar — Langkah 3 | `/register/child-info`    | Halaman Penuh  | Input profil anak pertama                    |
| B5  | Lupa Password      | `/forgot-password`        | Halaman Penuh  | Permintaan reset link email                  |
| B6  | Reset Password     | `/reset-password/[token]` | Halaman Penuh  | Form pembaruan password baru                 |

---

## C. Portal Orang Tua — `app/(parent)/`

| #   | Halaman / Fitur          | Route                                    | Tipe Kontainer     | Keterangan                                                         |
| --- | ------------------------ | ---------------------------------------- | ------------------ | ------------------------------------------------------------------ |
| C1  | Beranda (Dashboard)      | `/home`                                  | Halaman Penuh      | Ringkasan anak, jadwal & tagihan                                   |
| C2  | Pilih & Daftar Kelas     | `/classes`, `/classes/[id]`              | Halaman Penuh      | Tombol daftar memicu alur pendaftaran                              |
| C3  | Rincian Pendaftaran      | `/enrollments/[id]`                      | Halaman Penuh      | Status enrollment & rincian pembayaran                             |
| C4  | Pembayaran Midtrans Snap | `/enrollments/[id]/pay`                  | Halaman / Embed    | Integrasi Snap pembayaran tagihan aktif                            |
| C5  | Hasil Pembayaran         | `/enrollments/[id]/payment-result`       | Halaman Penuh      | Status settlement / pending dari Midtrans                          |
| C6  | Riwayat Pembayaran       | `/payments`                              | Halaman Penuh      | Tab status lunas, aktif, & tertunggak                              |
| C7  | Jadwal & Presensi Anak   | `/schedule-attendance`                   | Halaman Penuh      | Kalender & rekap absensi anak                                      |
| C8  | Kelola Data Anak         | `/children`                              | Halaman Penuh      | Daftar profil seluruh anak wali                                    |
| C9  | Tambah Data Anak         | `/children` (atau `/children/new`)       | **Sheet / Drawer** | Form input profil anak baru                                        |
| C10 | Ubah Data Anak           | `/children` (atau `/children/[id]/edit`) | **Sheet / Drawer** | Terkunci read-only jika ada pendaftaran aktif (BR#29)              |
| C11 | Profil Akun Wali         | `/profile`                               | Halaman Penuh      | Edit nama, telepon, alamat rumah                                   |
| C12 | Rapor Siswa Semester     | `/enrollments/[id]/report`               | Halaman Penuh      | Laporan capaian nilai, presensi, catatan guru, dan cetak PDF resmi |

---

## D. Portal Guru — `app/(teacher)/`

| #   | Halaman / Fitur                   | Route                                                               | Tipe Kontainer      | Keterangan                                                                                              |
| --- | --------------------------------- | ------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------- |
| D1  | Dashboard Guru                    | `/teacher/dashboard`                                                | Halaman Penuh       | Jadwal hari ini & metrik kelas aktif                                                                    |
| D2  | Navigasi Kelas (Sidebar AI-Style) | Sidebar Portal Guru (link langsung ke `/teacher/classes/[classId]`) | Komponen Sidebar    | Rute indeks `/teacher/classes` didekomisi total; digantikan daftar kelas langsung di sidebar ala web AI |
| D3  | Input Presensi Pertemuan          | `/teacher/classes/[classId]/sessions/[date]/attendance`             | **Sheet / Halaman** | Tandai Hadir, Izin, Sakit, Alpa                                                                         |
| D4  | Nilai & Progres Belajar           | `/teacher/grades`                                                   | Halaman Penuh       | Rekap nilai siswa per kelas                                                                             |
| D5  | Input Nilai & Catatan             | `/teacher/grades`                                                   | **Sheet / Drawer**  | Nilai angka & catatan naratif siswa                                                                     |
| D6  | Pengajuan Koreksi                 | `/teacher/corrections`                                              | **Dialog (Modal)**  | Riwayat koreksi presensi/nilai                                                                          |
| D7  | Profil Guru                       | `/teacher/profile`                                                  | Halaman Penuh       | Informasi biodata & kontak pengajar                                                                     |
| D8  | Rekap Rapor Semester Kelas        | `/teacher/classes/[classId]/reports`                                | Halaman Penuh       | Indeks evaluasi rapor seluruh siswa kelas                                                               |
| D9  | Pengisian & Detail Rapor Siswa    | `/teacher/classes/[classId]/reports/[enrollmentId]`                 | Halaman Penuh       | Perhitungan otomatis, evaluasi subjektif guru, terbitkan ke ortu, & cetak                               |
| D10 | Status Pembelajaran               | `/teacher/status`                                                   | Halaman Penuh       | Unggah foto galeri & kamera langsung dengan caption ke orang tua kelas                                  |

---

## E. Portal Admin — `app/(admin)/`

| #   | Halaman / Fitur        | Route                        | Tipe Kontainer   | Keterangan                                                             |
| --- | ---------------------- | ---------------------------- | ---------------- | ---------------------------------------------------------------------- |
| E1  | Dashboard Admin        | `/admin/dashboard`           | Halaman Penuh    | Metrik penerimaan, pendaftar, & pendapatan                             |
| E2  | Semester / Periode     | `/admin/periods`             | **Dialog Form**  | CRUD semester/periode pendaftaran & tanggal aktif                      |
| E3  | Data Guru              | `/admin/teachers`            | **Dialog Form**  | CRUD data guru & akun pengajar                                         |
| E4  | Data Kelas             | `/admin/classes`             | Halaman Penuh    | Indeks kelas, mapel langsung, filter pengajar/status, & CRUD modal     |
| E5  | Rincian Kelas          | `/admin/classes/[classId]`   | Halaman Penuh    | Roster siswa terdaftar, status cicilan, jadwal, & rekap presensi       |
| E6a | Hub Pendaftaran        | `/admin/enrollments`         | Halaman Penuh    | Pengelolaan seluruh pendaftaran siswa & status pembayaran              |
| E6b | Pendaftaran Bermasalah | `/admin/enrollments/flagged` | Halaman Penuh    | Monitoring pendaftaran tersendat, timeout, & tertunggak                |
| E6c | Rincian Pendaftaran    | `/admin/enrollments/[id]`    | Halaman Penuh    | Rincian pendaftaran, termin cicilan, referensi gateway, & konfirmasi bayar manual |
| E6d | Data Pembayaran        | `/admin/payments`            | Halaman Penuh    | Tabel riwayat tagihan, cicilan, metode bayar, & konfirmasi bayar manual |
| E7  | Laporan & Keuangan     | `/admin/reports`             | Halaman Penuh    | Analitik pendaftaran & penerimaan kas                                  |
| E8  | Pesan Masuk            | `/admin/messages`            | **Sheet Detail** | Daftar pertanyaan dari form kontak publik                              |
| E9  | Jadwal Master          | `/admin/schedule`            | Halaman Penuh    | Daftar jadwal CRUD + matriks mingguan seluruh guru dan kelas           |
| E10 | Direktori Orang Tua    | `/admin/parents`             | Halaman Penuh    | CRUD akun wali murid & modal detail (profil orang tua + daftar anak)   |
| E11 | Direktori Siswa        | `/admin/students`            | Halaman Penuh    | CRUD seluruh profil anak (TK–SMA), kontak, alamat, & kelas/tingkat     |
| E12 | Log Audit Sistem       | `/admin/audit-logs`          | Halaman Penuh    | Jejak audit kronologis perubahan data penting (nilai, presensi, bayar) |

---

## F. Endpoint Sistem & Background Jobs

| #   | Layanan                        | Route / Handler           | Mekanisme                              | Keterangan                                                                |
| --- | ------------------------------ | ------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| F1  | Pengecekan Timeout Pendaftaran | `/api/cron/check-timeout` | Vercel Cron / Scheduler (Tiap 5 menit) | Membatalkan pendaftaran timeout 1x24 jam & melepas kuota (BR#2, BR#11)    |
| F2  | Webhook Midtrans               | `/api/webhooks/midtrans`  | HTTP POST Callback (SHA512 Signature)  | Sinkronisasi status pembayaran & penerbitan cicilan (BR#14, BR#17, BR#26) |

---

## G. Fitur Didekomisioning / Dihapus (Out of Scope)

| #   | Fitur / Rute Asal                  | Rute Terkait                                                                             | Alasan & Status                                                                                                                                 |
| --- | ---------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | Rapor Resmi Siswa                  | `/teacher/classes/[classId]/report/[enrollmentId]`, `/enrollments/[id]/report`           | Didekomisioning via SDD (`SPEC-decommission-rapor-sertifikat-dan-laporan.md`). Pelaporan difokuskan pada nilai tugas/asesmen murni.             |
| G2  | Sertifikat Kelulusan               | `/teacher/classes/[classId]/certificate/[enrollmentId]`, `/enrollments/[id]/certificate` | Didekomisioning. Pengelolaan sertifikat di luar lingkup utama pendaftaran & bimbingan belajar Siedu.                                            |
| G3  | Laporan Perkembangan Naratif Guru  | `LaporanPerkembanganForm`, tab laporan pada `/schedule-attendance`                       | Didekomisioning. Evaluasi belajar berfokus pada catatan tugas/nilai asesmen dan status aktivitas belajar harian.                                |
| G4  | Deteksi Duplikat Lintas Akun       | `/admin/duplicate-children` (BR#16)                                                      | Didekomisioning via SDD (`SPEC-decommission-duplicate-child-detection.md`). Proteksi dialihkan ke intra-account guard.                          |
| G5  | Sub-sistem Refund Otomatis         | `/admin/refunds`, `/enrollments/[id]/cancel` (BR#15, BR#20)                              | Didekomisioning via SDD (`SPEC-decommission-refund-subsystem.md`). Kebijakan refund manual via kontak admin.                                    |
| G6  | Persetujuan Koreksi Presensi Admin | `/admin/corrections` (BR#18)                                                             | Didekomisioning. Penguncian batas 7 hari presensi ditiadakan; guru mengelola dan memperbarui langsung data kehadiran tanpa permohonan ke admin. |
