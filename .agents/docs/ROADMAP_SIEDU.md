# Roadmap Produk & Pengembangan — Siedu v2.0

> **Kerangka Kerja:** _Now - Next - Later Framework_.
> Dokumen ini mencatat status faktual fitur, prioritas pengerjaan saat ini (_Now_), rencana lanjutan (_Next_), dan fitur masa depan (_Later_).
> Diperbarui secara berkala sebagai panduan sinkronisasi tim dan agen pengembang.

---

## 🧭 Ringkasan Status Proyek

- **Platform:** Next.js 15 (App Router, Server Actions, TypeScript).
- **Database & ORM:** PostgreSQL (Supabase) via Prisma ORM (`src/prisma/contract.prisma`).
- **Autentikasi:** Auth.js v5 (NextAuth) dengan Session Stateless JWT & Multi-role Guard.
- **Pembayaran:** Midtrans Snap & Event-Driven Webhook Handler.

---

## ✅ DONE (Fitur Selesai & Terverifikasi di Kode)

### 1. Fondasi Arsitektur & Database

- [x] Setup Next.js 15 App Router, TypeScript strict, Tailwind CSS, dan struktur folder modular.
- [x] Kontrak data Prisma 11 tabel (`users`, `anak`, `mata_pelajaran`, `periode_pendaftaran`, `kelas`, `jadwal_item`, `pendaftaran`, `pembayaran`, `presensi`, `nilai_progres`, `pengajuan_pembatalan`).
- [x] Penerapan _Row-Level Locking_ (`SELECT FOR UPDATE`) pada operasi pendaftaran kritis untuk proteksi kuota (BR#1).

### 2. Autentikasi & Akun

- [x] Autentikasi multi-role (`admin`, `guru`, `orang_tua`) melalui Auth.js v5.
- [x] Proteksi rute berbasis role pada lapisan proxy Next.js.
- [x] Alur registrasi wali murid bertahap 3-langkah dengan persetujuan consent hukum privasi dan perwalian sah (BR#25).

### 3. Portal Publik & Katalog

- [x] Halaman beranda (_Landing Page_) dengan hero, keunggulan lembaga, dan kelas pilihan.
- [x] Katalog Kelas publik dengan penyaringan (_filter_) jenjang pendidikan (TK, SD, SMP, SMA).
- [x] Halaman detail rincian kelas dengan silabus, informasi guru, dan jadwal mingguan.
- [x] Halaman informasi legal (_Tentang Kami_, _Kebijakan Privasi_, _Syarat & Ketentuan_) dan formulir _Kontak_.

### 4. Portal Orang Tua (Wali Murid)

- [x] Dasbor beranda wali: ringkasan pendaftaran anak, status kelas aktif, dan tagihan berjalan.
- [x] Manajemen Profil Anak: daftar anak, formulir tambah anak, dan ubah profil.
- [x] Alur pengajuan pendaftaran kelas anak dengan validasi kesesuaian jenjang (BR#13) dan anti-bentrok jadwal anak (BR#9).
- [x] Kalender terpadu jadwal belajar mingguan dan pemantauan riwayat presensi sesi anak.
- [x] Halaman riwayat pembayaran dan status tagihan (lunas, cicilan berjalan, tertunggak).

### 5. Portal Guru (Pengajar)

- [x] Dasbor pengajar: agenda kelas hari ini dan ringkasan kelas aktif yang diampu.
- [x] Daftar kelas yang diampu beserta daftar nama siswa terdaftar per kelas.
- [x] Formulir pengisian presensi kehadiran sesi pertemuan (Hadir, Izin, Sakit, Alpa).
- [x] Pengisian evaluasi nilai akademik (angka kuantitatif untuk SMP/SMA) dan catatan naratif perkembangan anak.
- [x] Penguncian edit 7 hari (BR#18) pada presensi & nilai serta alur kontekstual pengajuan koreksi ke Admin (`/teacher/corrections`).

### 6. Portal Administrator (Data Master)

- [x] Dasbor metrik statistik pendaftaran dan operasional kelas.
- [x] CRUD Mata Pelajaran.
- [x] CRUD Periode Pendaftaran (tanggal buka, tutup, dan periode aktif).
- [x] CRUD Data Pengajar / Guru.
- [x] CRUD Penawaran Kelas dengan validasi anti-bentrok jadwal guru (BR#6) dan aturan biaya DP (BR#12).
- [x] Verifikasi & persetujuan pengajuan koreksi data guru (`/admin/corrections`) dengan jejak audit komprehensif (BR#18).

### 7. Layanan Sistem & Otomasi

- [x] Endpoint Vercel Cron `/api/cron/check-timeout` untuk pembatalan otomatis 1×24 jam dan pelepasan kuota kelas (BR#2, BR#11, BR#21).
- [x] Endpoint Webhook Midtrans `/api/webhooks/midtrans` dengan verifikasi signature hash SHA512 dan idempotensi data (BR#14, BR#17, BR#26).
- [x] Kasir Terfokus & Integrasi Midtrans Snap Sandbox (`window.snap.pay`) di `/enrollments/[id]/pay` dengan countdown 24 jam (BR#2, BR#23).

---

## 🎯 NOW (Fokus Pengerjaan Berjalan)

Fokus utama saat ini adalah merampungkan tata kelola operasional dan alur pelaporan analitik:

| Prioritas | Fitur / Komponen                 | Keterangan & Rujukan Aturan                                                                         |
| :-------: | :------------------------------- | :-------------------------------------------------------------------------------------------------- |
| 🔴 **P1** | **Laporan Eksekutif & Keuangan** | Halaman analitik pendaftaran, arus kas penerimaan cicilan/lunas, dan tunggakan di `/admin/reports`. |
| 🟡 **P2** | **Ekspor Data (CSV / PDF)**      | Dukungan ekspor laporan presensi, nilai, dan rekap keuangan bagi Admin.                             |

---

## 🚀 NEXT (Sprint Berikutnya)

Fitur pendukung tata kelola lanjutan dan audit kualitas:

- [ ] **Penyempurnaan Aksesibilitas & Micro-Interactions:** Audit kontras WCAG AA, penataan area sentuh mobile 44px, dan transisi halus pada sheet/dialog.

---

## ⛔ OUT OF SCOPE (Fitur yang Dibatalkan / Tidak Dibuat)

Berdasarkan keputusan domain resmi:

- ❌ **Fitur Refund & Pengajuan Pembatalan Sepihak Wali:** Sistem **TIDAK** menyediakan pengajuan refund dan pembatalan sepihak oleh orang tua. Uang muka bersifat hangus (_non-refundable_), dan pelepasan kuota hanya dilakukan oleh sistem otomatis jika pendaftaran melewati batas waktu 1x24 jam tanpa pembayaran (_timeout_).
- ❌ **Auto-Debit Pembayaran:** Tagihan cicilan bulanan dibayar mandiri secara manual oleh orang tua (BR#24).
- ❌ **Deteksi & Review Anak Duplikat Antar-Akun (BR#16):** Akun orang tua adalah entitas mandiri. Kesamaan nama dan tanggal lahir antar-keluarga berbeda tidak dibatasi dan tidak memerlukan antarmuka review admin (menghilangkan false positive & menjaga privasi). Duplikasi dicegah murni di level akun yang sama (_intra-account guard_).

---

## 🔮 LATER (Cakupan Masa Depan / Out of Scope v1)

- [ ] Integrasi Notifikasi Instan via WhatsApp Business Gateway.
- [ ] Arsitektur Multi-Tenancy (dukungan multi-cabang bimbel dalam 1 instalasi).
- [ ] Integrasi Single Sign-On (SSO) dan LMS Eksternal (Google Classroom / Moodle).
- [ ] Aplikasi Mobile Mandiri (_Native iOS / Android_).
- [ ] Portal Login Mandiri untuk Siswa Dewasa (di luar naungan akun orang tua).
