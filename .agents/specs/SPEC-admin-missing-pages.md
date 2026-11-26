# SPEC: Penambahan Halaman Portal Admin Siedu (Ekosistem Lengkap)

> **Modul ID:** `admin-missing-pages`  
> **Aktor:** Administrator (`role: admin`)  
> **Status:** Approved (SDD Phase 2 - Ready for Implementation)  
> **Rujukan Aturan:** [AGENTS.md](../../AGENTS.md), [GEMINI.md](../../GEMINI.md), [CONSTRAINTS.md](../../CONSTRAINTS.md), [DESIGN.md](../docs/DESIGN.md), [DAFTAR_HALAMAN.md](../docs/DAFTAR_HALAMAN.md), [ATURAN_SISTEM.md](../docs/ATURAN_SISTEM.md).

---

## 1. Objective & User Story

### Konteks & Masalah
Hasil audit komprehensif pada antarmuka admin Siedu mengidentifikasi beberapa gap operasional fungsional:
1. **Tidak Ada Halaman Rincian Pendaftaran Individual (`/admin/enrollments/[id]`):**
   - Admin hanya dapat memantau pendaftaran dalam tabel global `/admin/enrollments` tanpa akses ke rincian invoice termin cicilan, tanggal jatuh tempo per termin, kode referensi transaksi gateway Midtrans, maupun timeline status pendaftaran.
   - Tidak ada mekanisme bagi admin untuk melakukan **konfirmasi pembayaran manual** (misalnya orang tua membayar tunai langsung di kantor bimbel atau transfer langsung).
2. **Ketiadaan Direktori Akun Orang Tua & Data Siswa (`/admin/parents` & `/admin/students`):**
   - Admin memiliki CRUD pengajar (`/admin/teachers`), namun tidak memiliki direktori terpusat untuk mencari akun wali murid (`role: orang_tua`) maupun direktori profil seluruh siswa lembaga (`Anak`) dari jenjang TK hingga SMA.
   - Hal ini menyulitkan tim CS/Admin saat orang tua berkonsultasi, meminta perbaikan kontak darurat, atau menanyakan histori pendaftaran anaknya.
3. **Ketiadaan Matriks Jadwal Master Mingguan (`/admin/schedule`):**
   - Jadwal kelas saat ini hanya bisa dilihat terpisah per rincian kelas (`/admin/classes/[classId]`). Admin tidak memiliki kalender matriks mingguan (Senin–Minggu) untuk melihat pemetaan waktu seluruh pengajar dan ketersediaan slot kelas secara holistik.
4. **Log Audit Tidak Memiliki Antarmuka (`/admin/audit-logs`):**
   - Database Siedu aktif merekam mutasi data kritis ke tabel `AuditPerubahan` (perubahan nilai, status pendaftaran, presensi), namun belum ada antarmuka bagi admin untuk memeriksa jejak audit tersebut secara kronologis.

### User Story
*Sebagai Administrator Bimbel*, saya ingin dapat:
1. Membuka rincian pendaftaran individual, meninjau status pembayaran setiap termin cicilan, dan mencatat konfirmasi pembayaran manual jika orang tua membayar tunai.
2. Mencari dan meninjau data akun orang tua dan direktori profil siswa secara mandiri dan cepat.
3. Memantau seluruh jadwal kelas dan guru dalam matriks kalender mingguan terpadu.
4. Memeriksa jejak audit perubahan data penting demi integritas dan transparansi operasional lembaga.

---

## 2. Commands Verifikasi

```bash
# Verifikasi kompilasi TypeScript (Wajib 0 error, gunakan PowerShell Windows sesuai aturan interop WSL)
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. Project Structure & Affected Files

```
src/
├── app/
│   ├── actions/
│   │   └── admin.ts                                  → Server action: konfirmasiPembayaranManualAdmin, updateKontakWaliAdmin
│   └── [locale]/
│       └── admin/
│           ├── layout.tsx                            → Pembaruan NavSections (Tambah Jadwal, Orang Tua, Siswa, Audit Log)
│           ├── enrollments/
│           │   ├── page.tsx                          → Hubungkan baris tabel ke /admin/enrollments/[id]
│           │   └── [id]/
│           │       └── page.tsx                      → [BARU] Halaman Rincian Pendaftaran Admin & Konfirmasi Manual
│           ├── parents/
│           │   └── page.tsx                          → [BARU] Direktori Akun Orang Tua & Riwayat Keluarga
│           ├── students/
│           │   └── page.tsx                          → [BARU] Direktori Siswa/Anak (TK/SD/SMP/SMA) & Kelas Aktif
│           ├── schedule/
│           │   └── page.tsx                          → [BARU] Matriks Jadwal Master Mingguan (Senin–Minggu)
│           └── audit-logs/
│               └── page.tsx                          → [BARU] Penampil Log Jejak Audit Perubahan Sistem
├── components/
│   └── admin/
│       ├── admin-sidebar.tsx                         → Dukungan ikon lucide baru untuk menu baru
│       └── manual-payment-dialog.tsx                 → Dialog konfirmasi pembayaran tunai/manual admin
└── .agents/
    └── docs/
        └── DAFTAR_HALAMAN.md                         → Pembaruan status rute & daftar halaman admin
```

---

## 4. Detailed Specification & Acceptance Criteria

### Slice 1: Rincian Pendaftaran Admin (`/admin/enrollments/[id]`)
- **Fitur:**
  - Menampilkan ringkasan siswa, wali murid (kontak & alamat), kelas, mata pelajaran, dan periode pendaftaran.
  - Linimasa status pendaftaran: `menunggu_pembayaran` ➔ `terdaftar` (atau `tertunggak`, `dibatalkan_*`).
  - Rincian metode pembayaran: Lunas atau DP + Cicilan, tenor, total biaya, dan total telah dibayar.
  - Tabel rincian seluruh record `Pembayaran` (angsuran ke, nominal, status, jatuh tempo, tanggal lunas, metode/gateway reference).
  - Tombol aksi: "Konfirmasi Pembayaran Manual" jika terdapat tagihan berstatus `pending` atau `tertunggak`.
  - Server Action `konfirmasiPembayaranManualAdmin(pembayaranId, catatan)`:
    - Memperbarui status pembayaran menjadi `berhasil`.
    - Mengupdate status pendaftaran ke `terdaftar` jika sebelumnya `menunggu_pembayaran` atau `tertunggak`.
    - Mencatat aksi ke `AuditPerubahan` dengan aksi `konfirmasi_bayar_manual`.
- **Acceptance Criteria (GWT):**
  - **Given** pendaftaran dengan tagihan pending, **When** admin membuka `/admin/enrollments/[id]`, **Then** seluruh rincian termin tagihan dan tombol konfirmasi bayar tampil.
  - **Given** tagihan dikonfirmasi manual, **When** form disubmit, **Then** pembayaran tercatat lunas dan log audit tersimpan.

### Slice 2: Direktori Orang Tua (`/admin/parents`) & Direktori Siswa (`/admin/students`)
- **Fitur `/admin/parents`:**
  - Tabel akun orang tua (`User` role `orang_tua`): Nama, Email, Nomor Telepon, Alamat, Status Verifikasi Email, Jumlah Anak.
  - Pencarian berdasarkan nama, email, atau nomor telepon.
  - Sheet/Drawer profil orang tua yang menampilkan daftar anak mereka dan riwayat pendaftaran kelas.
- **Fitur `/admin/students`:**
  - Tabel direktori profil seluruh anak (`Anak`): Nama Siswa, Tanggal Lahir & Usia, Jenjang Terakhir (TK/SD/SMP/SMA), Nama Wali Murid & Kontak, Status Kelas Aktif.
  - Filter segmented berdasarkan Jenjang (Semua / TK / SD / SMP / SMA).
  - Pencarian berdasarkan nama siswa atau nama orang tua.
- **Acceptance Criteria (GWT):**
  - **Given** admin membuka `/admin/parents`, **When** admin mencari nomor telepon wali, **Then** akun wali terkait tampil beserta daftar anaknya.
  - **Given** admin membuka `/admin/students`, **When** admin memilih filter jenjang "SMP", **Then** hanya siswa berjenjang SMP yang ditampilkan.

### Slice 3: Matriks Jadwal Master Mingguan (`/admin/schedule`)
- **Fitur `/admin/schedule`:**
  - Grid mingguan Senin s.d. Minggu dengan kolom hari.
  - Menampilkan kartu sesi jadwal (`JadwalItem` dari kelas-kelas aktif): Jam Mulai–Selesai, Nama Mata Pelajaran & Jenjang, Nama Guru Pengampu, Ruangan, dan Rasio Kuota (`kuotaTerisi/kuotaMaksimal`).
  - Filter interaktif: Berdasarkan Guru, Jenjang Pendidikan, dan Periode Pendaftaran.
  - Setiap kartu sesi memiliki tautan langsung ke halaman detail kelas terkait (`/admin/classes/[classId]`).
- **Acceptance Criteria (GWT):**
  - **Given** beberapa kelas aktif dengan jadwal hari Senin dan Rabu, **When** admin membuka `/admin/schedule`, **Then** kartu sesi teralokasi pada kolom hari yang tepat secara berurutan waktu.

### Slice 4: Penampil Log Audit Sistem (`/admin/audit-logs`)
- **Fitur `/admin/audit-logs`:**
  - Tabel kronologis membaca record `AuditPerubahan` (diurutkan dari teranyar).
  - Kolom: Waktu (WIB), Aktor (Nama & Role), Tipe Entitas (`presensi`, `penilaian`, `pendaftaran`, `pembayaran`, dll.), Aksi (`CREATE`, `UPDATE`, `konfirmasi_bayar_manual`, dll.), Alasan/Catatan.
  - Filter berdasarkan Entitas dan Pencarian nama aktor/ID.
  - Modal/Popover "Lihat Perubahan" untuk membandingkan JSON `sebelum` vs `sesudah`.
- **Acceptance Criteria (GWT):**
  - **Given** record log audit di database, **When** admin membuka `/admin/audit-logs`, **Then** daftar jejak audit tampil dengan format waktu yang rapi dan tombol inspeksi payload.

### Slice 5: Navigasi Sidebar, I18n & Pembaruan Dokumentasi
- **Fitur:**
  - Memperbarui grup `NAV_SECTIONS` pada `src/app/[locale]/admin/layout.tsx`:
    - Operasional: Dashboard, Pendaftaran, Jadwal Master (`/admin/schedule`).
    - Data Master: Mata Pelajaran, Periode, Guru, Kelas, Wali Murid (`/admin/parents`), Data Siswa (`/admin/students`).
    - Komunikasi & Laporan: Pesan Masuk, Laporan Keuangan, Log Audit (`/admin/audit-logs`).
  - Menambahkan icon mapping di `src/components/admin/admin-sidebar.tsx`: `clock` / `history` / `userCheck` / `graduationCap`.
  - Memperbarui `DAFTAR_HALAMAN.md`.

---

## 5. Quality & Design Constraints Checklist
- [x] **Strict TypeScript:** `powershell.exe ... npx tsc --noEmit` wajib 0 error.
- [x] **Zero Suppression:** Dilarang menggunakan `@ts-ignore`, `@ts-expect-error`, atau `as any`.
- [x] **Icon Restraint:** Ikon hanya untuk sidebar navigasi dan tombol icon-only dengan `aria-label`.
- [x] **Anti-Header Pill Clutter:** Judul halaman H1 bersih tanpa pill/badge berjejer.
- [x] **Data Table Alignment:** Angka/nominal/tanggal wajib `text-right tabular-nums`.
- [x] **Minimal Viable Diff (Ponytail Mode):** Menggunakan komponen UI admin yang sudah ada (`PageShell`, `PageHeader`, `Panel`, `DataTable`, `FilterTabs`).

---

## 6. Out of Scope
- Fitur penambahan anak baru oleh admin (pendaftaran anak tetap menjadi hak eksklusif akun orang tua sesuai BR#16).
- Halaman pengaturan lembaga dinamis `/admin/settings` (dikelola lewat konfigurasi kode/env).
